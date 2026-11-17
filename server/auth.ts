import type { ServerContext } from '../lib/server-contract.ts';
import { DEFAULT_CRITERIA, DEMO_ORG_ID, now, rolesOf, type MemberRow, type OrgRow } from './core.ts';

export async function membership(context:ServerContext):Promise<{member:MemberRow;org:OrgRow}|null> {
  const identity=context.identity;
  if(!identity)return null;
  if(context.config.bootstrapAdminId && identity.id===context.config.bootstrapAdminId) {
    const created=now();
    await context.db.batch([
      context.db.prepare('INSERT OR IGNORE INTO organizations (id,name,created_at,intake_enabled,ai_enabled,budget_limit_microusd,budget_spent_microusd,budget_reserved_microusd,retention_days,settings_version) VALUES (?,?,?,1,0,0,0,0,30,1)').bind(DEMO_ORG_ID,'Nexo — Ambiente de Demonstração',created),
      context.db.prepare('INSERT OR IGNORE INTO memberships (org_id,user_id,display_name,roles_json,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)').bind(DEMO_ORG_ID,identity.id,identity.displayName,JSON.stringify(['admin','tester','reviewer']),created,created),
      context.db.prepare('INSERT OR IGNORE INTO criteria_versions (id,org_id,version,text,created_at,author_id) VALUES (?,?,1,?,?,?)').bind('nexo-demo-criteria-1',DEMO_ORG_ID,DEFAULT_CRITERIA,created,identity.id),
    ]);
  }
  const member=await context.db.prepare('SELECT * FROM memberships WHERE user_id=? AND active=1').bind(identity.id).first<MemberRow>();
  if(!member||!rolesOf(member.roles_json).length)return null;
  const org=await context.db.prepare('SELECT * FROM organizations WHERE id=?').bind(member.org_id).first<OrgRow>();
  return org?{member,org}:null;
}
