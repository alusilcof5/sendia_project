'use client';

import { useState } from 'react';
import type { StoredPlan } from '@/lib/plan-store';
import { parseGeneratedOutputs, type GeneratedOutputs } from '@/lib/schemas';

type Audience = keyof GeneratedOutputs;
const labels: Record<Audience, string> = { teacher: 'Docente', family: 'Familia', school: 'Escuela' };

function lines(values: string[]) { return values.map((value) => `• ${value}`).join('\n'); }

function outputText(audience: Audience, outputs: GeneratedOutputs): string {
  if (audience === 'teacher') {
    const { goal, variants } = outputs.teacher;
    return [`BORRADOR GENERADO CON IA · REQUIERE REVISIÓN HUMANA`, `Meta: ${goal}`, ...variants.map((item) => `${item.level.toUpperCase()}\nTarea: ${item.task}\nMateriales: ${item.materials}\nObservar: ${item.observation}${item.withoutTechnology ? '\nPuede realizarse sin tecnología.' : ''}`)].join('\n\n');
  }
  if (audience === 'family') {
    const item = outputs.family;
    return `BORRADOR GENERADO CON IA · REQUIERE REVISIÓN HUMANA\n\n${item.guide}\n\nPreguntas para conversar:\n${lines(item.questions)}\n\nActividad en casa: ${item.homeActivity}\n\nEvita concluir que: ${item.avoidConclusion}`;
  }
  const item = outputs.school;
  return `BORRADOR GENERADO CON IA · REQUIERE REVISIÓN HUMANA\n\nSituación: ${item.situation}\n\nObservaciones:\n${lines(item.observations)}\n\nDudas abiertas:\n${lines(item.openQuestions)}\n\nIndicador: ${item.indicator}\nRevisión: ${item.reviewDate}\nConsultar con orientación: ${item.consultWhen}`;
}

