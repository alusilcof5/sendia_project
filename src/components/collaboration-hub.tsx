'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { demoPlan } from '@/lib/demo-data';
import { readPlans, type StoredPlan } from '@/lib/plan-store';

const storageKey = 'sendia-team-agreements-v1';

const perspectives = [
  { id: 'student', title: 'Voz del estudiante', prompt: '¿Qué dice que le ayuda o qué le gustaría probar?', color: 'student' },
  { id: 'family', title: 'Perspectiva de la familia', prompt: '¿En qué momentos lo ven distinto? ¿Qué apoyos le sirven?', color: 'family' },
  { id: 'school', title: 'Perspectiva de la escuela', prompt: '¿Qué ocurre con la tarea, las instrucciones y el grupo?', color: 'school' },
  { id: 'guidance', title: 'Orientación y apoyos', prompt: '¿Qué conviene observar o coordinar entre profesionales?', color: 'guidance' },
] as const;

type PerspectiveId = typeof perspectives[number]['id'];
type TeamAgreement = {
  id: string;
  planTitle: string;
  goal: string;
  perspectives: Partial<Record<PerspectiveId, string>>;
  action: string;
  responsible: string;
  indicator: string;
  reviewDate: string;
  savedAt: string;
  fictitious: boolean;
};

function validAgreement(value: unknown): value is TeamAgreement {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.planTitle === 'string' && typeof item.goal === 'string' &&
    typeof item.action === 'string' && typeof item.responsible === 'string' && typeof item.indicator === 'string' &&
    typeof item.reviewDate === 'string' && typeof item.savedAt === 'string' && typeof item.fictitious === 'boolean' &&
    Boolean(item.perspectives && typeof item.perspectives === 'object');
}

