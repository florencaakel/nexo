import { AiFailure } from '../lib/ai-contract.ts';
import type { AiInput, AiKind, AiProvider, AiProviderConfig, AiResult, QuestionData } from '../lib/ai-contract.ts';
import { MAX_PARTICIPANT_CHARS, MAX_QUESTIONS } from '../lib/contracts.ts';
import type { AnalysisData, MessageDTO } from '../lib/contracts.ts';
import { AI_LIMITS, costMicrousd, inputTokenUpperBound, resolveLimits } from './limits.ts';
import { minimizeText } from './privacy.ts';
import { ANALYSIS_PROMPT, PROMPT_VERSION, QUESTION_PROMPT } from './prompts.ts';
import { ANALYSIS_SCHEMA, QUESTION_SCHEMA, QUESTION_SCHEMA_VERSION, SCHEMA_VERSION } from './schema.ts';
import { participantAskedToStop, validateAnalysis, validateQuestion } from './validation.ts';

const ENDPOINT = 'https://api.openai.com/v1/responses';
/** Injection is for transport tests; production always uses the fixed OpenAI endpoint. */
export interface ProviderOptions { fetch?: typeof globalThis.fetch }

function inputFailure(): never {
  throw new AiFailure('AI_INVALID_INPUT', 'O relato não atende aos limites da demonstração.');
}

function projection(input: AiInput): MessageDTO[] {
  if (!input || !Array.isArray(input.messages) || !input.messages.length
    || input.messages.length > AI_LIMITS.maxMessages
    || !Number.isSafeInteger(input.questionCount) || input.questionCount < 0 || input.questionCount > MAX_QUESTIONS
    || !input.criteria || typeof input.criteria.text !== 'string' || !input.criteria.text.trim()
    || input.criteria.text.length > AI_LIMITS.maxCriteriaChars
    || !Number.isSafeInteger(input.criteria.version) || input.criteria.version < 1) inputFailure();
  const ids = new Set<string>();
  let participantChars = 0;
  const projected = input.messages.map(message => {
    if (!message || typeof message.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/u.test(message.id)
      || ids.has(message.id) || !['user', 'assistant'].includes(message.role)
      || typeof message.content !== 'string' || !message.content.trim()) inputFailure();
    ids.add(message.id);
    if (message.role === 'user') participantChars += message.content.length;
    else if (message.content.length > AI_LIMITS.maxAssistantChars) inputFailure();
    return { ...message, content: minimizeText(message.content) };
  });
  if (participantChars > MAX_PARTICIPANT_CHARS || !projected.some(message => message.role === 'user' && message.content)) inputFailure();
  return projected;
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function invalidResponse(): never {
  throw new AiFailure('AI_INVALID_RESPONSE', 'A resposta da IA não pôde ser validada.', false, true);
}

async function boundedJson(response: Response): Promise<unknown> {
  const declaredSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > AI_LIMITS.maxResponseBytes) invalidResponse();
  if (!response.body) invalidResponse();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > AI_LIMITS.maxResponseBytes) {
        void reader.cancel().catch(() => {});
        invalidResponse();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { invalidResponse(); }
}

function outputText(payload: Record<string, unknown>): string {
  if (payload.status === 'incomplete') throw new AiFailure('AI_INCOMPLETE', 'A IA não concluiu a resposta. O relato permanece salvo.', true, true);
  if (payload.status !== 'completed' || payload.error || payload.incomplete_details) invalidResponse();
  if (!Array.isArray(payload.output) || !payload.output.length || payload.output.length > 8) invalidResponse();
  const texts: string[] = [];
  for (const item of payload.output) {
    const entry = object(item);
    // Reasoning metadata may be present, but is neither requested nor persisted.
    if (entry?.type === 'reasoning') continue;
    if (!entry || entry.type !== 'message' || entry.role !== 'assistant'
      || entry.status !== 'completed' || !Array.isArray(entry.content)) invalidResponse();
    for (const part of entry.content) {
      const content = object(part);
      if (content?.type === 'refusal') throw new AiFailure('AI_REFUSED', 'A IA não produziu a ficha. O relato permanece disponível para revisão humana.', false, true);
      if (!content || content.type !== 'output_text' || typeof content.text !== 'string') invalidResponse();
      texts.push(content.text);
    }
  }
  if (texts.length !== 1 || !texts[0]) invalidResponse();
  return texts[0];
}

/** One network request per operation. The caller must reserve maxCostMicrousd first
 * and enforce approval, authorization and a bounded number of explicit retries.
 * All post-dispatch failures conservatively retain the reservation: no payload or
 * exception from the provider is returned to the UI or written to a log here.
 */
