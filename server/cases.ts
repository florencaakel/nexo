import type { AnalysisDTO, CaseDetailDTO, CaseListDTO, CaseListItem, ReviewDTO } from '../lib/contracts.ts';
import { STATUS_LABELS } from '../lib/contracts.ts';
import { validateAnalysis } from '../ai/validation.ts';
import { all, checkLease, checkVersion, criteria, expectedVersion, fail, first, inputText, loadCase, messages, now, stmt, strictKeys, uid, type CaseRow, type Runtime } from './core.ts';
import { analyzeCase, recoverExpiredOperation } from './processing.ts';

const item=(row:CaseRow):CaseListItem=>({id:row.id,title:row.title,status:row.status,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,mode:'demo'});
export async function detail(r:Runtime,row:CaseRow):Promise<CaseDetailDTO> {
  if(row.lease_until && row.lease_until<=now()) { await recoverExpiredOperation(r,'analysis',row.id); row=await loadCase(r,row.id); }
  const analysis=await first<{id:string;version:number;data_json:string;model:string;prompt_version:string;schema_version:string;criteria_version:number;created_at:string}>(r,'SELECT * FROM analyses WHERE org_id=? AND case_id=? ORDER BY version DESC LIMIT 1',r.org.id,row.id);
  const reviews=await all<{id:string;author_name:string;decision:ReviewDTO['decision'];notes:string;corrected_analysis_json:string|null;created_at:string}>(r,'SELECT * FROM reviews WHERE org_id=? AND case_id=? ORDER BY case_version',r.org.id,row.id);
  return {...item(row),messages:await messages(r,row.session_id),analysis:analysis?{id:analysis.id,version:analysis.version,data:JSON.parse(analysis.data_json),model:analysis.model,promptVersion:analysis.prompt_version,schemaVersion:analysis.schema_version,criteriaVersion:analysis.criteria_version,createdAt:analysis.created_at}:null,reviews:reviews.map(review=>({id:review.id,authorName:review.author_name,decision:review.decision,notes:review.notes,correctedAnalysis:review.corrected_analysis_json?JSON.parse(review.corrected_analysis_json):null,createdAt:review.created_at})),criteria:await criteria(r,row.criteria_id),analysisError:row.analysis_error};
}
export async function caseApi(r:Runtime,path:string[],method:string,input:Record<string,unknown>,url:URL):Promise<unknown> {
  if(path.length===0&&method==='GET') {
    const status=url.searchParams.get('status'); const cursor=url.searchParams.get('cursor');
    if(status&&!Object.hasOwn(STATUS_LABELS,status)) fail(400,'INVALID_FILTER','Estado de caso inválido.');
    let last:{createdAt:string;id:string}|null=null;
    if(cursor) { try {last=JSON.parse(atob(cursor));} catch {fail(400,'INVALID_CURSOR','Página inválida.');} if(!last||typeof last.createdAt!=='string'||typeof last.id!=='string'||last.id.length>100||last.createdAt.length>40) fail(400,'INVALID_CURSOR','Página inválida.'); }
    const clauses=['org_id=?']; const values:unknown[]=[r.org.id];
    if(status) {clauses.push('status=?');values.push(status);}
    if(last) {clauses.push('(created_at<? OR (created_at=? AND id<?))');values.push(last.createdAt,last.createdAt,last.id);}
    const rows=await all<CaseRow>(r,`SELECT * FROM cases WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT 26`,...values);
    const page=rows.slice(0,25);
    for(let i=0;i<page.length;i++) { const row=page[i]; if(row.lease_until && row.lease_until<=now()) { await recoverExpiredOperation(r,'analysis',row.id); page[i]=await loadCase(r,row.id); } }
    const tail=page.at(-1);
    const response:CaseListDTO={cases:page.map(item),nextCursor:rows.length>25&&tail?btoa(JSON.stringify({createdAt:tail.created_at,id:tail.id})):null}; return response;
  }
  if(!path[0]||path.length>2) fail(404,'NOT_FOUND','Rota não encontrada.');
  let row=await loadCase(r,path[0]);
  if(path.length===1&&method==='GET') return detail(r,row);
  await recoverExpiredOperation(r,'analysis',row.id); row=await loadCase(r,row.id);
  checkLease(row.lease_until); checkVersion(row.version,expectedVersion(input));
  if(path[1]==='analysis'&&method==='POST') {strictKeys(input,['expectedVersion']);return analyzeCase(r,row);}
  if(path[1]==='reviews'&&method==='POST') {
    strictKeys(input,['decision','notes','correctedAnalysis','expectedVersion']);
    if(!['PENDENTE_INFORMACOES','ACEITO_PARA_ATENDIMENTO','ENCERRADO'].includes(input.decision as string)) fail(400,'INVALID_INPUT','Escolha uma decisão humana válida.');
    const notes=inputText(input.notes,4000,'uma observação de revisão');
    let corrected=null;
    if(input.correctedAnalysis!==null) {
      try {corrected=validateAnalysis(input.correctedAnalysis,await messages(r,row.session_id),(await criteria(r,row.criteria_id)).version);} catch {fail(400,'INVALID_CORRECTION','A correção precisa manter formato e referências válidos ao relato.');}
    }
    const time=now(); const result=await r.context.db.batch([
      stmt(r,'UPDATE cases SET status=?,version=version+1,mutation_token=?,updated_at=? WHERE org_id=? AND id=? AND version=? AND lease_token IS NULL',input.decision,r.token,time,r.org.id,row.id,row.version),
      stmt(r,'INSERT INTO reviews (id,org_id,case_id,author_id,author_name,decision,notes,corrected_analysis_json,case_version,created_at) SELECT ?,org_id,id,?,?,?,?,?,version,? FROM cases WHERE org_id=? AND id=? AND mutation_token=?',uid(),r.actor.id,r.actor.displayName,input.decision,notes,corrected?JSON.stringify(corrected):null,time,r.org.id,row.id,r.token),
      stmt(r,"INSERT INTO audit_events (id,org_id,actor_id,action,resource_id,request_id,created_at) SELECT ?,?,?, 'case.reviewed',?,?,? WHERE EXISTS (SELECT 1 FROM cases WHERE org_id=? AND id=? AND mutation_token=?)",uid(),r.org.id,r.actor.id,row.id,r.requestId,time,r.org.id,row.id,r.token),
    ]);
    if(!result[0].meta.changes) fail(409,'VERSION_CONFLICT','O caso mudou. Atualize antes de registrar sua revisão.');
    return detail(r,await loadCase(r,row.id));
  }
  if(path.length===1&&method==='DELETE') {
    strictKeys(input,['expectedVersion']); const time=now();
    const guard='EXISTS (SELECT 1 FROM cases WHERE org_id=? AND id=? AND mutation_token=?)';
    const args=[r.org.id,row.id,r.token];
    const result=await r.context.db.batch([
      stmt(r,'UPDATE cases SET mutation_token=? WHERE org_id=? AND id=? AND version=? AND lease_token IS NULL',r.token,r.org.id,row.id,row.version),
      stmt(r,`DELETE FROM idempotency WHERE org_id=? AND (resource_id=? OR resource_id=?) AND (actor_id<>? OR key<>?) AND ${guard}`,r.org.id,row.id,row.session_id,r.actor.id,r.key,...args),
      stmt(r,`UPDATE ai_usage SET resource_id=NULL,operation_id=NULL WHERE org_id=? AND resource_id IN (?,?) AND ${guard}`,r.org.id,row.id,row.session_id,...args),
      stmt(r,`DELETE FROM ai_operations WHERE org_id=? AND resource_id IN (?,?) AND ${guard}`,r.org.id,row.id,row.session_id,...args),
      stmt(r,`UPDATE audit_events SET resource_id=NULL WHERE org_id=? AND resource_id IN (?,?) AND ${guard}`,r.org.id,row.id,row.session_id,...args),
      stmt(r,`DELETE FROM messages WHERE org_id=? AND session_id=? AND ${guard}`,r.org.id,row.session_id,...args),
      stmt(r,'DELETE FROM cases WHERE org_id=? AND id=? AND mutation_token=?',...args),
      stmt(r,'DELETE FROM intake_sessions WHERE org_id=? AND id=? AND NOT EXISTS (SELECT 1 FROM cases WHERE org_id=? AND session_id=?) AND NOT EXISTS (SELECT 1 FROM messages WHERE org_id=? AND session_id=?)',r.org.id,row.session_id,r.org.id,row.session_id,r.org.id,row.session_id),
    ]);
    if(!result[0].meta.changes) fail(409,'VERSION_CONFLICT','O caso mudou. Atualize antes de excluir.');
    r.resourceId=null;
    await stmt(r,"INSERT INTO audit_events (id,org_id,actor_id,action,resource_id,request_id,created_at) VALUES (?,?,?,'case.deleted',NULL,?,?)",uid(),r.org.id,r.actor.id,r.requestId,time).run();
    return {deleted:true};
  }
  fail(404,'NOT_FOUND','Rota não encontrada.');
}
