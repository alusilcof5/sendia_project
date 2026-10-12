'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { formatMonth, locale } from '@/lib/i18n/es-419';

type Role = 'docente' | 'familia' | 'profesional';
type Entry = { id: string; role: Role; phase: 'before' | 'after'; answers: number[]; savedAt: string };
const storageKey = 'sendia-pilot-entries-v1';
const activeKey = 'sendia-pilot-active-v1';
const legacyStorageKey = 'miradas-pilot-entries-v1';
const legacyActiveKey = 'miradas-pilot-active-v1';

function readMigratedValue(key: string, legacyKey: string): string | null {
  const current = localStorage.getItem(key);
  if (current !== null) return current;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy !== null) localStorage.setItem(key, legacy);
  return legacy;
}
const measures = [
  'Puedo separar lo que observo de lo que interpreto.',
  'Sé qué información falta antes de decidir cómo actuar.',
  'Puedo proponer un paso pequeño y un indicador para revisarlo.',
];
const roles: { id: Role; label: string }[] = [{ id: 'docente', label: 'Docente o equipo educativo' }, { id: 'familia', label: 'Familiar o persona cuidadora' }, { id: 'profesional', label: 'Otro perfil profesional' }];

export default function Impacto() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeId, setActiveId] = useState('');
  const [role, setRole] = useState<Role>('docente');
  const [answers, setAnswers] = useState<number[]>([0, 0, 0]);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [waitingForExplore, setWaitingForExplore] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(readMigratedValue(storageKey, legacyStorageKey) || '[]');
      if (Array.isArray(stored)) setEntries(stored.filter((item): item is Entry => item && typeof item.id === 'string' && (item.phase === 'before' || item.phase === 'after') && Array.isArray(item.answers)));
      setActiveId(readMigratedValue(activeKey, legacyActiveKey) || '');
    } catch { setEntries([]); }
    setReady(true);
  }, []);

  const paired = useMemo(() => {
    const before = new Map(entries.filter((entry) => entry.phase === 'before').map((entry) => [entry.id, entry]));
    return entries.filter((entry) => entry.phase === 'after' && before.has(entry.id)).map((after) => ({ before: before.get(after.id)!, after }));
  }, [entries]);
  const summaries = roles.map((profile) => {
    const profilePairs = paired.filter((pair) => pair.before.role === profile.id);
    const averages = measures.map((_, index) => {
      if (!profilePairs.length) return null;
      const before = profilePairs.reduce((total, pair) => total + pair.before.answers[index], 0) / profilePairs.length;
      const after = profilePairs.reduce((total, pair) => total + pair.after.answers[index], 0) / profilePairs.length;
      return { before, after, delta: after - before };
    });
    return { ...profile, pairs: profilePairs, averages };
  });
  const phase = activeId && !waitingForExplore ? 'after' : 'before';
  const pilotStep = paired.length > 0 && !activeId ? 3 : waitingForExplore ? 1 : activeId ? 2 : 0;
  const save = () => {
    if (!consent || answers.some((value) => value < 1 || value > 5) || !ready) return;
    const id = activeId || crypto.randomUUID();
    const currentRole = activeId ? entries.find((item) => item.id === activeId && item.phase === 'before')?.role || role : role;
    const next = [...entries, { id, role: currentRole, phase, answers, savedAt: new Date().toISOString() } satisfies Entry];
    setEntries(next); localStorage.setItem(storageKey, JSON.stringify(next));
    if (phase === 'before') { setActiveId(id); setWaitingForExplore(true); localStorage.setItem(activeKey, id); setMessage('Punto de partida guardado. Explora Comprender y vuelve para completar el seguimiento.'); }
    else { setActiveId(''); localStorage.removeItem(activeKey); setMessage('Seguimiento guardado. Se ha actualizado el resumen de respuestas emparejadas.'); }
    setAnswers([0, 0, 0]); setConsent(false);
  };
  const downloadCsv = (rows: string[][], filename: string) => {
    const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  };
  const exportAggregate = () => {
    if (!paired.length) return;
    const rows = [['Perfil', 'Indicador', 'n', 'Antes (media 1-5)', 'Después (media 1-5)', 'Cambio medio']];
    summaries.forEach((summary) => measures.forEach((measure, index) => {
      const value = summary.averages[index];
      if (value) rows.push([summary.label, measure, new Intl.NumberFormat(locale).format(summary.pairs.length), value.before.toFixed(2), value.after.toFixed(2), value.delta.toFixed(2)]);
    }));
    downloadCsv(rows, 'sendia-pilotaje-agregado-por-perfil.csv');
  };
  const exportResponses = () => {
    if (!entries.length) return;
    const rows = [['Perfil', 'Fase', ...measures.map((_, index) => `Indicador ${index + 1} (1-5)`), 'Identificador aleatorio de emparejamiento', 'Mes']];
    entries.forEach((entry) => rows.push([entry.role, entry.phase === 'before' ? 'antes' : 'después', ...entry.answers.map((value) => new Intl.NumberFormat(locale).format(value)), entry.id, /^\d{4}-\d{2}/.test(entry.savedAt) ? formatMonth(entry.savedAt) : '']));
    downloadCsv(rows, 'sendia-respuestas-anonimas.csv');
  };
  const clear = () => {
    if (!window.confirm('¿Borrar todas las respuestas de pilotaje guardadas en este navegador?')) return;
    localStorage.removeItem(storageKey); localStorage.removeItem(activeKey); localStorage.removeItem(legacyStorageKey); localStorage.removeItem(legacyActiveKey); setEntries([]); setActiveId(''); setWaitingForExplore(false); setMessage('Respuestas borradas de este navegador.');
  };

  return <AppShell><div className="content pilot-page">
    <section className="pilot-hero">
      <div className="pilot-hero-copy"><span className="case-label">SEGUIMIENTO · VOCES ADULTAS</span><h1>Volver sobre lo vivido<br/><em>también ayuda a avanzar.</em></h1><p>Este espacio queda preparado para acompañar el pilotaje de SendIA. Responde tres preguntas, explora la herramienta y vuelve después para comparar tu percepción.</p><div className="pilot-hero-tags"><span>3 preguntas</span><span>2 momentos</span><span>En este navegador</span></div></div>
      <div className="pilot-hero-art" aria-hidden="true"><span className="pilot-art-orbit"/><span className="pilot-art-core">↗</span><span className="pilot-art-note pilot-art-before">ANTES</span><span className="pilot-art-note pilot-art-after">DESPUÉS</span><span className="pilot-art-caption">Observar<br/>· explorar · revisar</span></div>
    </section>
    <div className="pilot-banner"><strong>¿Qué recoge este seguimiento?</strong><span>Tu percepción sobre cómo separas observaciones de interpretaciones y eliges qué hacer. No evalúa al alumnado ni demuestra que SendIA cause cambios. Todavía no hay resultados hasta que las personas participantes completen ambas partes.</span></div>
    <section className="pilot-howto" aria-label="Progreso del pilotaje">
      <div className={pilotStep > 0 ? 'is-done' : pilotStep === 0 ? 'is-current' : ''} aria-current={pilotStep === 0 ? 'step' : undefined}><span>{pilotStep > 0 ? '✓' : '01'}</span><p><strong>{pilotStep > 0 ? 'Tu punto de partida' : 'Primero, responde'}</strong><br/>Guarda cómo ves la situación hoy.</p></div>
      <div className={pilotStep > 1 ? 'is-done' : pilotStep === 1 ? 'is-current' : ''} aria-current={pilotStep === 1 ? 'step' : undefined}><span>{pilotStep > 1 ? '✓' : '02'}</span><p><strong>{pilotStep > 1 ? 'Exploración completada' : 'Después, explora'}</strong><br/>Prueba Comprender con el ejemplo ficticio.</p></div>
      <div className={pilotStep === 3 ? 'is-done' : pilotStep === 2 ? 'is-current' : ''} aria-current={pilotStep === 2 ? 'step' : undefined}><span>{pilotStep === 3 ? '✓' : '03'}</span><p><strong>{pilotStep === 3 ? 'Comparación lista' : 'Por último, vuelve'}</strong><br/>Completa el seguimiento aquí mismo.</p></div>
    </section>
    <div className="pilot-grid section-space">
      <section className="panel pilot-form"><div className="pilot-card-heading"><div><span className="eyebrow">{waitingForExplore ? 'SIGUIENTE PASO' : phase === 'before' ? 'MOMENTO 01 · ANTES' : 'MOMENTO 02 · DESPUÉS'}</span><h2>{waitingForExplore ? 'Ahora prueba SendIA.' : phase === 'before' ? '¿Cómo lo ves hoy?' : '¿Qué ves ahora?'}</h2></div><span className="pilot-step-badge">{waitingForExplore ? '2 / 3' : phase === 'before' ? '1 / 3' : '3 / 3'}</span></div>
        {waitingForExplore ? <div className="pilot-next-step"><strong>Tu punto de partida ya está guardado.</strong><p>Abre «Comprender», explora el caso ficticio de Alex y vuelve aquí para responder las mismas preguntas.</p><a className="button button-primary" href="/comprender?modo=demo" onClick={() => { setWaitingForExplore(false); setMessage(''); }}>Explorar el caso ficticio <span>→</span></a></div> : <>
        {phase === 'before' && <label className="pilot-role">Tu perfil<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <p className="pilot-instructions">Marca del 1 (todavía no) al 5 (sí, claramente). Piensa en tu experiencia, no en un estudiante concreto. Tus respuestas se guardan solo en este navegador.</p>
        <div className="pilot-measures">{measures.map((measure, index) => <fieldset className="pilot-measure" key={measure}><legend>{measure}</legend><div className="pilot-scale" role="radiogroup" aria-label={measure}>{[1, 2, 3, 4, 5].map((value) => <label key={value} className={answers[index] === value ? 'picked' : ''}><input type="radio" name={'measure-' + index} value={value} checked={answers[index] === value} onChange={() => setAnswers((current) => current.map((item, i) => i === index ? value : item))}/><span>{value}</span></label>)}</div><div className="pilot-scale-labels"><span>Todavía no</span><span>Claramente</span></div></fieldset>)}</div>
        <label className="pilot-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>Soy una persona adulta y acepto guardar mis respuestas en este navegador. No incluiré datos de menores. Si las exporto, el archivo llevará un código aleatorio para emparejar las dos respuestas.</span></label>
        <button className="button button-primary" disabled={!ready || !consent || answers.some((value) => value === 0)} onClick={save}>{phase === 'before' ? 'Guardar y empezar a explorar' : 'Guardar seguimiento'}</button>
        {message && <p className="pilot-message" role="status">{message}</p>}
        </>}
      </section>
      <section className="panel pilot-results"><div className="eyebrow">RESUMEN PERSONAL</div><h2>Lo que podemos observar.</h2><p className="muted">Las respuestas se comparan solo cuando están completas y emparejadas en este navegador.</p>
      {!paired.length ? <div className="pilot-empty"><span className="pilot-empty-mark" aria-hidden="true">↗</span><div><strong>{waitingForExplore ? 'Tu punto de partida ya está guardado.' : 'Aún no hay una comparación.'}</strong><p>{waitingForExplore ? 'Explora Comprender y vuelve para responder el seguimiento.' : 'Al completar los dos momentos, verás aquí un resumen de tus respuestas.'}</p></div></div> : <><div className="pilot-count"><strong>{new Intl.NumberFormat(locale).format(paired.length)}</strong><span>{paired.length === 1 ? 'comparación completa' : 'comparaciones completas'}</span></div><div className="pilot-aggregate">{summaries.filter((summary) => summary.pairs.length > 0).map((summary) => <section key={summary.id}><h3>{summary.label} · {new Intl.NumberFormat(locale).format(summary.pairs.length)} {summary.pairs.length === 1 ? 'par' : 'pares'}</h3>{measures.map((measure, index) => <article key={measure}><h4>{measure}</h4>{summary.averages[index] && <div><span>Antes <strong>{summary.averages[index]!.before.toLocaleString(locale, { maximumFractionDigits: 1 })}</strong></span><span>Después <strong>{summary.averages[index]!.after.toLocaleString(locale, { maximumFractionDigits: 1 })}</strong></span><span>Cambio <strong>{summary.averages[index]!.delta > 0 ? '+' : ''}{summary.averages[index]!.delta.toLocaleString(locale, { maximumFractionDigits: 1 })}</strong></span></div>}</article>)}</section>)}</div></>}
        {entries.length > 0 && <div className="pilot-actions">{paired.length > 0 && <button className="button button-secondary button-small" onClick={exportAggregate}>Descargar este resumen</button>}<button className="button button-secondary button-small" onClick={exportResponses}>Descargar mis respuestas</button><button className="case-back-link" onClick={clear}>Borrar mis respuestas</button></div>}
        {entries.length > 0 && <details className="pilot-privacy"><summary>¿Dónde se guardan y cómo compartirlas?</summary><p>Se guardan solo en este navegador. SendIA no reúne respuestas de varias personas. El archivo exportado incluye un código aleatorio para relacionar el antes y el después, además del mes. Para un grupo, quien coordina debe reunir los archivos fuera de SendIA.</p></details>}
      </section>
    </div>
    <details className="pilot-method"><summary>Cómo interpretar estos resultados</summary><p>Este cuestionario recoge percepciones de personas adultas. Es un instrumento de pilotaje, no validado; los resultados no prueban que SendIA haya causado un cambio. No mide resultados de estudiantes.</p></details>
  </div></AppShell>;
}
