'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { familyAgeBands, familyFocuses, familyStages, parseFamilyRoadmap, type FamilyFocusId, type FamilyRoadmap, type FamilyStageId } from '@/lib/family-roadmap';
import { familySources } from '@/lib/family-sources';
import { PrivacyAlias } from '@/components/privacy-alias';

type FamilyPath = 'roadmap' | 'school-talk' | 'home-situation';

const familyPaths: { id: FamilyPath; number: string; title: string; description: string; next: string; symbol: string }[] = [
  { id: 'roadmap', number: '01', title: 'Acabamos de recibir una identificación', description: 'Ordena dudas y piensa próximos pasos, sin tener que resolverlo todo hoy.', next: 'Crear una hoja de ruta', symbol: '↗' },
  { id: 'school-talk', number: '02', title: 'Quiero hablar con el centro', description: 'Prepara preguntas y acuerdos concretos para conversar con docentes u orientación.', next: 'Preparar la conversación', symbol: '↔' },
  { id: 'home-situation', number: '03', title: 'Hay algo que nos preocupa en casa', description: 'Describí una situación cotidiana y explorá un paso pequeño que puedan revisar en familia.', next: 'Explorar la situación', symbol: '⌂' },
];

export function FamilyRoadmapFlow() {
  const [path, setPath] = useState<FamilyPath | null>(null);
  const [stage, setStage] = useState<FamilyStageId>('new-identification');
  const [focus, setFocus] = useState<FamilyFocusId>('first-steps');
  const [ageBand, setAgeBand] = useState('prefer-not');
  const [context, setContext] = useState('');
  const [adultConsent, setAdultConsent] = useState(false);
  const [step, setStep] = useState(1);
  const [roadmap, setRoadmap] = useState<FamilyRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedStage = useMemo(() => familyStages.find((item) => item.id === stage)!, [stage]);
  const selectedFocus = useMemo(() => familyFocuses.find((item) => item.id === focus)!, [focus]);
  const usedSources = roadmap ? familySources.filter((source) => roadmap.sourceIds.includes(source.id)) : familySources;

  const generate = async () => {
    setError(''); setLoading(true);
    try {
      const response = await fetch('/api/familias/hoja-ruta', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, focus, ageBand, context, adultConsent }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error : 'No se pudo preparar la hoja. Inténtalo otra vez.';
        throw new Error(message);
      }
      setRoadmap(parseFamilyRoadmap(payload));
      setStep(3);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo conectar con la IA. Inténtalo más tarde.');
    } finally { setLoading(false); }
  };

  const choosePath = (next: FamilyPath) => {
    setPath(next); setRoadmap(null); setError(''); setAdultConsent(false);
    if (next === 'roadmap') { setStage('new-identification'); setFocus('first-steps'); setStep(1); }
    if (next === 'school-talk') { setStage('school-conversation'); setFocus('school'); setStep(2); }
    if (next === 'home-situation') { setStage('exploring-support'); setFocus('wellbeing'); setStep(2); }
  };
  const reset = () => { setPath(null); setRoadmap(null); setStep(1); setAdultConsent(false); setError(''); setContext(''); };
  const selectedPath = familyPaths.find((item) => item.id === path);

  return <AppShell><div className="content family-page">
    <section className="family-hero">
      <div className="family-hero-copy"><span className="case-label">UN ESPACIO PARA LAS FAMILIAS</span><h1>No tenés que resolverlo todo.<br/><em>Empezá por lo que necesitás.</em></h1><p>Elegí una situación. SendIA te ayuda a ordenar preguntas y preparar un siguiente paso, a tu ritmo.</p><div className="family-ai-label"><span aria-hidden="true">✳</span><span><strong>La IA prepara sugerencias para que las valores.</strong> No sustituye la orientación profesional.</span></div></div>
      <div className="family-hero-art" aria-hidden="true"><span className="family-route-line"/><span className="family-route-node family-node-start">HOY</span><span className="family-route-node family-node-middle">CONVERSAR</span><span className="family-route-node family-node-end">ELEGIR</span><span className="family-route-star">↗</span></div>
    </section>

    <aside className="family-boundary" role="note" aria-label="Límites de SendIA y cuidado de la privacidad"><span className="family-boundary-icon" aria-hidden="true">!</span><div className="family-boundary-copy"><strong>Una guía informativa, no un servicio profesional</strong><p>SendIA no es un servicio psicológico ni clínico. No diagnostica, no interpreta informes y no sustituye al profesional que realizó la evaluación ni al equipo educativo.</p><p className="family-boundary-privacy"><b>Para proteger la privacidad de tu hijo o hija:</b> no subas informes ni compartas nombres, puntuaciones, centros o datos que permitan identificarlo/a.</p></div></aside>

    {!path && !roadmap && <section className="family-path-picker" aria-labelledby="family-path-title"><div className="family-path-heading"><span className="eyebrow">¿QUÉ NECESITÁS HOY?</span><h2 id="family-path-title">Elegí por dónde empezar</h2><p>No hay un orden obligatorio. Entrá en la opción que más se parece a lo que están viviendo.</p></div><div className="family-path-grid">{familyPaths.map((item) => <button type="button" key={item.id} className={`family-path-card family-path-${item.id}`} onClick={() => choosePath(item.id)}><span className="family-path-top"><span>{item.number} · PARA FAMILIAS</span><span className="family-path-symbol" aria-hidden="true">{item.symbol}</span></span><strong>{item.title}</strong><p>{item.description}</p><span className="family-path-next">{item.next} <span aria-hidden="true">→</span></span></button>)}</div><p className="family-path-note">Podés volver y elegir otra opción en cualquier momento. No se crea un historial.</p></section>}

    {path && !roadmap && <section className="family-wizard" aria-labelledby="family-wizard-title">
      <div className="family-wizard-head"><div><span className="eyebrow">{path === 'roadmap' ? `HOJA DE RUTA · PASO ${step} DE 2` : `${selectedPath?.title.toUpperCase()} · PASO 1 DE 1`}</span><h2 id="family-wizard-title">{step === 1 ? '¿En qué momento estás?' : path === 'school-talk' ? '¿Qué querés aclarar con el centro?' : '¿Qué te ayudaría más ahora?'}</h2><p>{step === 1 ? 'No hay una fase correcta. Elegí la que más se parece a tu situación.' : path === 'school-talk' ? 'Elegí el tema principal. Después podés agregar contexto opcional y recibir preguntas para preparar la conversación.' : path === 'home-situation' ? 'Elegí qué querés comprender mejor. Después podés describir la situación sin incluir datos que identifiquen a tu hijo o hija.' : 'La IA usará estas respuestas para preparar sugerencias iniciales que podés tomar o dejar.'}</p></div>{path === 'roadmap' && <div className="family-step-indicator" aria-label={`Paso ${step} de 2`}><span className={step === 1 ? 'current' : 'complete'}>{step === 1 ? '01' : '✓'}</span><i/><span className={step === 2 ? 'current' : ''}>02</span></div>}</div>
      <div className="family-selected-path"><span aria-hidden="true">{selectedPath?.symbol}</span><div><strong>{selectedPath?.title}</strong><small>{path === 'roadmap' ? 'Recorrido guiado para ordenar próximos pasos.' : path === 'school-talk' ? 'Recorrido breve para preparar el diálogo con el centro.' : 'Recorrido breve para pensar una situación cotidiana.'}</small></div><button type="button" onClick={reset}>Cambiar opción</button></div>

      {step === 1 && <div className="family-stage-grid">{familyStages.map((item, index) => <button key={item.id} type="button" className={`family-choice ${stage === item.id ? 'selected' : ''}`} aria-pressed={stage === item.id} onClick={() => setStage(item.id)}><span className="family-choice-number">0{index + 1}</span><strong>{item.label}</strong><span className="family-choice-check" aria-hidden="true">{stage === item.id ? '✓' : '＋'}</span></button>)}</div>}

      {step === 2 && <div className="family-details-step">
        <fieldset className="family-focus-field"><legend>¿Cuál es tu pregunta más urgente?</legend><div className="family-focus-grid">{familyFocuses.map((item) => <label key={item.id} className={focus === item.id ? 'selected' : ''}><input type="radio" name="family-focus" value={item.id} checked={focus === item.id} onChange={() => setFocus(item.id)}/><span>{item.label}</span></label>)}</div></fieldset>
        <PrivacyAlias subject="tu hijo o hija"/>
        <div className="family-optional-context"><label htmlFor="family-age">Edad aproximada <span>(opcional)</span><select id="family-age" value={ageBand} onChange={(event) => setAgeBand(event.target.value)}>{familyAgeBands.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label htmlFor="family-context">¿Querés agregar algo de contexto? <span>(opcional)</span><textarea id="family-context" value={context} maxLength={700} onChange={(event) => setContext(event.target.value)} placeholder="Por ejemplo: qué te gustaría aclarar en la próxima conversación con el centro. Si hace falta, usá el alias; no incluyas nombres ni detalles del informe."/><small>{context.length}/700 · No escribas datos personales, puntuaciones ni información clínica.</small></label></div>
        <details className="family-data-details"><summary>¿Qué se enviará a Gemini?</summary><p>La fase que seleccionaste («{selectedStage.label}»), el tema elegido («{selectedFocus.label}»), el tramo de edad si lo indicaste y el contexto opcional. Se envían para generar la hoja y no se guardan en SendIA.</p></details>
        <label className="family-consent"><input type="checkbox" checked={adultConsent} onChange={(event) => setAdultConsent(event.target.checked)}/><span>Soy una persona adulta. Usé un alias ficticio y quité nombres y otras pistas que podrían identificar a mi hijo o hija; acepto enviar estas respuestas a Gemini.</span></label>
      </div>}

      {error && <p className="family-error" role="alert">{error}</p>}
      <div className="family-wizard-actions">{step === 2 && <button type="button" className="button button-secondary" onClick={() => path === 'roadmap' ? (setStep(1), setError('')) : reset()}>{path === 'roadmap' ? '← Volver' : '← Elegir otra opción'}</button>}{step === 1 ? <button type="button" className="button button-primary" onClick={() => { setStep(2); setError(''); }}>Continuar <span>→</span></button> : <button type="button" className="button button-primary" disabled={!adultConsent || loading} onClick={() => void generate()}>{loading ? 'Preparando sugerencias…' : path === 'school-talk' ? 'Preparar mi conversación' : path === 'home-situation' ? 'Explorar esta situación' : 'Generar mi hoja de ruta'} <span aria-hidden="true">→</span></button>}</div>
      <p className="family-no-save">SendIA no almacena tus respuestas ni crea un historial de hojas. Podés generar otra si cambia la situación.</p>
    </section>}

    {roadmap && <section className="family-roadmap-result" aria-labelledby="family-result-title">
      <div className="family-result-top"><div><span className="eyebrow">BORRADOR GENERADO POR IA · REVÍSENLO CON CALMA</span><h2 id="family-result-title">{path === 'school-talk' ? 'Una conversación mejor preparada.' : path === 'home-situation' ? 'Un primer paso para esta situación.' : 'Una hoja para este momento.'}</h2><p>{roadmap.summary}</p><span className="family-context-chip">{selectedStage.label}</span></div><div className="family-result-actions"><button className="button button-secondary" onClick={() => window.print()}>Imprimir / guardar PDF</button><button className="family-text-button" onClick={reset}>Elegir otra opción</button></div></div>
      <div className="family-result-columns">
        <section className="family-roadmap-phase family-now"><span className="family-phase-number">01</span><div><span className="eyebrow">SIN PRISA · PRIMEROS PASOS</span><h3>Lo que pueden hacer ahora</h3></div><div className="family-step-list">{roadmap.firstSteps.map((item, index) => <article key={`${item.title}-${index}`}><span>0{index + 1}</span><div><h4>{item.title}</h4><p>{item.action}</p><small>{item.reason}</small></div></article>)}</div></section>
        <section className="family-roadmap-phase family-later"><span className="family-phase-number">02</span><div><span className="eyebrow">CUANDO LES VENGA BIEN</span><h3>Qué pueden conversar y revisar</h3></div><div className="family-step-list">{roadmap.nextSteps.map((item, index) => <article key={`${item.title}-${index}`}><span>0{index + 1}</span><div><h4>{item.title}</h4><p>{item.action}</p><small>{item.reason}</small></div></article>)}</div></section>
      </div>
      <div className="family-conversation-grid"><section><span className="eyebrow">ESCUCHAR SU VOZ</span><h3>Preguntas para conversar con tu hijo o hija</h3><ul>{roadmap.childConversation.map((item, index) => <li key={index}>{item}</li>)}</ul><p>Elegí un momento tranquilo. No hace falta hacer todas las preguntas ni obtener respuestas inmediatas.</p></section><section><span className="eyebrow">EN DIÁLOGO CON EL CENTRO</span><h3>Preguntas para una reunión</h3><ul>{roadmap.schoolConversation.map((item, index) => <li key={index}>{item}</li>)}</ul><p>Adapten las preguntas a la organización y los recursos de su centro.</p></section></div>
      <aside className="family-support-note"><span className="family-support-icon" aria-hidden="true">＋</span><div><h3>Cuándo buscar apoyo profesional</h3><p>{roadmap.humanSupport}</p><p className="family-urgent-note">Si existe un riesgo inmediato para la seguridad de alguien, contactá con los servicios de emergencia o de ayuda urgente de tu localidad.</p></div></aside>
      <aside className="family-remember"><strong>Para tener presente</strong><p>{roadmap.keepInMind}</p></aside>
      <div className="family-ai-disclaimer"><strong>Transparencia sobre la IA y sus límites</strong><p>Gemini generó este borrador a partir de las opciones que elegiste y del contexto que escribiste. No es orientación profesional ni personalizada; puede equivocarse, simplificar o pasar algo por alto. Las referencias que aparecen abajo son lecturas orientativas disponibles para el sistema; Gemini no consultó sus textos en tiempo real ni verificó cada sugerencia con ellas. Conversá sobre lo importante con profesionales cualificados. SendIA no almacena esta hoja como historial; imprimila o guardala en PDF si querés conservarla.</p></div>
      <section className="family-sources"><span className="eyebrow">BIBLIOGRAFÍA Y RECURSOS ORIENTATIVOS</span><h3>Lecturas relacionadas con esta hoja</h3><ul>{usedSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.author} · {source.year}</span><small>{source.note}</small></a></li>)}</ul></section>
      <button type="button" className="family-new-roadmap" onClick={reset}>← Volver a empezar</button>
    </section>}

    {!roadmap && <section className="family-source-preview"><span className="eyebrow">UN MARCO, NO UNA RECETA</span><h2>La hoja se inspira en fuentes identificables.</h2><p>SendIA combina recursos para familias, revisiones académicas sobre las experiencias parentales y socioemocionales, y un informe internacional sobre inclusión. Estas fuentes orientan el marco; no sustituyen una valoración profesional ni prueban que una sugerencia concreta sea adecuada para cada familia.</p><div>{familySources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.author.split(' · ')[0]} · {source.year} ↗</a>)}</div></section>}
    <p className="family-page-footnote">La hoja es informativa y no constituye atención profesional. Si tenés dudas sobre una evaluación, consultá a quien la realizó o a un profesional cualificado de tu localidad.</p>
  </div></AppShell>;
}
