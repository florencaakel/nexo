import type { ApiErrorBody, CriteriaDTO, MessageDTO, Role, SettingsDTO } from '../lib/contracts.ts';
import type { ServerContext } from '../lib/server-contract.ts';

export const DEMO_ORG_ID = 'nexo-demo';
export const DEFAULT_CRITERIA = 'Demonstração fictícia de triagem em direito do consumidor: cobrança contestada, cancelamento e problema com produto ou serviço. Outros assuntos e relatos insuficientes seguem para revisão humana. Sinais relatados de urgência são apenas destacados para revisão. Não aplicar critérios de renda, localização ou capacidade. Nenhuma decisão jurídica ou de atendimento é automática.';
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export interface OrgRow { id:string; name:string; intake_enabled:number; ai_enabled:number; budget_limit_microusd:number; budget_spent_microusd:number; budget_reserved_microusd:number; retention_days:number; settings_version:number }
export interface MemberRow { org_id:string; user_id:string; display_name:string; roles_json:string; active:number }
export interface SessionRow { id:string; org_id:string; owner_id:string; criteria_id:string; mode:'demo'; state:'draft'|'submitted'; version:number; participant_chars:number; question_count:number; question_ready:number; ai_calls:number; lease_token:string|null; lease_until:string|null; mutation_token:string|null; expires_at:string; created_at:string; updated_at:string }
export interface CaseRow { id:string; org_id:string; session_id:string; owner_id:string; criteria_id:string; mode:'demo'; title:string; status:import('../lib/contracts.ts').CaseStatus; version:number; analysis_error:string|null; lease_token:string|null; lease_until:string|null; mutation_token:string|null; created_at:string; updated_at:string }
export interface Runtime { context:ServerContext; org:OrgRow; actor: {id:string; displayName:string}; roles:Role[]; requestId:string; token:string; key:string; resourceId:string|null }

