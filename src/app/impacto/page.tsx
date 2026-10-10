'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';

type Role = 'docente' | 'familia' | 'profesional';
type Entry = { id: string; role: Role; phase: 'before' | 'after'; answers: number[]; savedAt: string };
const storageKey = 'miradas-pilot-entries-v1';
const activeKey = 'miradas-pilot-active-v1';
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

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored)) setEntries(stored.filter((item): item is Entry => item && typeof item.id === 'string' && (item.phase === 'before' || item.phase === 'after') && Array.isArray(item.answers)));
      setActiveId(localStorage.getItem(activeKey) || '');
    } catch { setEntries([]); }
    setReady(true);
  }, []);

  const paired = useMemo(() => {
    const before = new Map(entries.filter((entry) => entry.phase === 'before').map((entry) => [entry.id, entry]));
    return entries.filter((entry) => entry.phase === 'after' && before.has(entry.id)).map((after) => ({ before: before.get(after.id)!, after }));
  }, [entries]);
  const averages = measures.map((_, index) => {
    if (!paired.length) return null;
    const before = paired.reduce((total, pair) => total + pair.before.answers[index], 0) / paired.length;
    const after = paired.reduce((total, pair) => total + pair.after.answers[index], 0) / paired.length;
    return { before, after, delta: after - before };
  });
  const phase = activeId ? 'after' : 'before';
  const save = () => {
    if (!consent || answers.some((value) => value < 1 || value > 5) || !ready) return;
    const id = activeId || crypto.randomUUID();
    const currentRole = activeId ? entries.find((item) => item.id === activeId && item.phase === 'before')?.role || role : role;
    const next = [...entries, { id, role: currentRole, phase, answers, savedAt: new Date().toISOString() } satisfies Entry];
    setEntries(next); localStorage.setItem(storageKey, JSON.stringify(next));
    if (phase === 'before') { setActiveId(id); localStorage.setItem(activeKey, id); setMessage('Línea inicial guardada en este navegador. Explora SendIA y vuelve para completar el seguimiento.'); }
    else { setActiveId(''); localStorage.removeItem(activeKey); setMessage('Seguimiento guardado. Se ha actualizado el resumen de respuestas emparejadas.'); }
    setAnswers([0, 0, 0]); setConsent(false);
  };
  const exportAggregate = () => {
    if (!paired.length) return;
    const rows = [['Indicador', 'Respuestas emparejadas', 'Antes (media 1-5)', 'Después (media 1-5)', 'Cambio medio']];
    measures.forEach((measure, index) => { const value = averages[index]!; rows.push([measure, String(paired.length), value.before.toFixed(2), value.after.toFixed(2), value.delta.toFixed(2)]); });
    const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sendia-pilotaje-agregado.csv'; link.click(); URL.revokeObjectURL(url);
  };
  const clear = () => {
    if (!window.confirm('¿Borrar todas las respuestas de pilotaje guardadas en este navegador?')) return;
    localStorage.removeItem(storageKey); localStorage.removeItem(activeKey); setEntries([]); setActiveId(''); setMessage('Respuestas borradas de este navegador.');
  };

  return <AppShell><div className="content pilot-page">
    <div className="eyebrow">PILOTAJE · MEDIDAS AUTODECLARADAS</div><h1 className="page-title serif">Impacto</h1><p className="subtitle">Compara cómo se sienten docentes y familias antes y después de explorar SendIA. Una señal para aprender, no una prueba de eficacia.</p>
    <div className="pilot-banner"><strong>Instrumento de pilotaje en construcción</strong><span>No hay resultados reales todavía. Este cuestionario no está validado y sus resultados no demuestran causalidad. Recoge primero una línea inicial, explora la herramienta y vuelve para responder el seguimiento.</span></div>
    <div className="pilot-grid section-space">
      <section className="panel pilot-form"><div className="panel-heading"><h2>{phase === 'before' ? '01 · Antes de explorar' : '02 · Después de explorar'}</h2><span className={'status ' + (phase === 'before' ? 'draft' : '')}>{phase === 'before' ? 'Línea inicial' : 'Seguimiento'}</span></div>
        {phase === 'before' && <label className="pilot-role">Tu perfil<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <p className="pilot-instructions">Valora tu experiencia actual del 1 (todavía no) al 5 (sí, claramente). No respondas sobre un estudiante concreto.</p>
        <div className="pilot-measures">{measures.map((measure, index) => <fieldset className="pilot-measure" key={measure}><legend>{measure}</legend><div className="pilot-scale" role="radiogroup" aria-label={measure}>{[1, 2, 3, 4, 5].map((value) => <label key={value} className={answers[index] === value ? 'picked' : ''}><input type="radio" name={'measure-' + index} value={value} checked={answers[index] === value} onChange={() => setAnswers((current) => current.map((item, i) => i === index ? value : item))}/><span>{value}</span></label>)}</div><div className="pilot-scale-labels"><span>Todavía no</span><span>Claramente</span></div></fieldset>)}</div>
        <label className="pilot-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>Soy una persona adulta y acepto guardar estas respuestas anónimas localmente para el pilotaje. No introduciré datos de menores.</span></label>
        <button className="button button-primary" disabled={!ready || !consent || answers.some((value) => value === 0)} onClick={save}>{phase === 'before' ? 'Guardar línea inicial' : 'Guardar seguimiento'}</button>
        {message && <p className="pilot-message" role="status">{message}</p>}
      </section>
      <section className="panel pilot-results"><div className="eyebrow">LECTURA AGREGADA</div><h2 className="serif">Cambios que podemos observar.</h2><p className="muted">Solo se comparan cuestionarios iniciales y de seguimiento emparejados en este navegador.</p><div className="pilot-count"><strong>{ready ? paired.length : '—'}</strong><span>pares completos<br/>de respuestas</span></div>
        <div className="pilot-aggregate">{measures.map((measure, index) => <article key={measure}><h3>{measure}</h3>{averages[index] ? <div><span>Antes <strong>{averages[index]!.before.toFixed(1)}</strong></span><span>Después <strong>{averages[index]!.after.toFixed(1)}</strong></span><span>Cambio <strong>{averages[index]!.delta > 0 ? '+' : ''}{averages[index]!.delta.toFixed(1)}</strong></span></div> : <p>Aún no hay pares suficientes para calcular esta media.</p>}</article>)}</div>
        <div className="pilot-actions"><button className="button button-secondary button-small" onClick={exportAggregate} disabled={!paired.length}>Descargar resumen agregado CSV</button><button className="case-back-link" onClick={clear} disabled={!entries.length}>Borrar datos locales</button></div>
        <p className="pilot-privacy">Las respuestas se quedan en este navegador. La exportación contiene medias y número de pares, no respuestas individuales, nombres, correos ni datos de estudiantes. Para consolidar varios dispositivos, combina los resúmenes agregados fuera de la plataforma.</p>
      </section>
    </div>
    <section className="pilot-method"><div><span className="eyebrow">PROTOCOLO BREVE</span><h2>Un piloto pequeño, contado con honestidad.</h2></div><ol><li>Invitar a personas adultas docentes o familiares; no recopilar información identificable de menores.</li><li>Responder la línea inicial y recorrer Comprender con una situación ficticia o anonimizada.</li><li>Completar el seguimiento y exportar solo medias agregadas.</li><li>Informar número de pares, perfiles, contexto y limitaciones; no atribuir el cambio a SendIA sin un diseño que lo permita.</li></ol></section>
  </div></AppShell>;
}
