'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './app-shell';
import { demoPlan } from '@/lib/demo-data';
import { makeStoredPlan, readPlans, upsertPlan, type PlanStatus, type StoredPlan } from '@/lib/plan-store';
import type { ActionPlan } from '@/lib/schemas';

const statusLabels: Record<PlanStatus, string> = { draft: 'Borrador', 'pending-approval': 'Pendiente de aprobación', approved: 'En marcha', completed: 'Completado' };

export function ActionPlan() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<StoredPlan | null>(null);

  useEffect(() => {
    const saved = readPlans();
    setPlans(saved);
    setSelectedId(saved[0]?.id ?? '');
    setReady(true);
  }, []);

  const selected = plans.find((item) => item.id === selectedId) ?? null;
  const plan: ActionPlan = draft ?? selected ?? demoPlan;
  const status: PlanStatus = (draft ?? selected)?.status ?? 'draft';
  const progress = useMemo(() => plan.strategies.length ? Math.round(((draft ?? selected)?.completedStrategies.length ?? 0) / plan.strategies.length * 100) : 0, [draft, selected, plan.strategies.length]);
  const reviewDate = plan.reviewDate.split('-').reverse().join('/');

  const persist = (updated: StoredPlan, success: string) => {
    try {
      const next = upsertPlan({ ...updated, updatedAt: new Date().toISOString() });
      setPlans(next);
      setSelectedId(updated.id);
      setDraft(null);
      setMessage(success);
      return true;
    } catch {
      setMessage('No se pudo guardar en este navegador. Comprueba el espacio disponible y vuelve a intentarlo.');
      return false;
    }
  };

  const ensureStored = (): StoredPlan => selected ?? makeStoredPlan({
    ...demoPlan,
    status: 'draft',
    source: 'demo',
  });

  const saveEdits = () => {
    if (!draft) return;
    if (![draft.title, draft.objective, draft.reviewDate, ...draft.strategies.flatMap((item) => [item.title, item.detail, item.responsible, item.cadence])].every((value) => value.trim())) {
      setMessage('Completa el título, objetivo, estrategias, responsables y revisión antes de guardar.');
      return;
    }
    if (persist(draft, 'Cambios guardados en este navegador.')) setEditing(false);
  };

  const updateStrategy = (strategyId: string, key: 'title' | 'detail' | 'responsible' | 'cadence', value: string) => {
    const current = ensureStored();
    setDraft({ ...current, strategies: current.strategies.map((strategy) => strategy.id === strategyId ? { ...strategy, [key]: value } : strategy) });
  };

  const toggleStrategy = (strategyId: string) => {
    if (!selected || selected.status !== 'approved') return;
    const completedStrategies = selected.completedStrategies.includes(strategyId)
      ? selected.completedStrategies.filter((id) => id !== strategyId)
      : [...selected.completedStrategies, strategyId];
    persist({ ...selected, completedStrategies }, 'Seguimiento de la acción actualizado.');
  };

  const saveReview = () => {
    const text = note.trim();
    if (!text) { setMessage('Escribe una observación breve antes de guardar.'); return; }
    if (text.length > 600) { setMessage('La nota debe tener 600 caracteres o menos.'); return; }
    const current = ensureStored();
    persist({ ...current, status: current.status === 'draft' || current.status === 'pending-approval' ? 'approved' : current.status, reviews: [...current.reviews, { id: crypto.randomUUID(), note: text, savedAt: new Date().toISOString() }] }, 'Revisión guardada localmente.');
    setNote('');
  };

  const approve = () => {
    const current = ensureStored();
    persist({ ...current, status: 'approved' }, 'Plan aprobado y guardado.');
  };

  const complete = () => {
    if (!selected) return;
    persist({ ...selected, status: 'completed' }, 'Plan marcado como completado.');
  };

  const beginEdit = () => {
    setDraft(ensureStored());
    setEditing(true);
    setMessage('');
  };

  return <AppShell><div className="content">
    <div className="eyebrow">MIS PLANES · {statusLabels[status].toUpperCase()}</div>
    <div className="welcome-row" style={{ marginBottom: 23 }}><div><h1 className="page-title serif">Plan de actuación</h1><p className="subtitle">Prueba acciones pequeñas, registra qué ocurre y revisa el plan con las personas implicadas.</p></div><Link href="/comprender" className="button button-secondary">← &nbsp;Volver a Comprender</Link></div>

    {plans.length > 0 && <section className="panel" aria-label="Planes guardados"><div className="panel-heading"><h2>Planes guardados</h2><span className="muted" style={{ fontSize: 10 }}>{plans.length} {plans.length === 1 ? 'plan' : 'planes'} · solo en este navegador</span></div><div className="plan-list">{plans.map((item) => <button key={item.id} type="button" className={'plan-row ' + (item.id === selectedId ? 'selected' : '')} onClick={() => { setSelectedId(item.id); setDraft(null); setEditing(false); setMessage(''); }} aria-pressed={item.id === selectedId}><span className="plan-symbol" aria-hidden="true">{item.source === 'ai' ? '✳' : '▤'}</span><span><span className="plan-title">{item.title}</span><span className="plan-meta">Revisión {item.reviewDate.split('-').reverse().join('/')}</span></span><span className={'status ' + (item.status === 'draft' || item.status === 'pending-approval' ? 'draft' : '')}>{statusLabels[item.status]}</span></button>)}</div></section>}

    <section className="plan-top section-space"><div><div className="eyebrow" style={{ color: '#678070' }}>{(draft ?? selected)?.source === 'ai' ? 'PROPUESTA GENERADA CON IA · REVISIÓN HUMANA' : 'AULA · DEMOSTRACIÓN FICTICIA'}</div>{editing && draft ? <input className="textarea" aria-label="Título del plan" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /> : <h2>{plan.title}</h2>}{editing && draft ? <textarea className="textarea" aria-label="Objetivo del plan" value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} /> : <p>{plan.objective}</p>}</div><span className={'status ' + (status === 'draft' || status === 'pending-approval' ? 'draft' : '')}>{statusLabels[status]}</span></section>

    <section className="panel"><div className="panel-heading"><h2>Acciones y revisión</h2><span className="muted" style={{ fontSize: 10 }}>Revisar el {reviewDate}</span></div>
      {(draft ?? selected)?.why && <p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>{(draft ?? selected)?.why}</p>}
      {editing && draft && <label className="plan-review-date">Fecha de revisión<input type="date" value={draft.reviewDate} onChange={(event) => setDraft({ ...draft, reviewDate: event.target.value })} /></label>}
      <div className="panel-heading" style={{ marginBottom: 5 }}><h2>Estrategias para probar</h2><span className="muted" style={{ fontSize: 10 }}>{plan.strategies.length} {plan.strategies.length === 1 ? 'acción' : 'acciones'}</span></div>
      {selected?.status === 'approved' && <div className="progress-track" aria-label={`Progreso de acciones: ${progress}%`}><span style={{ width: `${progress}%` }} /></div>}
      {plan.strategies.map((strategy, index) => {
        const completed = (draft ?? selected)?.completedStrategies.includes(strategy.id) ?? false;
        return <article className={'strategy ' + (completed ? 'strategy-complete' : '')} key={strategy.id}>
          {!editing && selected?.status === 'approved' && <label className="strategy-check"><input type="checkbox" checked={completed} onChange={() => toggleStrategy(strategy.id)} aria-label={`Marcar como ${completed ? 'pendiente' : 'realizada'}: ${strategy.title}`} /></label>}
          <div className="strategy-index">0{index + 1}</div><div className="strategy-content">{editing && draft ? <><input className="textarea" aria-label={`Título de acción ${index + 1}`} value={strategy.title} onChange={(event) => updateStrategy(strategy.id, 'title', event.target.value)} /><textarea className="textarea" aria-label={`Detalle de acción ${index + 1}`} value={strategy.detail} onChange={(event) => updateStrategy(strategy.id, 'detail', event.target.value)} /></> : <><h3>{strategy.title}</h3><p>{strategy.detail}</p></>}</div>
          <div className="strategy-meta">{editing && draft ? <><input className="textarea" aria-label={`Responsable de acción ${index + 1}`} value={strategy.responsible} onChange={(event) => updateStrategy(strategy.id, 'responsible', event.target.value)} /><input className="textarea" aria-label={`Frecuencia de acción ${index + 1}`} value={strategy.cadence} onChange={(event) => updateStrategy(strategy.id, 'cadence', event.target.value)} /></> : <><strong>{strategy.responsible}</strong>{strategy.cadence}</>}</div>
        </article>;
      })}
      {selected?.indicator && <div className="notice"><span>◎</span><span><strong>Indicador observable:</strong> {selected.indicator}{selected.question ? <> · <strong>Pregunta de revisión:</strong> {selected.question}</> : null}</span></div>}
      <div className="notice"><span>✳</span><span>Son ideas para explorar, no instrucciones cerradas. Si una estrategia no encaja con el estudiante, el contexto o sus preferencias, se puede cambiar o descartar.</span></div>
      <div className="plan-footer"><span className="muted" style={{ fontSize: 10 }}>{selected ? `Guardado localmente · actualizado ${new Date(selected.updatedAt).toLocaleDateString('es-ES')}` : 'La demostración usa datos ficticios; se guardará solo si apruebas el plan.'}</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {editing ? <><button className="button button-secondary button-small" onClick={() => { setDraft(null); setEditing(false); }}>Cancelar</button><button className="button button-primary button-small" onClick={saveEdits}>Guardar cambios</button></> : <button className="button button-secondary button-small" onClick={beginEdit}>✎ &nbsp;Editar plan</button>}
        {!editing && status !== 'approved' && status !== 'completed' && <button className="button button-primary button-small" onClick={approve}>✓ &nbsp;Aprobar plan</button>}
        {!editing && status === 'approved' && <button className="button button-secondary button-small" onClick={complete}>Marcar completado</button>}
      </div></div>
    </section>

    {(selected?.status === 'approved' || selected?.status === 'completed') && <section className="panel section-space"><div className="panel-heading"><h2>Registrar una revisión</h2><span className="status">Seguimiento</span></div><p className="muted" style={{ fontSize: 11, lineHeight: 1.6 }}>¿Qué ayudó?, ¿qué cambiaríais? y ¿qué opina el estudiante? Guarda observaciones breves, sin nombres ni datos identificativos.</p><label className="sr-only" htmlFor="review-note">Nota de revisión</label><textarea id="review-note" className="textarea" maxLength={600} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Qué se observó y qué conviene revisar…"/><div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}><button className="button button-primary button-small" onClick={saveReview}>Guardar revisión</button></div>{selected.reviews.length > 0 && <ol className="review-history">{[...selected.reviews].reverse().map((review) => <li key={review.id}><time dateTime={review.savedAt}>{new Date(review.savedAt).toLocaleDateString('es-ES')}</time><p>{review.note}</p></li>)}</ol>}</section>}
    {message && <p className="pilot-message" role="status">{message}</p>}
    <section className="section-space" style={{ display: 'flex', gap: 9, alignItems: 'center' }}><span className="tag-dot" /><span className="muted" style={{ fontSize: 10 }}>Las propuestas no diagnostican ni explican por sí solas una conducta por las altas capacidades.</span></section>
    {!ready && <p className="muted">Recuperando planes de este navegador…</p>}
  </div></AppShell>;
}
