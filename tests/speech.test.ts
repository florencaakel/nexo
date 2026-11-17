import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechDraft, finishSpeechDraft, receiveSpeechResults, speechErrorMessage, speechPreview } from '../lib/speech.ts';

// Only native-result text snapshots are simulated here. No microphone or network.
test('a revisão da hipótese provisória não altera o rascunho nem duplica o texto final', () => {
  let draft = createSpeechDraft('Relato já digitado.', 200);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'o serviço cobrou', final: false }]);
  assert.equal(speechPreview(draft).value, 'Relato já digitado. o serviço cobrou');
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'O serviço cancelou.', final: true }]);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'O serviço cancelou.', final: true }]);
  const finish = finishSpeechDraft(draft, 'Relato já digitado.', 200, true);
  assert.equal(finish.kind, 'applied');
  assert.equal(finish.value, 'Relato já digitado. O serviço cancelou.');
});

test('eventos cumulativos mantêm finais anteriores e permitem repetir uma frase em outro segmento', () => {
  let draft = createSpeechDraft('', 200);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'Não sei.', final: true }]);
  draft = receiveSpeechResults(draft, [
    { index: 0, text: 'Não sei.', final: true },
    { index: 1, text: 'Não sei.', final: true },
    { index: 2, text: 'hipótese provisória', final: false },
  ]);
  assert.equal(finishSpeechDraft(draft, '', 200, true).value, 'Não sei. Não sei.');
});

test('redução da lista de resultados remove apenas a prévia, sem apagar finais confirmados', () => {
  let draft = receiveSpeechResults(createSpeechDraft('Base\n', 200), [
    { index: 0, text: 'Pedido cancelado', final: true },
    { index: 1, text: 'uma hipótese incorreta', final: false },
  ]);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'Pedido cancelado', final: true }]);
  assert.equal(speechPreview(draft).interimText, '');
  assert.equal(finishSpeechDraft(draft, 'Base\n', 200, true).value, 'Base\nPedido cancelado');
});

test('resultado final repetido por índice não substitui texto que já estava confirmado', () => {
  let draft = receiveSpeechResults(createSpeechDraft('', 200), [{ index: 0, text: 'Trecho confirmado.', final: true }]);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'Alteração inesperada do navegador.', final: true }]);
  assert.equal(finishSpeechDraft(draft, '', 200, true).value, 'Trecho confirmado.');
});

test('fim da escuta descarta hipóteses não finalizadas e não altera um campo sem transcrição final', () => {
  const draft = receiveSpeechResults(createSpeechDraft('Original', 200), [{ index: 0, text: 'provisório', final: false }]);
  assert.deepEqual(finishSpeechDraft(draft, 'Original', 200, true), {
    draft: { ...draft, closed: true, interim: '' }, kind: 'empty', value: 'Original', limited: false,
  });
});

test('alteração externa do campo durante a escuta sempre vence a transcrição', () => {
  const draft = receiveSpeechResults(createSpeechDraft('Original', 200), [{ index: 0, text: 'Fala nova.', final: true }]);
  const result = finishSpeechDraft(draft, 'Correção digitada por outra ação', 200, true);
  assert.equal(result.kind, 'conflict');
  assert.equal(result.value, 'Correção digitada por outra ação');
});

test('limite inclui texto existente e separador, sem cortar caracteres Unicode ao meio', () => {
  const draft = receiveSpeechResults(createSpeechDraft('Oi', 6), [{ index: 0, text: '😀abc', final: true }]);
  assert.equal(speechPreview(draft).limitReached, true);
  const result = finishSpeechDraft(draft, 'Oi', 6, true);
  assert.equal(result.value, 'Oi 😀a');
  assert.equal(result.value.length, 6);
  assert.equal(result.limited, true);
  const noSpace = receiveSpeechResults(createSpeechDraft('Oi', 4), [{ index: 0, text: '😀', final: true }]);
  assert.equal(finishSpeechDraft(noSpace, 'Oi', 4, true).value, 'Oi');
});

test('redução posterior do limite não encurta nem perde o texto que já existia', () => {
  const draft = receiveSpeechResults(createSpeechDraft('Texto existente', 200), [{ index: 0, text: 'adicional', final: true }]);
  const result = finishSpeechDraft(draft, 'Texto existente', 4, true);
  assert.equal(result.value, 'Texto existente');
  assert.equal(result.kind, 'empty');
  assert.equal(result.limited, true);
});

test('cancelamento fecha a sessão e ignora resultados ou finais atrasados', () => {
  const draft = receiveSpeechResults(createSpeechDraft('Original', 200), [{ index: 0, text: 'Fala final.', final: true }]);
  const cancelled = finishSpeechDraft(draft, 'Original', 200, false);
  assert.equal(cancelled.kind, 'cancelled');
  assert.equal(cancelled.value, 'Original');
  const stale = receiveSpeechResults(cancelled.draft, [{ index: 1, text: 'Evento atrasado.', final: true }]);
  assert.equal(stale, cancelled.draft);
  assert.equal(finishSpeechDraft(stale, 'Original', 200, true).value, 'Original');
});

test('preserva espaços e quebras do texto existente e une pontuação sem espaço extra', () => {
  let draft = createSpeechDraft('Original\n  ', 200);
  draft = receiveSpeechResults(draft, [{ index: 0, text: 'Primeiro trecho', final: true }, { index: 1, text: ', complemento.', final: true }]);
  assert.equal(finishSpeechDraft(draft, 'Original\n  ', 200, true).value, 'Original\n  Primeiro trecho, complemento.');
});

test('erros nativos recebem orientação em português sem retornar detalhes do provedor', () => {
  for (const code of ['not-allowed', 'no-speech', 'network', 'audio-capture', 'language-not-supported']) {
    assert.match(speechErrorMessage(code), /digitando|teclado/u);
  }
  assert.equal(speechErrorMessage('detalhe interno inesperado'), 'O ditado não pôde ser concluído. Seu texto anterior foi mantido; você pode continuar digitando.');
});