export function createOpenAIProvider(config: AiProviderConfig = {}, options: ProviderOptions = {}): AiProvider {
  const limits = resolveLimits(config);
  const apiKey = config.apiKey?.trim();
  const model = config.model?.trim() ?? '';
  const inputPrice = config.inputUsdPerMillion ?? 0;
  const outputPrice = config.outputUsdPerMillion ?? 0;
  const configured = !!apiKey && !/[\r\n]/u.test(apiKey) && /^[a-zA-Z0-9._:-]{1,100}$/u.test(model)
    && Number.isFinite(inputPrice) && inputPrice > 0 && inputPrice <= 1_000
    && Number.isFinite(outputPrice) && outputPrice > 0 && outputPrice <= 1_000
    && Object.values(limits).every(value => value > 0);
  const transport = options.fetch ?? globalThis.fetch;

  function requireConfiguration() {
    if (!configured) throw new AiFailure('AI_NOT_CONFIGURED', 'A integração de IA ainda não está configurada e aprovada.');
  }

  async function run<T extends AnalysisData | QuestionData>(kind: AiKind, input: AiInput): Promise<AiResult<T>> {
    requireConfiguration();
    const projected = projection(input);
    if (kind === 'question' && (input.questionCount >= MAX_QUESTIONS || participantAskedToStop(input.messages))) {
      throw new AiFailure('AI_QUESTION_LIMIT', 'A entrevista pode seguir para conferência e envio sem novas perguntas.');
    }
    const schemaVersion = kind === 'question' ? QUESTION_SCHEMA_VERSION : SCHEMA_VERSION;
    const maxOutput = limits[kind];
    const body = JSON.stringify({
      model,
      store: false,
      stream: false,
      background: false,
      service_tier: 'default',
      max_output_tokens: maxOutput,
      truncation: 'disabled',
      instructions: kind === 'question' ? QUESTION_PROMPT : ANALYSIS_PROMPT,
      input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify({
        criterios: { versao: input.criteria.version, texto: minimizeText(input.criteria.text) },
        numero_de_perguntas: input.questionCount,
        mensagens_usuario: projected.filter(message => message.role === 'user').map(message => ({ id: message.id, texto: message.content })),
        perguntas_anteriores: projected.filter(message => message.role === 'assistant').map(message => message.content),
      }) }] }],
      text: { format: { type: 'json_schema', name: schemaVersion, strict: true, schema: kind === 'question' ? QUESTION_SCHEMA : ANALYSIS_SCHEMA } },
    });
    const estimatedInput = inputTokenUpperBound(body);
    if (estimatedInput > limits.input) throw new AiFailure('AI_INPUT_LIMIT', 'O relato excede o limite de processamento da IA.');
    const started = performance.now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new AiFailure('AI_TIMEOUT', 'A IA demorou além do limite. Consulte o estado salvo antes de tentar novamente.', true, true));
      }, limits.timeoutMs);
    });
    const operation = async (): Promise<AiResult<T>> => {
      const response = await transport(ENDPOINT, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
      });
      if (!response.ok) {
        void response.body?.cancel().catch(() => {});
        const transient = response.status === 429 || response.status >= 500;
        throw new AiFailure(response.status === 429 ? 'AI_RATE_LIMIT' : 'AI_PROVIDER_ERROR',
          'A integração de IA está indisponível. O relato permanece salvo.', transient, true);
      }
      const payload = object(await boundedJson(response));
      if (!payload) invalidResponse();
      const text = outputText(payload);
      let data: unknown;
      try { data = JSON.parse(text); } catch { invalidResponse(); }
      const validated = kind === 'question'
        ? validateQuestion(data, projected, input.questionCount)
        : validateAnalysis(data, projected, input.criteria.version);
      // A minimized quote must also exist in the immutable original, not only in
      // a concatenation formed by removing identifiers from the projection.
      if (kind === 'analysis') validateAnalysis(validated, input.messages, input.criteria.version);
      const usage = object(payload.usage);
      const measured = !!usage && Number.isSafeInteger(usage.input_tokens) && Number(usage.input_tokens) >= 0
        && Number.isSafeInteger(usage.output_tokens) && Number(usage.output_tokens) >= 0;
      const inputTokens = measured ? Number(usage!.input_tokens) : estimatedInput;
      const outputTokens = measured ? Number(usage!.output_tokens) : maxOutput;
      if (inputTokens > limits.input || outputTokens > maxOutput) invalidResponse();
      const resolvedModel = typeof payload.model === 'string' && /^[a-zA-Z0-9._:-]{1,100}$/u.test(payload.model) ? payload.model : model;
      const requestId = response.headers.get('x-request-id');
      return { data: validated as T, meta: {
        model: resolvedModel, promptVersion: PROMPT_VERSION, schemaVersion,
        requestId: requestId && /^[a-zA-Z0-9_-]{1,200}$/u.test(requestId) ? requestId : null,
        durationMs: Math.max(0, Math.round(performance.now() - started)),
        inputTokens, outputTokens, usageEstimated: !measured,
        estimatedCostMicrousd: costMicrousd(inputTokens, outputTokens, inputPrice, outputPrice),
      } };
    };
    try { return await Promise.race([operation(), deadline]); }
    catch (error) {
      if (error instanceof AiFailure) {
        // Local validation failures happen after a potentially billable response.
        throw new AiFailure(error.code, error.message, error.retryable, true);
      }
      throw new AiFailure('AI_NETWORK_ERROR', 'Não foi possível confirmar a resposta da IA. O relato permanece salvo.', true, true);
    } finally { if (timer !== undefined) clearTimeout(timer); }
  }

  return {
    configured, model,
    maxCostMicrousd(kind) { requireConfiguration(); return costMicrousd(limits.input, limits[kind], inputPrice, outputPrice); },
    question: input => run<QuestionData>('question', input),
    analyze: input => run<AnalysisData>('analysis', input),
  };
}
