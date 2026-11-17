import type { ServerContext } from '../lib/server-contract.ts';
import type { MeDTO } from '../lib/contracts.ts';
import { membership } from './auth.ts';
import { claim, complete } from './idempotency.ts';
import { aiAvailable, errorBody, fail, fault, json, loadCase, loadSession, requireRole, rolesOf, uid, type Runtime } from './core.ts';
import { intake } from './intake.ts';
import { caseApi } from './cases.ts';
import { admin } from './admin.ts';

async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('X-Nexo-Request') !== '1') fail(403, 'INVALID_ORIGIN', 'Origem do pedido não permitida.');
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') fail(415, 'INVALID_CONTENT_TYPE', 'Envie o pedido em JSON.');
  if (Number(request.headers.get('Content-Length')) > 131_072) fail(413, 'PAYLOAD_TOO_LARGE', 'O pedido excede o limite permitido.');
  const reader = request.body?.getReader();
  let size = 0; const parts: Uint8Array[] = [];
  if (reader) {
    try { for (;;) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > 131_072) { await reader.cancel(); fail(413, 'PAYLOAD_TOO_LARGE', 'O pedido excede o limite permitido.'); } parts.push(next.value); } }
    finally { reader.releaseLock(); }
  }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  let result: unknown; try { result = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); } catch { fail(400, 'INVALID_JSON', 'JSON inválido.'); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail(400, 'INVALID_INPUT', 'Informe um objeto JSON.');
  return result as Record<string, unknown>;
}

// Authorization precedes idempotency replay as well as execution.
async function authorize(r: Runtime, path: string[], method: string): Promise<void> {
  if (path[0] === 'admin') { requireRole(r, 'admin'); return; }
  if (path[0] === 'intake-sessions') {
    requireRole(r, 'tester', 'admin');
    if (path[1]) { await loadSession(r, path[1]); r.resourceId = path[1]; }
    return;
  }
  if (path[0] === 'cases') {
    if (!path[1]) { requireRole(r, 'reviewer', 'admin'); return; }
    if (method === 'DELETE') { requireRole(r, 'admin'); r.resourceId=path[1]; return; }
    const row = await loadCase(r, path[1]); r.resourceId = row.id;
    if (path[2] === 'analysis' && method === 'POST') {
      if (!r.roles.includes('admin') && !r.roles.includes('reviewer') && !(r.roles.includes('tester') && row.owner_id === r.actor.id)) fail(404, 'NOT_FOUND', 'Caso não encontrado.');
    } else if (method === 'DELETE') requireRole(r, 'admin');
    else requireRole(r, 'reviewer', 'admin');
    return;
  }
  fail(404, 'NOT_FOUND', 'Rota não encontrada.');
}

export async function handleApi(request: Request, path: string[], context: ServerContext): Promise<Response> {
  const requestId = uid(); let runtime: Runtime | undefined; let claimed = false;
  try {
    if (!context.identity) fail(401, 'AUTH_REQUIRED', 'Entre com sua conta para continuar.');
    const access = await membership(context);
    if (request.method === 'GET' && path.join('/') === 'me') {
      const me: MeDTO = { user:context.identity, organization:access ? {id:access.org.id,name:access.org.name} : null, roles:access ? rolesOf(access.member.roles_json) : [], capabilities:{ intakeOpen:!!access?.org.intake_enabled, aiConfigured:context.config.aiApproved && context.provider.configured, aiEnabled:!!access?.org.ai_enabled, realIntakeEnabled:false } };
      return json(me);
    }
    if (!access) fail(403, 'MEMBERSHIP_REQUIRED', 'Sua conta ainda não está autorizada para esta demonstração.');
    runtime = {context, org:access.org, actor:context.identity, roles:rolesOf(access.member.roles_json),requestId,token:uid(),key:'',resourceId:null};
    const method = request.method.toUpperCase();
    const mutation = ['POST','PUT','PATCH','DELETE'].includes(method);
    if (method !== 'GET' && !mutation) fail(405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
    await authorize(runtime, path, method);
    let input: Record<string,unknown> = {};
    if (mutation) {
      input = await body(request);
      runtime.key = request.headers.get('Idempotency-Key') ?? '';
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(runtime.key)) fail(400, 'IDEMPOTENCY_REQUIRED', 'Informe uma chave de repetição válida.');
      const replay = await claim(runtime, `${method} /${path.join('/')}`, input);
      if (replay) return replay;
      claimed = true;
    }
    let result: unknown;
    if (path[0] === 'intake-sessions') result = await intake(runtime, path.slice(1), method, input);
    else if (path[0] === 'cases') result = await caseApi(runtime, path.slice(1), method, input, new URL(request.url));
    else if (path[0] === 'admin') result = await admin(runtime, path.slice(1), method, input);
    else fail(404,'NOT_FOUND','Rota não encontrada.');
    if (claimed) await complete(runtime, result, 200);
    return json(result);
  } catch (error) {
    const problem = fault(error); const response = errorBody(problem,requestId);
    // Persist a known outcome. An interruption leaves the claim pending and fails closed.
    if (claimed && runtime) { try { await complete(runtime,response,problem.status); } catch { /* no user content in logs */ } }
    return json(response,problem.status);
  }
}
