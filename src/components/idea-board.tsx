'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppShell } from '@/components/app-shell';
import { ensureAnonymousSession, supabaseBrowserClient } from '@/lib/supabase-browser';
import { assertNoDirectIdentifiers } from '@/lib/privacy';

type Board = { id: string; title: string; owner_id: string };
type Note = { id: string; board_id: string; author_id: string; author_role: Role; column_key: ColumnKey; body: string; color: NoteColor; created_at: string };
type Vote = { note_id: string; user_id: string };
type Role = 'Docente' | 'Familia' | 'Orientación';
type ColumnKey = 'observar' | 'preguntar' | 'probar';
type NoteColor = 'yellow' | 'lilac' | 'lime' | 'coral';

const roles: Role[] = ['Docente', 'Familia', 'Orientación'];
const columns: { id: ColumnKey; title: string; prompt: string; color: string }[] = [
  { id: 'observar', title: 'Lo que observamos', prompt: 'Hechos concretos, sin explicar todavía por qué.', color: 'blue' },
  { id: 'preguntar', title: 'Lo que queremos entender', prompt: 'Preguntas abiertas y datos que nos faltan.', color: 'lilac' },
  { id: 'probar', title: 'Ideas pequeñas para probar', prompt: 'Opciones posibles, revisables y de bajo riesgo.', color: 'yellow' },
];
const noteColors: NoteColor[] = ['yellow', 'lilac', 'lime', 'coral'];
const supabaseSetup = `1. Crea un proyecto en Supabase y activa Authentication → Sign In / Providers → Anonymous Sign-Ins.\n2. En este mismo proyecto, ejecuta 202610160001_idea_boards.sql.\n3. Ejecuta 202610180001_institutional_workspace.sql.\n4. Ejecuta 202610190001_shared_content_safety.sql.\n5. Copia Project URL y Publishable key a .env.local como NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.\n6. Reinicia npm run dev.`;

function rows<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function roomRow(value: unknown): Record<string, unknown> | null { return Array.isArray(value) && value[0] && typeof value[0] === 'object' ? value[0] as Record<string, unknown> : value && typeof value === 'object' ? value as Record<string, unknown> : null; }

