import type { AnalysisData, CriteriaDTO, MessageDTO } from './contracts.ts';
export type AiKind = 'question'|'analysis';
export interface AiInput { messages: MessageDTO[]; criteria: CriteriaDTO; questionCount: number }
export interface QuestionData { question: string|null; ready: boolean; reason: string }
export interface AiMeta { model: string; promptVersion: string; schemaVersion: string; requestId: string|null; durationMs: number; inputTokens: number; outputTokens: number; usageEstimated: boolean; estimatedCostMicrousd: number }
export interface AiResult<T> { data: T; meta: AiMeta }
export interface AiProvider {
  /** Local rules never use network or billable tokens. Omitted only by legacy adapters/tests. */
  readonly kind?: 'rules' | 'external';
  readonly configured: boolean;
  readonly model: string;
  maxCostMicrousd(kind: AiKind): number;
  question(input: AiInput): Promise<AiResult<QuestionData>>;
  analyze(input: AiInput): Promise<AiResult<AnalysisData>>;
}
export interface AiProviderConfig { apiKey?: string; model?: string; inputUsdPerMillion?: number; outputUsdPerMillion?: number; timeoutMs?: number; maxInputTokens?: number; questionOutputTokens?: number; analysisOutputTokens?: number }
export class AiFailure extends Error {
  code: string; retryable: boolean; chargeUncertain: boolean;
  constructor(code: string, message: string, retryable = false, chargeUncertain = false) {
    super(message); this.name='AiFailure'; this.code=code; this.retryable=retryable; this.chargeUncertain=chargeUncertain;
  }
}
