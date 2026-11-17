"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createSpeechDraft, finishSpeechDraft, receiveSpeechResults, speechErrorMessage, speechPreview, type SpeechDraft, type SpeechResultPiece } from "@/lib/speech";

interface RecognitionResult { isFinal: boolean; [index: number]: { transcript: string } | undefined }
interface RecognitionEvent { results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
interface Run {
  recognition: Recognition;
  draft: SpeechDraft;
  stopping: boolean;
  durationTimer?: ReturnType<typeof setTimeout>;
  stopTimer?: ReturnType<typeof setTimeout>;
  limitReached: boolean;
  stopReason?: string;
}
export interface VoiceInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength: number;
  disabled?: boolean;
  onActiveChange?: (active: boolean) => void;
}

const MAX_DICTATION_MS = 120_000;
const STOP_GRACE_MS = 2_000;

function constructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as SpeechWindow;
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

/** Native browser dictation only. Results stay in the editable draft; no autosave. */
export function VoiceInput({ value, onChange, maxLength, disabled = false, onActiveChange }: VoiceInputProps) {
  const descriptionId = useId();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [consented, setConsented] = useState(false);
  const [active, setActive] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [preview, setPreview] = useState("");
  const [hasInterim, setHasInterim] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);
  const running = useRef<Run | null>(null);
  const latest = useRef({ value, onChange, maxLength, disabled, onActiveChange });
  latest.current = { value, onChange, maxLength, disabled, onActiveChange };

  function finish(run: Run, commit: boolean, reason?: string, isError = false) {
    if (running.current !== run) return;
    running.current = null;
    clearTimeout(run.durationTimer); clearTimeout(run.stopTimer);
    const recognition = run.recognition;
    recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
    const result = finishSpeechDraft(run.draft, latest.current.value, latest.current.maxLength, commit);
    run.draft = result.draft;
    try { recognition.abort(); } catch { /* Already stopped by the browser. */ }
    latest.current.onActiveChange?.(false);
    if (!mounted.current) return;
    setActive(false); setStopping(false); setPreview(""); setHasInterim(false);
    if (result.kind === "applied") latest.current.onChange(result.value);
    const finishReason = reason || run.stopReason;
    const detail = result.kind === "conflict"
      ? "O texto foi alterado durante o ditado. A transcrição não foi acrescentada para preservar suas alterações."
      : result.kind === "cancelled"
        ? finishReason || "Ditado cancelado. Seu texto anterior foi mantido."
        : isError && finishReason
          ? finishReason + (result.kind === "applied" ? " Os trechos finais reconhecidos foram acrescentados ao rascunho para revisão." : "")
          : result.limited || run.limitReached
            ? result.kind === "applied"
              ? "O ditado parou no limite do campo. Confira o texto acrescentado ao rascunho antes de salvar."
              : "O limite do campo foi atingido. Nenhum novo trecho final coube; seu texto anterior foi mantido."
            : finishReason || (result.kind === "applied" ? "Ditado concluído. Confira e corrija o texto no campo antes de salvar." : "Nenhum trecho final foi reconhecido. Seu texto anterior foi mantido.");
    setMessage(detail); setFailed(isError || result.kind === "conflict");
  }

  function stop(run: Run, reason?: string) {
    if (running.current !== run || run.stopping) return;
    run.stopping = true;
    run.stopReason = reason;
    clearTimeout(run.durationTimer);
    if (mounted.current) { setStopping(true); setMessage(reason || "Finalizando o ditado…"); }
    // Keep the field locked until final result/end, then bound a silent browser.
    run.stopTimer = setTimeout(() => finish(run, true, reason), STOP_GRACE_MS);
    try { run.recognition.stop(); } catch { finish(run, true, reason); }
  }

  useEffect(() => {
    mounted.current = true;
    setSupported(Boolean(constructor()));
    const hide = () => {
      const run = running.current;
      if (document.hidden && run) finish(run, false, "Ditado interrompido ao sair da aba. Seu texto anterior foi mantido.");
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", hide);
      const run = running.current;
      if (run) finish(run, false);
    };
  }, []);

  useEffect(() => {
    const run = running.current;
    if (!run) return;
    if (disabled) finish(run, false, "Ditado interrompido. Seu texto anterior foi mantido.");
    else if (value !== run.draft.base) finish(run, false, "O texto mudou durante o ditado. Suas alterações foram preservadas.");
    else if (maxLength !== run.draft.maximum) finish(run, false, "O limite do campo mudou. O ditado foi interrompido e seu texto anterior foi mantido.");
  }, [disabled, value, maxLength]);

  function start() {
    if (running.current || latest.current.disabled || !consented || document.hidden) return;
    const NativeRecognition = constructor();
    if (!NativeRecognition) { setSupported(false); return; }
    if (!Number.isFinite(maxLength) || value.length >= maxLength || maxLength < 1) {
      setMessage("O campo já atingiu o limite de caracteres. Revise o texto antes de ditar."); setFailed(false); return;
    }
    let recognition: Recognition;
    try { recognition = new NativeRecognition(); }
    catch { setMessage("O ditado não está disponível neste navegador. Continue digitando."); setFailed(true); return; }
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const run: Run = { recognition, draft: createSpeechDraft(value, maxLength), stopping: false, limitReached: false };
    running.current = run;
    setActive(true); setStopping(false); setPreview(""); setHasInterim(false); setFailed(false); setMessage("Aguardando o microfone…");
    latest.current.onActiveChange?.(true);
    recognition.onstart = () => { if (running.current === run && mounted.current) setMessage("Ouvindo em português do Brasil. Fale uma parte por vez."); };
    recognition.onresult = event => {
      if (running.current !== run || !mounted.current) return;
      if (latest.current.value !== run.draft.base || latest.current.disabled || document.hidden) {
        finish(run, false, "O ditado foi interrompido para preservar seu texto anterior."); return;
      }
      const results: SpeechResultPiece[] = [];
      for (let index = 0; index < Math.min(event.results.length, 512); index++) {
        const result = event.results[index];
        if (result?.[0]) results.push({ index, final: result.isFinal, text: result[0].transcript });
      }
      run.draft = receiveSpeechResults(run.draft, results);
      const next = speechPreview(run.draft);
      setPreview(next.value); setHasInterim(Boolean(next.interimText));
      if (next.limitReached) {
        run.limitReached = true;
        stop(run, "Limite de caracteres atingido. Finalizando o trecho reconhecido…");
      }
    };
    recognition.onerror = event => {
      if (running.current !== run) return;
      finish(run, event.error !== "aborted", speechErrorMessage(event.error), true);
    };
    recognition.onend = () => { if (running.current === run) finish(run, true); };
    run.durationTimer = setTimeout(() => stop(run, "O limite de dois minutos foi atingido. Confira o texto antes de iniciar outro ditado."), MAX_DICTATION_MS);
    try { recognition.start(); }
    catch { finish(run, false, "Não foi possível iniciar o microfone. Confira a permissão do navegador ou continue digitando.", true); }
  }

  return <section className="nx-voice-input" aria-label="Ditado por voz" style={{ marginBlock: "18px 24px" }}>
    <p id={descriptionId} className="nx-small">A fala vira texto para você conferir. O áudio não fica salvo no Nexo.</p>
    {supported === false ? <p className="nx-small" style={{ marginTop: 8 }}>Este navegador não oferece o ditado desta página. Continue digitando ou use o microfone do teclado do seu dispositivo, se disponível.</p> : <>
      <label className="nx-check"><input type="checkbox" checked={consented} disabled={disabled || active || supported === null} onChange={event => setConsented(event.target.checked)} /><span>Entendi que o fornecedor do navegador pode processar meu áudio para transcrição.</span></label>
      <div className="nx-actions">
        {active ? <><button type="button" className="nx-button nx-secondary" disabled={stopping} onClick={() => { const run = running.current; if (run) stop(run); }}>{stopping ? "Finalizando ditado…" : "Parar ditado"}</button><button type="button" className="nx-button nx-quiet" onClick={() => { const run = running.current; if (run) finish(run, false); }}>Cancelar ditado</button></> : <button type="button" className="nx-button nx-secondary" disabled={disabled || !consented || !supported || value.length >= maxLength} aria-describedby={descriptionId} onClick={start}>Falar em vez de digitar</button>}
      </div>
      <p className="nx-small">Ao terminar, apenas os trechos finais serão acrescentados ao rascunho. Confira o texto e use o botão de salvar do formulário. O ditado para em até dois minutos e não reinicia sozinho.</p>
    </>}
    {active && preview && <div className="nx-notice" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}><strong>{hasInterim ? "Prévia provisória — ainda pode mudar" : "Texto reconhecido — aguardando o fim do ditado"}</strong><p>{preview}</p></div>}
    {message && <p className={`nx-notice${failed ? " nx-notice-error" : ""}`} role={failed ? "alert" : "status"} aria-live={failed ? "assertive" : "polite"}>{message}</p>}
  </section>;
}
