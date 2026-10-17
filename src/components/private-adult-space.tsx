'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppShell } from '@/components/app-shell';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { createCaseAlias, findDirectIdentifiers, identifierMessage } from '@/lib/privacy';

type Context = 'aula' | 'centro' | 'familia';
type PrivateRecord = { id: string; owner_id: string; context: Context; alias: string; title: string; next_step: string; review_on: string | null; created_at: string; updated_at: string };
const contexts: { id: Context; label: string }[] = [{ id: 'aula', label: 'Aula' }, { id: 'centro', label: 'Centro' }, { id: 'familia', label: 'Familia' }];

export function PrivateAdultSpace() {
  const client = useMemo(() => supabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [context, setContext] = useState<Context>('aula');
  const [alias, setAlias] = useState('');
  const [title, setTitle] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [reviewOn, setReviewOn] = useState('');
  const [records, setRecords] = useState<PrivateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRecords = useCallback(async (userId: string) => {
    if (!client) return;
    const { data, error: queryError } = await client.from('sendia_private_records').select('id,owner_id,context,alias,title,next_step,review_on,created_at,updated_at').eq('owner_id', userId).order('updated_at', { ascending: false });
    if (queryError) throw queryError;
    setRecords(Array.isArray(data) ? data as PrivateRecord[] : []);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    void (async () => {
      // El cliente compartido desactiva la detección automática del fragmento OAuth.
      // Completa aquí el enlace OTP y retira los tokens de la barra de direcciones.
      const callback = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = callback.get('access_token');
      const refreshToken = callback.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: callbackError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (callbackError) throw callbackError;
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
      const { data, error: authError } = await client.auth.getSession();
      if (authError) throw authError;
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadRecords(data.session.user.id);
    })().catch((cause: unknown) => { if (mounted) setError(cause instanceof Error ? cause.message : 'No se pudo abrir el espacio.'); });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void loadRecords(nextSession.user.id).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus registros.'));
      else setRecords([]);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [client, loadRecords]);

  const requestAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!client) { setError('El acceso privado no está configurado. Añade las variables públicas de Supabase y aplica la migración indicada en la guía.'); return; }
    if (!adultConfirmed) { setError('Confirma que eres una persona adulta para continuar.'); return; }
    setLoading(true);
    try {
      const { error: authError } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/espacio-seguro`, shouldCreateUser: true } });
      if (authError) throw authError;
      setMessage('Te enviamos un enlace de acceso al correo. Ábrelo en este mismo navegador para entrar.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo enviar el enlace. Revisa el correo e inténtalo otra vez.'); }
    finally { setLoading(false); }
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!client || !session) return;
    const detected = findDirectIdentifiers(`${alias}\n${title}\n${nextStep}`);
    if (detected.length) { setError(identifierMessage(detected.map(({ kind }) => kind))); return; }
    setLoading(true);
    try {
      const { error: insertError } = await client.from('sendia_private_records').insert({ owner_id: session.user.id, context, alias: alias.trim(), title: title.trim(), next_step: nextStep.trim(), review_on: reviewOn || null });
      if (insertError) throw insertError;
      setAlias(''); setTitle(''); setNextStep(''); setReviewOn('');
      await loadRecords(session.user.id);
      setMessage('Guardado en tu espacio privado. Solo tu cuenta puede consultar este registro.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar. Comprueba que la migración de Supabase esté aplicada.'); }
    finally { setLoading(false); }
  };

  const deleteRecord = async (record: PrivateRecord) => {
    if (!client || !session || !window.confirm(`¿Eliminar «${record.title}»? Esta acción no se puede deshacer.`)) return;
    setError(''); setMessage('');
    const { error: deleteError } = await client.from('sendia_private_records').delete().eq('id', record.id).eq('owner_id', session.user.id);
    if (deleteError) setError(deleteError.message);
    else { setRecords((current) => current.filter((item) => item.id !== record.id)); setMessage('Registro eliminado.'); }
  };

  const exportRecords = () => {
    const blob = new Blob([JSON.stringify(records.map(({ owner_id: _owner, ...record }) => record), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sendia-registros-privados.json'; anchor.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => { if (!client) return; await client.auth.signOut(); setSession(null); setRecords([]); setMessage('Has cerrado la sesión de este navegador.'); };

  return <AppShell><div className="content private-space-page">
    <span className="case-label">SENDIA · ESPACIO ADULTO</span>
    <header className="private-space-hero"><div><span className="case-label">ACCESO PERSONAL Y PRIVADO</span><h1>Un espacio de trabajo<br/><em>solo para ti.</em></h1><p>Accede con un enlace enviado a tu correo y guarda próximos pasos de acompañamiento. Cada cuenta solo puede leer y modificar sus propios registros.</p></div><div className="private-space-seal" aria-hidden="true"><span>PRIVADO</span><b>◎</b><span>POR CUENTA</span></div></header>
    <section className="private-space-boundary"><strong>Antes de guardar</strong><p>Usa un alias y no incluyas nombres, centro, datos de contacto ni información que permita reconocer a un estudiante. El filtro de identificadores es automático pero limitado. Este espacio no envía tus registros a Gemini.</p></section>
    {!session ? <section className="private-space-panel"><div><span className="case-label">ENTRADA SEGURA</span><h2>Recibe un enlace de acceso</h2><p>Verificamos que tienes acceso a ese correo. No necesitas crear ni recordar una contraseña.</p></div><form onSubmit={requestAccess} className="private-space-form"><label htmlFor="private-email">Correo de la persona adulta</label><input id="private-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu correo de trabajo o personal"/><label className="private-adult-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)}/><span>Confirmo que soy una persona adulta y usaré este espacio sin datos identificativos de menores.</span></label><button className="button button-primary" disabled={loading}>{loading ? 'Enviando enlace…' : 'Enviarme el enlace de acceso →'}</button></form></section> : <>
      <section className="private-space-panel private-space-account"><div><span className="case-label">SESIÓN ACTIVA</span><h2>Tu espacio privado</h2><p>Cuenta verificada: <strong>{session.user.email}</strong></p><p>{records.length} {records.length === 1 ? 'registro personal' : 'registros personales'}</p></div><div><button className="button button-secondary" onClick={exportRecords} disabled={!records.length}>Exportar mis registros</button><button className="private-signout" onClick={() => void signOut()}>Cerrar sesión</button></div></section>
      <div className="private-space-columns"><form className="private-space-panel private-record-form" onSubmit={saveRecord}><span className="case-label">GUARDAR UN PASO</span><h2>Deja constancia de un acuerdo</h2><label htmlFor="private-context">¿Desde qué espacio?</label><select id="private-context" value={context} onChange={(event) => setContext(event.target.value as Context)}>{contexts.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><label htmlFor="private-alias">Alias ficticio del caso</label><input id="private-alias" required minLength={2} maxLength={40} value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Ej.: caso-4A82C1"/><button type="button" className="privacy-alias-copy-button" onClick={() => setAlias(createCaseAlias())}>Crear alias aleatorio</button><label htmlFor="private-title">¿Qué quieres recordar?</label><input id="private-title" required minLength={3} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Un objetivo o acuerdo breve"/><label htmlFor="private-step">Siguiente paso acordado</label><textarea id="private-step" required minLength={3} maxLength={1200} value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Describe una acción general sin datos identificativos…"/><label htmlFor="private-review">Fecha para revisarlo (opcional)</label><input id="private-review" type="date" value={reviewOn} onChange={(event) => setReviewOn(event.target.value)}/><button className="button button-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar en mi espacio privado'}</button><small>El registro queda aislado en tu cuenta. No se comparte con familia, centro ni Gemini. El alias no vuelve anónimo el resto del texto.</small></form>
      <section className="private-space-panel private-record-list"><div><span className="case-label">TUS REGISTROS</span><h2>Seguimiento personal</h2></div>{records.length ? records.map((record) => <article key={record.id}><div className="private-record-meta"><span>{contexts.find((item) => item.id === record.context)?.label} · {record.alias}</span>{record.review_on && <time dateTime={record.review_on}>Revisar: {record.review_on}</time>}</div><h3>{record.title}</h3><p>{record.next_step}</p><button className="private-delete-record" onClick={() => void deleteRecord(record)}>Eliminar este registro</button></article>) : <p className="private-empty">Todavía no has guardado pasos. Empieza con un acuerdo pequeño, sin datos que identifiquen a un estudiante.</p>}</section></div>
    </>}
    {message && <p className="private-feedback" role="status">{message}</p>}{error && <p className="private-feedback private-feedback-error" role="alert">{error}</p>}
    <section className="private-space-limits"><h2>Qué protege este espacio y qué falta para un uso institucional</h2><ul><li><strong>Identidad:</strong> el acceso verifica el control del correo; no verifica por sí solo la edad, el rol laboral ni la autorización del centro.</li><li><strong>Acceso a datos:</strong> las políticas RLS de Supabase limitan cada registro a su cuenta propietaria. No hay todavía espacios de equipo ni permisos para compartir estos registros.</li><li><strong>Persistencia:</strong> los registros se guardan en Supabase y puedes exportarlos o borrarlos. La plataforma no realiza copias de seguridad institucionales ni ofrece recuperación de cuenta administrada por un centro.</li><li><strong>Protección de datos:</strong> antes de almacenar información identificable, el centro responsable debe aprobar base jurídica, información a las familias, plazos de retención, contrato de tratamiento y evaluación de impacto cuando corresponda.</li></ul><p>Esta implementación añade controles técnicos básicos; no certifica cumplimiento normativo ni habilita el uso con información identificable de menores.</p></section>
  </div></AppShell>;
}
