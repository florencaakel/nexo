"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CaseStatus, MeDTO, Role } from "@/lib/contracts";
import { STATUS_LABELS } from "@/lib/contracts";
import { BROWSER_DEMO } from "@/lib/runtime-mode";
import { ApiFailure, failureText, readApi, signInHref } from "./api";

export function Wordmark() { return <a className="wordmark" href="/" aria-label="Nexo, início">Ne<span className="brand-x">x</span>o<span className="brand-dot">.</span></a>; }

export function Notice({ children, kind = "info" }: { children: ReactNode; kind?: "info" | "error" | "success" }) {
  return <div className={`nx-notice nx-notice-${kind}`} role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"}>{children}</div>;
}

export function Failure({ error, returnTo }: { error: unknown; returnTo?: string }) {
  if (!error) return null;
  return <Notice kind="error"><p>{failureText(error)}</p>{!BROWSER_DEMO && error instanceof ApiFailure && error.status === 401 && <p><a className="nx-inline-link" href={signInHref(returnTo || "/")} target="_top">Entrar novamente com ChatGPT</a></p>}{error instanceof ApiFailure && error.requestId && <small>Referência do erro: {error.requestId}</small>}</Notice>;
}

export function StatusBadge({ status }: { status: CaseStatus }) { return <span className={`nx-status nx-status-${status.toLowerCase()}`}>{BROWSER_DEMO && status === "RECEBIDO" ? "Salvo neste navegador" : STATUS_LABELS[status]}</span>; }

function Frame({ children, me, current }: { children: ReactNode; me?: MeDTO; current: "relato" | "painel" | "configuracoes" }) {
  const canReview = BROWSER_DEMO || me?.roles.some(role => role === "reviewer" || role === "admin");
  return <div className="nx-app">
    <header className="nx-header"><div className="nx-header-inner"><Wordmark /><span className="nx-demo-pill">{BROWSER_DEMO ? "Demo no navegador" : "Demonstração"}</span>
      <nav aria-label="Navegação da demonstração"><a href="/" aria-label="Voltar à apresentação da Nexo">Apresentação</a>{(BROWSER_DEMO || !me || me.roles.some(role => role === "tester" || role === "admin")) && <a href="/relato" aria-current={current === "relato" ? "page" : undefined}>Novo relato</a>}{canReview && <a href="/painel" aria-current={current === "painel" ? "page" : undefined}>Painel</a>}{(BROWSER_DEMO || me?.roles.includes("admin")) && <a href="/painel/configuracoes" aria-current={current === "configuracoes" ? "page" : undefined}>Configurações</a>}</nav>
      {!BROWSER_DEMO && me && <a className="nx-signout" href="/signout-with-chatgpt" target="_top">Sair</a>}
    </div></header>
    <div className="nx-context-strip"><div className="nx-width"><span><span className="nx-dot" />Somente casos fictícios</span><span>{BROWSER_DEMO ? "Sem login · revisão simulada por você" : me?.organization?.name || "Nexo — Ambiente de Demonstração"}</span></div></div>
    <main id="conteudo" tabIndex={-1} className="nx-main nx-width">
      {BROWSER_DEMO && <div className="nx-browser-notice"><strong>Demonstração sem login.</strong> Textos salvos e decisões ficam neste navegador e dispositivo, sem sincronização. O ditado opcional pode usar o serviço de voz do navegador, com aviso antes de ativar. Limpar os dados do navegador remove os registros. Use apenas casos fictícios.</div>}
      {children}
    </main>
    <footer className="nx-footer nx-width"><span>{BROWSER_DEMO ? "Nexo · Demonstração local no navegador" : "Nexo · Produto em desenvolvimento"}</span><span>Demonstração sem atendimento jurídico real.</span></footer>
  </div>;
}

export function Gate({ roles, current, children }: { roles: Role[]; current: "relato" | "painel" | "configuracoes"; children: (me: MeDTO) => ReactNode }) {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const returnTo = typeof window === "undefined" ? (current === "relato" ? "/relato" : "/painel") : window.location.pathname + window.location.search;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    readApi<MeDTO>("/api/me", controller.signal).then(setMe).catch(e => { if (!controller.signal.aborted) setError(e); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  if (loading) return <Frame current={current}><div className="nx-access"><p className="nx-overline">{BROWSER_DEMO ? "Demonstração no navegador" : "Acesso restrito"}</p><h1>{BROWSER_DEMO ? "Abrindo seus dados locais." : "Conferindo seu acesso."}</h1><p className="nx-muted" role="status">Aguarde um instante…</p><div className="nx-skeleton" /></div></Frame>;
  if (BROWSER_DEMO) {
    if (error || !me) return <Frame current={current}><div className="nx-access"><p className="nx-overline">Demonstração no navegador</p><h1>Não foi possível abrir os dados locais.</h1><p className="nx-muted">A demonstração precisa do armazenamento deste navegador para continuar. Os relatos não são enviados a uma equipe.</p><Failure error={error} /><button className="nx-button nx-secondary" onClick={() => setAttempt(a => a + 1)}>Tentar novamente</button><a className="nx-inline-link" href="/">Voltar à apresentação</a></div></Frame>;
    return <Frame current={current} me={me}>{children(me)}</Frame>;
  }
  if (error) return <Frame current={current}><div className="nx-access"><span className="nx-access-symbol" aria-hidden="true">↗</span><p className="nx-overline">Demonstração da Nexo</p><h1>{error instanceof ApiFailure && error.status === 401 ? "Entre para experimentar." : "Não foi possível verificar o acesso."}</h1><p className="nx-muted">A demonstração é restrita a pessoas autorizadas. Use sua conta para continuar com casos fictícios.</p>{error instanceof ApiFailure && error.status === 401 ? <a className="nx-button nx-primary" href={signInHref(returnTo)} target="_top">Entrar com ChatGPT <span aria-hidden="true">↗</span></a> : <><Failure error={error} returnTo={returnTo} /><button className="nx-button nx-secondary" onClick={() => setAttempt(a => a + 1)}>Verificar novamente</button></>}<a className="nx-inline-link" href="/">Conhecer a Nexo</a></div></Frame>;
  if (!me || !me.organization || !me.roles.some(role => roles.includes(role))) return <Frame current={current} me={me || undefined}><div className="nx-access"><p className="nx-overline">Acesso restrito</p><h1>Seu acesso ainda não está liberado.</h1><p className="nx-muted">Uma pessoa administradora precisa autorizar sua conta para esta área.</p>{me && <div className="nx-id-card"><span>Identificador da sua conta verificada</span><code>{me.user.id}</code><small>Compartilhe este identificador com quem administra a demonstração.</small></div>}<button className="nx-button nx-secondary" onClick={() => setAttempt(a => a + 1)}>Verificar acesso novamente</button><a className="nx-inline-link" href="/">Voltar à apresentação</a></div></Frame>;
  return <Frame current={current} me={me}>{children(me)}</Frame>;
}

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="nx-page-heading"><div><p className="nx-overline">{eyebrow}</p><h1>{title}</h1><p className="nx-muted">{description}</p></div>{children && <div className="nx-heading-actions">{children}</div>}</div>;
}
