'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { parseCreatedActivity, parseSavedActivity, type ActivityVariant, type CreatedActivity } from '@/lib/created-activity';

const storageKey = 'sendia-created-activities-v1';
const routeLabels: Record<ActivityVariant['route'], string> = { representacion: 'Otra forma de acceder', expresion: 'Otra forma de demostrarlo', profundizacion: 'Más profundidad o elección' };

function loadSaved(): CreatedActivity[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? parsed.map(parseSavedActivity).filter((item): item is CreatedActivity => Boolean(item)) : [];
  } catch { return []; }
}

export function ActivityCreator() {
  const [mode, setMode] = useState<CreatedActivity['mode']>('crear');
  const [stage, setStage] = useState('Educación primaria');
  const [area, setArea] = useState('');
  const [objective, setObjective] = useState('');
  const [existingTask, setExistingTask] = useState('');
  const [requestedChange, setRequestedChange] = useState('');
  const [constraints, setConstraints] = useState('');
  const [interests, setInterests] = useState('');
  const [sourceDocument, setSourceDocument] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [current, setCurrent] = useState<CreatedActivity | null>(null);
  const [saved, setSaved] = useState<CreatedActivity[]>([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  useEffect(() => { setSaved(loadSaved()); }, []);
  const activeWorkflowStep = !current ? 1 : reviewConfirmed ? 3 : 2;

  const create = async () => {
    if (!consent || !area.trim() || !objective.trim()) return;
    setLoading(true); setError(''); setMessage(''); setCurrent(null);
    try {
      const payload = { mode, stage, area, objective, existingTask, requestedChange, constraints, interests, documentText, adultConsent: consent };
      let response: Response;
      if (sourceDocument && (sourceDocument.type === 'application/pdf' || sourceDocument.name.toLowerCase().endsWith('.pdf'))) {
        const form = new FormData(); form.set('payload', JSON.stringify(payload)); form.set('document', sourceDocument);
        response = await fetch('/api/crear', { method: 'POST', body: form });
      } else {
        response = await fetch('/api/crear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : 'No se pudo crear la actividad.');
      const parsed = parseCreatedActivity(result);
      setCurrent({ ...parsed, id: crypto.randomUUID(), createdAt: new Date().toISOString(), mode, stage, area });
      setReviewConfirmed(false);
      setMessage('Propuesta lista. Edita lo necesario antes de guardarla o llevarla al aula.');
      document.getElementById('actividad-generada')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo conectar con Gemini.'); }
    finally { setLoading(false); }
  };

  const edit = (update: (activity: CreatedActivity) => CreatedActivity) => {
    setCurrent((activity) => activity ? update(activity) : activity);
    setReviewConfirmed(false);
    setError('');
  };
  const save = () => {
    if (!current) return;
    if (!reviewConfirmed) { setError('Confirma que revisaste la propuesta antes de guardarla.'); return; }
    try { parseCreatedActivity(current); }
    catch { setError('Completa los campos editados antes de guardar la actividad.'); return; }
    const next = [current, ...saved.filter((item) => item.id !== current.id)].slice(0, 30);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaved(next); setMessage('Actividad guardada en este navegador.'); }
    catch { setError('No se pudo guardar. Comprueba el espacio disponible en este navegador.'); }
  };
  const copy = async () => {
    if (!current) return;
    const text = [current.title, `Objetivo: ${current.objective}`, `Etapa: ${current.stage} · Área: ${current.area}`, `Duración: ${current.duration}`, `Materiales: ${current.materials.join(', ')}`, 'Pasos:', ...current.steps.map((step, i) => `${i + 1}. ${step}`), ...current.variants.map((variant) => `\n${routeLabels[variant.route]} — ${variant.title}\n${variant.task}\nMateriales: ${variant.materials}\nObservar: ${variant.observe}`), `\nRevisión docente: ${current.reviewNote}`].join('\n');
    try { await navigator.clipboard.writeText(text); setMessage('Actividad copiada. Revísala y ajústala antes de compartirla.'); }
    catch { setMessage('No se pudo copiar automáticamente. Puedes seleccionar el contenido y copiarlo.'); }
  };
  const openSaved = (item: CreatedActivity) => { setCurrent(item); setMode(item.mode); setStage(item.stage); setArea(item.area); setObjective(item.objective); setReviewConfirmed(false); setMessage('Actividad recuperada. Revísala antes de descargar o guardar de nuevo.'); };
  const remove = (id: string) => { const next = saved.filter((item) => item.id !== id); localStorage.setItem(storageKey, JSON.stringify(next)); setSaved(next); if (current?.id === id) setCurrent(null); };
  const selectDocument = async (file?: File) => {
    setSourceDocument(null); setDocumentText(''); setConsent(false); setError(''); setMessage('');
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isText = ['.txt', '.md'].some((extension) => file.name.toLowerCase().endsWith(extension)) || file.type === 'text/plain' || file.type === 'text/markdown';
    if (!isPdf && !isText) { setError('Formato no compatible. Sube un PDF, TXT o Markdown.'); return; }
    if (isPdf && file.size > 8 * 1024 * 1024) { setError('El PDF debe pesar menos de 8 MB.'); return; }
    if (isText && file.size > 100 * 1024) { setError('El documento de texto debe pesar menos de 100 KB.'); return; }
    if (isPdf) { setSourceDocument(file); setMessage('PDF seleccionado. Se enviará a Gemini junto con los campos que revises.'); return; }
    try {
      const text = await file.text();
      if (text.length > 30_000) { setError('El documento contiene demasiado texto. Reduce el archivo a 30.000 caracteres.'); return; }
      setSourceDocument(file); setDocumentText(text); setMessage('Documento de texto seleccionado. Se incluirá su contenido en la propuesta.');
    } catch { setError('No se pudo leer el documento.'); }
  };
  const downloadReviewed = () => {
    if (!current || !reviewConfirmed) return;
    try { parseCreatedActivity(current); }
    catch { setError('Completa los campos editados antes de descargar la propuesta.'); return; }
    const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
    const list = (values: string[]) => `<ul>${values.map((value) => `<li>${escape(value)}</li>`).join('')}</ul>`;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escape(current.title)}</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:850px;margin:48px auto;padding:0 24px;color:#28272d}h1,h2{line-height:1.2}h1{font-size:32px}h2{margin-top:32px;color:#3657ff}article{border-top:1px solid #ddd;padding:18px 0;break-inside:avoid}.meta{color:#666;font-size:14px}.note{background:#f2f7e8;padding:16px}</style></head><body><p class="meta">SENDIA · PROPUESTA REVISADA POR DOCENTE</p><h1>${escape(current.title)}</h1><p><b>Etapa:</b> ${escape(current.stage)} · <b>Área:</b> ${escape(current.area)} · <b>Duración:</b> ${escape(current.duration)}</p><h2>Meta de aprendizaje</h2><p>${escape(current.objective)}</p><h2>Materiales</h2>${list(current.materials)}<h2>Desarrollo</h2>${list(current.steps)}<h2>Vías opcionales para la misma meta</h2>${current.variants.map((variant) => `<article><h3>${escape(routeLabels[variant.route])}: ${escape(variant.title)}</h3><p><b>Qué cambia:</b> ${escape(variant.change)}</p><p><b>Consigna:</b> ${escape(variant.task)}</p><p><b>Materiales:</b> ${escape(variant.materials)}</p><p><b>Observar:</b> ${escape(variant.observe)}</p></article>`).join('')}<h2>Antes de usar</h2><p class="note">${escape(current.reviewNote)}</p><p class="meta">Propuesta generada con IA y revisada por una persona docente. Ajustar al contexto del grupo.</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${current.title.trim().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '').slice(0, 70) || 'sendia-actividad'}-revisada.html`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Propuesta revisada descargada. Puedes abrir el archivo e imprimirlo o guardarlo como PDF.');
  };

  return <AppShell><div className="content creator-page">
    <div className="creator-hero"><div className="creator-hero-copy"><span className="case-label">SENDIA · TALLER DE DISEÑO DOCENTE</span><h1 className="page-title">Una meta.<br/><em>Más caminos.</em></h1><p>Crea desde cero o transforma una actividad que ya tienes. SENDIA te ayuda a abrir opciones sin cambiar lo que quieres que el grupo aprenda.</p></div><aside className="creator-hero-note"><span>EL MAPA DE UNA ACTIVIDAD</span><div className="creator-route-art" aria-label="Una meta con tres rutas posibles"><b>Meta</b><i/><div><span>Acceder</span><span>Expresar</span><span>Profundizar</span></div></div><small>La meta se mantiene. Tú eliges qué rutas tienen sentido para tu grupo.</small></aside></div>

    <ol className="creator-workflow" aria-label={`Paso ${activeWorkflowStep} de 3`}><li className={activeWorkflowStep > 1 ? 'done' : 'active'} aria-current={activeWorkflowStep === 1 ? 'step' : undefined}><span>{activeWorkflowStep > 1 ? '✓' : '01'}</span><div><b>Define la meta</b><small>Empieza por el aprendizaje, no por una etiqueta.</small></div></li><li className={activeWorkflowStep === 2 ? 'active' : activeWorkflowStep > 2 ? 'done' : ''} aria-current={activeWorkflowStep === 2 ? 'step' : undefined}><span>{activeWorkflowStep > 2 ? '✓' : '02'}</span><div><b>Abre posibilidades</b><small>Gemini prepara una propuesta editable.</small></div></li><li className={activeWorkflowStep === 3 ? 'active' : ''} aria-current={activeWorkflowStep === 3 ? 'step' : undefined}><span>03</span><div><b>Decide y llévala al aula</b><small>Revisa, descarga o guarda para después.</small></div></li></ol>

    <div className="creator-layout"><section className="creator-form panel" aria-labelledby="creator-form-title">
      <div className="panel-heading"><div><span className="eyebrow">TU MESA DE DISEÑO</span><h2 id="creator-form-title">¿Cómo quieres empezar?</h2><p>Elige una entrada. Después solo completarás lo necesario.</p></div></div>
      <div className="creator-mode-grid" role="group" aria-label="Tipo de trabajo"><button type="button" className={mode === 'crear' ? 'active' : ''} aria-pressed={mode === 'crear'} onClick={() => setMode('crear')}><span className="creator-mode-icon">✳</span><b>Crear</b><span>Partir de una meta de aprendizaje.</span></button><button type="button" className={mode === 'adaptar' ? 'active' : ''} aria-pressed={mode === 'adaptar'} onClick={() => setMode('adaptar')}><span className="creator-mode-icon">↗</span><b>Adaptar</b><span>Abrir otras formas de participar y demostrar.</span></button><button type="button" className={mode === 'modificar' ? 'active' : ''} aria-pressed={mode === 'modificar'} onClick={() => setMode('modificar')}><span className="creator-mode-icon">↻</span><b>Modificar</b><span>Cambiar algo concreto de la tarea actual.</span></button></div>
      <div className="creator-fields"><label>Etapa<select className="textarea" value={stage} onChange={(event) => setStage(event.target.value)}><option>Educación primaria</option><option>Educación secundaria</option><option>Formación técnico profesional</option><option>Educación superior</option><option>Otra etapa</option></select></label><label>Área o asignatura<input className="textarea" maxLength={100} value={area} onChange={(event) => setArea(event.target.value)} placeholder="Ej.: ciencias, lengua, matemática"/></label>
        <label className="creator-full">Meta de aprendizaje<input className="textarea" maxLength={800} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="¿Qué quieres que el grupo aprenda o pueda demostrar?"/><small>La IA no inventará la meta ni la cambiará para ajustarla a una actividad.</small></label>
        {mode !== 'crear' && <label className="creator-full">La actividad que ya tienes <span className="optional-label">(necesaria para adaptarla)</span><textarea className="textarea" maxLength={3000} value={existingTask} onChange={(event) => setExistingTask(event.target.value)} placeholder="Pega la consigna o describe brevemente la tarea. Quita nombres y datos personales."/></label>}
        {mode !== 'crear' && <label className="creator-full">{mode === 'modificar' ? '¿Qué quieres cambiar?' : '¿Qué te gustaría abrir o facilitar?'} <span className="optional-label">{mode === 'modificar' ? '(necesario)' : '(opcional)'}</span><textarea className="textarea" maxLength={1200} value={requestedChange} onChange={(event) => setRequestedChange(event.target.value)} placeholder="Ej.: ofrecer una opción visual, permitir otra forma de explicar o reducir la espera…"/></label>}
        <details className="creator-extra-details creator-full"><summary>Añadir contexto opcional: tiempo, recursos o intereses</summary><div className="creator-fields"><label>Tiempo, materiales o límites<textarea className="textarea" maxLength={800} value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Tiempo disponible, materiales cotidianos, trabajo individual o en equipo…"/></label><label>Intereses o fortalezas expresados<textarea className="textarea" maxLength={800} value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Solo información general y explícita, sin identificar a nadie."/></label></div></details>
        <label className="creator-document creator-full"><strong>¿Tienes un material que quieras usar?</strong><span className="optional-label">Opcional · puedes adjuntar un solo documento</span><input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={(event) => { void selectDocument(event.target.files?.[0]); event.currentTarget.value = ''; }}/><small>PDF hasta 8 MB o TXT/Markdown hasta 100 KB. Al adjuntarlo, su contenido se envía a Gemini. Anonimízalo antes de subirlo.</small>{sourceDocument && <span className="creator-file-chip"><b>{sourceDocument.name}</b><button type="button" onClick={() => selectDocument(undefined)}>Quitar documento</button></span>}</label>
      </div>
      <aside className="creator-safety"><b>Un criterio importante</b><p>No hace falta indicar que un estudiante tiene AACC ni otra condición. Describe la meta, lo que observas y qué opción educativa quieres explorar. SENDIA no asignará necesidades por una etiqueta.</p></aside>
      <label className="ai-consent creator-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>Soy una persona adulta, no he incluido datos identificativos y acepto enviar estos campos a Gemini para preparar la propuesta.</span></label>
      <details className="send-preview"><summary>Ver la información que se enviará</summary><p>El documento adjunto se envía completo a Gemini; SendIA no extrae ni anonimiza el contenido de un PDF.</p><pre>{JSON.stringify({ mode, stage, area, objective, existingTask, requestedChange, constraints, interests, documentText, attachedFile: sourceDocument ? { name: sourceDocument.name, type: sourceDocument.type, size: sourceDocument.size } : null }, null, 2)}</pre></details>
      <div className="case-actions"><button className="button button-primary" disabled={!consent || !area.trim() || !objective.trim() || (mode !== 'crear' && !existingTask.trim()) || (mode === 'modificar' && !requestedChange.trim()) || loading} onClick={create}>{loading ? 'Abriendo posibilidades…' : mode === 'crear' ? 'Diseñar actividad' : mode === 'adaptar' ? 'Proponer otras vías' : 'Preparar el cambio'} <span>→</span></button><span className="muted">Gemini prepara un borrador. No se guarda hasta que tú lo decidas.</span></div>
      {error && <p className="ai-error" role="alert">{error}</p>}{message && <p className="pilot-message" role="status">{message}</p>}
    </section>

    <aside className="creator-library panel"><span className="eyebrow">TU BANCO LOCAL</span><h2>Actividades guardadas</h2><p>Solo están disponibles en este navegador. No se comparten con otras personas.</p>{saved.length ? <ul>{saved.map((item) => <li key={item.id}><button type="button" onClick={() => openSaved(item)}><b>{item.title}</b><span>{item.stage} · {item.area}</span></button><button type="button" className="creator-remove" aria-label={`Eliminar ${item.title}`} onClick={() => remove(item.id)}>×</button></li>)}</ul> : <div className="creator-empty">Cuando guardes una propuesta, aparecerá aquí para que puedas retomarla.</div>}</aside>
    </div>

    {current && <section className="creator-result panel" id="actividad-generada" aria-labelledby="activity-result-title"><div className="creator-result-head"><div><span className="eyebrow">PASO 2 · BORRADOR PARA TRABAJAR</span><h2 id="activity-result-title">La propuesta ya está sobre la mesa.</h2><p>Empieza por la actividad central. Después decide si alguna ruta adicional le sirve a tu grupo.</p></div><span className="simulation-stamp">{reviewConfirmed ? 'REVISIÓN DOCENTE' : 'GENERADA CON IA'}<br/>{reviewConfirmed ? 'CONFIRMADA' : 'BORRADOR'}</span></div>
      <aside className="creator-result-guide"><b>Cómo usar esta propuesta</b><span>Edita cualquier campo aquí mismo. Las tres rutas son opciones flexibles para la misma meta; no tienes que usar todas.</span></aside>
      <div className="creator-fields creator-edit-fields"><label>Título<input className="textarea" value={current.title} onChange={(event) => edit((activity) => ({ ...activity, title: event.target.value }))}/></label><label>Duración<input className="textarea" value={current.duration} onChange={(event) => edit((activity) => ({ ...activity, duration: event.target.value }))}/></label><label className="creator-full">Meta de aprendizaje<textarea className="textarea" value={current.objective} onChange={(event) => edit((activity) => ({ ...activity, objective: event.target.value }))}/></label><label>Materiales <small>Uno por línea</small><textarea className="textarea" value={current.materials.join('\n')} onChange={(event) => edit((activity) => ({ ...activity, materials: event.target.value.split('\n') }))}/></label><label>Pasos <small>Uno por línea</small><textarea className="textarea creator-steps" value={current.steps.join('\n')} onChange={(event) => edit((activity) => ({ ...activity, steps: event.target.value.split('\n') }))}/></label></div>
      <div className="creator-variants"><h3>Tres vías opcionales para la misma meta</h3><p>Elige solo las que respondan al grupo y al contexto. No son niveles ni categorías de estudiantes.</p>{current.variants.map((variant, index) => <article className="creator-variant" key={variant.route}><span className="eyebrow">{routeLabels[variant.route]}</span><label>Título<input className="textarea" value={variant.title} onChange={(event) => edit((activity) => ({ ...activity, variants: activity.variants.map((item, i) => i === index ? { ...item, title: event.target.value } : item) }))}/></label><label>Qué cambia<textarea className="textarea" value={variant.change} onChange={(event) => edit((activity) => ({ ...activity, variants: activity.variants.map((item, i) => i === index ? { ...item, change: event.target.value } : item) }))}/></label><label>Consigna<textarea className="textarea" value={variant.task} onChange={(event) => edit((activity) => ({ ...activity, variants: activity.variants.map((item, i) => i === index ? { ...item, task: event.target.value } : item) }))}/></label><label>Materiales<input className="textarea" value={variant.materials} onChange={(event) => edit((activity) => ({ ...activity, variants: activity.variants.map((item, i) => i === index ? { ...item, materials: event.target.value } : item) }))}/></label><label>Qué observar<textarea className="textarea" value={variant.observe} onChange={(event) => edit((activity) => ({ ...activity, variants: activity.variants.map((item, i) => i === index ? { ...item, observe: event.target.value } : item) }))}/></label></article>)}</div>
      <label className="creator-review-note">Antes de usarla, revisa<textarea className="textarea" value={current.reviewNote} onChange={(event) => edit((activity) => ({ ...activity, reviewNote: event.target.value }))}/></label>
      <label className="creator-review-confirm"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => { setReviewConfirmed(event.target.checked); setError(''); }}/><span>He revisado y ajustado el contenido. Esta es la propuesta definitiva que quiero conservar o descargar.</span></label>
      <div className="case-actions"><button type="button" className="button button-primary" disabled={!reviewConfirmed} onClick={downloadReviewed}>Descargar propuesta revisada</button><button type="button" className="button button-secondary" disabled={!reviewConfirmed} onClick={() => window.print()}>Imprimir o guardar como PDF</button><button type="button" className="button button-secondary" disabled={!reviewConfirmed} onClick={save}>Guardar en mis actividades</button><button type="button" className="button button-secondary" disabled={!reviewConfirmed} onClick={copy}>Copiar para compartir</button></div>
    </section>}
  </div></AppShell>;
}
