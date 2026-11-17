import { AiFailure, type AiKind, type AiMeta } from '../lib/ai-contract.ts';
import { MAX_QUESTIONS } from '../lib/contracts.ts';
import { participantAskedToStop, validateAnalysis, validateQuestion } from '../ai/validation.ts';
import { all, checkVersion, criteria, fail, first, loadCase, messages, now, orgFresh, stmt, uid, usesLocalRules, type CaseRow, type Runtime, type SessionRow } from './core.ts';

const LEASE_MS=120_000;
interface Reservation { id:string; amount:number; resourceId:string; kind:AiKind }
interface UsageRow {id:string;reserved_microusd:number}
const resourceTable=(kind:AiKind)=>kind==='question'?'intake_sessions':'cases';

/** A killed worker cannot establish the actual provider bill. Charge its entire
 * reserved ceiling conservatively; never release it as free or silently retry. */
export async function recoverExpiredOperation(r:Runtime,kind:AiKind,resourceId:string):Promise<void> {
  const table=resourceTable(kind); const cutoff=now();
  const rows=await all<UsageRow>(r,`SELECT u.id,u.reserved_microusd FROM ai_usage u JOIN ${table} t ON t.id=u.resource_id AND t.org_id=u.org_id WHERE u.org_id=? AND u.resource_id=? AND u.status='reserved' AND t.lease_until<=?`,r.org.id,resourceId,cutoff);
  for(const usage of rows) {
    await r.context.db.batch([
      stmt(r,"UPDATE organizations SET budget_reserved_microusd=budget_reserved_microusd-?,budget_spent_microusd=budget_spent_microusd+? WHERE id=? AND EXISTS (SELECT 1 FROM ai_usage WHERE id=? AND org_id=? AND status='reserved')",usage.reserved_microusd,usage.reserved_microusd,r.org.id,usage.id,r.org.id),
      stmt(r,"UPDATE ai_usage SET status=?,cost_microusd=reserved_microusd,usage_estimated=?,error_code='OPERATION_INTERRUPTED',completed_at=? WHERE id=? AND org_id=? AND status='reserved'",usage.reserved_microusd===0?'failed':'uncertain',usage.reserved_microusd===0?0:1,now(),usage.id,r.org.id),
      stmt(r,`UPDATE ${table} SET lease_token=NULL,lease_until=NULL,version=version+1,updated_at=?${kind==='analysis'?",status='FALHA_ANALISE',analysis_error='OPERATION_INTERRUPTED'":''} WHERE id=? AND org_id=? AND lease_until<=?`,now(),resourceId,r.org.id,cutoff),
    ]);
  }
}

async function reserve(r:Runtime,kind:AiKind,row:SessionRow|CaseRow,operation:string):Promise<Reservation> {
  const local=usesLocalRules(r);
  if(!r.context.provider.configured||!local&&!r.context.config.aiApproved) fail(503,local?'RULES_NOT_CONFIGURED':'AI_NOT_CONFIGURED',local?'A organização local do relato está indisponível. O relato permanece salvo.':'A IA ainda não está habilitada. O relato permanece salvo.');
  await orgFresh(r);
  if(!r.org.intake_enabled||!local&&!r.org.ai_enabled) fail(409,local?'PROCESSING_PAUSED':'AI_PAUSED',local?'A demonstração está pausada. O relato permanece salvo.':'As chamadas de IA estão pausadas. O relato permanece salvo.');
  const amount=r.context.provider.maxCostMicrousd(kind);
  if(!Number.isSafeInteger(amount)||(local?amount!==0:amount<=0)) fail(503,local?'RULES_COST_INVALID':'AI_COST_UNAVAILABLE',local?'A configuração de regras locais deve ter custo zero.':'Os limites de custo da IA ainda não foram configurados.');
  const id=uid(); const time=now(); const until=new Date(Date.now()+LEASE_MS).toISOString(); const table=resourceTable(kind);
  const state=kind==='question'?"t.state='draft' AND t.question_count<8 AND t.ai_calls<24":"t.status IN ('RECEBIDO','FALHA_ANALISE')";
  const results=await r.context.db.batch([
    stmt(r,'INSERT OR IGNORE INTO ai_operations (id,org_id,resource_id,kind,attempts) VALUES (?,?,?,?,0)',operation,r.org.id,row.id,kind),
    stmt(r,`INSERT INTO ai_usage (id,org_id,resource_id,operation_id,kind,status,reserved_microusd,model,created_at)
      SELECT ?,o.id,t.id,?,?,'reserved',?,?,? FROM organizations o JOIN ${table} t ON t.org_id=o.id
      WHERE o.id=? AND t.id=? AND t.version=? AND t.lease_token IS NULL AND ${state}
      AND o.intake_enabled=1 AND (?=1 OR (o.ai_enabled=1 AND o.budget_spent_microusd+o.budget_reserved_microusd+?<=o.budget_limit_microusd
      AND o.budget_spent_microusd+o.budget_reserved_microusd+?<=?))
      AND EXISTS (SELECT 1 FROM ai_operations WHERE id=? AND org_id=o.id AND attempts<3)`,id,operation,kind,amount,r.context.provider.model,time,r.org.id,row.id,row.version,local?1:0,amount,amount,r.context.config.maxBudgetMicrousd,operation),
    stmt(r,"UPDATE organizations SET budget_reserved_microusd=budget_reserved_microusd+? WHERE id=? AND EXISTS (SELECT 1 FROM ai_usage WHERE id=? AND org_id=?)",amount,r.org.id,id,r.org.id),
    stmt(r,'UPDATE ai_operations SET attempts=attempts+1 WHERE id=? AND org_id=? AND EXISTS (SELECT 1 FROM ai_usage WHERE id=? AND org_id=?)',operation,r.org.id,id,r.org.id),
    stmt(r,`UPDATE ${table} SET lease_token=?,lease_until=?,version=version+1,updated_at=?${kind==='analysis'?",status='EM_ANALISE',analysis_error=NULL":',ai_calls=ai_calls+1'} WHERE id=? AND org_id=? AND EXISTS (SELECT 1 FROM ai_usage WHERE id=? AND org_id=?)`,r.token,until,time,row.id,r.org.id,id,r.org.id),
  ]);
  if(!results[1].meta.changes) {
    const op=await first<{attempts:number}>(r,'SELECT attempts FROM ai_operations WHERE org_id=? AND id=?',r.org.id,operation);
    if(op&&op.attempts>=3) fail(429,local?'PROCESSING_ATTEMPT_LIMIT':'AI_ATTEMPT_LIMIT','Esta operação atingiu o limite de três tentativas. Encaminhe o relato para revisão humana.');
    await orgFresh(r);
    if(!local&&r.org.budget_spent_microusd+r.org.budget_reserved_microusd+amount>Math.min(r.org.budget_limit_microusd,r.context.config.maxBudgetMicrousd)) fail(429,'AI_BUDGET_LIMIT','O limite de consumo foi atingido. O relato permanece salvo.');
    fail(409,'VERSION_CONFLICT','O atendimento mudou ou já está sendo processado. Atualize antes de continuar.');
  }
  return {id,amount,resourceId:row.id,kind};
}

