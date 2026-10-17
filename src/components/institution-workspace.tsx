'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { AppShell } from '@/components/app-shell';
import { createCaseAlias, findDirectIdentifiers, identifierMessage } from '@/lib/privacy';
import { readPlans, type StoredPlan } from '@/lib/plan-store';
import { supabaseInstitutionClient } from '@/lib/supabase-browser';

type Role = 'admin' | 'coordinator' | 'teacher' | 'family' | 'guidance';
type Org = { id: string; name: string; owner_id: string; role: Role; display_name: string };
type Member = { organization_id: string; user_id: string; display_name: string; role: Role; joined_at: string };
type TeamPlanData = { caseAlias: string; status: string; reviewDate: string; strategies: StoredPlan['strategies']; indicator?: string };
type TeamPlan = { id: string; organization_id: string; source_plan_id: string; title: string; objective: string; plan_data: TeamPlanData; shared_with_family_id: string | null; team_status: 'active' | 'review' | 'completed'; created_by: string; updated_at: string };
type TeamUpdate = { id: string; organization_id: string; plan_id: string; author_id: string; update_type: 'perspective' | 'action' | 'observation' | 'review'; body: string; created_at: string };
type Invite = { id: string; role: Role; created_at: string; expires_at: string; revoked_at: string | null; max_uses: number; use_count: number };

const roleLabels: Record<Role, string> = { admin: 'Administración', coordinator: 'Coordinación', teacher: 'Docencia', family: 'Familia', guidance: 'Orientación' };
const updateLabels: Record<TeamUpdate['update_type'], string> = { perspective: 'Perspectiva', action: 'Acuerdo', observation: 'Observación', review: 'Revisión' };
const rolesForInvitation: Role[] = ['coordinator', 'teacher', 'family', 'guidance'];

