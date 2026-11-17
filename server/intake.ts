import { MAX_PARTICIPANT_CHARS, MAX_QUESTIONS, type SessionDTO } from '../lib/contracts.ts';
import { aiAvailable, audit, checkVersion, criteria, draft, expectedVersion, fail, first, inputText, loadSession, messages, now, stmt, strictKeys, uid, type CaseRow, type Runtime, type SessionRow } from './core.ts';
import { askQuestion, recoverExpiredOperation } from './processing.ts';

export async function sessionDTO(r: Runtime, row: SessionRow): Promise<SessionDTO> {
  const history = await messages(r,row.id);
  const item = await first<CaseRow>(r,'SELECT * FROM cases WHERE org_id=? AND session_id=?',r.org.id,row.id);
  return {id:row.id,version:row.version,state:row.state,mode:'demo',messages:history,questionCount:row.question_count,expiresAt:row.expires_at,canAsk:row.state==='draft' && !row.question_ready && row.question_count<MAX_QUESTIONS && history.at(-1)?.role==='user',aiAvailable:aiAvailable(r),receipt:item ? {caseId:item.id,status:item.status,version:item.version,receivedAt:item.created_at} : null};
}

export async function intake(r: Runtime, path: string[], method: string, input: Record<string, unknown>): Promise<SessionDTO> {
  if (path.length === 0 && method === 'POST') {
    strictKeys(input,['mode']); if (input.mode !== 'demo') fail(400,'DEMO_ONLY','Esta demonstração aceita somente casos fictícios.');
    if (!r.org.intake_enabled) fail(409,'INTAKE_PAUSED','Novas entrevistas estão pausadas.');
    const current = await criteria(r); const id=uid(); const time=now(); r.resourceId=id;
    const ttl = Math.min(24*7,Math.max(1,r.context.config.sessionTtlHours));
    await r.context.db.batch([
      stmt(r,'INSERT INTO intake_sessions (id,org_id,owner_id,criteria_id,expires_at,created_at,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM organizations WHERE id=? AND intake_enabled=1)',id,r.org.id,r.actor.id,current.id,new Date(Date.now()+ttl*3_600_000).toISOString(),time,time,r.org.id),
      audit(r,'session.created',id),
    ]);
    return sessionDTO(r,await loadSession(r,id));
  }
  if (!path[0] || path.length>2) fail(404,'NOT_FOUND','Rota não encontrada.');
  let row=await loadSession(r,path[0]);
  if (path.length===1 && method==='GET') return sessionDTO(r,row);
  await recoverExpiredOperation(r,'question',row.id);
  row=await loadSession(r,row.id); draft(row); checkVersion(row.version,expectedVersion(input));
  if (path[1]==='next-question' && method==='POST') { strictKeys(input,['expectedVersion']); await askQuestion(r,row); return sessionDTO(r,await loadSession(r,row.id)); }
  const time=now(); const expected=row.version;
  if (path[1]==='messages' && method==='POST') {
    strictKeys(input,['content','expectedVersion']);
    const content=inputText(input.content,MAX_PARTICIPANT_CHARS,'um relato fictício');
    if (row.participant_chars+content.length>MAX_PARTICIPANT_CHARS) fail(400,'TEXT_LIMIT','O relato completo pode ter até 10.000 caracteres.');
    const history=await messages(r,row.id);
    if(history.length>=32) fail(400,'MESSAGE_LIMIT','O atendimento atingiu o limite de mensagens.');
    const result=await r.context.db.batch([
      stmt(r,'UPDATE intake_sessions SET participant_chars=participant_chars+?,version=version+1,mutation_token=?,question_ready=0,updated_at=? WHERE org_id=? AND id=? AND owner_id=? AND version=? AND state=\'draft\' AND lease_token IS NULL',content.length,r.token,time,r.org.id,row.id,r.actor.id,expected),
      stmt(r,'INSERT INTO messages (id,org_id,session_id,role,content,sequence,created_at) SELECT ?,?,?,\'user\',?,?,? WHERE EXISTS (SELECT 1 FROM intake_sessions WHERE id=? AND org_id=? AND mutation_token=?)',uid(),r.org.id,row.id,content,history.length+1,time,row.id,r.org.id,r.token),
    ]);
    if(!result[0].meta.changes) fail(409,'VERSION_CONFLICT','O atendimento mudou. Atualize antes de continuar.');
    return sessionDTO(r,await loadSession(r,row.id));
  }
  if(path[1]==='messages' && method==='PUT') {
    strictKeys(input,['answers','expectedVersion']);
    if(!Array.isArray(input.answers)||input.answers.length<1||input.answers.length>32) fail(400,'INVALID_INPUT','Informe as respostas a corrigir.');
    const history=await messages(r,row.id); const users=history.filter(m=>m.role==='user');
    const values=new Map<string,string>();
    for(const value of input.answers) {
      if(!value||typeof value!=='object'||Array.isArray(value)) fail(400,'INVALID_INPUT','Resposta inválida.');
      const answer=value as Record<string,unknown>; strictKeys(answer,['id','content']);
      if(typeof answer.id!=='string'||values.has(answer.id)||!users.some(m=>m.id===answer.id)) fail(400,'INVALID_INPUT','Resposta inválida.');
      values.set(answer.id,inputText(answer.content,MAX_PARTICIPANT_CHARS));
    }
    const total=users.reduce((sum,m)=>sum+(values.get(m.id)??m.content).length,0);
    if(total>MAX_PARTICIPANT_CHARS) fail(400,'TEXT_LIMIT','O relato completo pode ter até 10.000 caracteres.');
    const result=await r.context.db.batch([
      stmt(r,'UPDATE intake_sessions SET participant_chars=?,version=version+1,mutation_token=?,question_ready=0,updated_at=? WHERE org_id=? AND id=? AND owner_id=? AND version=? AND state=\'draft\' AND lease_token IS NULL',total,r.token,time,r.org.id,row.id,r.actor.id,expected),
      ...[...values].map(([id,content])=>stmt(r,'UPDATE messages SET content=? WHERE org_id=? AND session_id=? AND id=? AND role=\'user\' AND EXISTS (SELECT 1 FROM intake_sessions WHERE id=? AND org_id=? AND mutation_token=?)',content,r.org.id,row.id,id,row.id,r.org.id,r.token)),
    ]);
    if(!result[0].meta.changes) fail(409,'VERSION_CONFLICT','O atendimento mudou. Atualize antes de continuar.');
    return sessionDTO(r,await loadSession(r,row.id));
  }
  if(path[1]==='submit' && method==='POST') {
    strictKeys(input,['confirmedFictional','expectedVersion']);
    if(input.confirmedFictional!==true) fail(400,'FICTIONAL_CONFIRMATION_REQUIRED','Confirme que o relato é fictício.');
    const history=await messages(r,row.id); if(!history.some(m=>m.role==='user')) fail(400,'EMPTY_REPORT','Escreva um relato antes de enviar.');
    const caseId=uid();
    const result=await r.context.db.batch([
      stmt(r,'UPDATE intake_sessions SET state=\'submitted\',version=version+1,mutation_token=?,updated_at=? WHERE org_id=? AND id=? AND owner_id=? AND version=? AND state=\'draft\' AND lease_token IS NULL',r.token,time,r.org.id,row.id,r.actor.id,expected),
      stmt(r,'INSERT INTO cases (id,org_id,session_id,owner_id,criteria_id,title,created_at,updated_at) SELECT ?,org_id,id,owner_id,criteria_id,?,?,? FROM intake_sessions WHERE id=? AND org_id=? AND mutation_token=?',caseId,'Relato fictício para revisão',time,time,row.id,r.org.id,r.token),
    ]);
    if(!result[0].meta.changes) fail(409,'VERSION_CONFLICT','O atendimento mudou. Atualize antes de continuar.');
    await audit(r,'case.received',caseId).run();
    return sessionDTO(r,await loadSession(r,row.id));
  }
  fail(404,'NOT_FOUND','Rota não encontrada.');
}
