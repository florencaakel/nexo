import { AiFailure } from '../lib/ai-contract.ts';
import type { QuestionData } from '../lib/ai-contract.ts';
import { MAX_QUESTIONS } from '../lib/contracts.ts';
import type { AnalysisData, CitedText, MessageDTO } from '../lib/contracts.ts';
import { containsUnnecessaryIdentifier } from './privacy.ts';

const ANALYSIS_KEYS = [
  'resumo', 'fatos_relatados', 'datas_mencionadas', 'envolvidos_mencionados',
  'documentos_mencionados', 'tentativas_de_solucao', 'lacunas', 'perguntas_pendentes',
  'area_sugerida', 'compatibilidade_com_criterios', 'sinais_para_revisao_prioritaria',
  'avisos_de_incerteza',
] as const;

function invalid(): never {
  // Never include source text, provider payload or the failing value in errors.
  throw new AiFailure('AI_INVALID_RESPONSE', 'A resposta da IA não pôde ser validada.');
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) invalid();
  return value as Record<string, unknown>;
}

function plain(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) invalid();
  if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)
    || /&(?:lt|gt);/iu.test(value) || containsUnnecessaryIdentifier(value)) invalid();
  return value;
}

function list(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) invalid();
  return value;
}

function textList(value: unknown, maximum: number, textMaximum = 500): string[] {
  return list(value, maximum).map((entry) => plain(entry, textMaximum));
}