function accounting(r:Runtime,reservation:Reservation,meta:AiMeta|undefined,error:AiFailure|undefined):D1PreparedStatement[] {
  const local=usesLocalRules(r);
  if(local&&meta&&(meta.estimatedCostMicrousd!==0||meta.inputTokens!==0||meta.outputTokens!==0)) throw new AiFailure('RULES_INVALID_METADATA','Regras locais não podem registrar tokens ou custo de API.');
  const reported=meta?.estimatedCostMicrousd;
  const validCost=typeof reported==='number'&&Number.isSafeInteger(reported)&&reported>=0;
  const uncertain=!local&&(!!error?.chargeUncertain||(!error&&!validCost));
  const cost=local?0:uncertain?reservation.amount:error?0:reported!;
  const safeInt=(n:number|undefined)=>Number.isSafeInteger(n)&&n!>=0?n!:0;
  return [
    stmt(r,"UPDATE organizations SET budget_reserved_microusd=budget_reserved_microusd-?,budget_spent_microusd=budget_spent_microusd+? WHERE id=? AND EXISTS (SELECT 1 FROM ai_usage WHERE id=? AND org_id=? AND status='reserved')",reservation.amount,cost,r.org.id,reservation.id,r.org.id),
    stmt(r,"UPDATE ai_usage SET status=?,cost_microusd=?,input_tokens=?,output_tokens=?,usage_estimated=?,provider_request_id=?,duration_ms=?,error_code=?,completed_at=? WHERE id=? AND org_id=? AND status='reserved'",uncertain?'uncertain':error?'failed':'complete',cost,safeInt(meta?.inputTokens),safeInt(meta?.outputTokens),local?0:uncertain||!meta||meta.usageEstimated?1:0,meta?.requestId??null,safeInt(meta?.durationMs),error?.code??null,now(),reservation.id,r.org.id),
  ];
}
function safeFailure(error:unknown):AiFailure {
  return error instanceof AiFailure ? error : new AiFailure('AI_UNAVAILABLE','Não foi possível concluir a análise. O relato permanece salvo.',true,true);
}
function raiseFailure(r:Runtime,error:AiFailure):never { fail(503,error.code,usesLocalRules(r)?'Não foi possível organizar esta etapa. O relato permanece salvo; consulte o estado antes de tentar novamente.':'A IA não concluiu esta etapa. O relato permanece salvo; consulte o estado antes de tentar novamente.',error.retryable); }

