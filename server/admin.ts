import type { MembershipDTO, UsageDTO } from '../lib/contracts.ts';
import { all, checkVersion, criteria, expectedVersion, fail, first, inputText, now, orgFresh, rolesOf, settings, stmt, strictKeys, uid, usesLocalRules, type MemberRow, type Runtime } from './core.ts';

async function members(r:Runtime):Promise<{members:MembershipDTO[]}> {
  return {members:(await all<MemberRow>(r,'SELECT * FROM memberships WHERE org_id=? ORDER BY display_name,user_id',r.org.id)).map(m=>({userId:m.user_id,displayName:m.display_name,roles:rolesOf(m.roles_json),active:!!m.active}))};
}
export async function admin(r:Runtime,path:string[],method:string,input:Record<string,unknown>):Promise<unknown> {
  if(path.length!==1) fail(404,'NOT_FOUND','Rota não encontrada.');
  if(path[0]==='settings') {
    if(method==='GET') return settings(r,await orgFresh(r));
    if(method==='PATCH') {
      strictKeys(input,['expectedVersion','intakeEnabled','aiEnabled','budgetLimitMicrousd','retentionDays']);
      const version=expectedVersion(input); await orgFresh(r); checkVersion(r.org.settings_version,version);
      for(const key of ['intakeEnabled','aiEnabled']) if(key in input&&typeof input[key]!=='boolean') fail(400,'INVALID_INPUT','Informe uma opção válida.');
      const retention=input.retentionDays??r.org.retention_days;
      if(!Number.isSafeInteger(retention)||Number(retention)<1||Number(retention)>365) fail(400,'INVALID_RETENTION','Informe retenção entre 1 e 365 dias.');
      if(usesLocalRules(r)) {
        if(input.aiEnabled===true||input.budgetLimitMicrousd!==undefined&&input.budgetLimitMicrousd!==0) fail(400,'PAID_AI_DISABLED','Esta versão usa somente regras locais. IA paga e orçamento de API não podem ser habilitados.');
        // Keep legacy budget, costs and switches intact. The sole runtime pause
        // for rules is intake_enabled; login never changes it.
        const result=await stmt(r,'UPDATE organizations SET intake_enabled=?,retention_days=?,settings_version=settings_version+1 WHERE id=? AND settings_version=?',input.intakeEnabled===undefined?r.org.intake_enabled:input.intakeEnabled?1:0,retention,r.org.id,version).run();
        if(!result.meta.changes) fail(409,'SETTINGS_CONFLICT','As configurações mudaram. Atualize antes de continuar.');
        await stmt(r,"INSERT INTO audit_events (id,org_id,actor_id,action,request_id,created_at) VALUES (?,?,?,'settings.updated',?,?)",uid(),r.org.id,r.actor.id,r.requestId,now()).run();
        return settings(r,await orgFresh(r));
      }
      const budget=input.budgetLimitMicrousd??r.org.budget_limit_microusd;
      if(!Number.isSafeInteger(budget)||Number(budget)<0||Number(budget)>r.context.config.maxBudgetMicrousd) fail(400,'INVALID_BUDGET','O limite deve respeitar o teto aprovado no servidor.');
      if(!Number.isSafeInteger(retention)||Number(retention)<1||Number(retention)>365) fail(400,'INVALID_RETENTION','Informe retenção entre 1 e 365 dias.');
      if(input.aiEnabled===true&&(!r.context.config.aiApproved||!r.context.provider.configured)) fail(409,'AI_NOT_CONFIGURED','A integração de IA ainda precisa ser aprovada e configurada.');
      const result=await stmt(r,'UPDATE organizations SET intake_enabled=?,ai_enabled=?,budget_limit_microusd=?,retention_days=?,settings_version=settings_version+1 WHERE id=? AND settings_version=? AND budget_spent_microusd+budget_reserved_microusd<=?',input.intakeEnabled===undefined?r.org.intake_enabled:input.intakeEnabled?1:0,input.aiEnabled===undefined?r.org.ai_enabled:input.aiEnabled?1:0,budget,retention,r.org.id,version,budget).run();
      if(!result.meta.changes) fail(409,'SETTINGS_CONFLICT','As configurações ou o consumo mudaram. O teto não pode ficar abaixo do consumo comprometido.');
      await stmt(r,"INSERT INTO audit_events (id,org_id,actor_id,action,request_id,created_at) VALUES (?,?,?,'settings.updated',?,?)",uid(),r.org.id,r.actor.id,r.requestId,now()).run();
      return settings(r,await orgFresh(r));
    }
  }
  if(path[0]==='memberships') {
    if(method==='GET') return members(r);
    if(method==='PUT') {
      strictKeys(input,['userId','displayName','roles','active']);
      const userId=inputText(input.userId,200,'o identificador verificado da conta'); const displayName=inputText(input.displayName,100,'um nome de exibição');
      if(!Array.isArray(input.roles)||input.roles.length>3||input.roles.some(role=>!['admin','tester','reviewer'].includes(role))||new Set(input.roles).size!==input.roles.length||typeof input.active!=='boolean'||(input.active&&!input.roles.length)) fail(400,'INVALID_INPUT','Informe papéis e estado de acesso válidos.');
      // Explicitly retain the signed-in administrator's own administration.
      if(userId===r.actor.id&&(!input.active||!input.roles.includes('admin'))) fail(409,'ADMIN_SELF_REMOVAL','Outra pessoa administradora deve alterar seu acesso.');
      const existing=await first<MemberRow>(r,'SELECT * FROM memberships WHERE user_id=?',userId);
      if(existing&&existing.org_id!==r.org.id) fail(409,'MEMBERSHIP_CONFLICT','Esta identidade não pode ser associada a esta organização.');
      const time=now();
      const result=await r.context.db.batch([
        stmt(r,'INSERT INTO memberships (org_id,user_id,display_name,roles_json,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(org_id,user_id) DO UPDATE SET display_name=excluded.display_name,roles_json=excluded.roles_json,active=excluded.active,updated_at=excluded.updated_at WHERE (excluded.active=1 AND EXISTS (SELECT 1 FROM json_each(excluded.roles_json) WHERE value=\'admin\')) OR NOT EXISTS (SELECT 1 FROM json_each(memberships.roles_json) WHERE value=\'admin\') OR memberships.active=0 OR (SELECT COUNT(*) FROM memberships m WHERE m.org_id=excluded.org_id AND m.active=1 AND EXISTS (SELECT 1 FROM json_each(m.roles_json) WHERE value=\'admin\'))>1',r.org.id,userId,displayName,JSON.stringify(input.roles),input.active?1:0,time,time),
        stmt(r,"INSERT INTO audit_events (id,org_id,actor_id,action,request_id,created_at) VALUES (?,?,?,'membership.updated',?,?)",uid(),r.org.id,r.actor.id,r.requestId,time),
      ]);
      if(!result[0].meta.changes) fail(409,'LAST_ADMIN','Mantenha ao menos uma pessoa administradora ativa.');
      return members(r);
    }
  }
  if(path[0]==='criteria') {
    if(method==='GET') return criteria(r);
    if(method==='POST') {
      strictKeys(input,['text','expectedVersion']); const text=inputText(input.text,4000,'os critérios'); const version=expectedVersion(input); const id=uid(); const time=now();
      const result=await stmt(r,'INSERT INTO criteria_versions (id,org_id,version,text,created_at,author_id) SELECT ?,?,MAX(version)+1,?,?,? FROM criteria_versions WHERE org_id=? HAVING MAX(version)=?',id,r.org.id,text,time,r.actor.id,r.org.id,version).run();
      if(!result.meta.changes) fail(409,'VERSION_CONFLICT','Os critérios mudaram. Atualize antes de continuar.');
      return criteria(r,id);
    }
  }
  if(path[0]==='usage'&&method==='GET') {
    await orgFresh(r);
    const totals=await first<{calls:number;input_tokens:number;output_tokens:number}>(r,'SELECT COUNT(*) AS calls,COALESCE(SUM(input_tokens),0) AS input_tokens,COALESCE(SUM(output_tokens),0) AS output_tokens FROM ai_usage WHERE org_id=?',r.org.id);
    const response:UsageDTO={calls:totals?.calls??0,inputTokens:totals?.input_tokens??0,outputTokens:totals?.output_tokens??0,spentMicrousd:r.org.budget_spent_microusd,reservedMicrousd:r.org.budget_reserved_microusd,limitMicrousd:r.org.budget_limit_microusd};return response;
  }
  fail(404,'NOT_FOUND','Rota não encontrada.');
}