function dateAfterAWeek() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function CollaborationHub() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [agreements, setAgreements] = useState<TeamAgreement[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('demo');
  const [notes, setNotes] = useState<Partial<Record<PerspectiveId, string>>>({});
  const [action, setAction] = useState('');
  const [responsible, setResponsible] = useState('Equipo docente');
  const [indicator, setIndicator] = useState('');
  const [reviewDate, setReviewDate] = useState(dateAfterAWeek);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [shareMessage, setShareMessage] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    setPlans(readPlans());
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setAgreements(Array.isArray(stored) ? stored.filter(validAgreement) : []);
    } catch { setAgreements([]); }
  }, []);

  const usablePlans = useMemo(() => plans.filter((plan) => plan.status === 'approved' || plan.status === 'completed'), [plans]);
  const selectedPlan = selectedPlanId === 'demo' ? null : usablePlans.find((plan) => plan.id === selectedPlanId) ?? null;
  const isFictitious = !selectedPlan || selectedPlan.source === 'demo';
  const goal = selectedPlan?.objective ?? demoPlan.objective;
  const availableStrategies = selectedPlan?.strategies ?? demoPlan.strategies;

  useEffect(() => {
    setAction(availableStrategies[0]?.detail ?? '');
    setIndicator(selectedPlan?.indicator ?? 'Observar si inicia la actividad y qué apoyo necesita.');
    setReviewDate(selectedPlan?.reviewDate ?? dateAfterAWeek());
    setNotes({});
    setConfirmed(false);
  }, [selectedPlanId]);

  const saveAgreement = () => {
    if (!confirmed || !action.trim() || !indicator.trim() || !reviewDate) return;
    const agreement: TeamAgreement = {
      id: crypto.randomUUID(), planTitle: selectedPlan?.title ?? demoPlan.title, goal,
      perspectives: Object.fromEntries(Object.entries(notes).filter(([, value]) => value?.trim()).map(([key, value]) => [key, value!.trim()])),
      action: action.trim(), responsible, indicator: indicator.trim(), reviewDate,
      savedAt: new Date().toISOString(), fictitious: isFictitious,
    };
    try {
      const updated = [agreement, ...agreements];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setAgreements(updated); setMessage('Acuerdo guardado en este navegador.');
      setNotes({}); setConfirmed(false);
    } catch { setMessage('No se pudo guardar. Comprueba el espacio disponible del navegador.'); }
  };

  const removeAgreement = (id: string) => {
    const updated = agreements.filter((agreement) => agreement.id !== id);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); setAgreements(updated); setMessage('Acuerdo eliminado de este navegador.'); }
    catch { setMessage('No se pudo eliminar el acuerdo.'); }
  };

  const shareAgreement = async (agreement: TeamAgreement) => {
    const perspectiveText = perspectives
      .map((item) => agreement.perspectives[item.id] ? `${item.title}: ${agreement.perspectives[item.id]}` : '')
      .filter(Boolean);
    const text = [
      `Acuerdo SendIA: ${agreement.planTitle}`,
      `Objetivo: ${agreement.goal}`,
      ...perspectiveText,
      `Paso para probar: ${agreement.action}`,
      `Coordina: ${agreement.responsible}`,
      `Qué observar: ${agreement.indicator}`,
      `Volver a conversar: ${agreement.reviewDate}`,
      'Acuerdo preparado en SendIA. Revisar y ajustar conjuntamente.',
    ].join('\n\n');
    setShareMessage(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Acuerdo SendIA · ${agreement.planTitle}`, text });
        setShareMessage({ id: agreement.id, text: 'Se abrió la opción de compartir del dispositivo. Elige tú con quién y por qué canal compartirlo.' });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareMessage({ id: agreement.id, text: 'Resumen copiado. Pégalo en el canal que el equipo haya acordado.' });
        return;
      }
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'acuerdo-sendia.txt';
      link.click();
      URL.revokeObjectURL(url);
      setShareMessage({ id: agreement.id, text: 'Resumen descargado. Revísalo antes de compartirlo.' });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareMessage({ id: agreement.id, text: 'No se pudo preparar el resumen para compartir.' });
    }
  };

  return <AppShell><div className="content collaboration-page">
    <div className="eyebrow">SENDIA · ACOMPAÑAR EN EQUIPO</div>
    <section className="collab-hero">
      <div className="collab-hero-copy">
        <span className="case-label">UNA SENDA COMPARTIDA, MÁS CONTEXTO</span>
        <h1 className="page-title serif">Nadie acompaña<br/><em>en solitario.</em></h1>
        <p>Cuando familia, estudiante y escuela ponen en común lo que observan, es más fácil evitar conclusiones rápidas y acordar un apoyo coherente. En altas capacidades pueden coexistir la necesidad de reto y la necesidad de apoyo; por eso conviene coordinar cómo acompañarlas.</p>
        <div className="collab-primary-actions"><Link className="button button-primary" href="/colaboracion/equipo">Abrir espacio de equipo <span>→</span></Link><Link className="button button-secondary collab-brainstorm-cta" href="/colaboracion/ideas">Abrir lluvia de ideas <span>↗</span></Link></div>
      </div>
      <div className="collab-orbit" aria-label="Estudiante, familia y escuela alrededor de un acuerdo común">
        <span className="collab-orbit-line"/><span className="collab-orbit-core">Un<br/>acuerdo</span>
        <span className="collab-orbit-node collab-node-student">Estudiante</span><span className="collab-orbit-node collab-node-family">Familia</span><span className="collab-orbit-node collab-node-school">Escuela</span>
      </div>
    </section>

    <section className="collab-principles" aria-label="Principios para colaborar">
      <article><span>01</span><div><h2>Escuchar perspectivas</h2><p>La voz del estudiante aporta información que las personas adultas no pueden sustituir.</p></div></article>
      <article><span>02</span><div><h2>Acordar un paso común</h2><p>Familia y escuela pueden probar apoyos compatibles y saber quién hace qué.</p></div></article>
      <article><span>03</span><div><h2>Volver a conversar</h2><p>Compartir qué ocurrió permite ajustar el apoyo sin convertir una observación en etiqueta.</p></div></article>
    </section>

    <section className="collab-workspace" aria-labelledby="collab-workspace-title">
      <div className="collab-section-heading"><div><span className="eyebrow">BORRADOR EN ESTE DISPOSITIVO</span><h2 id="collab-workspace-title">Prepara un acuerdo para conversar.</h2><p>Este borrador se guarda solo en este navegador. Para coordinar un plan con permisos y seguimiento compartido, usa el <Link href="/colaboracion/equipo">espacio de equipo</Link>.</p></div><span className="demo-pill">Guardado local</span></div>

      <div className="collab-form-grid">
        <div className="collab-form-main">
          <label className="collab-field" htmlFor="collab-plan">1. ¿Qué plan quieren revisar?
            <select id="collab-plan" value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
              <option value="demo">Ejemplo ficticio · {demoPlan.title}</option>
              {usablePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}
            </select>
            <small>{selectedPlan ? 'Plan guardado en este navegador.' : 'Ejemplo para practicar; no corresponde a un estudiante real.'}</small>
          </label>
          <div className="collab-goal"><span>OBJETIVO COMPARTIDO</span><p>{goal}</p></div>

          <fieldset className="collab-perspectives"><legend>2. ¿Qué aporta cada persona?</legend><p className="collab-field-help">Anota solo lo necesario para conversar. Puedes dejar cualquier campo vacío.</p>
            {perspectives.map((item) => <label className={'collab-perspective collab-perspective-' + item.color} key={item.id} htmlFor={'perspective-' + item.id}><span>{item.title}</span><small>{item.prompt}</small><textarea id={'perspective-' + item.id} maxLength={300} value={notes[item.id] ?? ''} onChange={(event) => { setNotes((current) => ({ ...current, [item.id]: event.target.value })); setConfirmed(false); }} placeholder="Una idea breve, sin nombres ni datos identificativos…"/></label>)}
          </fieldset>
        </div>

        <aside className="collab-agreement-card">
          <span className="eyebrow">3. ACUERDO PARA PROBAR</span><h3>Un paso pequeño, con fecha de vuelta.</h3>
          <label className="collab-field" htmlFor="collab-action">Qué probar
            <select id="collab-action" value={action} onChange={(event) => { setAction(event.target.value); setConfirmed(false); }}>{availableStrategies.map((strategy) => <option key={strategy.id} value={strategy.detail}>{strategy.title} · {strategy.detail}</option>)}</select>
          </label>
          <label className="collab-field" htmlFor="collab-responsible">Quién coordina
            <select id="collab-responsible" value={responsible} onChange={(event) => setResponsible(event.target.value)}><option>Equipo docente</option><option>Docente y familia</option><option>Docente y estudiante</option><option>Equipo docente y orientación</option><option>Familia y docente</option></select>
          </label>
          <label className="collab-field" htmlFor="collab-indicator">Qué observar
            <textarea id="collab-indicator" maxLength={300} value={indicator} onChange={(event) => { setIndicator(event.target.value); setConfirmed(false); }} placeholder="Un cambio concreto que puedan observar…"/>
          </label>
          <label className="collab-field" htmlFor="collab-review">Cuándo volver a conversar<input id="collab-review" type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)}/></label>
          <label className="collab-consent"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>He revisado el texto: no contiene nombres ni datos que identifiquen a un menor. Entiendo que el acuerdo se guarda en este navegador.</span></label>
          <button className="button button-primary collab-save" disabled={!confirmed || !action.trim() || !indicator.trim() || !reviewDate} onClick={saveAgreement}>Guardar acuerdo de equipo <span>→</span></button>
          {message && <p className="pilot-message" role="status">{message}</p>}
        </aside>
      </div>
      <p className="collab-local-note"><strong>Alcance actual:</strong> esto ayuda a preparar y registrar la conversación en un solo navegador. Todavía no invita a otras cuentas ni sincroniza acuerdos entre familia, docente y orientación.</p>
    </section>

    <section className="collab-saved section-space" aria-labelledby="collab-saved-title">
      <div className="collab-section-heading"><div><span className="eyebrow">CONTINUIDAD</span><h2 id="collab-saved-title">Acuerdos para retomar.</h2><p>Volver a lo acordado ayuda a que el acompañamiento no dependa de una sola conversación.</p></div><Link className="text-link" href="/planes/plan-aula">Abrir Mis planes →</Link></div>
      {agreements.length === 0 ? <div className="collab-empty"><span aria-hidden="true">↗</span><div><strong>Aún no hay acuerdos guardados.</strong><p>Prepara uno arriba con el caso ficticio o con un plan de este navegador.</p></div></div> : <div className="collab-agreement-list">{agreements.map((agreement) => <article className="collab-saved-card" key={agreement.id}>
        <div className="collab-saved-top"><div><span className="case-label">{agreement.fictitious ? 'EJEMPLO FICTICIO' : 'ACUERDO LOCAL'}</span><h3>{agreement.planTitle}</h3></div><button className="case-back-link" onClick={() => removeAgreement(agreement.id)}>Eliminar</button></div>
        <p className="collab-saved-goal">{agreement.goal}</p>
        <div className="collab-saved-details"><span><small>QUÉ PROBAR</small>{agreement.action}</span><span><small>QUIÉN COORDINA</small>{agreement.responsible}</span><span><small>REVISAR</small>{agreement.reviewDate}</span></div>
        <details><summary>Ver perspectivas y qué observar</summary><div className="collab-saved-perspectives">{perspectives.map((item) => agreement.perspectives[item.id] ? <p key={item.id}><strong>{item.title}</strong>{agreement.perspectives[item.id]}</p> : null)}<p><strong>Indicador</strong>{agreement.indicator}</p></div></details>
        <div className="collab-share-actions"><button className="button button-secondary button-small" onClick={() => void shareAgreement(agreement)}>Preparar resumen para compartir <span>↗</span></button></div>
        <p className="collab-share-note">Se abrirá el menú del dispositivo o se copiará/descargará un resumen. SendIA no lo envía ni sincroniza: revisa el contenido y elige un canal seguro con el equipo.</p>
        {shareMessage?.id === agreement.id && <p className="pilot-message" role="status">{shareMessage.text}</p>}
      </article>)}</div>}
    </section>

    <section className="collab-pilot-invite" aria-labelledby="collab-pilot-title">
      <div className="collab-pilot-mark" aria-hidden="true">◎</div>
      <div className="collab-pilot-copy"><span className="eyebrow">PARA EQUIPOS QUE ESTÁN PROBANDO SENDIA</span><h2 id="collab-pilot-title">¿El recorrido resulta claro y útil?</h2><p>Si vuestro equipo está realizando un pilotaje, podéis recoger la percepción de las personas adultas antes y después de explorar la herramienta. Es una evaluación opcional para aprender qué funciona y qué conviene mejorar; no evalúa al estudiante ni demuestra que SendIA cause cambios.</p></div>
      <Link className="button button-secondary" href="/impacto">Evaluar el pilotaje <span aria-hidden="true">→</span></Link>
    </section>
  </div></AppShell>;
}