export function InstitutionWorkspace() {
  const client = useMemo(() => supabaseInstitutionClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [magicMessage, setMagicMessage] = useState('');
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [teamPlans, setTeamPlans] = useState<TeamPlan[]>([]);
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [localPlans, setLocalPlans] = useState<StoredPlan[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('teacher');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [familyTargetId, setFamilyTargetId] = useState('');
  const [caseAlias, setCaseAlias] = useState('');
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftTypes, setDraftTypes] = useState<Record<string, TeamUpdate['update_type']>>({});

  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? null;
  const activeMember = members.find((member) => member.organization_id === activeOrgId && member.user_id === session?.user.id) ?? null;
  const approvedPlans = localPlans.filter((plan) => plan.status === 'approved' || plan.status === 'completed');
  const familyMembers = members.filter((member) => member.role === 'family');

  useEffect(() => { setLocalPlans(readPlans()); }, []);

  useEffect(() => {
    if (!client) { setAuthReady(true); return; }
    let mounted = true;
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    void (async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: callbackError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (callbackError) throw callbackError;
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (mounted) { setSession(data.session); setAuthReady(true); }
    })().catch((cause: unknown) => { if (mounted) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir el espacio de equipo.'); setAuthReady(true); } });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [client]);

  const loadOrganizations = useCallback(async () => {
    if (!client || !session) return;
    const { data: memberRows, error: memberError } = await client.from('sendia_org_members').select('organization_id,user_id,display_name,role,joined_at').eq('user_id', session.user.id);
    if (memberError) throw memberError;
    const memberships = (memberRows ?? []) as Member[];
    if (!memberships.length) { setOrganizations([]); setMembers([]); setActiveOrgId(''); return; }
    const ids = memberships.map((item) => item.organization_id);
    const { data: orgRows, error: orgError } = await client.from('sendia_organizations').select('id,name,owner_id').in('id', ids);
    if (orgError) throw orgError;
    const orgs = ((orgRows ?? []) as { id: string; name: string; owner_id: string }[]).flatMap((org) => {
      const membership = memberships.find((item) => item.organization_id === org.id);
      return membership ? [{ ...org, role: membership.role, display_name: membership.display_name }] : [];
    });
    setOrganizations(orgs);
    setMembers(memberships);
    setActiveOrgId((current) => orgs.some((org) => org.id === current) ? current : orgs[0]?.id ?? '');
  }, [client, session]);

  useEffect(() => {
    if (!session) { setOrganizations([]); setMembers([]); setTeamPlans([]); setUpdates([]); return; }
    void loadOrganizations().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus equipos.'));
  }, [session, loadOrganizations]);

  const loadWorkspace = useCallback(async () => {
    if (!client || !activeOrgId) return;
    const { data: memberRows, error: memberError } = await client.from('sendia_org_members').select('organization_id,user_id,display_name,role,joined_at').eq('organization_id', activeOrgId).order('joined_at');
    if (memberError) throw memberError;
    const roster = (memberRows ?? []) as Member[];
    const { data: planRows, error: planError } = await client.from('sendia_team_plans').select('id,organization_id,source_plan_id,title,objective,plan_data,shared_with_family_id,team_status,created_by,updated_at').eq('organization_id', activeOrgId).order('updated_at', { ascending: false });
    if (planError) throw planError;
    const plans = (planRows ?? []) as TeamPlan[];
    const planIds = plans.map((plan) => plan.id);
    let updateRows: TeamUpdate[] = [];
    if (planIds.length) {
      const { data, error: updateError } = await client.from('sendia_team_plan_updates').select('id,organization_id,plan_id,author_id,update_type,body,created_at').in('plan_id', planIds).order('created_at', { ascending: false });
      if (updateError) throw updateError;
      updateRows = (data ?? []) as TeamUpdate[];
    }
    setMembers(roster); setTeamPlans(plans); setUpdates(updateRows);
    if (roster.find((member) => member.user_id === session?.user.id)?.role === 'admin') {
      const { data, error: inviteError } = await client.from('sendia_org_invites').select('id,role,created_at,expires_at,revoked_at,max_uses,use_count').eq('organization_id', activeOrgId).order('created_at', { ascending: false });
      if (inviteError) throw inviteError;
      setInvites((data ?? []) as Invite[]);
    } else setInvites([]);
  }, [client, activeOrgId, session?.user.id]);

  useEffect(() => {
    if (!activeOrgId) { setTeamPlans([]); setUpdates([]); return; }
    void loadWorkspace().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudo cargar el espacio institucional.'));
    if (!client) return;
    const channel = client.channel(`sendia-org-${activeOrgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sendia_team_plans', filter: `organization_id=eq.${activeOrgId}` }, () => { void loadWorkspace().catch(() => undefined); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sendia_team_plan_updates', filter: `organization_id=eq.${activeOrgId}` }, () => { void loadWorkspace().catch(() => undefined); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sendia_org_members', filter: `organization_id=eq.${activeOrgId}` }, () => { void loadWorkspace().catch(() => undefined); })
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [client, activeOrgId, loadWorkspace]);

  const requestLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMagicMessage('');
    if (!client) { setError('Supabase no está configurado.'); return; }
    setBusy(true);
    try {
      const { error: authError } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/colaboracion/equipo` } });
      if (authError) throw authError;
      setMagicMessage('Enlace enviado. Ábrelo en este navegador para entrar al espacio de equipo.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo enviar el enlace.'); }
    finally { setBusy(false); }
  };

  const createOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!client) return; setError(''); setBusy(true);
    try {
      const { data, error: rpcError } = await client.rpc('sendia_create_organization', { p_name: orgName, p_display_name: displayName });
      if (rpcError) throw rpcError;
      await loadOrganizations(); setActiveOrgId(data as string); setNotice('Espacio creado. Ahora genera invitaciones con el rol que corresponda.'); setOrgName('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear el espacio. Aplica la migración de Supabase.'); }
    finally { setBusy(false); }
  };

  const joinOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!client) return; setError(''); setBusy(true);
    try {
      const { error: rpcError } = await client.rpc('sendia_join_organization', { p_code: joinCode.trim(), p_display_name: displayName });
      if (rpcError) throw rpcError;
      await loadOrganizations(); setNotice('Ya perteneces al equipo. El rol se asignó desde la invitación.'); setJoinCode('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo usar la invitación.'); }
    finally { setBusy(false); }
  };

  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!client || !activeOrgId) return; setError(''); setBusy(true);
    try {
      const { data, error: rpcError } = await client.rpc('sendia_create_org_invite', { p_org_id: activeOrgId, p_role: inviteRole });
      if (rpcError) throw rpcError;
      const result = Array.isArray(data) ? data[0] as { invite_code: string; invite_expires_at: string } : data as { invite_code: string; invite_expires_at: string };
      setNewInviteCode(result.invite_code); setNotice(`Invitación de ${roleLabels[inviteRole]} creada. Caduca el ${result.invite_expires_at.slice(0, 10)}.`);
      await loadWorkspace();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la invitación.'); }
    finally { setBusy(false); }
  };

  const revokeInvite = async (invite: Invite) => {
    if (!client || !window.confirm('¿Revocar este código? Las personas que aún no lo usaron ya no podrán entrar.')) return;
    const { error: revokeError } = await client.from('sendia_org_invites').update({ revoked_at: new Date().toISOString() }).eq('id', invite.id);
    if (revokeError) setError(revokeError.message); else { setNotice('Invitación revocada.'); await loadWorkspace(); }
  };

  const removeMember = async (member: Member) => {
    if (!client || member.user_id === session?.user.id || !window.confirm(`¿Quitar a ${member.display_name} del espacio?`)) return;
    const { error: removeError } = await client.rpc('sendia_remove_org_member', { p_org_id: activeOrgId, p_user_id: member.user_id });
    if (removeError) setError(removeError.message); else { setNotice('Acceso retirado.'); await loadWorkspace(); }
  };

  const sharePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!client || !activeOrgId || !activeMember || activeMember.role === 'family') return;
    const plan = approvedPlans.find((item) => item.id === selectedPlanId);
    if (!plan || !caseAlias.trim() || !shareConfirmed) return;
    const sharedData: TeamPlanData = { caseAlias: caseAlias.trim(), status: plan.status, reviewDate: plan.reviewDate, strategies: plan.strategies, ...(plan.indicator ? { indicator: plan.indicator } : {}) };
    const identifiable = findDirectIdentifiers(JSON.stringify({ title: plan.title, objective: plan.objective, strategies: plan.strategies }));
    if (identifiable.length) { setError(identifierMessage(identifiable.map(({ kind }) => kind))); return; }
    setBusy(true);
    try {
      const { error: shareError } = await client.from('sendia_team_plans').upsert({ organization_id: activeOrgId, source_plan_id: plan.id, title: plan.title, objective: plan.objective, plan_data: sharedData, shared_with_family_id: familyTargetId || null, created_by: session?.user.id, team_status: 'active' }, { onConflict: 'organization_id,source_plan_id' });
      if (shareError) throw shareError;
      setNotice('Plan añadido al espacio del equipo.'); setSelectedPlanId(''); setCaseAlias(''); setFamilyTargetId(''); setShareConfirmed(false); await loadWorkspace();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo compartir el plan.'); }
    finally { setBusy(false); }
  };

  const postUpdate = async (plan: TeamPlan) => {
    if (!client || !activeOrgId) return;
    const body = (drafts[plan.id] ?? '').trim();
    if (body.length < 2) return;
    const detected = findDirectIdentifiers(body);
    if (detected.length) { setError(identifierMessage(detected.map(({ kind }) => kind))); return; }
    setBusy(true); setError('');
    try {
      const { error: insertError } = await client.from('sendia_team_plan_updates').insert({ organization_id: activeOrgId, plan_id: plan.id, author_id: session?.user.id, update_type: drafts[`${plan.id}-type`] ?? (activeMember?.role === 'family' ? 'perspective' : 'observation'), body });
      if (insertError) throw insertError;
      setDrafts((current) => ({ ...current, [plan.id]: '' })); setNotice('Aporte añadido al seguimiento compartido.'); await loadWorkspace();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo añadir el aporte.'); }
    finally { setBusy(false); }
  };

  const updateStatus = async (plan: TeamPlan, status: TeamPlan['team_status']) => {
    if (!client || !activeOrgId) return;
    const { error: statusError } = await client.from('sendia_team_plans').update({ team_status: status }).eq('id', plan.id).eq('organization_id', activeOrgId);
    if (statusError) setError(statusError.message); else { setNotice('Seguimiento actualizado.'); await loadWorkspace(); }
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(newInviteCode); setNotice('Código copiado. Envíalo únicamente a la persona adulta y con el rol previstos.'); }
    catch { setNotice('No se pudo copiar automáticamente. Selecciona el código para copiarlo.'); }
  };

  const signOut = async () => { if (!client) return; await client.auth.signOut(); setSession(null); setOrganizations([]); setActiveOrgId(''); };

  return <AppShell><div className="content institution-page">
    <header className="institution-heading"><div><span className="eyebrow">SENDIA · ESPACIO DE CENTRO</span><h1 className="page-title">Un equipo.<br/><em>Un plan compartido.</em></h1><p>Reúne aula, orientación y familia alrededor de un objetivo, con permisos definidos y un seguimiento común.</p></div><div className="institution-heading-mark" aria-hidden="true">◎</div></header>
    <aside className="institution-privacy"><strong>Trabaja con información minimizada.</strong> Usa un alias para el caso. No incluyas nombres reales, informes ni detalles que permitan reconocer al estudiante. Los planes compartidos salen del dispositivo y se guardan en Supabase.</aside>
    {!client ? <section className="institution-panel"><h2>Falta conectar Supabase</h2><p>Configura la misma URL y clave pública que usa la lluvia de ideas y vuelve a cargar SendIA.</p></section> : !authReady ? <section className="institution-panel"><p role="status">Comprobando acceso…</p></section> : !session ? <section className="institution-auth-grid"><article className="institution-panel"><span className="eyebrow">ENTRADA DEL EQUIPO</span><h2>Accede con tu correo</h2><p>El enlace verifica que puedes abrir ese correo. Después podrás crear una comunidad o entrar con una invitación.</p><form onSubmit={requestLogin} className="institution-form"><label>Correo electrónico<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu correo de trabajo"/></label><button className="button button-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviarme un enlace →'}</button></form>{magicMessage && <p className="institution-message" role="status">{magicMessage}</p>}</article><aside className="institution-panel institution-auth-note"><b>Acceso de adultos</b><p>El inicio con correo es independiente de la sesión anónima de la lluvia de ideas; ambos módulos siguen funcionando por separado.</p><p>El centro debe compartir el código adecuado para asignar el rol correcto.</p></aside></section> : !organizations.length ? <section className="institution-onboarding"><article className="institution-panel"><span className="eyebrow">CREAR UN ESPACIO</span><h2>Abre el espacio de tu centro</h2><form className="institution-form" onSubmit={createOrganization}><label>Nombre del centro o equipo<input required minLength={2} maxLength={120} value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="Ej.: Equipo de acompañamiento"/></label><label>Tu nombre visible en el equipo<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nombre de persona adulta"/></label><button className="button button-primary" disabled={busy}>Crear espacio de equipo →</button></form><small>Quien lo crea recibe el rol de administración.</small></article><article className="institution-panel"><span className="eyebrow">ENTRAR A UN EQUIPO</span><h2>¿Te invitaron?</h2><form className="institution-form" onSubmit={joinOrganization}><label>Tu nombre visible<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nombre de persona adulta"/></label><label>Código de invitación<input required minLength={12} maxLength={20} value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Código que te compartió el centro"/></label><button className="button button-secondary" disabled={busy}>Unirme con mi invitación →</button></form></article></section> : <>
      <section className="institution-toolbar"><div><span className="eyebrow">ESPACIO ACTIVO</span><h2>{activeOrg?.name ?? 'Equipo educativo'}</h2><span className="institution-role-pill">{activeMember ? roleLabels[activeMember.role] : 'Miembro'}</span></div><div className="institution-toolbar-actions">{organizations.length > 1 && <label>Cambiar de espacio<select value={activeOrgId} onChange={(event) => setActiveOrgId(event.target.value)}>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>}<button className="button button-secondary button-small" onClick={() => void signOut()}>Cerrar sesión</button></div></section>
      {activeMember?.role === 'admin' && <section className="institution-panel institution-admin"><div><span className="eyebrow">GESTIÓN DEL EQUIPO</span><h2>Invita a cada persona con su rol</h2><p>El código asigna el rol elegido. Caduca en 14 días y admite hasta 20 incorporaciones; puedes revocarlo desde aquí.</p></div><form className="institution-invite-form" onSubmit={createInvite}><label>Rol de la invitación<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Role)}>{rolesForInvitation.map((role) => <option value={role} key={role}>{roleLabels[role]}</option>)}</select></label><button className="button button-primary" disabled={busy}>Crear código</button></form>{newInviteCode && <div className="institution-invite-code"><span><small>CÓDIGO PARA {roleLabels[inviteRole].toUpperCase()}</small><code>{newInviteCode}</code></span><button className="button button-secondary button-small" onClick={() => void copyInvite()}>Copiar código</button></div>}{invites.filter((invite) => !invite.revoked_at).length > 0 && <div className="institution-invites-list">{invites.filter((invite) => !invite.revoked_at).map((invite) => <div key={invite.id}><span>{roleLabels[invite.role]} · {invite.use_count}/{invite.max_uses} usos · vence {invite.expires_at.slice(0, 10)}</span><button onClick={() => void revokeInvite(invite)}>Revocar</button></div>)}</div>}</section>}
      <section className="institution-panel institution-roster"><div><span className="eyebrow">QUIÉNES PARTICIPAN</span><h2>Un equipo con responsabilidades claras</h2></div><div className="institution-member-list">{members.map((member) => <div key={member.user_id}><span className="institution-member-avatar">{member.display_name.slice(0, 1).toUpperCase()}</span><strong>{member.display_name}</strong><span>{roleLabels[member.role]}</span>{activeMember?.role === 'admin' && member.user_id !== session.user.id && <button onClick={() => void removeMember(member)}>Quitar acceso</button>}</div>)}</div></section>
      <section className="institution-shared-work"><div className="institution-section-title"><div><span className="eyebrow">SEGUIMIENTO EN COMÚN</span><h2>Planes que el equipo decidió compartir</h2><p>Los planes personales no aparecen aquí hasta que una persona del equipo los comparte.</p></div><span className="institution-count">{teamPlans.length} {teamPlans.length === 1 ? 'plan' : 'planes'}</span></div>
        {activeMember && activeMember.role !== 'family' && <form className="institution-share-form" onSubmit={sharePlan}><div><span className="eyebrow">AÑADIR UN PLAN APROBADO</span><h3>Trae un plan al espacio de equipo</h3><p>Elige un plan de este navegador. La familia solo lo verá si la seleccionas de forma explícita.</p></div><div className="institution-share-fields"><label>Plan<select required value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}><option value="">Seleccionar plan aprobado</option>{approvedPlans.map((plan) => <option value={plan.id} key={plan.id}>{plan.title}</option>)}</select></label><label>Alias del caso<input required value={caseAlias} onChange={(event) => setCaseAlias(event.target.value)} placeholder="Ej.: caso-A31F2B"/><button type="button" className="institution-inline-link" onClick={() => setCaseAlias(createCaseAlias())}>Crear alias aleatorio</button></label><label>Compartir con familia<select value={familyTargetId} onChange={(event) => setFamilyTargetId(event.target.value)}><option value="">Solo equipo profesional</option>{familyMembers.map((member) => <option value={member.user_id} key={member.user_id}>{member.display_name}</option>)}</select></label></div><label className="institution-check"><input type="checkbox" checked={shareConfirmed} onChange={(event) => setShareConfirmed(event.target.checked)}/><span>He revisado el plan, contiene un alias y no incluye datos reales que identifiquen al estudiante.</span></label><button className="button button-primary" disabled={busy || !selectedPlanId || !caseAlias.trim() || !shareConfirmed}>Compartir plan con el equipo →</button>{!approvedPlans.length && <p className="institution-empty-hint">No tienes planes aprobados en este navegador. Primero crea y guarda uno en <Link href="/comprender/aula">Comprender</Link>.</p>}</form>}
        {!teamPlans.length ? <div className="institution-empty"><span aria-hidden="true">◎</span><h3>Aquí crecerá el seguimiento del equipo</h3><p>Comparte un plan aprobado para acordar quién hace qué, escuchar perspectivas y revisar qué ocurrió.</p></div> : <div className="institution-plan-list">{teamPlans.map((plan) => {
          const visibleUpdates = updates.filter((update) => update.plan_id === plan.id);
          return <article className="institution-plan-card" key={plan.id}><header className="institution-plan-card-head"><div><span className="institution-alias">{plan.plan_data?.caseAlias || 'caso sin alias'}</span><h3>{plan.title}</h3><p>{plan.objective}</p></div><label className={`institution-status status-${plan.team_status}`}>Seguimiento<select value={plan.team_status} disabled={activeMember?.role === 'family'} onChange={(event) => void updateStatus(plan, event.target.value as TeamPlan['team_status'])}><option value="active">En marcha</option><option value="review">Revisar en equipo</option><option value="completed">Cerrado</option></select></label></header><div className="institution-plan-meta"><span>Revisión prevista: {plan.plan_data?.reviewDate || 'por acordar'}</span><span>{plan.shared_with_family_id ? `Compartido con ${members.find((member) => member.user_id === plan.shared_with_family_id)?.display_name ?? 'familia'}` : 'Solo equipo profesional'}</span></div>{plan.plan_data?.strategies?.length > 0 && <details className="institution-strategies"><summary>Ver estrategias y responsables</summary><ul>{plan.plan_data.strategies.map((strategy) => <li key={strategy.id}><strong>{strategy.title}</strong><span>{strategy.detail}</span><small>{strategy.responsible} · {strategy.cadence}</small></li>)}</ul></details>}<section className="institution-updates"><div className="institution-updates-heading"><h4>Lo que vamos aprendiendo</h4><span>{visibleUpdates.length} aportes</span></div>{visibleUpdates.length > 0 && <ol>{visibleUpdates.map((update) => <li key={update.id}><div><strong>{members.find((member) => member.user_id === update.author_id)?.display_name ?? roleLabels[activeMember?.role ?? 'teacher']}</strong><span>{updateLabels[update.update_type]} · {update.created_at.slice(0, 16).replace('T', ' ')}</span></div><p>{update.body}</p></li>)}</ol>}<div className="institution-update-compose"><label htmlFor={`update-${plan.id}`}>{activeMember?.role === 'family' ? '¿Qué perspectiva quieres aportar?' : 'Añadir observación o acuerdo'}</label><textarea id={`update-${plan.id}`} maxLength={1600} value={drafts[plan.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [plan.id]: event.target.value }))} placeholder="Un dato breve, sin nombres ni información identificativa…"/><div><select aria-label="Tipo de aporte" value={draftTypes[plan.id] ?? (activeMember?.role === 'family' ? 'perspective' : 'observation')} onChange={(event) => setDraftTypes((current) => ({ ...current, [plan.id]: event.target.value as TeamUpdate['update_type'] }))}>{(activeMember?.role === 'family' ? ['perspective', 'review'] as const : ['observation', 'action', 'review'] as const).map((type) => <option value={type} key={type}>{updateLabels[type]}</option>)}</select><button className="button button-secondary button-small" disabled={busy || !(drafts[plan.id] ?? '').trim()} onClick={() => void postUpdate(plan)}>Añadir al seguimiento</button></div></div></section></article>;
        })}</div>}
      </section>
      <section className="institution-more-tools"><div><span className="eyebrow">OTRAS FORMAS DE TRABAJAR JUNTOS</span><h2>El equipo también puede pensar en voz alta.</h2><p>La lluvia de ideas sigue siendo un espacio independiente con códigos de invitación propios.</p></div><Link href="/colaboracion/ideas" className="button button-secondary">Abrir lluvia de ideas →</Link><Link href="/colaboracion" className="institution-inline-link">Preparar un acuerdo local</Link></section>
    </>}
    {error && <p className="institution-feedback error" role="alert">{error}</p>}{notice && <p className="institution-feedback" role="status">{notice}</p>}
    <footer className="institution-footnote">El correo verificado identifica una cuenta, no acredita por sí solo el cargo ni la autorización institucional. No compartas planes con información identificable de menores. Las invitaciones son códigos portadores: compártelos solo con la persona y el rol previstos.</footer>
  </div></AppShell>;
}
