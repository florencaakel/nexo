"use client";

import { useId, useRef, useState } from "react";
import { MAX_PARTICIPANT_CHARS, type MessageDTO } from "@/lib/contracts";
import { BROWSER_DEMO } from "@/lib/runtime-mode";
import {
  evaluateReferral, formatReferralRecord, REFERRAL_DISCLAIMER, REFERRAL_HUMAN_REVIEW,
  REFERRAL_OPTIONS, REFERRAL_QUESTIONS, REFERRAL_SCOPE,
  type ReferralChoices,
} from "@/lib/referral";

export interface ReferralGuideProps {
  messages: MessageDTO[];
  onRecord?: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function ReferralGuide({ messages, onRecord, disabled = false }: ReferralGuideProps) {
  const id = useId();
  const [choices, setChoices] = useState<Partial<ReferralChoices>>({});
  const [recording, setRecording] = useState(false);
  const busy = useRef(false);
  const [savedRecord, setSavedRecord] = useState("");
  const [error, setError] = useState("");
  const complete = choices.demand && choices.goal && choices.attention ? choices as ReferralChoices : null;
  const result = complete ? evaluateReferral(complete) : null;
  const record = complete ? formatReferralRecord(complete) : "";
  const alreadyRecorded = !!record && (savedRecord === record || messages.some(message => message.role === "user" && message.content === record));
  const used = messages.filter(message => message.role === "user").reduce((sum, message) => sum + message.content.length, 0);
  const exceedsLimit = used + record.length > MAX_PARTICIPANT_CHARS;

  function change(key: keyof ReferralChoices, value: string) {
    setChoices(previous => ({ ...previous, [key]: value || undefined }));
    setError(""); setSavedRecord("");
  }
  async function save() {
    if (!onRecord || !record || disabled || busy.current || alreadyRecorded || exceedsLimit) return;
    busy.current = true; setRecording(true); setError("");
    try { await onRecord(record); setSavedRecord(record); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível adicionar a orientação. Confira o relato e tente novamente."); }
    finally { busy.current = false; setRecording(false); }
  }

  return <section className="nx-paper nx-referral" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Qual pode ser o próximo passo?</h2>
    <p className="nx-muted">Responda três perguntas para ver uma sugestão de encaminhamento. Ela usa suas escolhas, sem avaliar se cabe uma ação.</p>
    <p className="nx-small">{REFERRAL_SCOPE}. Esta orientação não usa os critérios editáveis do painel.</p>
    {(["demand", "goal", "attention"] as const).map((key, index) => <label className="nx-field" key={key}>
      <span>{index + 1}. {REFERRAL_QUESTIONS[key]}</span>
      <select value={choices[key] || ""} onChange={event => change(key, event.target.value)} disabled={disabled || recording} aria-describedby={key === "attention" ? `${id}-attention-help` : undefined}>
        <option value="">Escolha uma resposta</option>
        {REFERRAL_OPTIONS[key].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {key === "attention" && <small id={`${id}-attention-help`}>Considere sua própria percepção. A demonstração não verifica urgência ou assunto sensível.</small>}
    </label>)}
    <div aria-live="polite" aria-atomic="true">
      {result ? <div className="nx-notice">
        <h3>{result.label}</h3>
        <p>{result.explanation}</p>
        <p><strong>{REFERRAL_DISCLAIMER}</strong></p>
        <p>{REFERRAL_HUMAN_REVIEW}</p>
        <p>{BROWSER_DEMO ? "Nesta demonstração, nada é enviado a uma equipe. Você simula a revisão no painel deste navegador." : "Este resultado não envia um encaminhamento nem confirma atendimento por uma equipe."}</p>
      </div> : <p className="nx-small">Escolha as três respostas para ver a sugestão. “Não sei” também é uma resposta.</p>}
    </div>
    {result && <>
      <details><summary>Conferir a base da sugestão</summary><ul className="nx-bullets">{result.basis.map(answer => <li key={answer}>{answer}</li>)}</ul><p className="nx-small">Regras: {result.version} · {result.scope}.</p></details>
      {onRecord && <div className="nx-actions"><button type="button" className="nx-button nx-secondary" disabled={disabled || recording || alreadyRecorded || exceedsLimit} onClick={() => void save()}>{recording ? "Adicionando…" : alreadyRecorded ? "Orientação adicionada ao relato" : "Adicionar escolhas e orientação ao relato"}</button></div>}
      {onRecord && !alreadyRecorded && <p className="nx-small">Adicionar cria uma mensagem com as três respostas e a sugestão. Você poderá conferi-la e corrigi-la antes de confirmar o relato.</p>}
      {onRecord && exceedsLimit && !alreadyRecorded && <p className="nx-notice nx-notice-error" role="alert">Este registro ultrapassaria o limite de {MAX_PARTICIPANT_CHARS.toLocaleString("pt-BR")} caracteres. Confira suas respostas antes de adicioná-lo.</p>}
      {alreadyRecorded && <p className="nx-small" role="status">Registro adicionado às mensagens para sua conferência. Nenhum encaminhamento foi enviado.</p>}
      {error && <p className="nx-notice nx-notice-error" role="alert">{error}</p>}
    </>}
  </section>;
}
