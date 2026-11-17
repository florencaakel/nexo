import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { createRulesProvider } from '../../../ai/rules.ts';
import { handleApi } from '../../../server/api.ts';
import type { ServerContext } from '../../../lib/server-contract.ts';

export const dynamic = 'force-dynamic';
type RouteContext = {params: Promise<{path: string[]}>};

async function route(request: Request, routeContext: RouteContext): Promise<Response> {
  if (!env.DB) return Response.json({error:{code:'STORAGE_NOT_CONFIGURED',message:'O armazenamento da demonstração ainda não foi configurado.',requestId:crypto.randomUUID(),retryable:false}},{status:503,headers:{'Cache-Control':'no-store'}});
  const user=await getChatGPTUser();
  // This version has no paid provider selection, credentials or external calls.
  const provider=createRulesProvider();
  const context: ServerContext={
    db:env.DB, identity:user?{id:user.userId,displayName:user.displayName}:null, provider,
    config:{
      bootstrapAdminId:env.NEXO_BOOTSTRAP_ADMIN_ID,
      aiApproved:false,
      maxBudgetMicrousd:0,
      sessionTtlHours:24,
      realIntakeEnabled:false,
    },
  };
  const {path}=await routeContext.params;
  return handleApi(request,path,context);
}

export {route as GET,route as POST,route as PUT,route as PATCH,route as DELETE};
