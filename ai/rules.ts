import { AiFailure, type AiInput, type AiProvider, type AiResult, type QuestionData } from '../lib/ai-contract.ts';
import { MAX_PARTICIPANT_CHARS, MAX_QUESTIONS, type AnalysisData, type CitedText, type MessageDTO } from '../lib/contracts.ts';
import { containsUnnecessaryIdentifier } from './privacy.ts';
import { participantAskedToStop, validateAnalysis, validateQuestion } from './validation.ts';
import { SCHEMA_VERSION, QUESTION_SCHEMA_VERSION } from './schema.ts';

/** Deterministic application code. No model, network, credentials or paid service. */
export const RULES_VERSION = 'nexo-regras-v1';

const topics = [
  { key: 'situacao', question: 'Você pode contar o que aconteceu na situação fictícia?',
    found: /cobran[çc]|cancel|compr|produto|servi[çc]o|alug|loca[çc]|contrat|falh|quebr|demiti|paguei|pagamento|fa[ií]sca|queimad/iu,
    gap: 'Conferir a descrição do que aconteceu.' },
  { key: 'envolvidos', question: 'Quem está envolvido nessa situação fictícia?',
    found: /empresa|loja|oficina|operadora|clube|servi[çc]o\s+exemplo|assinatura\s+exemplo|locador|locadora|fornecedor|pessoa\s+exemplo/iu,
    gap: 'Conferir quem está envolvido no relato.' },
  { key: 'datas', question: 'Quando isso aconteceu, mesmo que você só lembre aproximadamente?',
    found: /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|ontem|hoje|semana|m[eê]s|ano|minutos?|dias?|n[aã]o\s+(?:sei|lembro)\s+quando/iu,
    gap: 'Conferir datas e referências de tempo, sem completar informações ausentes.' },
  { key: 'tentativas', question: 'O que você já tentou fazer para resolver a situação?',
    found: /reclam|pedi|solicit|avisei|voltei|falei|liguei|contat|respost|responde|chat|n[aã]o\s+tentei/iu,
    gap: 'Conferir as tentativas de solução e as respostas recebidas.' },
  { key: 'documentos', question: 'Você quer mencionar algum registro ou documento, sem enviá-lo?',
    found: /document|comprovante|recibo|protocolo|nota\s+fiscal|\bnota\b|contrato|mensage|\bmsg\b|conversa|foto|e-mail|tela/iu,
    gap: 'Conferir os registros mencionados; não há recebimento ou análise de documentos.' },
  { key: 'objetivo', question: 'O que você gostaria de resolver com esse relato?',
    found: /quero|gostaria|desejo|objetivo|reembolso|estorno|devolu[çc][aã]o|ressarcimento/iu,
    gap: 'Conferir o objetivo de quem relatou a situação.' },
] as const;

function checkedInput(input: AiInput): MessageDTO[] {
  if (!input || !Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 32
    || !Number.isSafeInteger(input.questionCount) || input.questionCount < 0 || input.questionCount > MAX_QUESTIONS
    || !input.criteria || !Number.isSafeInteger(input.criteria.version) || input.criteria.version < 1
    || typeof input.criteria.text !== 'string' || input.criteria.text.length > 4_000) {
    throw new AiFailure('RULES_INVALID_INPUT', 'O relato não atende aos limites da entrevista guiada.');
  }
  const ids = new Set<string>();
  let count = 0;
  for (const message of input.messages) {
    if (!message || typeof message.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/u.test(message.id)
      || ids.has(message.id) || !['user', 'assistant'].includes(message.role)
      || typeof message.content !== 'string' || !message.content.trim()
      || (message.role === 'assistant' && message.content.length > 4_000)) {
      throw new AiFailure('RULES_INVALID_INPUT', 'O relato não atende aos limites da entrevista guiada.');
    }
    ids.add(message.id);
    if (message.role === 'user') count += message.content.length;
  }
  const users = input.messages.filter(message => message.role === 'user');
  if (!users.length || count > MAX_PARTICIPANT_CHARS) {
    throw new AiFailure('RULES_INVALID_INPUT', 'O relato completo pode ter até 10.000 caracteres.');
  }
  return users;
}

function missingTopics(input: AiInput, users: MessageDTO[]) {
  const text = users.map(message => message.content).join('\n');
  return topics.filter(topic => !topic.found.test(text));
}

function questionData(input: AiInput, users: MessageDTO[]): QuestionData {
  if (participantAskedToStop(users) || input.questionCount >= MAX_QUESTIONS) {
    return { question: null, ready: true, reason: 'A pessoa pode conferir e enviar sem novas perguntas.' };
  }
  const asked = new Set(input.messages.filter(message => message.role === 'assistant').map(message => message.content));
  const topic = missingTopics(input, users).find(item => !asked.has(item.question));
  return topic
    ? { question: topic.question, ready: false, reason: topic.gap }
    : { question: null, ready: true, reason: 'O roteiro por regras terminou. A pessoa pode conferir e enviar.' };
}

/** Skip complete sentences containing common identifiers or markup. Every
 * retained excerpt remains an unmodified substring of the original message. */