export class ApiFault extends Error {
  status:number; code:string; retryable:boolean;
  constructor(status:number, code:string, message:string, retryable=false) { super(message); this.status=status; this.code=code; this.retryable=retryable; }
}
export function fail(status:number, code:string, message:string, retryable=false):never { throw new ApiFault(status,code,message,retryable); }
export function json(body:unknown,status=200):Response { return new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Vary':'Cookie'}}); }
export function errorBody(error:ApiFault, requestId:string):ApiErrorBody { return {error:{code:error.code,message:error.message,requestId,retryable:error.retryable}}; }
export function fault(error:unknown):ApiFault { return error instanceof ApiFault ? error : new ApiFault(500,'INTERNAL_ERROR','Não foi possível concluir a operação. Consulte o estado salvo antes de tentar novamente.',true); }
export function stmt(r:Runtime, sql:string,...args:unknown[]):D1PreparedStatement { return r.context.db.prepare(sql).bind(...args); }
export async function first<T>(r:Runtime,sql:string,...args:unknown[]):Promise<T|null> { return stmt(r,sql,...args).first<T>(); }
export async function all<T>(r:Runtime,sql:string,...args:unknown[]):Promise<T[]> { return (await stmt(r,sql,...args).all<T>()).results; }
export function changed(result:D1Result):boolean { return result.meta.changes > 0; }
export function rolesOf(value:string):Role[] { try { const parsed:unknown=JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((v):v is Role => v==='admin'||v==='tester'||v==='reviewer') : []; } catch { return []; } }
export function requireRole(r:Runtime,...roles:Role[]):void { if (!roles.some(role=>r.roles.includes(role))) fail(403,'FORBIDDEN','Seu acesso não permite esta operação.'); }
export function expectedVersion(input:Record<string,unknown>):number { if (!Number.isSafeInteger(input.expectedVersion)||Number(input.expectedVersion)<1) fail(400,'INVALID_INPUT','Informe uma versão válida.'); return Number(input.expectedVersion); }
export function strictKeys(input:Record<string,unknown>,allowed:string[]):void { if(Object.keys(input).some(key=>!allowed.includes(key))) fail(400,'INVALID_INPUT','O pedido contém campos não permitidos.'); }
export function inputText(value:unknown,max:number,label='texto'):string { if(typeof value!=='string'||value.trim().length<1||value.trim().length>max) fail(400,'INVALID_INPUT',`Informe ${label} entre 1 e ${max} caracteres.`); return value.trim(); }
export function checkVersion(actual:number,expected:number):void { if(actual!==expected) fail(409,'VERSION_CONFLICT','O registro mudou. Atualize a página antes de continuar.'); }
export function busy(until:string|null):boolean { return !!until && until > now(); }
export function checkLease(until:string|null):void { if(busy(until)) fail(409,'OPERATION_IN_PROGRESS','Uma operação está em andamento. Aguarde e consulte o estado salvo.',true); }
export async function sha(value:string):Promise<string> { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join(''); }
export function canonical(value:unknown):string { if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`; if(value!==null&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`; return JSON.stringify(value); }
export function audit(r:Runtime,action:string,resourceId:string|null):D1PreparedStatement { return stmt(r,'INSERT INTO audit_events (id,org_id,actor_id,action,resource_id,request_id,created_at) VALUES (?,?,?,?,?,?,?)',uid(),r.org.id,r.actor.id,action,resourceId,r.requestId,now()); }
export async function orgFresh(r:Runtime):Promise<OrgRow> { const row=await first<OrgRow>(r,'SELECT * FROM organizations WHERE id=?',r.org.id); if(!row)fail(403,'FORBIDDEN','Organização indisponível.'); r.org=row; return row; }
export function usesLocalRules(r:Runtime):boolean { return r.context.provider.kind==='rules'; }
export function settings(r:Runtime,org=r.org):SettingsDTO { const local=usesLocalRules(r); return {processingMode:local?'rules':'external',intakeEnabled:!!org.intake_enabled, aiEnabled:local?!!org.intake_enabled:!!org.ai_enabled, aiConfigured:r.context.provider.configured&&(local||r.context.config.aiApproved), realIntakeEnabled:false,budgetLimitMicrousd:org.budget_limit_microusd,budgetSpentMicrousd:org.budget_spent_microusd,budgetReservedMicrousd:org.budget_reserved_microusd,retentionDays:org.retention_days,version:org.settings_version}; }
export function aiAvailable(r:Runtime):boolean { return r.context.provider.configured&&!!r.org.intake_enabled&&(usesLocalRules(r)||r.context.config.aiApproved&&!!r.org.ai_enabled); }
export async function criteria(r:Runtime,id?:string):Promise<CriteriaDTO> { const row=await first<{id:string;version:number;text:string;created_at:string}>(r,id?'SELECT id,version,text,created_at FROM criteria_versions WHERE org_id=? AND id=?':'SELECT id,version,text,created_at FROM criteria_versions WHERE org_id=? ORDER BY version DESC LIMIT 1',...id?[r.org.id,id]:[r.org.id]); if(!row)fail(503,'CRITERIA_UNAVAILABLE','Os critérios da demonstração ainda não estão disponíveis.'); return {id:row.id,version:row.version,text:row.text,createdAt:row.created_at}; }
export async function messages(r:Runtime,sessionId:string):Promise<MessageDTO[]> { const rows=await all<{id:string;role:'user'|'assistant';content:string;sequence:number;created_at:string}>(r,'SELECT id,role,content,sequence,created_at FROM messages WHERE org_id=? AND session_id=? ORDER BY sequence',r.org.id,sessionId); return rows.map(row=>({id:row.id,role:row.role,content:row.content,sequence:row.sequence,createdAt:row.created_at})); }
export async function loadSession(r:Runtime,id:string):Promise<SessionRow> { const row=await first<SessionRow>(r,'SELECT * FROM intake_sessions WHERE org_id=? AND id=? AND owner_id=?',r.org.id,id,r.actor.id); if(!row)fail(404,'NOT_FOUND','Atendimento não encontrado.'); if(row.expires_at<=now())fail(410,'SESSION_EXPIRED','Este atendimento expirou. Inicie uma nova demonstração.'); return row; }
export async function loadCase(r:Runtime,id:string):Promise<CaseRow> { const row=await first<CaseRow>(r,'SELECT * FROM cases WHERE org_id=? AND id=?',r.org.id,id); if(!row)fail(404,'NOT_FOUND','Caso não encontrado.'); return row; }
export function draft(row:SessionRow):void { if(row.state!=='draft')fail(409,'ALREADY_SUBMITTED','O relato enviado não pode ser alterado.'); checkLease(row.lease_until); }
