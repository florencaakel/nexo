import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { createOpenAIProvider } from '../../../ai/provider.ts';
import { handleApi } from '../../../server/api.ts';
import type { ServerContext } from '../../../lib/server-contract.ts';

export const dynamic = 'force-dynamic';
type RouteContext = {params: Promise<{path: string[]}>};

function boundedNumber(value: string|undefined, fallback: number, min: number, max: number) {
  if (!value?.trim()) return fallback;
  const parsed=Number(value);
  return Number.isFinite(parsed) && parsed>=min && parsed<=max ? parsed : fallback;
}

async function route(request: Request, routeContext: RouteContext): Promise<Response> {
  if (!env.DB) return Response.json({error:{code:'STORAGE_NOT_CONFIGURED',message:'O armazenamento da demonstração ainda não foi configurado.',requestId:crypto.randomUUID(),retryable:false}},{status:503,headers:{'Cache-Control':'no-store'}});
  const user=await getChatGPTUser();
  const provider=createOpenAIProvider({
    apiKey:env.OPENAI_API_KEY,
    model:env.NEXO_AI_MODEL,
    inputUsdPerMillion:boundedNumber(env.NEXO_AI_INPUT_USD_PER_MILLION,0,0,1000),
    outputUsdPerMillion:boundedNumber(env.NEXO_AI_OUTPUT_USD_PER_MILLION,0,0,1000),
    timeoutMs:boundedNumber(env.NEXO_AI_TIMEOUT_MS,25000,1000,45000),
    maxInputTokens:boundedNumber(env.NEXO_AI_MAX_INPUT_TOKENS,64000,1000,80000),
    questionOutputTokens:boundedNumber(env.NEXO_AI_QUESTION_OUTPUT_TOKENS,512,100,1500),
    analysisOutputTokens:boundedNumber(env.NEXO_AI_ANALYSIS_OUTPUT_TOKENS,4096,1000,6000),
  });
  const context: ServerContext={
    db:env.DB, identity:user?{id:user.userId,displayName:user.displayName}:null, provider,
    config:{
      bootstrapAdminId:env.NEXO_BOOTSTRAP_ADMIN_ID,
      aiApproved:env.NEXO_AI_APPROVED==='true',
      maxBudgetMicrousd:Math.floor(boundedNumber(env.NEXO_MAX_BUDGET_USD,0,0,100)*1_000_000),
      sessionTtlHours:24,
      realIntakeEnabled:false,
    },
  };
  const {path}=await routeContext.params;
  return handleApi(request,path,context);
}

export {route as GET,route as POST,route as PUT,route as PATCH,route as DELETE};
