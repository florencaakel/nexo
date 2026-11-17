export const SCHEMA_VERSION = 'nexo-analysis-v1';
export const QUESTION_SCHEMA_VERSION = 'nexo-question-v1';

function object(properties: Record<string, unknown>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}
const string = { type: 'string' };
const strings = { type: 'array', items: string };
const reference = object({ message_id: string, trecho: string });
const cited = object({ texto: string, referencias_a_mensagens: { type: 'array', items: reference } });
const citedList = { type: 'array', items: cited };

// Keep the provider schema in the portable strict subset. Local validation enforces
// lengths, list limits, reference membership, literal quotations and consistency.
export const ANALYSIS_SCHEMA = object({
  resumo: cited,
  fatos_relatados: citedList,
  datas_mencionadas: citedList,
  envolvidos_mencionados: citedList,
  documentos_mencionados: citedList,
  tentativas_de_solucao: citedList,
  lacunas: strings,
  perguntas_pendentes: strings,
  area_sugerida: { type: 'string', enum: ['consumidor', 'fora_do_escopo', 'insuficiente'] },
  compatibilidade_com_criterios: object({
    versao: { type: 'integer' },
    resultado: { type: 'string', enum: ['compativel', 'fora_do_escopo', 'insuficiente'] },
    explicacao: string,
  }),
  sinais_para_revisao_prioritaria: citedList,
  avisos_de_incerteza: strings,
});

export const QUESTION_SCHEMA = object({
  question: { type: ['string', 'null'] },
  ready: { type: 'boolean' },
  reason: string,
});