export async function askQuestion(r:Runtime,row:SessionRow):Promise<void> {
  const history=await messages(r,row.id); const last=history.at(-1);
  if(history.length>=32) fail(409,'MESSAGE_LIMIT','O atendimento atingiu o limite de mensagens. Confira o relato para enviar.');
  if(!last||last.role!=='user') fail(409,'ANSWER_REQUIRED','Responda à pergunta atual antes de continuar.');
  if(row.question_count>=MAX_QUESTIONS||row.question_ready||participantAskedToStop(history)) fail(409,'QUESTION_LIMIT','Confira suas respostas e envie o relato quando desejar.');
  const selected=await criteria(r,row.criteria_id);
  const reservation=await reserve(r,'question',row,`question:${row.id}:${last.id}`);
  try {
    const result=await r.context.provider.question({messages:history,criteria:selected,questionCount:row.question_count});
    let data; try { data=validateQuestion(result.data,history,row.question_count); } catch { throw new AiFailure(usesLocalRules(r)?'RULES_INVALID_RESPONSE':'AI_INVALID_RESPONSE','Resposta inválida.',false,!usesLocalRules(r)); }
    const statements=accounting(r,reservation,result.meta,undefined);
    if(data.question!==null) statements.push(stmt(r,"INSERT INTO messages (id,org_id,session_id,role,content,sequence,created_at) SELECT ?,?,?,'assistant',?,?,? WHERE EXISTS (SELECT 1 FROM intake_sessions WHERE org_id=? AND id=? AND lease_token=?)",uid(),r.org.id,row.id,data.question,history.length+1,now(),r.org.id,row.id,r.token));
    statements.push(stmt(r,'UPDATE intake_sessions SET question_count=question_count+?,question_ready=?,version=version+1,lease_token=NULL,lease_until=NULL,updated_at=? WHERE org_id=? AND id=? AND lease_token=?',data.question===null?0:1,data.ready?1:0,now(),r.org.id,row.id,r.token));
    const settled=await r.context.db.batch(statements);
    if(!settled.at(-1)?.meta.changes) fail(409,'OPERATION_UNCERTAIN','A operação mudou. Consulte o estado salvo.');
  } catch(error) {
    const failure=safeFailure(error);
    await r.context.db.batch([...accounting(r,reservation,undefined,failure),stmt(r,'UPDATE intake_sessions SET lease_token=NULL,lease_until=NULL,version=version+1,updated_at=? WHERE org_id=? AND id=? AND lease_token=?',now(),r.org.id,row.id,r.token)]);
    raiseFailure(r,failure);
  }
}

export async function analyzeCase(r:Runtime,row:CaseRow):Promise<{caseId:string;status:CaseRow['status']}> {
  if(!['RECEBIDO','FALHA_ANALISE'].includes(row.status)) fail(409,'ANALYSIS_NOT_ALLOWED','Este caso já foi analisado, está em processamento ou recebeu uma decisão humana.');
  const history=await messages(r,row.session_id); const selected=await criteria(r,row.criteria_id);
  const reservation=await reserve(r,'analysis',row,`analysis:${row.id}`);
  try {
    const result=await r.context.provider.analyze({messages:history,criteria:selected,questionCount:history.filter(m=>m.role==='assistant').length});
    let data; try {data=validateAnalysis(result.data,history,selected.version);} catch {throw new AiFailure(usesLocalRules(r)?'RULES_INVALID_RESPONSE':'AI_INVALID_RESPONSE','Resposta inválida.',false,!usesLocalRules(r));}
    const settled=await r.context.db.batch([
      ...accounting(r,reservation,result.meta,undefined),
      stmt(r,"INSERT INTO analyses (id,org_id,case_id,version,data_json,model,prompt_version,schema_version,criteria_version,created_at) SELECT ?,?,c.id,(SELECT COALESCE(MAX(version),0)+1 FROM analyses WHERE org_id=? AND case_id=c.id),?,?,?,?,?,? FROM cases c WHERE c.org_id=? AND c.id=? AND c.lease_token=? AND c.status='EM_ANALISE'",uid(),r.org.id,r.org.id,JSON.stringify(data),result.meta.model,result.meta.promptVersion,result.meta.schemaVersion,selected.version,now(),r.org.id,row.id,r.token),
      stmt(r,"UPDATE cases SET status='AGUARDANDO_REVISAO',analysis_error=NULL,version=version+1,lease_token=NULL,lease_until=NULL,updated_at=? WHERE org_id=? AND id=? AND lease_token=? AND status='EM_ANALISE'",now(),r.org.id,row.id,r.token),
    ]);
    if(!settled.at(-1)?.meta.changes) fail(409,'OPERATION_UNCERTAIN','A operação mudou. Consulte o estado salvo.');
    return {caseId:row.id,status:'AGUARDANDO_REVISAO'};
  } catch(error) {
    const failure=safeFailure(error);
    await r.context.db.batch([...accounting(r,reservation,undefined,failure),stmt(r,"UPDATE cases SET status='FALHA_ANALISE',analysis_error=?,lease_token=NULL,lease_until=NULL,version=version+1,updated_at=? WHERE org_id=? AND id=? AND lease_token=?",failure.code,now(),r.org.id,row.id,r.token)]);
    raiseFailure(r,failure);
  }
}
