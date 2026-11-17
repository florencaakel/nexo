/** Pure draft handling for native browser dictation. No audio, network or storage. */
export interface SpeechResultPiece { index: number; text: string; final: boolean }
export interface SpeechDraft {
  base: string;
  maximum: number;
  finals: Readonly<Record<number, string>>;
  interim: string;
  closed: boolean;
}
export interface SpeechPreview {
  finalText: string;
  interimText: string;
  value: string;
  limitReached: boolean;
}
export type SpeechFinish = {
  draft: SpeechDraft;
  kind: 'applied' | 'empty' | 'cancelled' | 'conflict';
  value: string;
  limited: boolean;
};

function limitOf(maximum: number): number {
  return Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : 0;
}

function join(left: string, right: string): string {
  const text = right.trim();
  if (!text) return left;
  const separator = left && !/\s$/u.test(left) && !/^[,.;:!?…)}\]]/u.test(text) ? ' ' : '';
  return left + separator + text;
}

/** maxLength follows textarea UTF-16 units, without splitting a surrogate pair. */
function takeWithin(text: string, maximum: number): string {
  let result = '';
  for (const character of text) {
    if (result.length + character.length > maximum) break;
    result += character;
  }
  return result;
}

function appendWithin(base: string, transcript: string, maximum: number) {
  const text = transcript.trim();
  const limit = limitOf(maximum);
  if (!text) return { value: base, limited: false, atLimit: base.length >= limit };
  const separator = base && !/\s$/u.test(base) && !/^[,.;:!?…)}\]]/u.test(text) ? ' ' : '';
  const available = Math.max(0, limit - base.length - separator.length);
  const piece = takeWithin(text, available);
  // An existing draft is never shortened, including when its limit changes.
  const value = piece ? base + separator + piece : base;
  return { value, limited: piece !== text, atLimit: piece !== text || value.length >= limit };
}

function finalText(draft: SpeechDraft): string {
  return Object.entries(draft.finals).sort(([a], [b]) => Number(a) - Number(b)).reduce((text, [, part]) => join(text, part), '');
}

export function createSpeechDraft(base: string, maximum: number): SpeechDraft {
  return { base, maximum: limitOf(maximum), finals: {}, interim: '', closed: false };
}

/** Results are the complete native snapshot. Interim hypotheses may shrink or change.
 * Final segments are immutable by index; repeated events must not duplicate them.
 */
export function receiveSpeechResults(draft: SpeechDraft, results: readonly SpeechResultPiece[]): SpeechDraft {
  if (draft.closed) return draft;
  const finals: Record<number, string> = { ...draft.finals };
  let interim = '';
  for (const result of results) {
    if (!Number.isSafeInteger(result.index) || result.index < 0 || result.index >= 512 || typeof result.text !== 'string') continue;
    if (Object.hasOwn(finals, result.index)) continue;
    const text = result.text.trim();
    if (result.final) finals[result.index] = text;
    else interim = join(interim, text);
  }
  return { ...draft, finals, interim };
}

export function speechPreview(draft: SpeechDraft): SpeechPreview {
  const confirmed = finalText(draft);
  const finalAppend = appendWithin(draft.base, confirmed, draft.maximum);
  const previewAppend = appendWithin(draft.base, join(confirmed, draft.interim), draft.maximum);
  return { finalText: confirmed, interimText: draft.interim, value: previewAppend.value, limitReached: finalAppend.atLimit || previewAppend.atLimit };
}

/** Only final segments are appended, and only if the parent draft is unchanged. */
export function finishSpeechDraft(draft: SpeechDraft, currentValue: string, maximum: number, commit: boolean): SpeechFinish {
  const closed = { ...draft, closed: true, interim: '' };
  if (draft.closed || !commit) return { draft: closed, kind: 'cancelled', value: currentValue, limited: false };
  if (currentValue !== draft.base) return { draft: closed, kind: 'conflict', value: currentValue, limited: false };
  const appended = appendWithin(draft.base, finalText(draft), maximum);
  return { draft: closed, kind: appended.value === currentValue ? 'empty' : 'applied', value: appended.value, limited: appended.limited };
}

export function speechErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'not-allowed': 'O microfone não foi autorizado. Você pode permitir o acesso nas configurações do navegador ou continuar digitando.',
    'service-not-allowed': 'O navegador não permite o serviço de ditado. Continue digitando ou use o ditado do teclado, se disponível.',
    'no-speech': 'O navegador parou por não detectar fala. Tente novamente ou continue digitando.',
    network: 'O serviço de ditado do navegador não respondeu. Confira sua conexão ou continue digitando.',
    'audio-capture': 'Não foi possível acessar um microfone. Confira o dispositivo ou continue digitando.',
    'language-not-supported': 'Este navegador não oferece ditado em português do Brasil. Continue digitando ou use o ditado do teclado, se disponível.',
    aborted: 'O ditado foi interrompido. Seu texto anterior foi mantido.',
  };
  return messages[code] || 'O ditado não pôde ser concluído. Seu texto anterior foi mantido; você pode continuar digitando.';
}
