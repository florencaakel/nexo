/** Administrative routing from explicit selections only. No legal merits,
 * free-text inference, remote service or organization-specific criteria. */
export const REFERRAL_VERSION = 'nexo-encaminhamento-v1' as const;
export const REFERRAL_SCOPE = 'Demonstração com recorte fixo de consumidor' as const;
export type ReferralDemand = 'cobranca' | 'cancelamento' | 'produto_servico' | 'outro' | 'nao_sei';
export type ReferralGoal = 'avaliacao' | 'informacoes' | 'nao_sei';
export type ReferralAttention = 'sim' | 'nao' | 'nao_sei';
export interface ReferralChoices { demand: ReferralDemand; goal: ReferralGoal; attention: ReferralAttention }
export type ReferralRoute = 'atencao_humana' | 'avaliacao_consumo' | 'completar_informacoes' | 'outra_especialidade' | 'informacao_inicial';
export interface ReferralRecommendation {
  route: ReferralRoute;
  label: string;
  explanation: string;
  basis: string[];
  version: typeof REFERRAL_VERSION;
  scope: typeof REFERRAL_SCOPE;
}
export const REFERRAL_QUESTIONS = {
  demand: 'Qual é o tipo da demanda?',
  goal: 'O que você procura agora?',
  attention: 'Você precisa de atenção humana por urgência ou assunto sensível?',
} as const;
export const REFERRAL_OPTIONS = {
  demand: [
    { value: 'cobranca', label: 'Cobrança' },
    { value: 'cancelamento', label: 'Cancelamento' },
    { value: 'produto_servico', label: 'Produto ou serviço' },
    { value: 'outro', label: 'Outro assunto' },
    { value: 'nao_sei', label: 'Não sei' },
  ],
  goal: [
    { value: 'avaliacao', label: 'Avaliação jurídica' },
    { value: 'informacoes', label: 'Informações iniciais' },
    { value: 'nao_sei', label: 'Não sei' },
  ],
  attention: [
    { value: 'sim', label: 'Sim' },
    { value: 'nao', label: 'Não' },
    { value: 'nao_sei', label: 'Não sei' },
  ],
} as const;

export const REFERRAL_DISCLAIMER = 'Encaminhamento sugerido, não decisão jurídica. Não avalia direitos, viabilidade de ação ou garantia de atendimento.';
export const REFERRAL_HUMAN_REVIEW = 'Em qualquer resultado, você pode levar suas escolhas a uma pessoa e pedir revisão desta orientação.';
const routes: Record<ReferralRoute, { label: string; explanation: string }> = {
  atencao_humana: { label: 'Priorizar conversa com uma pessoa', explanation: 'Você sinalizou necessidade de atenção humana. Essa escolha tem prioridade sobre o tipo de demanda e o objetivo; a demonstração não verifica urgência.' },
  avaliacao_consumo: { label: 'Levar para avaliação jurídica de consumidor', explanation: 'Você escolheu um assunto do recorte de consumidor e pediu avaliação jurídica, sem sinalizar atenção humana específica. Uma pessoa precisa examinar o caso antes de qualquer decisão.' },
  completar_informacoes: { label: 'Conversar para completar as informações', explanation: 'Você marcou “Não sei” em pelo menos uma resposta. A sugestão é esclarecer essas escolhas com uma pessoa, sem descartar o relato.' },
  outra_especialidade: { label: 'Conversar sobre outra especialidade', explanation: 'Você escolheu outro assunto, fora do recorte fixo desta demonstração. Uma pessoa pode ajudar a identificar a especialidade adequada; isso não é uma recusa do caso.' },
  informacao_inicial: { label: 'Buscar informações iniciais', explanation: 'Você escolheu um assunto de consumidor e pediu informações iniciais, sem sinalizar atenção humana específica. Se desejar, também pode pedir uma avaliação jurídica humana.' },
};

export function evaluateReferral(choices: ReferralChoices): ReferralRecommendation {
  if (!choices || typeof choices !== 'object' || Array.isArray(choices)
    || !REFERRAL_OPTIONS.demand.some(option => option.value === choices.demand)
    || !REFERRAL_OPTIONS.goal.some(option => option.value === choices.goal)
    || !REFERRAL_OPTIONS.attention.some(option => option.value === choices.attention)) {
    throw new TypeError('Escolha uma resposta válida para cada uma das três perguntas.');
  }
  const route: ReferralRoute = choices.attention === 'sim' ? 'atencao_humana'
    : choices.demand === 'nao_sei' || choices.goal === 'nao_sei' || choices.attention === 'nao_sei' ? 'completar_informacoes'
    : choices.demand === 'outro' ? 'outra_especialidade'
    : choices.goal === 'informacoes' ? 'informacao_inicial' : 'avaliacao_consumo';
  const basis = (['demand', 'goal', 'attention'] as const).map(key => `${REFERRAL_QUESTIONS[key]} ${REFERRAL_OPTIONS[key].find(option => option.value === choices[key])!.label}`);
  return { route, ...routes[route], basis, version: REFERRAL_VERSION, scope: REFERRAL_SCOPE };
}

/** The UI records this only after a separate, explicit user action. It remains
 * an ordinary participant message, editable before submission. */
export function formatReferralRecord(choices: ReferralChoices): string {
  const result = evaluateReferral(choices);
  return [
    'Minhas escolhas para orientação de encaminhamento — demonstração fictícia.',
    ...result.basis.map((answer, index) => `${index + 1}. ${answer}`),
    `Sugestão por regras: ${result.label}.`,
    `Base: ${result.explanation}`,
    `${result.scope}. Versão: ${result.version}.`,
    REFERRAL_DISCLAIMER,
    'Nenhum encaminhamento foi enviado a uma equipe por este registro.',
  ].join('\n');
}

let canonicalRecords: Set<string> | undefined;
/** Only exact generated records are auxiliary. Edited text remains part of the
 * narrative so a participant's additions are never silently discarded. */
export function isCanonicalReferralRecord(content: string): boolean {
  if (!content.startsWith('Minhas escolhas para orientação de encaminhamento')) return false;
  if (!canonicalRecords) {
    canonicalRecords = new Set();
    for (const demand of REFERRAL_OPTIONS.demand) for (const goal of REFERRAL_OPTIONS.goal) for (const attention of REFERRAL_OPTIONS.attention) {
      canonicalRecords.add(formatReferralRecord({ demand: demand.value, goal: goal.value, attention: attention.value }));
    }
  }
  return canonicalRecords.has(content);
}
