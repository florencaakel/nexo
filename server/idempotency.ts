import { canonical, fail, first, json, now, sha, stmt, type Runtime } from './core.ts';
interface IdemRow {action:string;payload_hash:string;state:string;status_code:number|null;response_json:string|null;lease_until:string}
export async function claim(r:Runtime,action:string,input:unknown):Promise<Response|null> {
  const hash=await sha(canonical(input));
  const result=await stmt(r,'INSERT OR IGNORE INTO idempotency (org_id,actor_id,key,action,payload_hash,token,resource_id,state,created_at,lease_until) VALUES (?,?,?,?,?,?,?,\'pending\',?,?)',r.org.id,r.actor.id,r.key,action,hash,r.token,r.resourceId,now(),new Date(Date.now()+120_000).toISOString()).run();
  if(result.meta.changes>0)return null;
  const existing=await first<IdemRow>(r,'SELECT action,payload_hash,state,status_code,response_json,lease_until FROM idempotency WHERE org_id=? AND actor_id=? AND key=?',r.org.id,r.actor.id,r.key);
  if(!existing)fail(409,'IDEMPOTENCY_CONFLICT','Atualize o estado salvo antes de tentar novamente.',true);
  if(existing.action!==action||existing.payload_hash!==hash)fail(409,'IDEMPOTENCY_REUSED','Esta chave já foi usada em outro pedido.');
  if(existing.state==='complete'&&existing.response_json&&existing.status_code)return json(JSON.parse(existing.response_json),existing.status_code);
  if(existing.lease_until<=now())fail(409,'OPERATION_UNCERTAIN','A operação foi interrompida. Consulte o estado salvo; uma nova tentativa deve ser explícita.',false);
  fail(409,'OPERATION_IN_PROGRESS','Uma operação está em andamento. Aguarde e consulte o estado salvo.',true);
}
export async function complete(r:Runtime,body:unknown,status:number):Promise<void> {
  await stmt(r,'UPDATE idempotency SET state=\'complete\',status_code=?,response_json=?,resource_id=? WHERE org_id=? AND actor_id=? AND key=? AND token=?',status,JSON.stringify(body),r.resourceId,r.org.id,r.actor.id,r.key,r.token).run();
}