export function IdeaBoard() {
  const client = useMemo(() => supabaseBrowserClient(), []);
  const [configured, setConfigured] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [role, setRole] = useState<Role>('Docente');
  const [title, setTitle] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [members, setMembers] = useState<Role[]>([]);
  const [drafts, setDrafts] = useState<Record<ColumnKey, string>>({ observar: '', preguntar: '', probar: '' });
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [live, setLive] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!client) { setConfigured(false); setLive('offline'); return; }
    let mounted = true;
    void (async () => {
      try {
        const auth = await ensureAnonymousSession(client);
        if (!mounted) return;
        setSession(auth);
        const { data, error } = await client.from('idea_boards').select('id,title,owner_id').order('created_at', { ascending: false });
        if (error) throw error;
        if (mounted) { const next = rows<Board>(data); setBoards(next); }
        setLive('connected');
      } catch (error) {
        if (mounted) { setLive('offline'); setMessage(error instanceof Error ? error.message : 'No se pudo conectar con el servicio de colaboración.'); }
      }
    })();
    return () => { mounted = false; };
  }, [client]);

  const refreshBoard = useCallback(async (target: Board, userId?: string) => {
    if (!client) return;
    const [notesResult, votesResult, membersResult, ownMember] = await Promise.all([
      client.from('idea_notes').select('id,board_id,author_id,author_role,column_key,body,color,created_at').eq('board_id', target.id).order('created_at', { ascending: true }),
      client.from('idea_note_votes').select('note_id,user_id').eq('board_id', target.id),
      client.from('idea_board_members').select('role').eq('board_id', target.id),
      userId ? client.from('idea_board_members').select('role').eq('board_id', target.id).eq('user_id', userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    const error = notesResult.error || votesResult.error || membersResult.error || ownMember.error;
    if (error) throw error;
    setNotes(rows<Note>(notesResult.data)); setVotes(rows<Vote>(votesResult.data)); setMembers(rows<{ role: Role }>(membersResult.data).map((member) => member.role));
    if (ownMember.data?.role && roles.includes(ownMember.data.role as Role)) setRole(ownMember.data.role as Role);
  }, [client]);

  useEffect(() => {
    if (!client || !board || !session) return;
    let mounted = true;
    setLive('connecting');
    void refreshBoard(board, session.user.id).then(() => { if (mounted) setLive('connected'); }).catch((error) => { if (mounted) { setLive('offline'); setMessage(error instanceof Error ? error.message : 'No se pudo cargar el tablero.'); } });
    const channel = client.channel(`idea-board:${board.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_notes', filter: `board_id=eq.${board.id}` }, () => { void refreshBoard(board, session.user.id); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_note_votes', filter: `board_id=eq.${board.id}` }, () => { void refreshBoard(board, session.user.id); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idea_board_members', filter: `board_id=eq.${board.id}` }, () => { void refreshBoard(board, session.user.id); })
      .subscribe((status) => { if (mounted) setLive(status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting'); });
    return () => { mounted = false; void client.removeChannel(channel); };
  }, [client, board, session, refreshBoard]);

  const enterBoard = async (target: Board) => {
    if (!client || !session) return;
    setBoard(target); setInviteCode(''); setMessage(''); setEditing(null);
    try { await refreshBoard(target, session.user.id); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo abrir el tablero.'); }
  };

  const createBoard = async () => {
    if (!client || !title.trim()) return;
    setLoading(true); setMessage('');
    try {
      assertNoDirectIdentifiers(title.trim());
      const { data, error } = await client.rpc('create_idea_board', { p_title: title.trim(), p_role: role });
      if (error) throw error;
      const result = roomRow(data);
      if (typeof result?.board_id !== 'string' || typeof result.board_title !== 'string' || typeof result.invite_code !== 'string' || typeof result.owner_id !== 'string') throw new Error('Supabase devolvió un resultado inesperado.');
      const created = { id: result.board_id, title: result.board_title, owner_id: result.owner_id };
      setBoards((current) => [created, ...current.filter((item) => item.id !== created.id)]); setTitle(''); setInviteCode(result.invite_code); setBoard(created); setMessage('Sala creada. Copia el código y compártelo solo con el equipo acordado.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo crear la sala. Revisa la configuración SQL y Anonymous Sign-Ins.'); }
    finally { setLoading(false); }
  };

  const joinBoard = async () => {
    if (!client || inviteInput.trim().length < 6) return;
    setLoading(true); setMessage('');
    try {
      const { data, error } = await client.rpc('join_idea_board', { p_invite_code: inviteInput.trim().toUpperCase(), p_role: role });
      if (error) throw error;
      const result = roomRow(data);
      if (typeof result?.board_id !== 'string' || typeof result.board_title !== 'string' || typeof result.owner_id !== 'string') throw new Error('Código de sala no válido.');
      const joined = { id: result.board_id, title: result.board_title, owner_id: result.owner_id };
      setBoards((current) => [joined, ...current.filter((item) => item.id !== joined.id)]); setInviteInput(''); setBoard(joined); setInviteCode(''); setMessage('Ya estás en la sala. Las notas nuevas se sincronizan en vivo.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo abrir la sala. Comprueba el código.'); }
    finally { setLoading(false); }
  };

  const addNote = async (column: ColumnKey) => {
    if (!client || !board || !session || !drafts[column].trim()) return;
    setLoading(true); setMessage('');
    try { assertNoDirectIdentifiers(drafts[column].trim()); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Quitá los datos identificativos antes de guardar.'); setLoading(false); return; }
    const color = noteColors[notes.filter((note) => note.column_key === column).length % noteColors.length];
    const { error } = await client.from('idea_notes').insert({ board_id: board.id, author_id: session.user.id, author_role: role, column_key: column, body: drafts[column].trim(), color });
    if (error) setMessage(error.message); else { setDrafts((current) => ({ ...current, [column]: '' })); await refreshBoard(board, session.user.id); }
    setLoading(false);
  };

  const saveEdit = async () => {
    if (!client || !board || !session || !editing || !editing.text.trim()) return;
    try { assertNoDirectIdentifiers(editing.text.trim()); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Quitá los datos identificativos antes de guardar.'); return; }
    const { error } = await client.from('idea_notes').update({ body: editing.text.trim(), updated_at: new Date().toISOString() }).eq('id', editing.id).eq('board_id', board.id).eq('author_id', session.user.id);
    if (error) setMessage(error.message); else { setEditing(null); await refreshBoard(board, session.user.id); }
  };

  const deleteNote = async (note: Note) => {
    if (!client || !board || !session || note.author_id !== session.user.id) return;
    const { error } = await client.from('idea_notes').delete().eq('id', note.id).eq('board_id', board.id);
    if (error) setMessage(error.message); else await refreshBoard(board, session.user.id);
  };

  const toggleVote = async (note: Note) => {
    if (!client || !board || !session) return;
    const existing = votes.some((vote) => vote.note_id === note.id && vote.user_id === session.user.id);
    const result = existing
      ? await client.from('idea_note_votes').delete().eq('note_id', note.id).eq('board_id', board.id).eq('user_id', session.user.id)
      : await client.from('idea_note_votes').insert({ note_id: note.id, board_id: board.id, user_id: session.user.id });
    if (result.error) setMessage(result.error.message); else await refreshBoard(board, session.user.id);
  };

  const copyInvite = async () => {
    if (!inviteCode) return;
    try { await navigator.clipboard.writeText(inviteCode); setMessage('Código copiado. Compártelo por el canal acordado; quien lo tenga podrá solicitar acceso.'); }
    catch { setMessage(`Código de invitación: ${inviteCode}`); }
  };

  const closeBoard = () => { setBoard(null); setNotes([]); setVotes([]); setMembers([]); setInviteCode(''); setMessage(''); };

  const deleteBoard = async () => {
    if (!client || !board || !session || board.owner_id !== session.user.id) return;
    if (!window.confirm(`Se eliminará la sala «${board.title}» y todas sus notas y votos. Esta acción no se puede deshacer. ¿Continuar?`)) return;
    setLoading(true);
    const { error } = await client.from('idea_boards').delete().eq('id', board.id).eq('owner_id', session.user.id);
    if (error) setMessage(`No se pudo eliminar la sala: ${error.message}`);
    else {
      setBoards((current) => current.filter((item) => item.id !== board.id));
      setBoard(null); setNotes([]); setVotes([]); setMembers([]); setInviteCode('');
      setMessage('Sala y contenido eliminados.');
    }
    setLoading(false);
  };

  return <AppShell><div className="content ideas-page">
    <header className="ideas-page-heading"><div><span className="eyebrow">COLABORACIÓN · PIZARRA COMPARTIDA</span><h1 className="page-title">Pensemos en voz alta.</h1><p>Una lluvia de ideas en equipo, organizada en observaciones, preguntas y acciones pequeñas.</p></div><Link className="button button-secondary button-small" href="/colaboracion">← Volver a colaboración</Link></header>
    <aside className="ideas-safety"><b>Acuerdo de cuidado:</b> no escriban nombres, diagnósticos ni detalles identificables de estudiantes. Usen ideas generales o casos ficticios.</aside>
    {!configured ? <section className="panel ideas-setup"><span className="eyebrow">CONFIGURACIÓN NECESARIA</span><h2>Activa la sincronización del equipo.</h2><p>Para que varias personas vean las notas en tiempo real hay que conectar un proyecto Supabase y aplicar las políticas de acceso de SendIA.</p><pre>{supabaseSetup}</pre><p>El archivo SQL ya está incluido en el proyecto. No uses una clave service_role en el navegador.</p></section> : <>
      {!board ? <section className="ideas-entry-grid"><article className="panel ideas-entry-card"><span className="eyebrow">EMPEZAR UN TABLERO</span><h2>Crea una sala para una conversación.</h2><label>Nombre breve del tablero<input className="textarea" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej.: Ideas para abrir distintas formas de participar"/></label><label>Tu rol<select className="textarea" value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-primary" disabled={!title.trim() || loading || live === 'offline'} onClick={() => void createBoard()}>{loading ? 'Creando…' : 'Crear tablero y obtener código →'}</button></article>
        <article className="panel ideas-entry-card ideas-join"><span className="eyebrow">YA TIENES UN CÓDIGO</span><h2>Únete a una sala.</h2><label>Código de invitación<input className="textarea" maxLength={20} value={inviteInput} onChange={(event) => setInviteInput(event.target.value.toUpperCase())} placeholder="Pega el código de la persona que creó la sala"/></label><label>Tu rol<select className="textarea" value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-secondary" disabled={inviteInput.trim().length < 6 || loading || live === 'offline'} onClick={() => void joinBoard()}>Unirme al tablero →</button></article>
      </section> : <>
        <header className="ideas-board-toolbar"><div><button type="button" className="case-back-link" onClick={closeBoard}>← Todas las salas</button><h2>{board.title}</h2><div className="ideas-board-meta"><span className={`ideas-live ${live}`}><i/> {live === 'connected' ? 'En vivo' : live === 'connecting' ? 'Conectando…' : 'Sin conexión'}</span><span>{members.length} {members.length === 1 ? 'persona con acceso' : 'personas con acceso'}</span>{roles.map((memberRole, index) => <span className="ideas-member-pill" key={`${memberRole}-${index}`}>{memberRole}</span>)}</div></div><div className="ideas-toolbar-actions">{inviteCode && <button type="button" className="button button-secondary button-small" onClick={() => void copyInvite()}>Copiar código de invitación</button>}<button type="button" className="button button-secondary button-small" onClick={() => void refreshBoard(board, session?.user.id)}>Actualizar tablero</button>{board.owner_id === session?.user.id && <button type="button" className="button button-secondary button-small ideas-delete-board" disabled={loading} onClick={() => void deleteBoard()}>Eliminar sala</button>}</div></header>
        {inviteCode && <p className="ideas-invite-notice"><b>Código de la sala: <code>{inviteCode}</code></b> · compártelo solo con las personas adultas que quieras invitar. Quien tenga el código puede unirse.</p>}
        <section className="ideas-board" aria-label="Tablero de lluvia de ideas">{columns.map((column) => <section className={`ideas-column ideas-column-${column.color}`} key={column.id} aria-labelledby={`ideas-${column.id}`}>
          <header><span className="ideas-column-number">{String(columns.indexOf(column) + 1).padStart(2, '0')}</span><h3 id={`ideas-${column.id}`}>{column.title}</h3><p>{column.prompt}</p></header>
          <div className="ideas-note-stack">{notes.filter((note) => note.column_key === column.id).map((note) => {
            const ownVote = Boolean(session && votes.some((vote) => vote.note_id === note.id && vote.user_id === session.user.id));
            const count = votes.filter((vote) => vote.note_id === note.id).length;
            return <article key={note.id} className={`idea-sticky idea-sticky-${note.color}`}><div className="idea-sticky-meta"><span>{note.author_role}</span><time dateTime={note.created_at}>{new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(note.created_at))}</time></div>
              {editing?.id === note.id ? <><textarea maxLength={500} value={editing.text} onChange={(event) => setEditing({ id: note.id, text: event.target.value })}/><div className="idea-note-actions"><button type="button" onClick={() => void saveEdit()}>Guardar</button><button type="button" onClick={() => setEditing(null)}>Cancelar</button></div></> : <p>{note.body}</p>}
              {editing?.id !== note.id && <div className="idea-note-actions"><button type="button" className={ownVote ? 'voted' : ''} aria-pressed={ownVote} onClick={() => void toggleVote(note)}>♡ {count || 'Apoyar'}</button>{note.author_id === session?.user.id && <><button type="button" onClick={() => setEditing({ id: note.id, text: note.body })}>Editar</button><button type="button" onClick={() => void deleteNote(note)}>Quitar</button></>}</div>}
            </article>;
          })}</div>
          <div className="ideas-add-note"><label className="sr-only" htmlFor={`new-idea-${column.id}`}>Añadir nota a {column.title}</label><textarea id={`new-idea-${column.id}`} maxLength={500} value={drafts[column.id]} onChange={(event) => setDrafts((current) => ({ ...current, [column.id]: event.target.value }))} placeholder="Escribe una idea breve…"/><button type="button" disabled={!drafts[column.id].trim() || loading || live !== 'connected'} onClick={() => void addNote(column.id)}>+ Añadir nota</button></div>
        </section>)}</section>
        <div className="ideas-footer-note">Primero generen opciones sin evaluarlas. Después apoyen las ideas que quieran explorar y acuerden un paso pequeño con quién lo llevará y cuándo lo revisarán.</div>
      </>}
      {boards.length > 0 && !board && <section className="ideas-previous-boards"><h2>Tus salas</h2><div>{boards.map((item) => <button key={item.id} type="button" onClick={() => void enterBoard(item)}><span>↗</span><b>{item.title}</b></button>)}</div></section>}
      {message && <p className="pilot-message" role="status">{message}</p>}
      <p className="ideas-config-foot">La conexión usa una sesión anónima y permisos por sala. Las notas se guardan en Supabase para sincronizarse; no incluyan información identificable de menores.</p>
    </>}
  </div></AppShell>;
}
