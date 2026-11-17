import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReferral, formatReferralRecord, REFERRAL_DISCLAIMER, REFERRAL_HUMAN_REVIEW, REFERRAL_OPTIONS, REFERRAL_SCOPE, REFERRAL_VERSION, type ReferralChoices } from '../lib/referral.ts';

const defaults: ReferralChoices = { demand: 'cobranca', goal: 'avaliacao', attention: 'nao' };

test('orientação distingue as cinco saídas administrativas sem decisão jurídica', () => {
  assert.equal(evaluateReferral({ ...defaults, attention: 'sim' }).route, 'atencao_humana');
  assert.equal(evaluateReferral(defaults).route, 'avaliacao_consumo');
  assert.equal(evaluateReferral({ ...defaults, demand: 'nao_sei' }).route, 'completar_informacoes');
  assert.equal(evaluateReferral({ ...defaults, demand: 'outro' }).route, 'outra_especialidade');
  assert.equal(evaluateReferral({ ...defaults, goal: 'informacoes' }).route, 'informacao_inicial');
  assert.match(REFERRAL_DISCLAIMER, /não decisão jurídica/);
  assert.match(REFERRAL_HUMAN_REVIEW, /qualquer resultado/);
});

test('todas as 45 combinações têm base explícita, versão fixa e prioridade para atenção humana', () => {
  let count = 0;
  for (const demand of REFERRAL_OPTIONS.demand) for (const goal of REFERRAL_OPTIONS.goal) for (const attention of REFERRAL_OPTIONS.attention) {
    const choices = { demand: demand.value, goal: goal.value, attention: attention.value };
    const result = evaluateReferral(choices);
    assert.equal(result.version, REFERRAL_VERSION); assert.equal(result.scope, REFERRAL_SCOPE);
    assert.equal(result.basis.length, 3);
    assert.ok(result.basis[0].endsWith(demand.label)); assert.ok(result.basis[1].endsWith(goal.label)); assert.ok(result.basis[2].endsWith(attention.label));
    if (attention.value === 'sim') assert.equal(result.route, 'atencao_humana');
    else if (Object.values(choices).includes('nao_sei')) assert.equal(result.route, 'completar_informacoes');
    assert.doesNotMatch(result.label, /não cabe|sem direito|improcedente|ação garantida/iu);
    count++;
  }
  assert.equal(count, 45);
});

test('não saber em qualquer pergunta pede conversa, sem virar recusa', () => {
  for (const key of ['demand', 'goal', 'attention'] as const) {
    const result = evaluateReferral({ ...defaults, [key]: 'nao_sei' });
    assert.equal(result.route, 'completar_informacoes'); assert.match(result.explanation, /sem descartar o relato/);
  }
  assert.equal(evaluateReferral({ demand: 'nao_sei', goal: 'nao_sei', attention: 'sim' }).route, 'atencao_humana');
});

test('demanda fora do recorte não é recusada e pode pedir outra especialidade', () => {
  const result = evaluateReferral({ ...defaults, demand: 'outro' });
  assert.equal(result.route, 'outra_especialidade'); assert.match(result.explanation, /não é uma recusa/);
});

test('resultado exige três escolhas válidas e não aceita relato livre como classificação', () => {
  for (const choices of [null, {}, { demand: 'cobranca' }, { ...defaults, attention: '' }, { ...defaults, demand: 'urgente! quero processar' }, { ...defaults, goal: 'ganhar_acao' }]) {
    assert.throws(() => evaluateReferral(choices as ReferralChoices), /três perguntas/);
  }
});

test('registro explícito contém perguntas, respostas, sugestão derivada e limites da demonstração', () => {
  const choices: ReferralChoices = { demand: 'cancelamento', goal: 'informacoes', attention: 'nao' };
  const result = evaluateReferral(choices); const record = formatReferralRecord(choices);
  for (const item of result.basis) assert.ok(record.includes(item));
  assert.ok(record.includes(result.label)); assert.ok(record.includes(REFERRAL_VERSION)); assert.ok(record.includes(REFERRAL_SCOPE));
  assert.ok(record.includes(REFERRAL_DISCLAIMER)); assert.match(record, /Nenhum encaminhamento foi enviado/);
  assert.ok(record.length < 1500);
  assert.notEqual(formatReferralRecord({ ...choices, attention: 'sim' }), record);
});

test('orientação e registro são determinísticos, não alteram escolhas e não usam rede', t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Rede proibida neste teste.'); });
  const choices = Object.freeze({ ...defaults });
  assert.deepEqual(evaluateReferral(choices), evaluateReferral(choices));
  assert.equal(formatReferralRecord(choices), formatReferralRecord(choices));
  assert.deepEqual(choices, defaults); assert.equal(fetch.mock.callCount(), 0);
});
