"use client";

import { BROWSER_DEMO } from "@/lib/runtime-mode";

import { useEffect, useState } from "react";
import { STATUS_LABELS, type CaseListDTO, type CaseListItem, type CaseStatus } from "@/lib/contracts";
import { dateLabel, readApi } from "@/components/nexo/api";
import { Failure, Gate, PageHeading, StatusBadge } from "@/components/nexo/shell";

export default function PainelPage() { return <Gate roles={["reviewer", "admin"]} current="painel">{() => <CaseList />}</Gate>; }

function CaseList() {
  const [items, setItems] = useState<CaseListItem[]>([]);
  const [status, setStatus] = useState<CaseStatus | "">("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setItems([]); setCursor(null);
    readApi<CaseListDTO>(`/api/cases${status ? `?status=${encodeURIComponent(status)}` : ""}`, controller.signal)
      .then(result => { setItems(result.cases); setCursor(result.nextCursor); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [status, refresh]);

  async function more() {
    if (!cursor) return;
    setLoading(true); setError(null);
    try {
      const query = new URLSearchParams({ cursor });
      if (status) query.set("status", status);
      const result = await readApi<CaseListDTO>(`/api/cases?${query}`);
      setItems(value => [...value, ...result.cases.filter(item => !value.some(old => old.id === item.id))]); setCursor(result.nextCursor);
    } catch (reason) { setError(reason); } finally { setLoading(false); }
  }

  return <><PageHeading eyebrow={BROWSER_DEMO ? "Revisão simulada" : "Revisão humana"} title="Cada relato merece atenção." description={BROWSER_DEMO ? "Assuma o papel de revisor: confira a ficha e registre uma decisão simulada. Estes casos fictícios ficam só neste navegador." : "Leia o original, confira a ficha organizada por regras e registre uma decisão. Todos os casos deste ambiente são fictícios."}><button className="nx-button nx-secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Atualizar casos</button></PageHeading><div className="nx-list-toolbar"><label className="nx-field"><span>Filtrar por estado</span><select value={status} onChange={event => setStatus(event.target.value as CaseStatus | "")}><option value="">Todos os estados</option>{Object.entries(STATUS_LABELS).filter(([value]) => value !== "RASCUNHO").map(([value, label]) => <option value={value} key={value}>{BROWSER_DEMO && value === "RECEBIDO" ? "Salvo neste navegador" : label}</option>)}</select></label><p className="nx-small">{items.length} {items.length === 1 ? "caso carregado" : "casos carregados"}</p></div><Failure error={error} returnTo="/painel" />{loading && items.length === 0 ? <p role="status">Buscando casos salvos…</p> : !items.length && !error ? <div className="nx-empty"><span className="nx-large-symbol" aria-hidden="true">×</span><h2>{status ? "Nenhum caso neste estado." : "Os relatos aparecerão aqui."}</h2><p>{status ? "Escolha outro filtro para consultar os registros." : BROWSER_DEMO ? "Salve um relato fictício para experimentar a revisão neste navegador. Nenhuma equipe externa recebe os casos." : "Depois que um testador autorizado enviar um relato fictício, ele ficará disponível para revisão."}</p></div> : <div className="nx-case-list">{items.map(item => <a className="nx-case-row" href={`/painel/casos/${encodeURIComponent(item.id)}`} key={item.id}><div><span className="nx-small">Caso fictício · {dateLabel(item.createdAt)}</span><h2>{item.title}</h2><p className="nx-case-id">{item.id}</p></div><div><StatusBadge status={item.status} /><span className="nx-open-case">Abrir para revisão <span aria-hidden="true">↗</span></span></div></a>)}</div>}{cursor && <div className="nx-actions"><button className="nx-button nx-secondary" onClick={more} disabled={loading}>{loading ? "Carregando…" : "Carregar mais casos"}</button></div>}</>;
}
