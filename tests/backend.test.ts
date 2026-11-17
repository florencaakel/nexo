/** Integração local com SQLite real e provedor sintético exclusivo dos testes.
 * Não chama rede, não valida OpenAI real nem autenticação hospedada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.ts';
import { createTestDb } from './helpers/d1.ts';
import { AiFailure, type AiInput, type AiProvider, type AiResult } from '../lib/ai-contract.ts';
import type { AnalysisData, CaseDetailDTO, SessionDTO, SettingsDTO } from '../lib/contracts.ts';
import type { ServerContext } from '../lib/server-contract.ts';

function analysis(input:AiInput):AnalysisData {
  const source=input.messages.find(m=>m.role==='user')!;
  const cited={texto:source.content,referencias_a_mensagens:[{message_id:source.id,trecho:source.content}]};
  return {resumo:cited,fatos_relatados:[cited],datas_mencionadas:[],envolvidos_mencionados:[],documentos_mencionados:[],tentativas_de_solucao:[],lacunas:[],perguntas_pendentes:[],area_sugerida:'consumidor',compatibilidade_com_criterios:{versao:input.criteria.version,resultado:'compativel',explicacao:'Relato fictício de cobrança.'},sinais_para_revisao_prioritaria:[],avisos_de_incerteza:['Revisão humana necessária.']};
}
function result<T>(data:T):AiResult<T> {return {data,meta:{model:'test-only',promptVersion:'test',schemaVersion:'test',requestId:null,durationMs:1,inputTokens:20,outputTokens:10,usageEstimated:false,estimatedCostMicrousd:30}};}
function fakeProvider():AiProvider&{calls:number} {
  return {configured:true,model:'test-only',calls:0,maxCostMicrousd:()=>100,async question(){this.calls++;return result({question:'Qual foi a resposta da empresa fictícia?',ready:false,reason:'Tentativa de solução não informada.'});},async analyze(input){this.calls++;return result(analysis(input));}};
}
async function setup(t:{after:(fn:()=>void)=>void}) {
  const local=await createTestDb();t.after(local.close); const provider=fakeProvider();
  const context:ServerContext={db:local.db,identity:{id:'admin-fixture',displayName:'Administradora de teste'},provider,config:{bootstrapAdminId:'admin-fixture',aiApproved:true,maxBudgetMicrousd:1000,sessionTtlHours:24,realIntakeEnabled:false}};
  async function call<T=Record<string,unknown>>(path:string,method='GET',input?:unknown,key=crypto.randomUUID(),ctx=context) {
    const request=new Request(`https://nexo.example/api/${path}`,{method,headers:method==='GET'?{}:{Origin:'https://nexo.example','Content-Type':'application/json','X-Nexo-Request':'1','Idempotency-Key':key},...(method==='GET'?{}:{body:JSON.stringify(input??{})})});
    const response=await handleApi(request,path.split('?')[0].split('/'),ctx); return {status:response.status,data:await response.json() as T,headers:response.headers};
  }
  await call('me');
  async function configure(limit=1000) {const current=(await call<SettingsDTO>('admin/settings')).data;return call<SettingsDTO>('admin/settings','PATCH',{expectedVersion:current.version,aiEnabled:true,budgetLimitMicrousd:limit});}
  async function draft(text='Cancelei o serviço fictício e recebi uma cobrança indevida.') {
    let session=(await call<SessionDTO>('intake-sessions','POST',{mode:'demo'})).data;
    session=(await call<SessionDTO>(`intake-sessions/${session.id}/messages`,'POST',{content:text,expectedVersion:session.version})).data;return session;
  }
  async function submit(session?:SessionDTO) {session??=await draft();return (await call<SessionDTO>(`intake-sessions/${session.id}/submit`,'POST',{confirmedFictional:true,expectedVersion:session.version})).data;}
  return {context,provider,call,configure,draft,submit};
}

test('relato e recibo persistem antes da análise; revisão preserva original e sobrevive a novo contexto',async t=>{
  const h=await setup(t);await h.configure();const submitted=await h.submit();assert.equal(h.provider.calls,0);assert.equal(submitted.receipt?.status,'RECEBIDO');
  const receipt=submitted.receipt!;const processed=await h.call(`cases/${receipt.caseId}/analysis`,'POST',{expectedVersion:receipt.version});assert.equal(processed.status,200);assert.equal(h.provider.calls,1);
  const detail=(await h.call<CaseDetailDTO>(`cases/${receipt.caseId}`)).data;assert.equal(detail.status,'AGUARDANDO_REVISAO');assert.equal(detail.analysis?.data.resumo.texto,submitted.messages[0].content);
  const review=await h.call<CaseDetailDTO>(`cases/${receipt.caseId}/reviews`,'POST',{expectedVersion:detail.version,decision:'PENDENTE_INFORMACOES',notes:'Revisão fictícia.',correctedAnalysis:null});assert.equal(review.status,200);assert.equal(review.data.reviews.length,1);
  const nextContext={...h.context,identity:{id:'admin-fixture',displayName:'Outra sessão'}};
  const loaded=(await h.call<CaseDetailDTO>(`cases/${receipt.caseId}`,'GET',undefined,undefined,nextContext)).data;
  assert.equal(loaded.status,'PENDENTE_INFORMACOES');assert.equal(loaded.messages[0].content,submitted.messages[0].content);assert.equal(loaded.analysis?.id,detail.analysis?.id);
  const refreshed=(await h.call<SessionDTO>(`intake-sessions/${submitted.id}`)).data;assert.equal(refreshed.receipt?.version,loaded.version);
});

test('idempotência repete recibo sem duplicar caso e rejeita conteúdo diferente',async t=>{
  const h=await setup(t);const draft=await h.draft();const key=crypto.randomUUID();const path=`intake-sessions/${draft.id}/submit`;const input={expectedVersion:draft.version,confirmedFictional:true};
  const a=await h.call<SessionDTO>(path,'POST',input,key);const b=await h.call<SessionDTO>(path,'POST',input,key);assert.deepEqual(b.data,a.data);
  const conflict=await h.call(path,'POST',{...input,expectedVersion:999},key);assert.equal(conflict.status,409);
  assert.equal((await h.context.db.prepare('SELECT COUNT(*) AS count FROM cases').first<{count:number}>())?.count,1);
});

test('correções só alteram respostas antes de envio e concorrência preserva uma edição',async t=>{
  const h=await setup(t);const draft=await h.draft();const input={answers:[{id:draft.messages[0].id,content:'A cobrança fictícia ocorreu após cancelamento.'}],expectedVersion:draft.version};
  const responses=await Promise.all([h.call<SessionDTO>(`intake-sessions/${draft.id}/messages`,'PUT',input),h.call<SessionDTO>(`intake-sessions/${draft.id}/messages`,'PUT',input)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  const current=(await h.call<SessionDTO>(`intake-sessions/${draft.id}`)).data;assert.equal(current.messages[0].content,input.answers[0].content);
  const sent=await h.submit(current);assert.equal((await h.call(`intake-sessions/${draft.id}/messages`,'POST',{content:'alteração',expectedVersion:sent.version})).status,409);
});

test('pergunta faz uma chamada e exige resposta antes de outra; pausa mantém o rascunho',async t=>{
  const h=await setup(t);await h.configure();const draft=await h.draft();
  const asked=await h.call<SessionDTO>(`intake-sessions/${draft.id}/next-question`,'POST',{expectedVersion:draft.version});assert.equal(asked.status,200);assert.equal(asked.data.questionCount,1);assert.equal(asked.data.messages.at(-1)?.role,'assistant');
  assert.equal((await h.call(`intake-sessions/${draft.id}/next-question`,'POST',{expectedVersion:asked.data.version})).status,409);assert.equal(h.provider.calls,1);
  const settings=(await h.call<SettingsDTO>('admin/settings')).data;await h.call('admin/settings','PATCH',{expectedVersion:settings.version,intakeEnabled:false});
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo'})).status,409);assert.equal((await h.call(`intake-sessions/${draft.id}`)).status,200);
});

test('orçamento é reservado atomicamente entre casos; apenas uma chamada cabe',async t=>{
  const h=await setup(t);await h.configure(100);const a=await h.submit();const b=await h.submit();let release!:()=>void;const waiting=new Promise<void>(resolve=>{release=resolve;});
  h.provider.analyze=async input=>{h.provider.calls++;await waiting;return result(analysis(input));};
  const first=h.call(`cases/${a.receipt!.caseId}/analysis`,'POST',{expectedVersion:a.receipt!.version});
  while(h.provider.calls===0) await new Promise(resolve=>setTimeout(resolve,1));
  const second=await h.call(`cases/${b.receipt!.caseId}/analysis`,'POST',{expectedVersion:b.receipt!.version});assert.equal(second.status,429);assert.equal(h.provider.calls,1);release();assert.equal((await first).status,200);
  const settings=(await h.call<SettingsDTO>('admin/settings')).data;assert.equal(settings.budgetReservedMicrousd,0);assert.equal(settings.budgetSpentMicrousd,30);
});

test('timeout conserva custo incerto, relato e teto de três tentativas explícitas',async t=>{
  const h=await setup(t);await h.configure();const session=await h.submit();const id=session.receipt!.caseId;
  h.provider.analyze=async()=>{h.provider.calls++;throw new AiFailure('AI_TIMEOUT','timeout de teste',true,true);};
  for(let n=0;n<3;n++){const current=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:current.version})).status,503);}
  const current=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(current.status,'FALHA_ANALISE');assert.equal(current.messages.length,1);
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:current.version})).status,429);assert.equal(h.provider.calls,3);
  const settings=(await h.call<SettingsDTO>('admin/settings')).data;assert.equal(settings.budgetSpentMicrousd,300);assert.equal(settings.budgetReservedMicrousd,0);
});

test('duas análises do mesmo caso não duplicam chamada; revisão durante análise é recusada',async t=>{
  const h=await setup(t);await h.configure();const sent=await h.submit();let release!:()=>void;const waiting=new Promise<void>(resolve=>{release=resolve;});
  h.provider.analyze=async input=>{h.provider.calls++;await waiting;return result(analysis(input));};const path=`cases/${sent.receipt!.caseId}`;
  const pending=h.call(`${path}/analysis`,'POST',{expectedVersion:1});while(h.provider.calls===0) await new Promise(resolve=>setTimeout(resolve,1));
  assert.equal((await h.call(`${path}/analysis`,'POST',{expectedVersion:1})).status,409);
  assert.equal((await h.call(`${path}/reviews`,'POST',{expectedVersion:2,decision:'ENCERRADO',notes:'Teste.',correctedAnalysis:null})).status,409);
  release();assert.equal((await pending).status,200);assert.equal(h.provider.calls,1);
});

test('revisões concorrentes não se sobrescrevem nem permitem nova análise após decisão humana',async t=>{
  const h=await setup(t);const sent=await h.submit();const path=`cases/${sent.receipt!.caseId}`;
  const responses=await Promise.all(['ENCERRADO','PENDENTE_INFORMACOES'].map(decision=>h.call(`${path}/reviews`,'POST',{expectedVersion:1,decision,notes:'Decisão fictícia.',correctedAnalysis:null})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);const current=(await h.call<CaseDetailDTO>(path)).data;assert.equal(current.reviews.length,1);
  assert.equal((await h.call(`${path}/analysis`,'POST',{expectedVersion:current.version})).status,409);
});

test('critérios são versionados e caso conserva critérios da abertura',async t=>{
  const h=await setup(t);const old=await h.draft();const current=(await h.call<{version:number}>('admin/criteria')).data;
  assert.equal((await h.call('admin/criteria','POST',{expectedVersion:current.version,text:'Critério fictício atualizado.'})).status,200);
  assert.equal((await h.call('admin/criteria','POST',{expectedVersion:current.version,text:'Critério obsoleto.'})).status,409);
  const sent=await h.submit(old);const detail=(await h.call<CaseDetailDTO>(`cases/${sent.receipt!.caseId}`)).data;assert.equal(detail.criteria.version,current.version);
});

test('administração respeita A2, teto, papéis explícitos e impede auto remoção',async t=>{
  const h=await setup(t);const noA2={...h.context,config:{...h.context.config,aiApproved:false}};
  assert.equal((await h.call('admin/settings','PATCH',{expectedVersion:1,aiEnabled:true},undefined,noA2)).status,409);
  assert.equal((await h.call('admin/settings','PATCH',{expectedVersion:1,budgetLimitMicrousd:1001})).status,400);
  assert.equal((await h.call('admin/memberships','PUT',{userId:'admin-fixture',displayName:'Teste',roles:['tester'],active:true})).status,409);
  assert.equal((await h.call('admin/memberships','PUT',{userId:'tester-fixture',displayName:'Testador fictício',roles:['tester'],active:true})).status,200);
  const tester={...h.context,identity:{id:'tester-fixture',displayName:'Tester'}};
  assert.equal((await h.call('admin/settings','GET',undefined,undefined,tester)).status,403);
  assert.equal((await h.call('cases','GET',undefined,undefined,tester)).status,403);
});

test('exclusão remove conteúdo e caches mas mantém contabilidade agregada',async t=>{
  const h=await setup(t);await h.configure();const sent=await h.submit();const id=sent.receipt!.caseId;await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1});
  const current=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;const key=crypto.randomUUID();const input={expectedVersion:current.version};
  assert.equal((await h.call(`cases/${id}`,'DELETE',input,key)).status,200);assert.equal((await h.call(`cases/${id}`,'DELETE',input,key)).status,200);
  assert.equal((await h.call(`cases/${id}`)).status,404);assert.equal((await h.call(`intake-sessions/${sent.id}`)).status,404);
  for(const table of ['messages','cases','analyses','intake_sessions']) assert.equal((await h.context.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{count:number}>())?.count,0);
  assert.equal((await h.call<SettingsDTO>('admin/settings')).data.budgetSpentMicrousd,30);
  assert.equal((await h.context.db.prepare('SELECT COUNT(*) AS count FROM idempotency WHERE response_json LIKE ?').bind('%Cancelei o serviço%').first<{count:number}>())?.count,0);
});

test('requisições sem origem, corpo excessivo e dados reais não gravam entrevista',async t=>{
  const h=await setup(t);
  const request=new Request('https://nexo.example/api/intake-sessions',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:'{"mode":"demo"}'});
  assert.equal((await handleApi(request,['intake-sessions'],h.context)).status,403);
  assert.equal((await h.call('intake-sessions','POST',{mode:'real'})).status,400);
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo',padding:'x'.repeat(132000)})).status,413);
});

test('sessão expirada bloqueia alterações; visitante inicial não ganha papel',async t=>{
  const h=await setup(t);const stranger={...h.context,identity:{id:'unknown-fixture',displayName:'Desconhecido'}};
  const me=(await h.call<{roles:string[]}>('me','GET',undefined,undefined,stranger)).data;assert.deepEqual(me.roles,[]);
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo'},undefined,stranger)).status,403);
  const draft=await h.draft();await h.context.db.prepare('UPDATE intake_sessions SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00.000Z',draft.id).run();
  assert.equal((await h.call(`intake-sessions/${draft.id}`)).status,410);
});

test('corrigir relato reabre perguntas quando a etapa estava pronta',async t=>{
  const h=await setup(t);await h.configure();const draft=await h.draft();
  h.provider.question=async()=>result({question:null,ready:true,reason:'Informações suficientes para o teste.'});
  const ready=(await h.call<SessionDTO>(`intake-sessions/${draft.id}/next-question`,'POST',{expectedVersion:draft.version})).data;assert.equal(ready.canAsk,false);
  const edited=(await h.call<SessionDTO>(`intake-sessions/${draft.id}/messages`,'PUT',{expectedVersion:ready.version,answers:[{id:ready.messages[0].id,content:'A cobrança fictícia foi diferente do que eu relatei.'}]})).data;
  assert.equal(edited.canAsk,true);
});

test('lease interrompido converte reserva em custo incerto e permite só retomada explícita',async t=>{
  const h=await setup(t);await h.configure();const sent=await h.submit();const id=sent.receipt!.caseId;const time='2000-01-01T00:00:00.000Z';
  await h.context.db.batch([
    h.context.db.prepare("UPDATE cases SET status='EM_ANALISE',lease_token='test-interrupted',lease_until=?,version=2 WHERE id=?").bind(time,id),
    h.context.db.prepare("UPDATE organizations SET budget_reserved_microusd=100 WHERE id='nexo-demo'"),
    h.context.db.prepare("INSERT INTO ai_operations(id,org_id,resource_id,kind,attempts) VALUES (?,'nexo-demo',?,'analysis',1)").bind(`analysis:${id}`,id),
    h.context.db.prepare("INSERT INTO ai_usage(id,org_id,resource_id,operation_id,kind,status,reserved_microusd,created_at) VALUES ('interrupted-fixture','nexo-demo',?,?,'analysis','reserved',100,?)").bind(id,`analysis:${id}`,time),
  ]);
  // The recovered version differs, requiring state refresh and explicit retry.
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:2})).status,409);assert.equal(h.provider.calls,0);
  const current=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(current.status,'FALHA_ANALISE');assert.equal(current.version,3);
  let settings=(await h.call<SettingsDTO>('admin/settings')).data;assert.equal(settings.budgetReservedMicrousd,0);assert.equal(settings.budgetSpentMicrousd,100);
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:3})).status,200);assert.equal(h.provider.calls,1);
  settings=(await h.call<SettingsDTO>('admin/settings')).data;assert.equal(settings.budgetSpentMicrousd,130);
});

test('revogação de papel é aplicada antes de replay idempotente',async t=>{
  const h=await setup(t);await h.call('admin/memberships','PUT',{userId:'tester-fixture',displayName:'Teste',roles:['tester'],active:true});
  const tester={...h.context,identity:{id:'tester-fixture',displayName:'Tester'}};const key=crypto.randomUUID();
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo'},key,tester)).status,200);
  await h.call('admin/memberships','PUT',{userId:'tester-fixture',displayName:'Teste',roles:['reviewer'],active:true});
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo'},key,tester)).status,403);
});

test('administradores concorrentes não removem a última associação administrativa',async t=>{
  const h=await setup(t);await h.call('admin/memberships','PUT',{userId:'admin-2-fixture',displayName:'Segundo admin',roles:['admin'],active:true});
  const second={...h.context,identity:{id:'admin-2-fixture',displayName:'Segundo admin'}};
  const results=await Promise.all([
    h.call('admin/memberships','PUT',{userId:'admin-2-fixture',displayName:'Segundo admin',roles:['tester'],active:true}),
    h.call('admin/memberships','PUT',{userId:'admin-fixture',displayName:'Primeiro admin',roles:['tester'],active:true},undefined,second),
  ]);
  assert.equal(results.filter(r=>r.status===200).length,1);
  const remaining=await h.context.db.prepare("SELECT COUNT(*) AS count FROM memberships WHERE active=1 AND EXISTS (SELECT 1 FROM json_each(roles_json) WHERE value='admin')").first<{count:number}>();assert.equal(remaining?.count,1);
});