function dateTokens(text: string): string[] {
  return [...text.matchAll(/\b(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/gu)]
    .map((match) => match[0].replace(/\b0(?=\d)/gu, ''));
}

function moneyTokens(text: string): string[] {
  return [...text.matchAll(/R\$\s*(\d[\d.,]*)|(\d[\d.,]*)\s+reais\b/giu)].map((match) => {
    const value = (match[1] ?? match[2]).replace(/\.(?=\d{3}(?:\D|$))/gu, '').replace(',', '.');
    return Number(value).toString();
  });
}

function cited(value: unknown, messages: Map<string, MessageDTO>, maximum = 1_200): CitedText {
  const item = exactObject(value, ['texto', 'referencias_a_mensagens']);
  const texto = plain(item.texto, maximum);
  const refs = list(item.referencias_a_mensagens, 8);
  if (!refs.length) invalid();
  const seen = new Set<string>();
  const referencias_a_mensagens = refs.map((value) => {
    const ref = exactObject(value, ['message_id', 'trecho']);
    const message_id = plain(ref.message_id, 100);
    const trecho = plain(ref.trecho, 1_000);
    const source = messages.get(message_id);
    if (!source || !source.content.includes(trecho)) invalid();
    const identity = JSON.stringify([message_id, trecho]);
    if (seen.has(identity)) invalid();
    seen.add(identity);
    return { message_id, trecho };
  });
  const evidence = referencias_a_mensagens.map((ref) => ref.trecho).join('\n');
  // Prevent added date/amount precision even when a real but unrelated quote is used.
  const sourceDates = new Set(dateTokens(evidence));
  const sourceAmounts = new Set(moneyTokens(evidence));
  if (dateTokens(texto).some((date) => !sourceDates.has(date))
    || moneyTokens(texto).some((amount) => !sourceAmounts.has(amount))) invalid();
  return { texto, referencias_a_mensagens };
}

export function participantAskedToStop(messages: MessageDTO[]): boolean {
  return messages.some((message) => message.role === 'user'
    && /n[aã]o\s+quero\s+(?:mais\s+)?(?:responder|continuar)|(?:quero|prefiro)\s+(?:parar|terminar|encerrar)(?:\s+(?:a\s+entrevista|as?\s+perguntas))?|n[aã]o\s+(?:fa[cç]a|me\s+fa[cç]a)\s+mais\s+perguntas/iu.test(message.content));
}

function userMessageMap(messages: MessageDTO[]): Map<string, MessageDTO> {
  if (!Array.isArray(messages) || !messages.length || messages.length > 32) invalid();
  const result = new Map<string, MessageDTO>();
  const ids = new Set<string>();
  for (const message of messages) {
    if (!message || typeof message.id !== 'string' || !message.id || message.id.length > 100
      || typeof message.content !== 'string' || ids.has(message.id)
      || (message.role !== 'user' && message.role !== 'assistant')) invalid();
    ids.add(message.id);
    if (message.role === 'user') result.set(message.id, message);
  }
  if (!result.size) invalid();
  return result;
}

/** Structural and provenance validation, also used for human corrections.
 * This does not prove that a paraphrase is entailed by its quote, that all useful
 * facts were extracted, or that a suggested legal classification is correct.
 */
export function validateAnalysis(data: unknown, messages: MessageDTO[], criteriaVersion: number): AnalysisData {
  if (!Number.isSafeInteger(criteriaVersion) || criteriaVersion < 1) invalid();
  const source = userMessageMap(messages);
  const root = exactObject(data, ANALYSIS_KEYS);
  const criteria = exactObject(root.compatibilidade_com_criterios, ['versao', 'resultado', 'explicacao']);
  if (criteria.versao !== criteriaVersion
    || !['compativel', 'fora_do_escopo', 'insuficiente'].includes(criteria.resultado as string)
    || !['consumidor', 'fora_do_escopo', 'insuficiente'].includes(root.area_sugerida as string)) invalid();
  if (root.area_sugerida === 'fora_do_escopo' && criteria.resultado !== 'fora_do_escopo'
    || root.area_sugerida === 'insuficiente' && criteria.resultado !== 'insuficiente'
    || root.area_sugerida === 'consumidor' && criteria.resultado === 'fora_do_escopo') invalid();
  const result: AnalysisData = {
    resumo: cited(root.resumo, source, 2_400),
    fatos_relatados: list(root.fatos_relatados, 32).map((value) => cited(value, source)),
    datas_mencionadas: list(root.datas_mencionadas, 24).map((value) => cited(value, source, 800)),
    envolvidos_mencionados: list(root.envolvidos_mencionados, 16).map((value) => cited(value, source, 800)),
    documentos_mencionados: list(root.documentos_mencionados, 16).map((value) => cited(value, source, 800)),
    tentativas_de_solucao: list(root.tentativas_de_solucao, 24).map((value) => cited(value, source)),
    lacunas: textList(root.lacunas, 20),
    perguntas_pendentes: textList(root.perguntas_pendentes, MAX_QUESTIONS, 300),
    area_sugerida: root.area_sugerida as AnalysisData['area_sugerida'],
    compatibilidade_com_criterios: {
      versao: criteriaVersion,
      resultado: criteria.resultado as AnalysisData['compatibilidade_com_criterios']['resultado'],
      explicacao: plain(criteria.explicacao, 800),
    },
    sinais_para_revisao_prioritaria: list(root.sinais_para_revisao_prioritaria, 8).map((value) => cited(value, source, 800)),
    avisos_de_incerteza: textList(root.avisos_de_incerteza, 20),
  };
  const hasUncertainty = [...source.values()].some((message) => /\b(?:acho|talvez)\b|n[aã]o\s+(?:sei|lembro|tenho\s+certeza)/iu.test(message.content));
  if (hasUncertainty && !result.lacunas.length && !result.avisos_de_incerteza.length) invalid();
  if (participantAskedToStop(messages) && result.perguntas_pendentes.length) invalid();
  return result;
}

export function validateQuestion(data: unknown, messages: MessageDTO[], questionCount: number): QuestionData {
  const root = exactObject(data, ['question', 'ready', 'reason']);
  if (typeof root.ready !== 'boolean' || !Number.isSafeInteger(questionCount) || questionCount < 0 || questionCount > MAX_QUESTIONS) invalid();
  const reason = plain(root.reason, 300);
  if (root.question === null) {
    if (!root.ready) invalid();
    return { question: null, ready: true, reason };
  }
  const question = plain(root.question, 300);
  if (root.ready || questionCount >= MAX_QUESTIONS || participantAskedToStop(messages)
    || (question.match(/\?/gu) ?? []).length !== 1 || !question.trim().endsWith('?')
    || /[\n\r]/u.test(question)
    || /\b(?:CPF|conta\s+banc[aá]ria|endere[cç]o\s+completo)\b/iu.test(question)) invalid();
  const normalized = question.trim().toLocaleLowerCase('pt-BR').replace(/\s+/gu, ' ');
  if (messages.some((message) => message.role === 'assistant'
    && message.content.trim().toLocaleLowerCase('pt-BR').replace(/\s+/gu, ' ') === normalized)) invalid();
  return { question, ready: false, reason };
}
