"use client";

import { useEffect, useState } from "react";
import type { CriteriaDTO, MembershipDTO, MeDTO, Role, SettingsDTO, UsageDTO } from "@/lib/contracts";
import { dateLabel, moneyUsd, readApi, useApiAction } from "@/components/nexo/api";
import { Failure, Gate, Notice, PageHeading } from "@/components/nexo/shell";

const roleNames: Record<Role, string> = { tester: "Testador", reviewer: "Revisor", admin: "Administrador" };

export default function SettingsPage() { return <Gate roles={["admin"]} current="configuracoes">{me => <Settings me={me} />}</Gate>; }

function Settings({ me }: { me: MeDTO }) {
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [criteria, setCriteria] = useState<CriteriaDTO | null>(null);
  const [members, setMembers] = useState<MembershipDTO[]>([]);
  const [usage, setUsage] = useState<UsageDTO | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState(false);
  const [ai, setAi] = useState(false);
  const [budget, setBudget] = useState("0");
  const [retention, setRetention] = useState("30");
  const [criteriaText, setCriteriaText] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [roles, setRoles] = useState<Role[]>(["tester"]);
  const [active, setActive] = useState(true);
  const [editingMember, setEditingMember] = useState(false);
  const { mutate, pending } = useApiAction();

  function setSettingsForm(value: SettingsDTO) {
    setSettings(value); setIntake(value.intakeEnabled); setAi(value.aiEnabled); setBudget(String(value.budgetLimitMicrousd / 1_000_000)); setRetention(String(value.retentionDays));
  }

  async function load(signal?: AbortSignal) {
    setLoading(true); setError(null);
    try {
      const [nextSettings, nextCriteria, nextMembers, nextUsage] = await Promise.all([
        readApi<SettingsDTO>("/api/admin/settings", signal), readApi<CriteriaDTO>("/api/admin/criteria", signal),
        readApi<{ members: MembershipDTO[] }>("/api/admin/memberships", signal), readApi<UsageDTO>("/api/admin/usage", signal),
      ]);
      setSettingsForm(nextSettings); setCriteria(nextCriteria); setCriteriaText(nextCriteria.text); setMembers(nextMembers.members); setUsage(nextUsage);
    } catch (reason) { if (!signal?.aborted) setError(reason); }
    finally { if (!signal?.aborted) setLoading(false); }
  }

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);

  async function saveSettings() {
    if (!settings) return;
    setError(null); setSaved("");
    try {
      setSettingsForm(await mutate<SettingsDTO>("/api/admin/settings", "PATCH", { expectedVersion: settings.version, intakeEnabled: intake, aiEnabled: ai, budgetLimitMicrousd: Math.round(Number(budget) * 1_000_000), retentionDays: Number(retention) }));
      setSaved("Controles da demonstração salvos.");
      setUsage(await readApi<UsageDTO>("/api/admin/usage"));
    } catch (reason) { setError(reason); }
  }

  async function saveCriteria() {
    if (!criteria) return;
    setError(null); setSaved("");
    try {
      const next = await mutate<CriteriaDTO>("/api/admin/criteria", "POST", { expectedVersion: criteria.version, text: criteriaText });
      setCriteria(next); setCriteriaText(next.text); setSaved(`Critérios v${next.version} salvos. Os casos existentes preservam a versão usada no início.`);
    } catch (reason) { setError(reason); }
  }

  async function saveMember() {
    setError(null); setSaved("");
    try {
      const next = await mutate<{ members: MembershipDTO[] }>("/api/admin/memberships", "PUT", { userId: memberId.trim(), displayName: memberName.trim(), roles, active });
      setMembers(next.members); setSaved("Acesso salvo. Os papéis são conferidos em cada operação no servidor."); resetMember();
    } catch (reason) { setError(reason); }
  }

  function resetMember() { setMemberId(""); setMemberName(""); setRoles(["tester"]); setActive(true); setEditingMember(false); }
  function editMember(member: MembershipDTO) {
    setMemberId(member.userId); setMemberName(member.displayName); setRoles(member.roles); setActive(member.active); setEditingMember(true);
    document.getElementById("member-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const budgetValid = budget.trim() !== "" && Number.isFinite(Number(budget)) && Number(budget) >= 0 && Number(budget) <= 100;
  const retentionValid = /^\d+$/.test(retention) && Number(retention) >= 1 && Number(retention) <= 365;

  return <><PageHeading eyebrow="Administração" title="Controle a demonstração." description="Gerencie acessos, critérios e consumo. A coleta permanece limitada a casos fictícios."><button className="nx-button nx-secondary" disabled={pending || loading} onClick={() => void load()}>Atualizar configurações</button></PageHeading><Failure error={error} returnTo="/painel/configuracoes" />{saved && <Notice kind="success">{saved}</Notice>}{loading && !settings ? <p role="status">Carregando configurações…</p> : settings && <div className="nx-settings-grid"><aside><nav className="nx-settings-nav" aria-label="Seções das configurações"><a href="#controles">Coleta e IA</a><a href="#consumo">Consumo</a><a href="#criterios">Critérios</a><a href="#acessos">Acessos</a></nav></aside><div><section id="controles" className="nx-paper nx-settings-section"><h2>Coleta e IA</h2><p>Pause novas entrevistas e chamadas sem perder acesso aos registros existentes.</p><form onSubmit={event => { event.preventDefault(); void saveSettings(); }}><label className="nx-check"><input type="checkbox" checked={intake} disabled={pending} onChange={event => setIntake(event.target.checked)} /><span>Permitir novos relatos fictícios</span></label><label className="nx-check"><input type="checkbox" checked={ai} disabled={pending || !settings.aiConfigured} onChange={event => setAi(event.target.checked)} /><span>Permitir chamadas de IA</span></label>{!settings.aiConfigured && <Notice>A IA aguarda configuração e autorização de uso. Habilitar este controle não substitui essas etapas.</Notice>}<div className="nx-two-fields"><label className="nx-field"><span>Teto de consumo acumulado (US$)</span><input type="number" min="0" max="100" step="0.01" required value={budget} disabled={pending} onChange={event => setBudget(event.target.value)} /><small>O servidor também aplica o teto autorizado. Zero bloqueia novas chamadas.</small></label><label className="nx-field"><span>Retenção dos casos (dias)</span><input type="number" min="1" max="365" step="1" required value={retention} disabled={pending} onChange={event => setRetention(event.target.value)} /><small>Período definido para os registros de demonstração.</small></label></div><p className="nx-small">Coleta de dados reais: desabilitada. Este ambiente não permite ativá-la.</p><div className="nx-actions"><button className="nx-button nx-primary" disabled={pending || !budgetValid || !retentionValid}>{pending ? "Salvando…" : "Salvar controles"}</button></div></form></section><section id="consumo" className="nx-paper nx-settings-section"><h2>Consumo da IA</h2><p>Valores em dólares americanos. Reservas protegem o limite durante as chamadas; uma falha pode manter custo incerto.</p>{usage ? <><dl className="nx-stats"><div><dt>Registrado</dt><dd>{moneyUsd(usage.spentMicrousd)}</dd></div><div><dt>Reservado</dt><dd>{moneyUsd(usage.reservedMicrousd)}</dd></div><div><dt>Teto acumulado</dt><dd>{moneyUsd(usage.limitMicrousd)}</dd></div></dl><dl className="nx-stats"><div><dt>Chamadas registradas</dt><dd>{usage.calls.toLocaleString("pt-BR")}</dd></div><div><dt>Tokens de entrada</dt><dd>{usage.inputTokens.toLocaleString("pt-BR")}</dd></div><div><dt>Tokens de saída</dt><dd>{usage.outputTokens.toLocaleString("pt-BR")}</dd></div></dl><p className="nx-small">O registro pode incluir estimativas conservadoras quando o provedor não confirma o uso. Consulte o faturamento do provedor para a cobrança final.</p></> : <Notice>Não foi possível carregar o consumo.</Notice>}</section><section id="criterios" className="nx-paper nx-settings-section"><h2>Critérios de triagem</h2><p>As alterações criam uma nova versão para novas entrevistas. Os critérios não decidem automaticamente o atendimento.</p>{criteria && <form onSubmit={event => { event.preventDefault(); void saveCriteria(); }}><label className="nx-field"><span>Orientações da organização</span><textarea rows={9} required maxLength={6000} value={criteriaText} disabled={pending} onChange={event => setCriteriaText(event.target.value)} /><small>Versão atual: {criteria.version}, registrada em {dateLabel(criteria.createdAt)}.</small></label><button className="nx-button nx-primary" disabled={pending || !criteriaText.trim() || criteriaText === criteria.text}>Salvar nova versão dos critérios</button></form>}</section><section id="acessos" className="nx-paper nx-settings-section"><h2>Pessoas autorizadas</h2><p>Use o identificador verificado que a pessoa encontra depois de entrar na demonstração. Um nome ou e-mail não concede acesso.</p><ul className="nx-member-list">{members.map(member => <li key={member.userId}><div><strong>{member.displayName}{member.userId === me.user.id ? " (você)" : ""}</strong><code>{member.userId}</code><p className="nx-small">{member.roles.map(role => roleNames[role]).join(", ")} · {member.active ? "Acesso ativo" : "Acesso suspenso"}</p></div><button className="nx-button nx-secondary" disabled={pending} onClick={() => editMember(member)}>Editar acesso</button></li>)}</ul><form id="member-editor" className="nx-form-divider" onSubmit={event => { event.preventDefault(); void saveMember(); }}><h3>{editingMember ? "Editar acesso selecionado" : "Autorizar uma pessoa"}</h3><div className="nx-two-fields"><label className="nx-field"><span>Identificador verificado da conta</span><input required maxLength={200} value={memberId} disabled={pending || editingMember} onChange={event => setMemberId(event.target.value)} autoComplete="off" /></label><label className="nx-field"><span>Nome para exibição</span><input required maxLength={100} value={memberName} disabled={pending} onChange={event => setMemberName(event.target.value)} autoComplete="off" /></label></div><fieldset className="nx-roles" disabled={pending}><legend>Papéis autorizados</legend>{(Object.keys(roleNames) as Role[]).map(role => <label className="nx-check" key={role}><input type="checkbox" checked={roles.includes(role)} onChange={event => setRoles(value => event.target.checked ? [...value, role] : value.filter(item => item !== role))} /><span>{roleNames[role]}</span></label>)}</fieldset><label className="nx-check"><input type="checkbox" checked={active} disabled={pending} onChange={event => setActive(event.target.checked)} /><span>Manter acesso ativo</span></label><div className="nx-actions"><button className="nx-button nx-primary" disabled={pending || !memberId.trim() || !memberName.trim() || roles.length === 0}>Salvar acesso</button>{editingMember && <button type="button" className="nx-button nx-quiet" disabled={pending} onClick={resetMember}>Cancelar edição</button>}</div></form></section></div></div>}</>;
}
