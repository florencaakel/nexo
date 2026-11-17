"use client";

import { BROWSER_DEMO } from "@/lib/runtime-mode";

import { useEffect, useState } from "react";
import type { CriteriaDTO, MembershipDTO, MeDTO, Role, SettingsDTO } from "@/lib/contracts";
import { dateLabel, readApi, useApiAction } from "@/components/nexo/api";
import { Failure, Gate, Notice, PageHeading } from "@/components/nexo/shell";

const roleNames: Record<Role, string> = { tester: "Testador", reviewer: "Revisor", admin: "Administrador" };

export default function SettingsPage() { return <Gate roles={["admin"]} current="configuracoes">{me => <Settings me={me} />}</Gate>; }

function Settings({ me }: { me: MeDTO }) {
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [criteria, setCriteria] = useState<CriteriaDTO | null>(null);
  const [members, setMembers] = useState<MembershipDTO[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState(false);
  const [retention, setRetention] = useState("30");
  const [criteriaText, setCriteriaText] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [roles, setRoles] = useState<Role[]>(["tester"]);
  const [active, setActive] = useState(true);
  const [editingMember, setEditingMember] = useState(false);
  const { mutate, pending } = useApiAction();

  function setSettingsForm(value: SettingsDTO) {
    setSettings(value); setIntake(value.intakeEnabled); setRetention(String(value.retentionDays));
  }

  async function load(signal?: AbortSignal) {
    setLoading(true); setError(null);
    try {
      const [nextSettings, nextCriteria, nextMembers] = await Promise.all([
        readApi<SettingsDTO>("/api/admin/settings", signal), readApi<CriteriaDTO>("/api/admin/criteria", signal),
        BROWSER_DEMO ? Promise.resolve({ members: [] as MembershipDTO[] }) : readApi<{ members: MembershipDTO[] }>("/api/admin/memberships", signal),
      ]);
      setSettingsForm(nextSettings); setCriteria(nextCriteria); setCriteriaText(nextCriteria.text); setMembers(nextMembers.members);
    } catch (reason) { if (!signal?.aborted) setError(reason); }
    finally { if (!signal?.aborted) setLoading(false); }
  }

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);

  async function saveSettings() {
    if (!settings) return;
    setError(null); setSaved("");
    try {
      setSettingsForm(await mutate<SettingsDTO>("/api/admin/settings", "PATCH", { expectedVersion: settings.version, intakeEnabled: intake, retentionDays: Number(retention) }));
      setSaved("Controles da demonstração salvos.");
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
    if (BROWSER_DEMO) return;
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

  const retentionValid = /^\d+$/.test(retention) && Number(retention) >= 1 && Number(retention) <= 365;

  return <>
    <PageHeading eyebrow={BROWSER_DEMO ? "Configurações locais" : "Administração"} title="Controle a demonstração." description={BROWSER_DEMO ? "Ajuste a demonstração neste navegador. Você faz todos os papéis, sem login, usuários separados ou sincronização." : "Gerencie a coleta, os critérios e os acessos. A demonstração organiza relatos fictícios por regras, com revisão humana."}>
      <button className="nx-button nx-secondary" disabled={pending || loading} onClick={() => void load()}>Atualizar configurações</button>
    </PageHeading>
    <Failure error={error} returnTo="/painel/configuracoes" />
    {saved && <Notice kind="success">{saved}</Notice>}
    {loading && !settings ? <p role="status">Carregando configurações…</p> : settings && <div className="nx-settings-grid">
      <aside><nav className="nx-settings-nav" aria-label="Seções das configurações"><a href="#controles">Coleta e organização</a><a href="#criterios">Critérios</a>{!BROWSER_DEMO && <a href="#acessos">Acessos</a>}</nav></aside>
      <div>
        <section id="controles" className="nx-paper nx-settings-section">
          <h2>Coleta e organização por regras</h2>
          <p>Perguntas predefinidas e regras simples organizam trechos do relato. Esta versão não se conecta a serviços externos de IA e não gera cobrança por IA.</p>
          <Notice>{BROWSER_DEMO ? "Estas configurações valem só para os dados deste navegador. Você simula tanto o relato quanto a revisão; as regras não avaliam o caso juridicamente." : "As regras não compreendem o contexto completo nem classificam o caso juridicamente. A leitura das fontes e a decisão continuam com a equipe."}</Notice>
          <form onSubmit={event => { event.preventDefault(); void saveSettings(); }}>
            <label className="nx-check"><input type="checkbox" checked={intake} disabled={pending} onChange={event => setIntake(event.target.checked)} /><span>Manter a demonstração aberta para relatos fictícios</span></label>
            <p className="nx-small">{BROWSER_DEMO ? "A pausa afeta apenas esta demonstração neste navegador: suspende novas entrevistas, perguntas e fichas. Os casos locais continuam disponíveis para leitura e revisão simulada." : "Ao pausar, novas entrevistas, perguntas e organização de fichas ficam suspensas. Os casos salvos continuam disponíveis para leitura e revisão humana."}</p>
            <label className="nx-field nx-form-divider"><span>Retenção dos casos (dias)</span><input type="number" min="1" max="365" step="1" required value={retention} disabled={pending} onChange={event => setRetention(event.target.value)} /><small>{BROWSER_DEMO ? "Prazo de referência da simulação, sem limpeza automática. Você pode excluir um caso no painel; limpar os dados do navegador apaga os registros mesmo antes desse prazo." : "Prazo definido para os registros. A exclusão é manual, no detalhe do caso; ainda não há limpeza automática."}</small></label>
            <p className="nx-small">Coleta de dados reais: desabilitada. Este ambiente não permite ativá-la.</p>
            <div className="nx-actions"><button className="nx-button nx-primary" disabled={pending || !retentionValid}>{pending ? "Salvando…" : "Salvar controles"}</button></div>
          </form>
        </section>
        <section id="criterios" className="nx-paper nx-settings-section"><h2>Critérios de triagem</h2><p>As alterações criam uma nova versão para novas entrevistas. Os critérios ficam disponíveis para a avaliação humana; as regras não interpretam esse texto para decidir atendimento.</p>{criteria && <form onSubmit={event => { event.preventDefault(); void saveCriteria(); }}><label className="nx-field"><span>{BROWSER_DEMO ? "Orientações da organização fictícia" : "Orientações da organização"}</span><textarea rows={9} required maxLength={4000} value={criteriaText} disabled={pending} onChange={event => setCriteriaText(event.target.value)} /><small>Versão atual: {criteria.version}, registrada em {dateLabel(criteria.createdAt)}.</small></label><button className="nx-button nx-primary" disabled={pending || !criteriaText.trim() || criteriaText === criteria.text}>Salvar nova versão dos critérios</button></form>}</section>{!BROWSER_DEMO && <section id="acessos" className="nx-paper nx-settings-section"><h2>Pessoas autorizadas</h2><p>Use o identificador verificado que a pessoa encontra depois de entrar na demonstração. Um nome ou e-mail não concede acesso.</p><ul className="nx-member-list">{members.map(member => <li key={member.userId}><div><strong>{member.displayName}{member.userId === me.user.id ? " (você)" : ""}</strong><code>{member.userId}</code><p className="nx-small">{member.roles.map(role => roleNames[role]).join(", ")} · {member.active ? "Acesso ativo" : "Acesso suspenso"}</p></div><button className="nx-button nx-secondary" disabled={pending} onClick={() => editMember(member)}>Editar acesso</button></li>)}</ul><form id="member-editor" className="nx-form-divider" onSubmit={event => { event.preventDefault(); void saveMember(); }}><h3>{editingMember ? "Editar acesso selecionado" : "Autorizar uma pessoa"}</h3><div className="nx-two-fields"><label className="nx-field"><span>Identificador verificado da conta</span><input required maxLength={200} value={memberId} disabled={pending || editingMember} onChange={event => setMemberId(event.target.value)} autoComplete="off" /></label><label className="nx-field"><span>Nome para exibição</span><input required maxLength={100} value={memberName} disabled={pending} onChange={event => setMemberName(event.target.value)} autoComplete="off" /></label></div><fieldset className="nx-roles" disabled={pending}><legend>Papéis autorizados</legend>{(Object.keys(roleNames) as Role[]).map(role => <label className="nx-check" key={role}><input type="checkbox" checked={roles.includes(role)} onChange={event => setRoles(value => event.target.checked ? [...value, role] : value.filter(item => item !== role))} /><span>{roleNames[role]}</span></label>)}</fieldset><label className="nx-check"><input type="checkbox" checked={active} disabled={pending} onChange={event => setActive(event.target.checked)} /><span>Manter acesso ativo</span></label><div className="nx-actions"><button className="nx-button nx-primary" disabled={pending || !memberId.trim() || !memberName.trim() || roles.length === 0}>Salvar acesso</button>{editingMember && <button type="button" className="nx-button nx-quiet" disabled={pending} onClick={resetMember}>Cancelar edição</button>}</div></form></section>}</div></div>}</>;
}
