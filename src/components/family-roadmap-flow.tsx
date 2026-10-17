'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { familyAgeBands, familyFocuses, familyStages, parseFamilyRoadmap, type FamilyFocusId, type FamilyRoadmap, type FamilyStageId } from '@/lib/family-roadmap';
import { familySources } from '@/lib/family-sources';
import { PrivacyAlias } from '@/components/privacy-alias';

export function FamilyRoadmapFlow() {
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

  const reset = () => { setRoadmap(null); setStep(1); setAdultConsent(false); setError(''); };

  return <AppShell><div className="content family-page">
    <section className="family-hero">
      <div className="family-hero-copy"><span className="case-label">UN ESPACIO PARA LAS FAMILIAS</span><h1>Recibiste una respuesta.<br/><em>¿Y ahora qué?</em></h1><p>Una hoja de ruta para ordenar tus preguntas y preparar próximos pasos, según el momento que está viviendo tu familia.</p><div className="family-ai-label"><span aria-hidden="true">✳</span><span><strong>Generada con inteligencia artificial.</strong> Son sugerencias informativas, no orientación profesional.</span></div></div>
      <div className="family-hero-art" aria-hidden="true"><span className="family-route-line"/><span className="family-route-node family-node-start">HOY</span><span className="family-route-node family-node-middle">CONVERSAR</span><span className="family-route-node family-node-end">ELEGIR</span><span className="family-route-star">↗</span></div>
    </section>

    <aside className="family-boundary" role="note"><strong>Antes de empezar</strong><span>SendIA no es un servicio profesional, psicológico ni clínico. No diagnostica, no interpreta informes y no sustituye al profesional que realizó la evaluación ni al equipo educativo. No subas informes ni compartas nombres, puntuaciones, centros o datos que identifiquen a tu hijo/a.</span></aside>

    {!roadmap && <section className="family-wizard" aria-labelledby="family-wizard-title">
      <div className="family-wizard-head"><div><span className="eyebrow">HOJA DE RUTA · PASO {step} DE 2</span><h2 id="family-wizard-title">{step === 1 ? '¿En qué momento estáis?' : '¿Qué os ayudaría más ahora?'}</h2><p>{step === 1 ? 'No hay una fase correcta. Elige la que más se parece a vuestra situación.' : 'La IA usará estas respuestas para preparar sugerencias iniciales que podéis tomar o dejar.'}</p></div><div className="family-step-indicator" aria-label={`Paso ${step} de 2`}><span className={step === 1 ? 'current' : 'complete'}>{step === 1 ? '01' : '✓'}</span><i/><span className={step === 2 ? 'current' : ''}>02</span></div></div>

      {step === 1 && <div className="family-stage-grid">{familyStages.map((item, index) => <button key={item.id} type="button" className={`family-choice ${stage === item.id ? 'selected' : ''}`} aria-pressed={stage === item.id} onClick={() => setStage(item.id)}><span className="family-choice-number">0{index + 1}</span><strong>{item.label}</strong><span className="family-choice-check" aria-hidden="true">{stage === item.id ? '✓' : '＋'}</span></button>)}</div>}

      {step === 2 && <div className="family-details-step">
        <fieldset className="family-focus-field"><legend>¿Cuál es vuestra pregunta más urgente?</legend><div className="family-focus-grid">{familyFocuses.map((item) => <label key={item.id} className={focus === item.id ? 'selected' : ''}><input type="radio" name="family-focus" value={item.id} checked={focus === item.id} onChange={() => setFocus(item.id)}/><span>{item.label}</span></label>)}</div></fieldset>
        <PrivacyAlias subject="tu hijo/a"/>
        <div className="family-optional-context"><label htmlFor="family-age">Edad aproximada <span>(opcional)</span><select id="family-age" value={ageBand} onChange={(event) => setAgeBand(event.target.value)}>{familyAgeBands.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label htmlFor="family-context">¿Quieres añadir algo de contexto? <span>(opcional)</span><textarea id="family-context" value={context} maxLength={700} onChange={(event) => setContext(event.target.value)} placeholder="Por ejemplo: qué os gustaría aclarar en la próxima conversación con el centro. Si hace falta, usa el alias; no incluyas nombres ni detalles del informe."/><small>{context.length}/700 · No escribas datos personales, puntuaciones ni información clínica.</small></label></div>
        <details className="family-data-details"><summary>¿Qué se enviará a Gemini?</summary><p>La fase que seleccionaste («{selectedStage.label}»), el tema elegido («{selectedFocus.label}»), el tramo de edad si lo indicaste y el contexto opcional. Se envían para generar la hoja y no se guardan en SendIA.</p></details>
        <label className="family-consent"><input type="checkbox" checked={adultConsent} onChange={(event) => setAdultConsent(event.target.checked)}/><span>Soy una persona adulta. No he escrito el nombre real ni datos que identifiquen a mi hijo/a; acepto enviar estas respuestas a Gemini para generar sugerencias.</span></label>
      </div>}

      {error && <p className="family-error" role="alert">{error}</p>}
      <div className="family-wizard-actions">{step === 2 && <button type="button" className="button button-secondary" onClick={() => { setStep(1); setError(''); }}>← Volver</button>}{step === 1 ? <button type="button" className="button button-primary" onClick={() => { setStep(2); setError(''); }}>Continuar <span>→</span></button> : <button type="button" className="button button-primary" disabled={!adultConsent || loading} onClick={() => void generate()}>{loading ? 'Preparando sugerencias…' : 'Generar mi hoja de ruta'} <span aria-hidden="true">→</span></button>}</div>
      <p className="family-no-save">SendIA no almacena tus respuestas ni crea un historial de hojas. Puedes generar otra si cambia vuestra situación.</p>
    </section>}

    {roadmap && <section className="family-roadmap-result" aria-labelledby="family-result-title">
      <div className="family-result-top"><div><span className="eyebrow">BORRADOR GENERADO POR IA · REVÍSALO CON CALMA</span><h2 id="family-result-title">Una hoja para vuestro momento.</h2><p>{roadmap.summary}</p><span className="family-context-chip">{selectedStage.label}</span></div><div className="family-result-actions"><button className="button button-secondary" onClick={() => window.print()}>Imprimir / guardar PDF</button><button className="family-text-button" onClick={reset}>Crear otra hoja</button></div></div>
      <div className="family-result-columns">
        <section className="family-roadmap-phase family-now"><span className="family-phase-number">01</span><div><span className="eyebrow">SIN PRISA · PRIMEROS PASOS</span><h3>Lo que podéis hacer ahora</h3></div><div className="family-step-list">{roadmap.firstSteps.map((item, index) => <article key={`${item.title}-${index}`}><span>0{index + 1}</span><div><h4>{item.title}</h4><p>{item.action}</p><small>{item.reason}</small></div></article>)}</div></section>
        <section className="family-roadmap-phase family-later"><span className="family-phase-number">02</span><div><span className="eyebrow">CUANDO OS VENGA BIEN</span><h3>Qué podéis conversar y revisar</h3></div><div className="family-step-list">{roadmap.nextSteps.map((item, index) => <article key={`${item.title}-${index}`}><span>0{index + 1}</span><div><h4>{item.title}</h4><p>{item.action}</p><small>{item.reason}</small></div></article>)}</div></section>
      </div>
      <div className="family-conversation-grid"><section><span className="eyebrow">ESCUCHAR SU VOZ</span><h3>Preguntas para conversar con tu hijo/a</h3><ul>{roadmap.childConversation.map((item, index) => <li key={index}>{item}</li>)}</ul><p>Elige un momento tranquilo. No hace falta hacer todas las preguntas ni obtener respuestas inmediatas.</p></section><section><span className="eyebrow">EN DIÁLOGO CON EL CENTRO</span><h3>Preguntas para una reunión</h3><ul>{roadmap.schoolConversation.map((item, index) => <li key={index}>{item}</li>)}</ul><p>Adapta las preguntas a la organización y los recursos de vuestro centro.</p></section></div>
      <aside className="family-support-note"><span className="family-support-icon" aria-hidden="true">＋</span><div><h3>Cuándo buscar apoyo profesional</h3><p>{roadmap.humanSupport}</p><p className="family-urgent-note">Si existe un riesgo inmediato para la seguridad de alguien, contacta con los servicios de emergencia o ayuda urgente de tu localidad.</p></div></aside>
      <aside className="family-remember"><strong>Para tener presente</strong><p>{roadmap.keepInMind}</p></aside>
      <div className="family-ai-disclaimer"><strong>Transparencia sobre la IA y sus límites</strong><p>Gemini generó este borrador a partir de las opciones que elegiste y del contexto que escribiste. No es orientación profesional ni personalizada; puede equivocarse, simplificar o pasar algo por alto. Las referencias que aparecen abajo son lecturas orientativas disponibles para el sistema; Gemini no consultó sus textos en tiempo real ni verificó cada sugerencia con ellas. Contrasta lo importante con profesionales cualificados. SendIA no almacena esta hoja como historial; imprímela o guárdala en PDF si quieres conservarla.</p></div>
      <section className="family-sources"><span className="eyebrow">BIBLIOGRAFÍA Y RECURSOS ORIENTATIVOS</span><h3>Lecturas relacionadas con esta hoja</h3><ul>{usedSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.author} · {source.year}</span><small>{source.note}</small></a></li>)}</ul></section>
      <button type="button" className="family-new-roadmap" onClick={reset}>← Volver a empezar</button>
    </section>}

    {!roadmap && <section className="family-source-preview"><span className="eyebrow">UN MARCO, NO UNA RECETA</span><h2>La hoja se inspira en fuentes identificables.</h2><p>SendIA combina recursos para familias, revisiones académicas sobre las experiencias parentales y socioemocionales, y un informe internacional sobre inclusión. Estas fuentes orientan el marco; no sustituyen una valoración profesional ni prueban que una sugerencia concreta sea adecuada para cada familia.</p><div>{familySources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.author.split(' · ')[0]} · {source.year} ↗</a>)}</div></section>}
    <p className="family-page-footnote">La hoja es informativa y no constituye atención profesional. En caso de dudas sobre una evaluación, consulta a quien la realizó o a un profesional cualificado de tu localidad.</p>
  </div></AppShell>;
}
