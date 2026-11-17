/** Regras reais da aplicação + SQLite local. Sem modelo externo, credenciais ou rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRulesProvider } from '../ai/rules.ts';
import { handleApi } from '../server/api.ts';
import { createTestDb } from './helpers/d1.ts';
import type { ServerContext } from '../lib/server-contract.ts';
import type { CaseDetailDTO, MeDTO, SessionDTO, SettingsDTO, UsageDTO } from '../lib/contracts.ts';

async function setup(t:{after:(fn:()=>void)=>void}) {
  const local=await createTestDb();t.after(local.close);
  const provider=createRulesProvider();
  const context:ServerContext={db:local.db,identity:{id:'rules-admin-fixture',displayName:'Admin de teste local'},provider,config:{bootstrapAdminId:'rules-admin-fixture',aiApproved:false,maxBudgetMicrousd:0,sessionTtlHours:24,realIntakeEnabled:false}};
  async function call<T=Record<string,unknown>>(path:string,method='GET',input?:unknown,key=crypto.randomUUID()) {
    const request=new Request(`https://nexo.example/api/${path}`,{method,headers:method==='GET'?{}:{Origin:'https://nexo.example','Content-Type':'application/json','X-Nexo-Request':'1','Idempotency-Key':key},...(method==='GET'?{}:{body:JSON.stringify(input??{})})});
    const response=await handleApi(request,path.split('/'),context);return {status:response.status,data:await response.json() as T};
  }
  await call('me');
  async function draft() {
    const created=await call<SessionDTO>('intake-sessions','POST',{mode:'demo'});assert.equal(created.status,200);
    const added=await call<SessionDTO>(`intake-sessions/${created.data.id}/messages`,'POST',{expectedVersion:created.data.version,content:'Recebi uma cobrança da empresa fictícia.'});assert.equal(added.status,200);return added.data;
  }
  async function submit(session:SessionDTO) {
    const sent=await call<SessionDTO>(`intake-sessions/${session.id}/submit`,'POST',{expectedVersion:session.version,confirmedFictional:true});assert.equal(sent.status,200);return sent.data;
  }
  return {context,provider,call,draft,submit};
}

test('regras reais percorrem pergunta, ficha e revisão com gates falsos, orçamento zero e nenhum fetch',async t=>{
  const network=t.mock.method(globalThis,'fetch',()=>{throw new Error('Rede não permitida no teste de regras locais.');});
  const h=await setup(t);const me=(await h.call<MeDTO>('me')).data;
  assert.equal(me.capabilities.processingMode,'rules');assert.equal(me.capabilities.aiConfigured,true);assert.equal(me.capabilities.aiEnabled,true);
  const settings=(await h.call<SettingsDTO>('admin/settings')).data;assert.equal(settings.budgetLimitMicrousd,0);assert.equal(settings.processingMode,'rules');
  const raw=await h.context.db.prepare("SELECT ai_enabled,budget_limit_microusd FROM organizations WHERE id='nexo-demo'").first<{ai_enabled:number;budget_limit_microusd:number}>();assert.deepEqual(raw,{ai_enabled:0,budget_limit_microusd:0});
  const draft=await h.draft();assert.equal(draft.processingMode,'rules');assert.equal(draft.aiAvailable,true);
  const question=await h.call<SessionDTO>(`intake-sessions/${draft.id}/next-question`,'POST',{expectedVersion:draft.version});assert.equal(question.status,200);assert.equal(question.data.messages.at(-1)?.role,'assistant');
  const sent=await h.submit(question.data);const id=sent.receipt!.caseId;
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:sent.receipt!.version})).status,200);
  const detail=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(detail.status,'AGUARDANDO_REVISAO');assert.equal(detail.analysis?.model,'nexo-regras-v1');assert.ok(detail.analysis?.data.resumo.referencias_a_mensagens.length);
  const reviewed=await h.call<CaseDetailDTO>(`cases/${id}/reviews`,'POST',{expectedVersion:detail.version,decision:'PENDENTE_INFORMACOES',notes:'Revisão fictícia da ficha organizada por regras.',correctedAnalysis:null});assert.equal(reviewed.status,200);
  const restored=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(restored.reviews.length,1);assert.equal(restored.messages[0].content,draft.messages[0].content);
  const usage=(await h.call<UsageDTO>('admin/usage')).data;assert.equal(usage.calls,2);assert.equal(usage.inputTokens,0);assert.equal(usage.outputTokens,0);assert.equal(usage.spentMicrousd,0);assert.equal(usage.reservedMicrousd,0);
  assert.equal(network.mock.callCount(),0);
});

test('pausa única bloqueia regras e novas entrevistas e permanece após novo login',async t=>{
  const h=await setup(t);const draft=await h.draft();const settings=(await h.call<SettingsDTO>('admin/settings')).data;
  const paused=await h.call<SettingsDTO>('admin/settings','PATCH',{expectedVersion:settings.version,intakeEnabled:false,retentionDays:15});assert.equal(paused.status,200);assert.equal(paused.data.aiEnabled,false);
  for(let n=0;n<3;n++) assert.equal((await h.call<MeDTO>('me')).data.capabilities.intakeOpen,false);
  assert.equal((await h.call('intake-sessions','POST',{mode:'demo'})).status,409);
  const question=await h.call(`intake-sessions/${draft.id}/next-question`,'POST',{expectedVersion:draft.version});assert.equal(question.status,409);assert.equal((question.data.error as {code:string}).code,'PROCESSING_PAUSED');
  const sent=await h.submit(draft);assert.equal((await h.call(`cases/${sent.receipt!.caseId}/analysis`,'POST',{expectedVersion:1})).status,409);
  const resumed=await h.call<SettingsDTO>('admin/settings','PATCH',{expectedVersion:paused.data.version,intakeEnabled:true});assert.equal(resumed.status,200);
  assert.equal((await h.call(`cases/${sent.receipt!.caseId}/analysis`,'POST',{expectedVersion:1})).status,200);
});

test('administração local recusa IA paga e orçamento positivo, preservando histórico anterior',async t=>{
  const h=await setup(t);
  await h.context.db.batch([
    h.context.db.prepare("UPDATE organizations SET ai_enabled=1,budget_limit_microusd=100,budget_spent_microusd=50,budget_reserved_microusd=20 WHERE id='nexo-demo'"),
    h.context.db.prepare("INSERT INTO ai_usage(id,org_id,kind,status,reserved_microusd,cost_microusd,input_tokens,output_tokens,model,created_at) VALUES ('historical-fixture','nexo-demo','analysis','complete',0,50,100,50,'legacy-test-only',?)").bind(new Date().toISOString()),
  ]);
  assert.equal((await h.call('admin/settings','PATCH',{expectedVersion:1,aiEnabled:true})).status,400);
  assert.equal((await h.call('admin/settings','PATCH',{expectedVersion:1,budgetLimitMicrousd:1})).status,400);
  const changed=await h.call<SettingsDTO>('admin/settings','PATCH',{expectedVersion:1,intakeEnabled:true,retentionDays:20,budgetLimitMicrousd:0,aiEnabled:false});assert.equal(changed.status,200);
  assert.equal(changed.data.budgetLimitMicrousd,100);assert.equal(changed.data.budgetSpentMicrousd,50);assert.equal(changed.data.budgetReservedMicrousd,20);
  const sent=await h.submit(await h.draft());assert.equal((await h.call(`cases/${sent.receipt!.caseId}/analysis`,'POST',{expectedVersion:1})).status,200);
  const totals=(await h.call<UsageDTO>('admin/usage')).data;assert.equal(totals.spentMicrousd,50);assert.equal(totals.reservedMicrousd,20);assert.equal(totals.inputTokens,100);assert.equal(totals.outputTokens,50);
  const historic=await h.context.db.prepare("SELECT cost_microusd,input_tokens,output_tokens FROM ai_usage WHERE id='historical-fixture'").first();assert.deepEqual(historic,{cost_microusd:50,input_tokens:100,output_tokens:50});
});

test('regras preservam idempotência e concorrência sem criar fichas duplicadas',async t=>{
  const h=await setup(t);const sent=await h.submit(await h.draft());const id=sent.receipt!.caseId;const key=crypto.randomUUID();
  const results=await Promise.all([h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1},key),h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1},key)]);
  assert.ok(results.some(r=>r.status===200));assert.ok(results.every(r=>r.status===200||r.status===409));
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1},key)).status,200);
  assert.equal((await h.context.db.prepare('SELECT COUNT(*) AS count FROM analyses WHERE case_id=?').bind(id).first<{count:number}>())?.count,1);
  const usage=(await h.call<UsageDTO>('admin/usage')).data;assert.equal(usage.calls,1);assert.equal(usage.spentMicrousd,0);
});

test('metadados cobrados ou reserva positiva são rejeitados no modo de regras',async t=>{
  const h=await setup(t);const sent=await h.submit(await h.draft());const id=sent.receipt!.caseId;
  h.context.provider={...h.provider,maxCostMicrousd:()=>1};
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1})).status,503);
  assert.equal((await h.call<UsageDTO>('admin/usage')).data.calls,0);
  const realAnalyze=h.provider.analyze.bind(h.provider);
  h.context.provider={...h.provider,analyze:async input=>{const result=await realAnalyze(input);return {...result,meta:{...result.meta,estimatedCostMicrousd:1,inputTokens:1}};}};
  assert.equal((await h.call(`cases/${id}/analysis`,'POST',{expectedVersion:1})).status,503);
  const detail=(await h.call<CaseDetailDTO>(`cases/${id}`)).data;assert.equal(detail.analysis,null);assert.equal(detail.status,'FALHA_ANALISE');
  const usage=(await h.call<UsageDTO>('admin/usage')).data;assert.equal(usage.spentMicrousd,0);assert.equal(usage.inputTokens,0);assert.equal(usage.outputTokens,0);
});