export function PlanOutputs({ plan }: { plan: StoredPlan }) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [outputs, setOutputs] = useState<GeneratedOutputs | null>(null);
  const [audience, setAudience] = useState<Audience>('teacher');
  const providerPlanPreview = { title: plan.title, objective: plan.objective, strategies: plan.strategies.map(({ title, detail, responsible, cadence }) => ({ title, detail, responsible, cadence })), indicator: plan.indicator, question: plan.question, reviewDate: plan.reviewDate };

  const generate = async () => {
    if (!consent || plan.status !== 'approved') return;
    setLoading(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/understanding/outputs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'outputs', plan, adultConsent: true, confirmed: consent }) });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'No se pudieron preparar los borradores.');
      setOutputs(parseGeneratedOutputs(body));
      setMessage('Borradores preparados. Revisa y edita antes de compartirlos.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron preparar los borradores.'); }
    finally { setLoading(false); }
  };

  const edit = (update: (current: GeneratedOutputs) => GeneratedOutputs) => setOutputs((current) => current ? update(current) : current);
  const copyOutput = async () => {
    if (!outputs) return;
    try { await navigator.clipboard.writeText(outputText(audience, outputs)); setMessage('Texto copiado. Revísalo antes de compartirlo.'); }
    catch { setMessage('No se pudo copiar automáticamente. Puedes seleccionar el texto y copiarlo.'); }
  };

  return <section className="panel plan-outputs" aria-labelledby="outputs-heading">
    <div className="panel-heading"><div><span className="eyebrow">DIVERSIFICAR · BORRADORES</span><h2 id="outputs-heading">Preparar materiales para compartir</h2></div><span className="status">Solo después de aprobar el plan</span></div>
    <p>Desde este plan puedes preparar una guía para la familia, variantes de actividad para el docente y un resumen para la escuela. Los borradores no se envían ni guardan; tú decides qué editar y compartir.</p>
    {!outputs && <><details className="send-preview"><summary>Revisar exactamente los datos del plan que se enviarán</summary><pre>{JSON.stringify(providerPlanPreview, null, 2)}</pre></details><div className="outputs-consent-box"><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Revisé el plan y quité nombres y datos que puedan identificar al estudiante. Acepto enviarlo a Gemini para generar los borradores.</span></label><button className="button button-primary button-small" disabled={!consent || loading} onClick={generate}>{loading ? 'Preparando borradores…' : 'Generar los tres borradores'}</button></div></>}
    {error && <p className="ai-error" role="alert">{error}</p>}
    {message && <p className="pilot-message" role="status">{message}</p>}
    {outputs && <>
      <div className="output-audience-tabs" role="tablist" aria-label="Tipo de borrador">{(Object.keys(labels) as Audience[]).map((key) => <button key={key} type="button" role="tab" id={`output-tab-${key}`} aria-controls="generated-output-panel" aria-selected={audience === key} className={audience === key ? 'active' : ''} onClick={() => setAudience(key)}>{labels[key]}</button>)}</div>
      <article className="generated-output" id="generated-output-panel" role="tabpanel" aria-labelledby={`output-tab-${audience}`}>
        <div className="generated-output-notice">BORRADOR GENERADO CON IA · REQUIERE REVISIÓN HUMANA</div>
        {audience === 'teacher' && <><label>Meta de aprendizaje<textarea className="textarea" value={outputs.teacher.goal} onChange={(event) => edit((current) => ({ ...current, teacher: { ...current.teacher, goal: event.target.value } }))} /></label>{outputs.teacher.variants.map((variant, index) => <fieldset className="output-variant" key={variant.level}><legend>Variante de {variant.level}</legend><label>Tarea<textarea className="textarea" value={variant.task} onChange={(event) => edit((current) => ({ ...current, teacher: { ...current.teacher, variants: current.teacher.variants.map((item, i) => i === index ? { ...item, task: event.target.value } : item) } }))} /></label><label>Materiales<textarea className="textarea" value={variant.materials} onChange={(event) => edit((current) => ({ ...current, teacher: { ...current.teacher, variants: current.teacher.variants.map((item, i) => i === index ? { ...item, materials: event.target.value } : item) } }))} /></label><label>Qué observar<textarea className="textarea" value={variant.observation} onChange={(event) => edit((current) => ({ ...current, teacher: { ...current.teacher, variants: current.teacher.variants.map((item, i) => i === index ? { ...item, observation: event.target.value } : item) } }))} /></label>{variant.withoutTechnology && <p>Esta opción puede realizarse sin tecnología.</p>}</fieldset>)}</>}
        {audience === 'family' && <><label>Guía breve<textarea className="textarea" value={outputs.family.guide} onChange={(event) => edit((current) => ({ ...current, family: { ...current.family, guide: event.target.value } }))} /></label>{outputs.family.questions.map((question, index) => <label key={index}>Pregunta {index + 1}<textarea className="textarea" value={question} onChange={(event) => edit((current) => ({ ...current, family: { ...current.family, questions: current.family.questions.map((item, i) => i === index ? event.target.value : item) as [string, string, string] } }))} /></label>)}<label>Actividad breve en casa<textarea className="textarea" value={outputs.family.homeActivity} onChange={(event) => edit((current) => ({ ...current, family: { ...current.family, homeActivity: event.target.value } }))} /></label><label>Qué no concluir<textarea className="textarea" value={outputs.family.avoidConclusion} onChange={(event) => edit((current) => ({ ...current, family: { ...current.family, avoidConclusion: event.target.value } }))} /></label></>}
        {audience === 'school' && <><label>Situación<textarea className="textarea" value={outputs.school.situation} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, situation: event.target.value } }))} /></label><label>Observaciones<textarea className="textarea" value={outputs.school.observations.join('\n')} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, observations: event.target.value.split('\n') } }))} /></label><label>Dudas abiertas<textarea className="textarea" value={outputs.school.openQuestions.join('\n')} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, openQuestions: event.target.value.split('\n') } }))} /></label><label>Indicador<textarea className="textarea" value={outputs.school.indicator} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, indicator: event.target.value } }))} /></label><label>Fecha o intervalo de revisión<textarea className="textarea" value={outputs.school.reviewDate} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, reviewDate: event.target.value } }))} /></label><label>Cuándo consultar con orientación<textarea className="textarea" value={outputs.school.consultWhen} onChange={(event) => edit((current) => ({ ...current, school: { ...current.school, consultWhen: event.target.value } }))} /></label></>}
      </article>
      <div className="case-actions"><button className="button button-secondary button-small" onClick={copyOutput}>Copiar este borrador</button><button className="button button-primary button-small" onClick={() => window.print()}>Imprimir o guardar como PDF</button></div>
      <p className="muted">Los cambios quedan solo en esta pantalla. Imprime a PDF desde el diálogo de impresión para compartir una copia revisada.</p>
    </>}
  </section>;
}