function excerpts(users: MessageDTO[]): { items: CitedText[]; omitted: boolean; truncated: boolean } {
  const items: CitedText[] = [];
  let omitted = false;
  let truncated = false;
  for (const message of users) {
    const sentences = message.content.split(/(?<=[.!?])\s+|[\r\n]+/u).map(value => value.trim()).filter(Boolean);
    for (const sentence of sentences) {
      if (containsUnnecessaryIdentifier(sentence) || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]|&(?:lt|gt);/iu.test(sentence)) {
        omitted = true;
        continue;
      }
      let remaining = sentence;
      while (remaining) {
        let end = Math.min(780, remaining.length);
        if (end < remaining.length) {
          const space = remaining.lastIndexOf(' ', end);
          if (space > 0) end = space;
        }
        const trecho = remaining.slice(0, end).trim();
        remaining = remaining.slice(end).trim();
        if (items.length >= 32) { truncated = true; break; }
        if (trecho) items.push({ texto: trecho, referencias_a_mensagens: [{ message_id: message.id, trecho }] });
      }
    }
  }
  return { items, omitted, truncated };
}

function analysisData(input: AiInput, users: MessageDTO[]): AnalysisData {
  const { items, omitted, truncated } = excerpts(users);
  if (!items.length) {
    throw new AiFailure('RULES_NO_SAFE_TEXT', 'Não há trecho adequado para a ficha. O original permanece salvo para revisão manual; use apenas situações fictícias, sem identificadores pessoais.');
  }
  const selected = (pattern: RegExp, max: number) => items.filter(item => pattern.test(item.texto)).slice(0, max);
  const dates: CitedText[] = [];
  const datePattern = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?\b|\bh[aá]\s+(?:poucos?|\d+)\s+(?:minutos?|horas?|dias?|semanas?)\b|\b(?:ontem|hoje)\b/giu;
  for (const item of items) {
    for (const match of item.texto.matchAll(datePattern)) {
      if (dates.length >= 24) break;
      dates.push({ texto: match[0], referencias_a_mensagens: item.referencias_a_mensagens });
    }
  }
  const stopped = participantAskedToStop(users);
  const gaps = missingTopics(input, users);
  const notices = [
    'Ficha organizada por regras, sem inteligência artificial ou serviço externo. Os trechos são cópias do relato, não fatos verificados.',
    'O trecho de abertura não é um resumo completo. Leia o relato original e preserve dúvidas, negativas e versões diferentes dos acontecimentos.',
    'Datas não são calculadas nem corrigidas. Documentos são apenas mencionados; nenhum arquivo foi recebido ou analisado.',
    'Área, compatibilidade com critérios e prioridade não são avaliadas automaticamente. A classificação e a decisão dependem da revisão humana.',
  ];
  if (omitted) notices.push('Frases com identificadores comuns ou marcação foram omitidas da ficha. O original continua disponível ao revisor autorizado.');
  if (truncated) notices.push('A ficha exibe até 32 trechos. O relato original completo continua disponível e deve ser conferido.');
  if (stopped) notices.push('A pessoa pediu para terminar as perguntas. O relato pode seguir para conferência e revisão humana.');
  return {
    resumo: items[0],
    fatos_relatados: items,
    datas_mencionadas: dates,
    envolvidos_mencionados: selected(/empresa|loja|oficina|operadora|locador|clube|fornecedor|pessoa\s+exemplo/iu, 16),
    documentos_mencionados: selected(/document|comprovante|recibo|protocolo|nota\s+fiscal|\bnota\b|contrato|mensage|\bmsg\b|conversa|foto|e-mail|tela/iu, 16),
    tentativas_de_solucao: selected(/reclam|pedi|solicit|avisei|voltei|falei|liguei|contat|respost|responde|chat/iu, 24),
    lacunas: gaps.map(topic => topic.gap),
    perguntas_pendentes: stopped ? [] : gaps.map(topic => topic.question),
    area_sugerida: 'insuficiente',
    compatibilidade_com_criterios: { versao: input.criteria.version, resultado: 'insuficiente', explicacao: 'A compatibilidade não é avaliada pelas regras. O revisor deve comparar o relato com os critérios desta versão.' },
    sinais_para_revisao_prioritaria: [],
    avisos_de_incerteza: notices,
  };
}

function result<T>(data: T, schemaVersion: string, started: number): AiResult<T> {
  return { data, meta: { model: RULES_VERSION, promptVersion: RULES_VERSION, schemaVersion,
    requestId: null, durationMs: Math.max(0, Math.round(performance.now() - started)),
    inputTokens: 0, outputTokens: 0, usageEstimated: false, estimatedCostMicrousd: 0 } };
}

export function createRulesProvider(): AiProvider {
  return {
    kind: 'rules', configured: true, model: RULES_VERSION,
    maxCostMicrousd: () => 0,
    async question(input) {
      const started = performance.now();
      const data = questionData(input, checkedInput(input));
      return result(validateQuestion(data, input.messages, input.questionCount), QUESTION_SCHEMA_VERSION, started);
    },
    async analyze(input) {
      const started = performance.now();
      const data = analysisData(input, checkedInput(input));
      return result(validateAnalysis(data, input.messages, input.criteria.version), SCHEMA_VERSION, started);
    },
  };
}
