"use client";

import { BROWSER_DEMO } from "@/lib/runtime-mode";

import { useEffect, useRef, useState } from "react";
import { MAX_PARTICIPANT_CHARS, MAX_QUESTIONS, type MeDTO, type SessionDTO } from "@/lib/contracts";
import { dateLabel, readApi, useApiAction } from "@/components/nexo/api";
import { Failure, Gate, Notice, PageHeading, StatusBadge } from "@/components/nexo/shell";

export default function RelatoPage() {
  return <Gate roles={["tester", "admin"]} current="relato">{me => <Interview me={me} />}</Gate>;
}

function Interview({ me }: { me: MeDTO }) {
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [text, setText] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState("");
  const { mutate, pending } = useApiAction();
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const used = session?.messages.filter(message => message.role === "user").reduce((total, message) => total + message.content.length, 0) || 0;
  const editedCount = Object.values(answers).reduce((total, value) => total + value.length, 0);
  const path = session ? `/api/intake-sessions/${encodeURIComponent(session.id)}` : "";

  function accept(next: SessionDTO) {
    setSession(next);
    setAnswers(Object.fromEntries(next.messages.filter(message => message.role === "user").map(message => [message.id, message.content])));
    const url = new URL(window.location.href);
    url.searchParams.set("sessao", next.id);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  useEffect(() => {
    const controller = new AbortController();
    const id = new URLSearchParams(window.location.search).get("sessao");
    if (!id) { setLoading(false); return; }
    readApi<SessionDTO>(`/api/intake-sessions/${encodeURIComponent(id)}`, controller.signal)
      .then(accept).catch(reason => { if (!controller.signal.aborted) setError(reason); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function refresh() {
    if (!session) { window.location.reload(); return; }
    setError(null);
    try { accept(await readApi<SessionDTO>(path)); setSaved("Estado salvo atualizado."); }
    catch (reason) { setError(reason); }
  }

  async function start() {
    setError(null); setSaved("");
    try { accept(await mutate<SessionDTO>("/api/intake-sessions", "POST", { mode: "demo" })); }
    catch (reason) { setError(reason); }
  }

  async function saveAnswer() {
    if (!session || !text.trim()) return;
    setError(null); setSaved("");
    try {
      accept(await mutate<SessionDTO>(`${path}/messages`, "POST", { content: text, expectedVersion: session.version }));
      setText(""); setSaved("Resposta salva."); answerRef.current?.focus();
    } catch (reason) { setError(reason); }
  }

  async function ask() {
    if (!session) return;
    setError(null); setSaved("");
    try { accept(await mutate<SessionDTO>(`${path}/next-question`, "POST", { expectedVersion: session.version })); answerRef.current?.focus(); }
    catch (reason) { setError(reason); await readApi<SessionDTO>(path).then(accept).catch(() => {}); }
  }

  async function saveCorrections() {
    if (!session) return;
    setError(null); setSaved("");
    try {
      accept(await mutate<SessionDTO>(`${path}/messages`, "PUT", { answers: session.messages.filter(message => message.role === "user").map(message => ({ id: message.id, content: answers[message.id] || "" })), expectedVersion: session.version }));
      setSaved(BROWSER_DEMO ? "Correções salvas neste navegador. Confira o relato e confirme o registro local." : "Correções salvas. Confira o relato e confirme o envio.");
    } catch (reason) { setError(reason); }
  }

  async function submit() {
    if (!session || !confirmed) return;
    setError(null); setSaved("");
    try { accept(await mutate<SessionDTO>(`${path}/submit`, "POST", { expectedVersion: session.version, confirmedFictional: true })); setReviewing(false); }
    catch (reason) { setError(reason); }
  }

  async function analyze() {
    if (!session?.receipt) return;
    setError(null); setSaved("");
    try {
      await mutate(`/api/cases/${encodeURIComponent(session.receipt.caseId)}/analysis`, "POST", { expectedVersion: session.receipt.version });
      accept(await readApi<SessionDTO>(path));
    } catch (reason) { setError(reason); await readApi<SessionDTO>(path).then(accept).catch(() => {}); }
  }

  const dirty = session?.messages.some(message => message.role === "user" && answers[message.id] !== message.content);
  const analysisAllowed = session?.aiAvailable && ["RECEBIDO", "FALHA_ANALISE"].includes(session.receipt?.status || "");

  return <>
    <PageHeading eyebrow="Demonstração de consumidor" title={session?.receipt ? BROWSER_DEMO ? "Relato salvo neste navegador." : "Relato recebido." : "Toda história tem um começo."} description={BROWSER_DEMO ? "Experimente todos os papéis: conte um caso fictício, organize a ficha e faça a revisão simulada. Os dados ficam só neste navegador." : "Use apenas situações fictícias. Perguntas predefinidas orientam o relato e regras organizam a ficha. Uma pessoa confere e decide os próximos passos."} />
    <Failure error={error} returnTo="/relato" />
    {error && <div className="nx-actions"><button className="nx-button nx-secondary" disabled={pending} onClick={refresh}>Consultar estado salvo</button>{!session && <a className="nx-inline-link" href="/relato">Começar outro relato</a>}</div>}
    {saved && <Notice kind="success">{saved}</Notice>}
    {loading ? <p role="status">Buscando seu relato…</p> : !session ? <div className="nx-intro-grid"><section className="nx-paper"><h2>Um espaço para testar o fluxo.</h2><p>{BROWSER_DEMO ? "Você conta uma situação fictícia, confere as informações e salva o caso neste navegador. Depois, você mesmo experimenta a revisão." : "Você conta o que aconteceu, confere as informações e envia um caso fictício. O relato fica salvo para revisão."}</p><ol className="nx-steps"><li><span>1</span><div><h3>Conte a situação</h3><p>Um problema de cobrança, cancelamento, produto ou serviço.</p></div></li><li><span>2</span><div><h3>Esclareça e confira</h3><p>Perguntas predefinidas ajudam a conferir campos do relato. Você pode responder “não sei” e encerrar quando quiser.</p></div></li><li><span>3</span><div><h3>{BROWSER_DEMO ? "Salve e simule a revisão" : "Envie para revisão"}</h3><p>{BROWSER_DEMO ? "O registro é confirmado depois que o caso é salvo neste navegador." : "O recebimento é confirmado depois que o caso é salvo."}</p></div></li></ol>{!me.capabilities.intakeOpen && <Notice>{BROWSER_DEMO ? "Novos relatos estão pausados nas configurações deste navegador." : "Novos relatos estão pausados pela administração."}</Notice>}<button className="nx-button nx-primary" disabled={pending || !me.capabilities.intakeOpen} onClick={start}>{pending ? "Iniciando…" : "Começar relato fictício"}</button></section><aside className="nx-side-note"><span className="nx-large-symbol" aria-hidden="true">×</span><h2>O cuidado começa nos dados.</h2><p>Não inclua CPF, dados bancários, endereço completo ou informações de pessoas reais. Não há envio de documentos nem atendimento jurídico real.</p><p>{BROWSER_DEMO ? "O link do relato só funciona neste mesmo navegador e dispositivo, enquanto os dados locais existirem e a sessão não expirar." : "Guarde o link da sessão para retomar em outra sessão autorizada até sua expiração."}</p></aside></div> : session.receipt ? <section className="nx-paper nx-receipt"><span className="nx-receipt-mark" aria-hidden="true">✓</span><h2>{BROWSER_DEMO ? "Seu caso fictício foi salvo neste navegador." : "Seu caso fictício foi salvo."}</h2><StatusBadge status={session.receipt.status} /><dl className="nx-meta"><div><dt>Identificador do caso</dt><dd><code>{session.receipt.caseId}</code></dd></div><div><dt>{BROWSER_DEMO ? "Salvo em" : "Recebido em"}</dt><dd>{dateLabel(session.receipt.receivedAt)}</dd></div></dl><p>{BROWSER_DEMO ? "O registro local está concluído. Você pode organizar a ficha por regras e assumir o papel de revisor. Nada foi enviado a uma equipe; não há atendimento jurídico nesta demonstração." : "O envio está concluído. A ficha organiza trechos por regras, sem serviço externo de IA, e será conferida por uma pessoa autorizada. Não há promessa de atendimento ou prazo de retorno."}</p>{!session.aiAvailable && <Notice>A organização da ficha está pausada ou indisponível. O relato permanece salvo e pode ser revisado por uma pessoa.</Notice>}{session.receipt.status === "EM_ANALISE" && <Notice>A ficha está sendo organizada. Consulte o estado salvo em alguns instantes.</Notice>}{session.receipt.status === "FALHA_ANALISE" && <Notice>A organização da ficha não foi concluída. O relato continua disponível para revisão.</Notice>}<div className="nx-actions">{analysisAllowed && <button className="nx-button nx-primary" disabled={pending} onClick={analyze}>{pending ? "Gerando ficha…" : BROWSER_DEMO ? "Organizar ficha neste navegador" : "Gerar ficha para revisão"}</button>}{BROWSER_DEMO && <a className="nx-button nx-secondary" href={`/painel/casos/${encodeURIComponent(session.receipt.caseId)}`}>Abrir revisão simulada</a>}<button className="nx-button nx-secondary" disabled={pending} onClick={refresh}>Atualizar estado</button><a className="nx-inline-link" href="/relato">Começar outro relato</a></div></section> : <div className="nx-work-grid"><section className="nx-paper"><div className="nx-section-header"><h2>{reviewing ? "Confira suas respostas." : "Conte o que aconteceu."}</h2><span className="nx-small">{session.questionCount}/{MAX_QUESTIONS} perguntas</span></div><div className="nx-progress" aria-label={reviewing ? "Etapa 2 de 3: conferir" : "Etapa 1 de 3: relatar"}><span className="is-current">Relatar</span><span className={reviewing ? "is-current" : ""}>Conferir</span><span>{BROWSER_DEMO ? "Salvar" : "Enviar"}</span></div>
      {reviewing ? <><p className="nx-muted">{BROWSER_DEMO ? "Corrija o que precisar. Salve as correções antes de confirmar o registro local." : "Corrija o que precisar. Salve as correções antes de confirmar o envio."}</p><div className="nx-answer-list">{session.messages.map(message => message.role === "assistant" ? <p className="nx-question" key={message.id}>{message.content}</p> : <label className="nx-field" key={message.id}><span>Resposta {session.messages.filter(m => m.role === "user" && m.sequence <= message.sequence).length}</span><textarea rows={5} value={answers[message.id] || ""} maxLength={MAX_PARTICIPANT_CHARS} disabled={pending} onChange={event => { setAnswers(value => ({ ...value, [message.id]: event.target.value })); setConfirmed(false); }} /></label>)}</div><p className="nx-small">{editedCount.toLocaleString("pt-BR")} de {MAX_PARTICIPANT_CHARS.toLocaleString("pt-BR")} caracteres.</p><div className="nx-actions"><button className="nx-button nx-secondary" disabled={pending || !dirty || editedCount > MAX_PARTICIPANT_CHARS || Object.values(answers).some(value => !value.trim())} onClick={saveCorrections}>Salvar correções</button><button className="nx-button nx-quiet" disabled={pending || !!dirty} onClick={() => { setReviewing(false); setConfirmed(false); }}>Voltar ao relato</button></div><label className="nx-check"><input type="checkbox" checked={confirmed} disabled={pending || !!dirty} onChange={event => setConfirmed(event.target.checked)} /><span>Conferi o relato e confirmo que todos os dados e acontecimentos são fictícios.</span></label><button className="nx-button nx-primary" disabled={pending || !confirmed || !!dirty} onClick={submit}>{pending ? BROWSER_DEMO ? "Salvando…" : "Enviando…" : BROWSER_DEMO ? "Confirmar e salvar neste navegador" : "Confirmar e enviar relato"}</button></> : <><div className="nx-conversation" aria-label="Histórico salvo">{session.messages.length === 0 ? <p className="nx-muted">Qual é a situação? O que aconteceu e o que você já tentou fazer?</p> : session.messages.map(message => <article className={`nx-message nx-message-${message.role}`} key={message.id}><span>{message.role === "user" ? "Seu relato fictício" : "Pergunta predefinida"}</span><p>{message.content}</p><small>{dateLabel(message.createdAt)}</small></article>)}</div>{session.messages.length === 0 && !text && <button className="nx-inline-link nx-example-button" disabled={pending} onClick={() => { setText("Sou Pessoa Exemplo 02. Pedi para cancelar o Clube Exemplo 02, mas acho que continuam cobrando. Não lembro quando pedi nem quanto foi cobrado."); answerRef.current?.focus(); }}>Preencher exemplo fictício de cancelamento</button>}<form onSubmit={event => { event.preventDefault(); void saveAnswer(); }}><label className="nx-field"><span>{session.messages.length ? "Sua resposta ou complemento" : "Seu relato fictício"}</span><textarea ref={answerRef} rows={6} value={text} maxLength={Math.max(0, MAX_PARTICIPANT_CHARS - used)} onChange={event => setText(event.target.value)} disabled={pending} aria-describedby="answer-help" placeholder="Escreva uma situação fictícia…" /></label><div className="nx-input-footer"><p id="answer-help" className="nx-small">{(used + text.length).toLocaleString("pt-BR")} / {MAX_PARTICIPANT_CHARS.toLocaleString("pt-BR")} caracteres</p><button className="nx-button nx-primary" disabled={pending || !text.trim()}>{pending ? "Salvando…" : "Salvar resposta"}</button></div></form>{!session.aiAvailable && <Notice>{BROWSER_DEMO ? "As perguntas guiadas estão pausadas ou indisponíveis. Confira o relato salvo e as configurações locais para continuar." : "As perguntas guiadas estão pausadas ou indisponíveis. Você pode conferir o relato salvo e consultar a administração para continuar."}</Notice>}<div className="nx-actions">{session.canAsk && session.aiAvailable && <button className="nx-button nx-secondary" disabled={pending || !!text.trim() || used === 0} onClick={ask}>{pending ? "Aguarde…" : "Pedir próxima pergunta"}</button>}<button className="nx-button nx-secondary" disabled={pending || used === 0 || !!text.trim()} onClick={() => { setReviewing(true); setConfirmed(false); setSaved(""); }}>{BROWSER_DEMO ? "Conferir e salvar" : "Conferir e enviar"}</button></div>{!!text.trim() && used > 0 && <p className="nx-small">Salve sua resposta antes de continuar.</p>}</>}
      </section><aside className="nx-side-note"><h2>Uma informação por vez.</h2><p>A entrevista usa perguntas predefinidas selecionadas por regras simples. Ela pode deixar passar informações; confira o relato. “Não sei” também é uma resposta.</p><p>Relate documentos apenas como mencionados. Nenhum documento será recebido ou analisado neste teste.</p><div className="nx-session-note"><span>{BROWSER_DEMO ? "Rascunho salvo neste navegador" : "Rascunho salvo no servidor"}</span><p>{BROWSER_DEMO ? "O link só retoma o relato no mesmo navegador e dispositivo. Limpar os dados locais apaga este registro." : "Retome com o link desta página."}</p><small>Disponível até {dateLabel(session.expiresAt)}.</small></div><button className="nx-inline-link" disabled={pending} onClick={refresh}>Atualizar estado salvo</button></aside></div>}
  </>;
}
