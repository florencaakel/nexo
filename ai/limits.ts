import type { AiProviderConfig } from '../lib/ai-contract.ts';

// Local engineering limits for review in A2; these are not a model selection.
export const AI_LIMITS = Object.freeze({
  maxMessages: 32,
  maxCriteriaChars: 4_000,
  maxAssistantChars: 4_000,
  maxInputTokens: 80_000,
  defaultInputTokens: 64_000,
  maxQuestionOutputTokens: 1_024,
  defaultQuestionOutputTokens: 512,
  maxAnalysisOutputTokens: 6_000,
  defaultAnalysisOutputTokens: 4_096,
  maxTimeoutMs: 45_000,
  defaultTimeoutMs: 25_000,
  maxResponseBytes: 262_144,
  framingTokenAllowance: 1_024,
});

function bound(value: number | undefined, fallback: number, maximum: number): number {
  return value === undefined ? fallback : Number.isFinite(value) && value > 0
    ? Math.min(maximum, Math.max(1, Math.floor(value))) : 0;
}

export function resolveLimits(config: AiProviderConfig) {
  return {
    input: bound(config.maxInputTokens, AI_LIMITS.defaultInputTokens, AI_LIMITS.maxInputTokens),
    question: bound(config.questionOutputTokens, AI_LIMITS.defaultQuestionOutputTokens, AI_LIMITS.maxQuestionOutputTokens),
    analysis: bound(config.analysisOutputTokens, AI_LIMITS.defaultAnalysisOutputTokens, AI_LIMITS.maxAnalysisOutputTokens),
    timeoutMs: bound(config.timeoutMs, AI_LIMITS.defaultTimeoutMs, AI_LIMITS.maxTimeoutMs),
  };
}

/** Byte-level upper bound, including the instructions, schema, payload and API framing.
 * Intentionally not chars/4. Model/tokenizer compatibility still requires A2 verification.
 */
export function inputTokenUpperBound(serializedRequest: string): number {
  return new TextEncoder().encode(serializedRequest).byteLength + AI_LIMITS.framingTokenAllowance;
}

export function costMicrousd(inputTokens: number, outputTokens: number, inputUsdPerMillion: number, outputUsdPerMillion: number): number {
  // USD / million tokens * tokens * one million micro-USD / USD.
  return Math.ceil(inputTokens * inputUsdPerMillion + outputTokens * outputUsdPerMillion);
}
