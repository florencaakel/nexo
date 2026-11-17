"use client";

import { BROWSER_DEMO } from "@/lib/runtime-mode";

import { use, useEffect, useState } from "react";
import type { AnalysisData, CaseDetailDTO, Decision, MeDTO } from "@/lib/contracts";
import { STATUS_LABELS } from "@/lib/contracts";
import { dateLabel, readApi, useApiAction } from "@/components/nexo/api";
import { AnalysisEditor, AnalysisView, cleanAnalysis } from "@/components/nexo/analysis";
import { Failure, Gate, Notice, PageHeading, StatusBadge } from "@/components/nexo/shell";

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Gate roles={["reviewer", "admin"]} current="painel">{me => <CaseDetail id={id} me={me} />}</Gate>;
}

function CaseDetail({ id, me }: { id: string; me: MeDTO }) {
  const [detail, setDetail] = useState<CaseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState("");
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<Decision | "">("");
  const [correction, setCorrection] = useState<AnalysisData | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const { mutate, pending } = useApiAction();
  const path = `/api/cases/${encodeURIComponent(id)}`;

  useEffect(() => {
    const controller = new AbortController();
    readApi<CaseDetailDTO>(path, controller.signal).then(setDetail).catch(reason => { if (!controller.signal.aborted) setError(reason); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path]);

  async function refresh() {
    setError(null); setLoading(true);
    try { setDetail(await readApi<CaseDetailDTO>(path)); setSaved("Caso atualizado. Confira o estado e as revisões antes de salvar sua decisão."); setConfirmed(false); }
    catch (reason) { setError(reason); } finally { setLoading(false); }
  }

  async function analyze() {
    if (!detail) return;
    setError(null); setSaved("");
    try { await mutate(`${path}/analysis`, "POST", { expectedVersion: detail.version }); setDetail(await readApi<CaseDetailDTO>(path)); }
    catch (reason) { setError(reason); await readApi<CaseDetailDTO>(path).then(setDetail).catch(() => {}); }
  }

  async function saveReview() {
    if (!detail || !decision || !confirmed) return;
    setError(null); setSaved("");
    try {
      setDetail(await mutate<CaseDetailDTO>(`${path}/reviews`, "POST", { expectedVersion: detail.version, decision, notes, correctedAnalysis: correcting && correction ? cleanAnalysis(correction) : null }));
      setSaved("Revisão e decisão salvas. O relato original foi preservado."); setNotes(""); setDecision(""); setCorrecting(false); setCorrection(null); setConfirmed(false);
    } catch (reason) { setError(reason); }
  }

  async function deleteCase() {
    if (!detail || !deleteConfirmed || !me.roles.includes("admin")) return;
    setError(null); setSaved("");
    try {
      await mutate<{ deleted: true }>(path, "DELETE", { expectedVersion: detail.version });
      window.location.assign("/painel");
    } catch (reason) { setError(reason); }
  }

  function toggleCorrection(enabled: boolean) {
    setCorrecting(enabled); setConfirmed(false);
    if (enabled && !correction && detail?.analysis) {
      const latest = [...detail.reviews].reverse().find(review => review.correctedAnalysis)?.correctedAnalysis;
      setCorrection(structuredClone(latest || detail.analysis.data));
    }
  }

  return <><a className="nx-back-link" href="/painel">← Todos os casos</a><Failure error={error} returnTo={`/painel/casos/${encodeURIComponent(id)}`} />{saved && <Notice kind="success">{saved}</Notice>}{!detail ? <div className="nx-paper">{loading ? <p role="status">Carregando o caso…</p> : <button className="nx-button nx-secondary" onClick={refresh}>Tentar novamente</button>}</div> : <><PageHeading eyebrow="Caso fictício" title={detail.title} description={`${BROWSER_DEMO ? "Salvo neste navegador em" : "Recebido em"} ${dateLabel(detail.createdAt)}. Registro v${detail.version}.`}><StatusBadge status={detail.status} /><button className="nx-button nx-secondary" disabled={pending || loading} onClick={refresh}>Atualizar caso</button></PageHeading><p className="nx-case-id nx-detail-id">Identificador: {detail.id}</p><div className="nx-detail-grid"><section className="nx-paper nx-original"><div className="nx-section-header"><h2>Relato original</h2><span className="nx-tag">Preservado</span></div><p className="nx-small">{BROWSER_DEMO ? "Esta é a conversa confirmada no registro local. A revisão simulada não altera o original." : "Esta é a conversa confirmada no envio. A revisão não altera o original."}</p>{detail.messages.map(message => <article id={`mensagem-${message.id}`} className={`nx-message nx-message-${message.role}`} key={message.id} tabIndex={-1}><span>Mensagem {message.sequence} · {message.role === "user" ? "Participante" : "Nexo"}</span><p>{message.content}</p><small>{dateLabel(message.createdAt)}</small></article>)}<details className="nx-evidence"><summary>Critérios usados neste caso · v{detail.criteria.version}</summary><p>{detail.criteria.text}</p></details></section><section className="nx-paper"><div className="nx-section-header"><h2>{detail.analysis && detail.analysis.model !== "nexo-regras-v1" ? "Ficha registrada anteriormente" : "Ficha organizada por regras"}</h2>{detail.analysis && <span className="nx-tag">Versão {detail.analysis.version}</span>}</div>{detail.analysis ? <><Notice>{detail.analysis.model === "nexo-regras-v1" ? "Confira cada referência no relato. Regras selecionam trechos literais e não compreendem o contexto completo. A ficha exige revisão humana." : "Esta ficha pertence a um registro anterior. Confira a origem e todas as referências antes de revisá-la."}</Notice><AnalysisView data={detail.analysis.data} messages={detail.messages} kind={detail.analysis.model === "nexo-regras-v1" ? "rules" : "external"} /><details className="nx-evidence"><summary>Registro da geração</summary><dl className="nx-meta"><div><dt>{detail.analysis.model === "nexo-regras-v1" ? "Motor de organização" : "Modelo usado no registro anterior"}</dt><dd>{detail.analysis.model}</dd></div><div><dt>{detail.analysis.model === "nexo-regras-v1" ? "Regras e formato" : "Versões do registro anterior"}</dt><dd>{detail.analysis.promptVersion} / {detail.analysis.schemaVersion}</dd></div><div><dt>Gerada em</dt><dd>{dateLabel(detail.analysis.createdAt)}</dd></div></dl></details></> : <div className="nx-analysis-empty"><h3>A ficha ainda não está disponível.</h3><p>O relato está salvo e pode ser lido. Organize uma ficha por regras para reunir trechos com suas fontes.</p>{detail.analysisError && <Notice>A tentativa anterior não concluiu a ficha. O relato foi preservado.</Notice>}{detail.status === "EM_ANALISE" && <Notice>Processamento em andamento. Atualize o caso em alguns instantes.</Notice>}{["RECEBIDO", "FALHA_ANALISE"].includes(detail.status) && <button className="nx-button nx-primary" disabled={pending || !me.capabilities.intakeOpen} onClick={analyze}>{pending ? "Gerando ficha…" : "Organizar ficha"}</button>}</div>}</section></div><section className="nx-paper nx-review"><div className="nx-section-header"><div><h2>{BROWSER_DEMO ? "Agora, você é o revisor." : "A decisão é humana."}</h2><p className="nx-muted">{BROWSER_DEMO ? "Confira o relato e a ficha e registre uma decisão simulada. Ela fica neste navegador; nenhuma equipe recebe o caso." : "Revise o relato e a ficha antes de registrar o próximo passo da demonstração."}</p></div></div><form onSubmit={event => { event.preventDefault(); void saveReview(); }}>{!detail.analysis && <Notice>Revisão do relato original, sem ficha organizada. A decisão e as observações serão registradas como revisão humana.</Notice>}{detail.analysis && <label className="nx-check"><input type="checkbox" checked={correcting} disabled={pending} onChange={event => toggleCorrection(event.target.checked)} /><span>Corrigir a ficha nesta revisão</span></label>}{correcting && correction && <AnalysisEditor data={correction} onChange={value => { setCorrection(value); setConfirmed(false); }} messages={detail.messages} disabled={pending} />}<div className="nx-review-fields"><label className="nx-field"><span>Próximo passo</span><select required value={decision} disabled={pending} onChange={event => { setDecision(event.target.value as Decision | ""); setConfirmed(false); }}><option value="">Escolha uma decisão</option><option value="PENDENTE_INFORMACOES">Pedir informações</option><option value="ACEITO_PARA_ATENDIMENTO">Aceitar para atendimento simulado</option><option value="ENCERRADO">Encerrar caso fictício</option></select><small>Aceitar significa uma decisão simulada de atendimento; não reconhece um direito.</small></label><label className="nx-field"><span>Observações da revisão</span><textarea required rows={5} maxLength={4000} value={notes} disabled={pending} onChange={event => { setNotes(event.target.value); setConfirmed(false); }} placeholder="Registre o que foi conferido e o motivo do próximo passo." /><small>{BROWSER_DEMO ? "Notas locais desta simulação. Quem usar este mesmo navegador pode vê-las; não existe separação por contas." : "Notas internas, disponíveis somente à equipe autorizada."}</small></label></div><label className="nx-check"><input type="checkbox" checked={confirmed} disabled={pending} onChange={event => setConfirmed(event.target.checked)} /><span>Conferi o relato, as referências e a decisão que será registrada.</span></label><button className="nx-button nx-primary" disabled={pending || !decision || !notes.trim() || !confirmed}>{pending ? "Salvando revisão…" : "Registrar revisão e decisão"}</button></form></section><section className="nx-review-history"><h2>Histórico de revisão</h2>{detail.reviews.length === 0 ? <p className="nx-muted">Nenhuma decisão humana registrada.</p> : [...detail.reviews].reverse().map(review => <article className="nx-history-item" key={review.id}><div className="nx-section-header"><h3>{STATUS_LABELS[review.decision]}</h3><span className="nx-small">{dateLabel(review.createdAt)}</span></div><p className="nx-small">{BROWSER_DEMO ? "Revisão simulada neste navegador" : <>Registrado por {review.authorName}</>}</p><p className="nx-preserve-text">{review.notes}</p>{review.correctedAnalysis && <details className="nx-evidence"><summary>Ficha corrigida nesta revisão</summary><AnalysisView data={review.correctedAnalysis} messages={detail.messages} kind="human" /></details>}</article>)}</section>{me.roles.includes("admin") && <details className="nx-delete-section"><summary>Excluir este caso fictício</summary><p>{BROWSER_DEMO ? "Remove deste navegador o relato, a ficha e as revisões deste caso. Não há cópia sincronizada e esta ação não pode ser desfeita na demonstração." : "Remove o relato, a ficha e as revisões deste caso. Esta ação não pode ser desfeita na demonstração."}</p><label className="nx-check"><input type="checkbox" checked={deleteConfirmed} disabled={pending || detail.status === "EM_ANALISE"} onChange={event => setDeleteConfirmed(event.target.checked)} /><span>Confirmo a exclusão permanente deste caso fictício e dos seus registros relacionados.</span></label><button className="nx-button nx-delete-button" disabled={pending || !deleteConfirmed || detail.status === "EM_ANALISE"} onClick={deleteCase}>{pending ? "Excluindo…" : "Excluir caso fictício"}</button>{detail.status === "EM_ANALISE" && <p className="nx-small">Aguarde a organização da ficha terminar antes de excluir.</p>}</details>}</>}</>;
}
