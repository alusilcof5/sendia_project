'use client';

import { useEffect, useState } from 'react';
import { AppShell } from './app-shell';
import { alexCase, demoBranches, initialHypotheses } from '@/lib/demo-data';
import { parseAdaptiveQuestion, parseGeneratedGuidance, parseHypothesisReview, type AdaptiveQuestion, type DemoBranch, type GeneratedGuidance, type NextStep, type Situation } from '@/lib/schemas';
import { deriveReviewDate, makeStoredPlan, readPlans, upsertPlan } from '@/lib/plan-store';
import { findDirectIdentifiers, findPossibleNameWarnings, identifierMessage } from '@/lib/privacy';
import { teacherCases, type TeacherCase } from '@/lib/teacher-cases';
import { hasTeacherDemoSession } from '@/lib/teacher-session';
import { TeacherBetaShell } from '@/components/teacher-beta-shell';
import { useRouter } from 'next/navigation';
import { aiSituationLabels, countries, copy } from '@/lib/i18n/es-419';
import { understandingProfiles, type UnderstandingProfile } from '@/lib/understanding-profiles';

const situations: { id: Situation; icon: string; title: string; detail: string }[] = [
  { id: 'participation', icon: '↗', title: 'Participación', detail: 'Algo cambia según la actividad.' },
  { id: 'frustration', icon: '⌁', title: 'Inicio y bloqueo', detail: 'Le cuesta encontrar cómo empezar.' },
  { id: 'relationships', icon: '♡', title: 'Relaciones', detail: 'Hay desencuentros que explorar.' },
  { id: 'challenge', icon: '✳', title: 'Reto y aprendizaje', detail: 'El desafío puede variar entre tareas.' },
  { id: 'asynchrony', icon: '◷', title: 'Ritmos distintos', detail: 'Las necesidades cambian entre áreas o momentos.' },
  { id: 'perfectionism', icon: '⌕', title: 'Miedo a equivocarse', detail: 'El error o la exposición pueden influir.' },
  { id: 'motivation', icon: '↗', title: 'Interés y motivación', detail: 'La participación cambia con el tema o la tarea.' },
  { id: 'transitions', icon: '⇄', title: 'Cambios y transiciones', detail: 'Cuesta pasar de una actividad o momento a otro.' },
];
const questions = [
  { id: 'objective', title: '¿Qué objetivo resuelve Alex con autonomía?', detail: 'Ayuda a diferenciar rapidez de dominio demostrado.', branch: 'skill-specific' as const },
  { id: 'format', title: '¿Qué ocurre si cambia el formato o la consigna?', detail: 'Permite explorar si las instrucciones influyen en el inicio.', branch: 'contradictory' as const },
  { id: 'context', title: '¿En qué momentos participa más y qué dice Alex?', detail: 'Añade contexto y la perspectiva del propio estudiante.', branch: 'insufficient' as const },
];
const demoLabels = ['Situación', 'Pregunta', 'Dato nuevo', 'Siguiente paso'];
const ownLabels = ['Situación', 'Contexto', 'Preguntas', 'Tu paso'];
const statusLabels = { compatible: 'Compatible con lo observado', insufficient: 'Información insuficiente', contradictory: 'Contradice o cuestiona', unsupported: 'Sin respaldo suficiente' };
const plainPrincipleLabels: Record<'representación' | 'acción y expresión' | 'implicación', string> = {
  representación: 'Presentar la información de otra forma',
  'acción y expresión': 'Permitir otra forma de mostrar lo aprendido',
  implicación: 'Conectar con intereses o dar opciones',
};
const evidenceRefLabels: Record<string, string> = {
  observation: 'situación observada', learningGoal: 'meta', currentEvidence: 'evidencia actual',
  expectedDemonstration: 'forma de demostrarlo', studentPerspective: 'voz del estudiante',
  context: 'contexto', strengthsAndInterests: 'fortalezas o intereses', knownSupportNeeds: 'apoyos conocidos', history: 'respuestas previas',
};
function evidenceSources(refs?: string[]) {
  return refs?.length ? refs.map((ref) => evidenceRefLabels[ref] ?? ref).join(' · ') : 'sin referencias disponibles';
}

function FlowProgress({ labels, current }: { labels: string[]; current: number }) {
  return <ol className="flow-progress" aria-label={`Paso ${current + 1} de ${labels.length}: ${labels[current]}`}>
    {labels.map((label, index) => <li key={label} className={index < current ? 'is-done' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}>
      <span>{index < current ? '✓' : index + 1}</span><small>{label}</small>
    </li>)}
  </ol>;
}

function StatusPill({ status }: { status: keyof typeof statusLabels }) {
  return <span className={'evidence-status evidence-' + status}>{statusLabels[status]}</span>;
}

export function UnderstandingFlow({ betaMode = false, initialProfile }: { betaMode?: boolean; initialProfile?: UnderstandingProfile }) {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'demo' | 'own'>(initialProfile ? 'own' : 'choose');
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<DemoBranch | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [teacherCase, setTeacherCase] = useState<TeacherCase | null>(null);
  const [profile, setProfile] = useState<UnderstandingProfile>(initialProfile ?? 'teacher');

  useEffect(() => {
    const caseId = new URLSearchParams(window.location.search).get('caso');
    if (!caseId) {
      if (betaMode) { router.replace('/beta/docentes/casos'); return; }
      const startMode = new URLSearchParams(window.location.search).get('modo');
      if (startMode === 'propio') setMode('own');
      if (startMode === 'demo') { setStep(0); setBranch(null); setSelectedQuestion(''); setMode('demo'); }
      if (startMode === 'ejemplo') {
        setTeacherCase({ id: 'alex-demo', title: 'Ejemplo guiado · Alex', situation: 'challenge', observation: 'En las tareas repetitivas termina rápido y después deja de trabajar. En tareas abiertas, a veces le cuesta explicar cómo llegó a una respuesta.', context: 'No se ha comparado el formato, el nivel de desafío, el tiempo ni los apoyos. La perspectiva de Alex está pendiente.', support: 'En este ejemplo ficticio, muestra interés en resolver problemas y compartir ideas.' });
        setMode('own');
      }
      return;
    }
    if (!betaMode) { window.location.replace('/beta/comprender?caso=' + encodeURIComponent(caseId)); return; }
    if (!hasTeacherDemoSession()) { router.replace('/beta/docentes/acceso'); return; }
    const selected = teacherCases.find((item) => item.id === caseId);
    if (!selected) { router.replace('/beta/docentes/casos'); return; }
    setTeacherCase(selected);
    setMode('own');
  }, [router, betaMode]);
  if (betaMode && mode !== 'own') return <TeacherBetaShell showLibrary><div className="teacher-beta-content"><p role="status">Abriendo el caso de ejemplo…</p></div></TeacherBetaShell>;
  if (mode === 'own') return <OwnSituation profile={profile} initialProfile={initialProfile} initialCase={teacherCase} betaMode={betaMode} onBack={() => {
    if (initialProfile) { router.push('/comprender'); return; }
    setTeacherCase(null); setMode('choose'); window.history.replaceState(null, '', '/comprender');
  }} />;
  const currentBranch = branch ? demoBranches[branch] : null;
  const reviews = currentBranch?.reviews.map((review) => parseHypothesisReview(review)) ?? [];
  const goTo = (next: number) => setStep(next);
  const visibleStep = step === 0 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;
  const chosenQuestion = questions.find((item) => item.id === selectedQuestion);
  const profileRoutes: Record<UnderstandingProfile, string> = { teacher: '/comprender/aula', school: '/comprender/centro', family: '/comprender/casa' };

  return <AppShell><div className="content case-experience">
    <div className="case-eyebrow"><span className="case-eye">◎</span> COMPRENDER · LABORATORIO DE HIPÓTESIS</div>
    {mode === 'choose' ? <>
      <section className="case-welcome">
      <div className="case-welcome-copy"><span className="case-label">PARA FAMILIAS Y PROFESIONALES EDUCATIVOS</span><h1 className="case-display">Primero,<br/><em>comprender.</em></h1><p>Parte de una situación real sin datos identificativos, o prueba con un ejemplo. SendIA te ayuda a explorar qué falta saber y a pensar un siguiente paso revisable.</p></div>
      <aside className="case-welcome-art" aria-hidden="true"><span className="case-orbit case-orbit-a"/><span className="case-orbit case-orbit-b"/><span className="case-art-center">?</span><span className="case-art-note">OBSERVAR<br/>≠ ADIVINAR</span><span className="case-art-caption">UNA PREGUNTA<br/>PUEDE CAMBIARLO TODO</span></aside>
      </section>
      <section className="understanding-pathway-panel" aria-label="Elige el espacio que corresponde a tu situación">
        <div className="understanding-pathway-heading"><span className="case-label">EMPIEZA POR TU CONTEXTO</span><h2>¿Desde dónde quieres acompañar?</h2><p>Cada espacio abre su propio recorrido, con preguntas adaptadas a tu papel.</p></div>
        <div className="understanding-pathways">{(Object.entries(understandingProfiles) as [UnderstandingProfile, typeof understandingProfiles[UnderstandingProfile]][]).map(([id, item]) => <button className={`understanding-pathway pathway-${id}`} key={id} onClick={() => router.push(profileRoutes[id])}><span>{item.label}</span><strong>{item.title}</strong><small>{item.description}</small><em>Entrar a este espacio <b>→</b></em></button>)}</div>
        <div className="understanding-demo-row"><span><strong>¿Quieres ver un ejemplo antes?</strong><small>Alex es un caso ficticio; la demo no usa Gemini en vivo ni guarda un plan.</small></span><button className="case-own-button" onClick={() => { setStep(0); setBranch(null); setSelectedQuestion(''); setMode('demo'); }}>Ver la demo de Alex <b>→</b></button></div>
        <details className="case-extra-option"><summary>Quiero probar Gemini con el caso ficticio de Alex</summary><p>Esta opción avanzada usa la misma situación ficticia y requiere conexión y consentimiento.</p><button className="button button-secondary button-small" onClick={() => {
          setTeacherCase({ id: 'alex-demo', title: 'Ejemplo guiado · Alex', situation: 'challenge', observation: 'En las tareas repetitivas termina rápido y después deja de trabajar. En tareas abiertas, a veces le cuesta explicar cómo llegó a una respuesta.', context: 'No se ha comparado el formato, el nivel de desafío, el tiempo ni los apoyos. La perspectiva de Alex está pendiente.', support: 'En este ejemplo ficticio, muestra interés en resolver problemas y compartir ideas.' });
          setProfile('teacher');
          setMode('own');
        }}>Continuar con Alex y Gemini →</button></details>
        {!betaMode && <a className="case-teacher-link" href="/beta/docentes/acceso">Docentes: consultar casos de ejemplo</a>}
        <span className="demo-disclaimer">{copy.privacy.noStudentIdentifiers}</span>
      </section>
    </> : <>
      <div className="case-page-heading"><div><span className="case-label">EJEMPLO FICTICIO · ALEX · 10 AÑOS</span><h1 className="case-page-title">{step === 0 ? 'Primero, lo que sabemos.' : step === 2 ? 'Elige qué averiguar.' : step === 3 ? 'Este dato es una simulación.' : 'Un paso pequeño para probar.'}</h1></div><span className="simulation-stamp">DEMO PREPARADA<br/>SIN IA EN VIVO</span></div>
      <FlowProgress labels={demoLabels} current={visibleStep} />

      {step === 0 && <section className="case-board">
        <div className="case-board-intro"><span className="case-step-no">01 / SITUACIÓN</span><h2>Antes de explicar, miremos con cuidado.</h2><p>Estos son los datos iniciales del caso. Separamos lo observado de lo que todavía no sabemos.</p></div>
        <div className="evidence-grid">{alexCase.observations.map((item, index) => <article key={item.id} className={'evidence-card evidence-card-' + item.kind}><span className="evidence-index">0{index + 1}</span><span className="source-label">{item.kind === 'unknown' ? 'DATO DESCONOCIDO' : 'OBSERVACIÓN APORTADA'}</span><p>{item.text}</p></article>)}</div>
        <details className="hypothesis-alternatives demo-initial-hypotheses"><summary>Ver explicaciones que todavía están abiertas</summary><ul>{initialHypotheses.map((item) => <li key={item.id}><strong>{item.title}</strong><p>{item.summary}</p></li>)}</ul></details>
        <div className="case-actions"><button className="button button-primary" onClick={() => goTo(2)}>Elegir qué averiguar <span>→</span></button><button className="case-back-link" onClick={() => setMode('choose')}>Volver a las opciones</button></div>
      </section>}

      {step === 2 && <section className="case-board"><div className="case-board-intro"><span className="case-step-no">02 / PREGUNTA ÚTIL</span><h2>¿Qué dato ayudaría a distinguir estas explicaciones?</h2><p>Elige una pregunta. Después verás el dato ficticio asociado a ella.</p></div><div className="question-choice-grid">{questions.map((item) => <button key={item.id} className={'question-choice ' + (selectedQuestion === item.id ? 'selected' : '')} aria-pressed={selectedQuestion === item.id} onClick={() => setSelectedQuestion(item.id)}><span className="choice-select">{selectedQuestion === item.id ? '✓' : '↗'}</span><strong>{item.title}</strong><span>{item.detail}</span></button>)}</div>{chosenQuestion && <div className="why-question"><span>POR QUÉ PUEDE AYUDAR</span><p>{chosenQuestion.detail} Es una elección de exploración, no una conclusión sobre Alex.</p></div>}<div className="case-actions"><button className="button button-primary" disabled={!chosenQuestion} onClick={() => { if (!chosenQuestion) return; setBranch(chosenQuestion.branch); goTo(3); }}>Ver el dato de ejemplo <span>→</span></button><button className="case-back-link" onClick={() => goTo(0)}>← Revisar la situación</button></div></section>}

      {step === 3 && currentBranch && <section className="case-board"><div className="case-board-intro"><span className="case-step-no">03 / DATO DE EJEMPLO</span><h2>La pregunta que elegiste:</h2><p className="selected-question-copy">{chosenQuestion?.title}</p></div><article className="new-information"><span>INFORMACIÓN FICTICIA ASOCIADA A ESTA PREGUNTA</span><p>{currentBranch.newInformation.text}</p></article><p className="demo-sim-note">Este dato está preparado para la demostración; no es una respuesta generada por IA ni una observación real.</p><div className="case-actions"><button className="button button-primary" onClick={() => goTo(4)}>Ver el siguiente paso <span>→</span></button><button className="case-back-link" onClick={() => goTo(2)}>← Elegir otra pregunta</button></div></section>}

      {step === 4 && currentBranch && <section className="case-board"><div className="case-board-intro"><span className="case-step-no">04 / SIGUIENTE PASO</span><h2>¿Qué cambia con esta información?</h2><p className="change-summary">{currentBranch.changeSummary}</p></div><div className="review-grid">{reviews.map((item) => <article key={item.id} className={'review-card review-' + item.status}><div className="review-card-head"><h3>{item.title}</h3><StatusPill status={item.status}/></div><p>{item.summary}</p><details className="hypothesis-alternatives"><summary>Ver qué encaja y qué falta</summary><div className="review-columns"><div><strong>Qué encaja</strong><ul>{item.supporting.map((value) => <li key={value}>{value}</li>)}</ul></div><div><strong>Qué falta</strong><ul>{item.missing.map((value) => <li key={value}>{value}</li>)}</ul></div></div><p><strong>Otra explicación:</strong> {item.alternatives[0]}</p></details></article>)}</div><article className="next-step-card demo-next-step"><span className="next-step-label">PASO PEQUEÑO PARA PROBAR</span><h3>{currentBranch.nextStep.action}</h3><p><strong>Objetivo:</strong> {currentBranch.nextStep.objective}</p><p><strong>Quién:</strong> {currentBranch.nextStep.responsible}</p><p><strong>Qué observar:</strong> {currentBranch.nextStep.indicator}</p><p><strong>Cuándo revisar:</strong> {currentBranch.nextStep.reviewIn}</p></article><p className="demo-disclaimer">Es una idea de ejemplo, no una decisión automática. Puedes comentarla con el estudiante y adaptarla. El ejemplo no se guarda ni se comparte.</p><div className="case-actions"><button className="button button-primary" onClick={() => { setMode('choose'); setStep(0); setBranch(null); setSelectedQuestion(''); }}>Terminar ejemplo</button><button className="case-back-link" onClick={() => goTo(3)}>← Volver al dato</button></div></section>}

    </>}
  </div></AppShell>;
}

function OwnSituation({ onBack, initialCase, betaMode, profile, initialProfile }: { onBack: () => void; initialCase: TeacherCase | null; betaMode: boolean; profile: UnderstandingProfile; initialProfile?: UnderstandingProfile }) {
  const [stage, setStage] = useState(0);
  const [situation, setSituation] = useState<Situation>(initialCase?.situation ?? 'other');
  const [observation, setObservation] = useState(initialCase?.observation ?? '');
  const [learningGoal, setLearningGoal] = useState('');
  const [currentEvidence, setCurrentEvidence] = useState('');
  const [expectedDemonstration, setExpectedDemonstration] = useState('');
  const [studentPerspective, setStudentPerspective] = useState('');
  const [context, setContext] = useState(initialCase?.context ?? '');
  const [support, setSupport] = useState(initialCase?.support ?? '');
  const [knownNeeds, setKnownNeeds] = useState('');
  const [country, setCountry] = useState('');
  const [question, setQuestion] = useState<AdaptiveQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [answersHistory, setAnswersHistory] = useState<{ question: string; answer: string }[]>([]);
  const [guidance, setGuidance] = useState<GeneratedGuidance | null>(null);
  const [draftStep, setDraftStep] = useState<NextStep | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [approved, setApproved] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [possibleNameWarnings, setPossibleNameWarnings] = useState<string[]>([]);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [lastAction, setLastAction] = useState<'question' | 'guidance'>('question');
  const [conversationCopyStatus, setConversationCopyStatus] = useState('');
  const profileCopy = understandingProfiles[profile];
  const situationPrompt = profile === 'family' ? '¿Qué ocurre en casa?' : profile === 'school' ? '¿Qué necesita coordinar el centro?' : '¿Qué está pasando en el aula?';
  const situationExample = profile === 'family' ? 'Por ejemplo: «Al llegar la hora de los deberes, terminamos discutiendo y no sabemos cómo acompañar».' : profile === 'school' ? 'Por ejemplo: «Cada equipo responde de forma distinta y no tenemos un seguimiento compartido».' : 'Por ejemplo: «En las tareas abiertas tarda en empezar y pide ayuda con el primer paso».';
  const goalLabel = profile === 'family' ? '¿Qué te gustaría que fuera más fácil?' : profile === 'school' ? '¿Qué cambio concreto busca el centro?' : '¿Qué aprendizaje se busca?';
  const goalHint = profile === 'family' ? 'Puede ser algo cotidiano, como empezar los deberes con menos tensión. Si aún no lo sabes, déjalo vacío.' : profile === 'school' ? 'Describe un resultado que el equipo pueda observar; no hace falta que sea un objetivo formal.' : 'La meta permite valorar si una idea facilita el acceso o cambia lo que se espera aprender.';
  const contextLabel = profile === 'family' ? '¿Qué suele pasar antes, durante y después?' : profile === 'school' ? '¿Qué respuesta existe ya y quiénes participan?' : '¿Qué pasaba alrededor?';
  const contextPlaceholder = profile === 'family' ? 'Rutinas, momento del día, qué han probado y qué parece ayudar…' : profile === 'school' ? 'Acuerdos existentes, personas implicadas, recursos y dónde falta coordinación…' : 'Tarea, instrucciones, momento o grupo…';
  const supportLabel = profile === 'family' ? '¿Qué disfruta, qué le interesa o qué suele ayudar en casa?' : profile === 'school' ? '¿Qué recursos o apoyos tiene disponibles el centro?' : '¿Qué fortalezas, intereses o retos le interesan?';
  const voiceLabel = profile === 'family' ? '¿Qué ha expresado el niño o adolescente?' : profile === 'school' ? '¿Qué ha expresado el estudiante?' : '¿Qué ha dicho el estudiante sobre la situación?';
  const progressLabel = stage === 2 ? `Pregunta ${Math.min(answersHistory.length + 1, 3)} de hasta 3` : ownLabels[stage];
  const updateText = (setter: (value: string) => void, value: string) => { setter(value); setWarningAcknowledged(false); setPossibleNameWarnings([]); };
  const previewHistory = [...answersHistory, ...(stage === 2 && question && answer.trim() ? [{ question: question.question, answer: answer.trim() }] : [])];
  const providerPreview = { profile, situation: situation ? aiSituationLabels[situation] : '', observation, learningGoal, currentEvidence, expectedDemonstration, studentPerspective, context, strengthsAndInterests: support, knownSupportNeeds: knownNeeds, history: previewHistory, ...(country ? { country } : {}) };
  const generate = async (action: 'question' | 'guidance') => {
    const submittedText = [observation, learningGoal, currentEvidence, expectedDemonstration, studentPerspective, context, support, knownNeeds, answer, ...answersHistory.flatMap((item) => [item.question, item.answer])].join('\n');
    if (!aiConsent) { setError('Confirma que eres una persona adulta y que has retirado los datos identificativos antes de continuar.'); return; }
    const identifiers = findDirectIdentifiers(submittedText);
    if (identifiers.length) { setError(identifierMessage(identifiers.map(({ kind }) => kind))); return; }
    const possibleNames = findPossibleNameWarnings(submittedText);
    if (possibleNames.length && !warningAcknowledged) { setPossibleNameWarnings([...new Set(possibleNames)]); setError('Revisa si alguna palabra señalada identifica a una persona.'); return; }
    setLastAction(action); setLoading(true); setError('');
    try {
      const currentAnswer = question && answer.trim() ? [{ question: question.question, answer: answer.trim() }] : [];
      const history = [...answersHistory, ...currentAnswer];
      const response = await fetch('/api/understanding/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, action, situation, observation, learningGoal, evidence: currentEvidence, expectedDemonstration, studentPerspective, context, support, necesidadesConocidas: knownNeeds, pais: country || undefined, question: question?.question ?? '', answer, history, adultConsent: aiConsent }) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'No se pudo generar una respuesta.');
      if (action === 'question') { setAnswersHistory(history); setQuestion(parseAdaptiveQuestion(result)); setAnswer(''); setStage(2); }
      else { const parsed = parseGeneratedGuidance(result); setAnswersHistory(history); setGuidance(parsed); setDraftStep(parsed.nextStep); setSelectedOption(null); setApproved(false); setPlanId(null); setStage(3); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo conectar con la IA.'); }
    finally { setLoading(false); }
  };
  const chooseDiversification = (index: number) => {
    if (!guidance) return;
    setSelectedOption(index);
    setConversationCopyStatus('');
    setDraftStep((current) => current ? { ...current, action: guidance.diversification[index].strategy } : current);
  };
  const copyConversationGuide = async () => {
    if (!guidance || selectedOption === null || !draftStep) return;
    const option = guidance.diversification[selectedOption];
    const goal = guidance.goalClear ? option.learningGoal : 'Aclarar la meta de aprendizaje antes de adaptar la actividad';
    const text = [
      profile === 'family' ? 'Quisiera conversar sobre cómo acompañar esta situación en casa.' : profile === 'school' ? 'Propuesta inicial para conversar y coordinar en el centro.' : 'Quisiera que conversemos sobre cómo acompañar esta situación de aprendizaje.',
      `${profile === 'family' ? 'Cambio que nos gustaría explorar' : profile === 'school' ? 'Resultado que buscamos' : 'Meta que buscamos'}: ${goal}.`,
      `Paso pequeño que queremos explorar: ${option.strategy}.`,
      `Para saber cómo va, podríamos observar: ${option.indicator}.`,
      `¿Qué observa y qué opina el estudiante? ¿Quién puede acompañar este paso y cuándo lo revisamos? (${draftStep.reviewIn})`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setConversationCopyStatus('Resumen copiado. Puedes adaptarlo antes de compartirlo.');
    } catch {
      setConversationCopyStatus('No se pudo copiar automáticamente. Puedes seleccionar el resumen y copiarlo.');
    }
  };
  const savePlan = () => {
    if (!draftStep || !guidance || selectedOption === null) return;
    const selectedStrategy = guidance.diversification[selectedOption];
    if (!selectedStrategy) return;
    const existing = readPlans().find((plan) => plan.id === planId);
    const saved = makeStoredPlan({ id: planId ?? undefined, createdAt: existing?.createdAt, title: `${initialCase ? initialCase.title + ': ' : `${profileCopy.label} · `}${guidance.goalClear ? 'Paso para probar: ' : 'Pregunta para aclarar: '}${selectedStrategy.strategy}`, objective: draftStep.objective,
      strategies: [{ id: 'ai-step', title: selectedStrategy.strategy, detail: selectedStrategy.strategy, responsible: draftStep.responsible, cadence: draftStep.reviewIn }],
      reviewDate: existing?.reviewDate ?? deriveReviewDate(draftStep.reviewIn), status: 'approved', source: initialCase || betaMode ? 'demo' : 'ai',
      question: draftStep.question, indicator: draftStep.indicator, why: draftStep.why, completedStrategies: existing?.completedStrategies ?? [], reviews: existing?.reviews ?? [] });
    upsertPlan(saved); setPlanId(saved.id);
    setApproved(true);
  };
  const content = <div className="content case-experience">
    {initialCase && betaMode ? <a className="case-back-link own-back" href="/beta/docentes/casos">← Volver a los casos docentes</a> : <button className="case-back-link own-back" onClick={() => { const hasDraft = Boolean(observation.trim() || learningGoal.trim() || context.trim() || support.trim() || knownNeeds.trim()); if (hasDraft && !window.confirm('El texto de esta situación no se guarda automáticamente. Si vuelves ahora, se borrará. ¿Quieres salir?')) return; onBack(); }}>{initialCase ? '← Cambiar ejemplo' : initialProfile ? '← Cambiar de espacio' : '← Volver a elegir recorrido'}</button>}
    <span className="case-label">{initialCase ? 'CASO FICTICIO · ' + initialCase.title : `${profileCopy.label.toUpperCase()} · RECORRIDO GUIADO`}</span><h1 className="case-page-title">{profile === 'family' ? 'Empezar por lo que os preocupa.' : profile === 'school' ? 'Empezar por lo que el centro necesita coordinar.' : 'Empezar por lo que observas.'}</h1>
    <p className="subtitle">{initialCase ? 'Situación ficticia para probar el recorrido; puedes editarla. ' : profile === 'family' ? 'Cuenta una situación cotidiana con tus palabras. No hace falta saber por qué ocurre ni resolverlo todo hoy. ' : profile === 'school' ? 'Describe una necesidad de coordinación o respuesta educativa. La IA propondrá un borrador para deliberar, no una decisión del centro. ' : 'Describe una situación del aula de forma anónima. No necesitas saber por qué ocurre. '}{copy.privacy.noStudentIdentifiers}</p>
    <aside className="case-support-note" aria-label="Acompañamiento durante el recorrido"><strong>No tienes que resolverlo todo hoy.</strong><span>Puedes decir «no lo sé» y empezar con una sola situación. Si todavía no hay una respuesta clara, SENDIA te ayuda a preparar una pregunta y un paso pequeño para conversar con otras personas adultas.</span></aside>
    <FlowProgress labels={ownLabels} current={stage} />
    <p className="flow-help" role="status">{stage === 0 && <><strong>Paso 1 de 4 · Situación</strong> Cuenta qué ocurrió. Si no sabes qué aspecto elegir, puedes seguir sin clasificarlo.</>}{stage === 1 && <><strong>Paso 2 de 4 · Contexto</strong> Añade solo lo que sepas. Puedes dejar los campos en blanco y continuar.</>}{stage === 2 && <><strong>{progressLabel}.</strong> {copy.flow.question}</>}{stage === 3 && !approved && <><strong>Paso 4 de 4 · Un siguiente paso.</strong> Puede ser una pregunta para aclarar la meta o una opción concreta para probar.</>}{stage === 3 && approved && <><strong>Listo.</strong> El paso ya está guardado en «Mis planes».</>}</p>
    {stage === 0 && <section className="case-board"><div className="case-board-intro"><h2>{situationPrompt}</h2><p>Describe lo que ocurre, sin explicar todavía su causa. Una situación concreta basta para empezar.</p></div>{profile === 'teacher' && <details className="situation-picker"><summary>Si quieres, indica qué aspecto se acerca más</summary><div className="situation-grid">{situations.map((item) => <button type="button" key={item.id} className={'situation-choice ' + (situation === item.id ? 'selected' : '')} onClick={() => setSituation(item.id)} aria-pressed={situation === item.id}><div className="situation-icon">{item.icon}</div><strong>{item.title}</strong><span>{item.detail}</span></button>)}</div></details>}<label className="free-text-label" htmlFor="own-observation">{profile === 'family' ? 'Cuéntanos qué ocurre' : profile === 'school' ? 'Describe la necesidad compartida' : 'Describe qué viste u oíste'}</label><p className="field-hint">{situationExample}</p><textarea id="own-observation" className="textarea" maxLength={1200} value={observation} onChange={(event) => updateText(setObservation, event.target.value)} placeholder="Sin nombres ni detalles que identifiquen a nadie…"/><div className="case-actions"><button className="button button-primary" disabled={!observation.trim()} onClick={() => setStage(1)}>Continuar <span>→</span></button></div></section>}
      {stage === 1 && <section className="case-board">
        <div className="case-board-intro"><h2>{goalLabel}</h2><p>{goalHint} Si todavía no lo tienes claro, continúa y la IA ayudará a formular una pregunta antes de proponer acciones.</p></div>
        <label className="free-text-label" htmlFor="learning-goal">{profile === 'teacher' ? 'Meta de aprendizaje' : profile === 'school' ? 'Resultado que busca el centro' : 'Qué te gustaría que fuera más fácil'} <span className="optional-label">(si lo sabes)</span></label>
        <input id="learning-goal" className="textarea" maxLength={500} value={learningGoal} onChange={(event) => updateText(setLearningGoal, event.target.value)} placeholder={profile === 'teacher' ? '¿Qué se quería aprender, terminar o practicar?' : profile === 'school' ? '¿Qué debería poder observar el equipo si mejora la respuesta?' : 'Por ejemplo: empezar una rutina con menos tensión…'}/>
        <label className="free-text-label" htmlFor="own-context">{contextLabel} <span className="optional-label">(opcional)</span></label>
        <textarea id="own-context" className="textarea" maxLength={1200} value={context} onChange={(event) => updateText(setContext, event.target.value)} placeholder={contextPlaceholder}/>
        <details className="optional-context"><summary>Añadir detalles si los tienes (opcional)</summary>
          <label htmlFor="current-evidence">{profile === 'family' ? '¿Qué suele ocurrir en esa situación?' : profile === 'school' ? '¿Qué medidas se han probado y qué se observó?' : '¿Qué puede hacer ahora?'}<textarea id="current-evidence" className="textarea" maxLength={600} value={currentEvidence} onChange={(event) => updateText(setCurrentEvidence, event.target.value)} placeholder="Una observación concreta, sin sacar conclusiones…"/></label>
          <label htmlFor="expected-demonstration">{profile === 'family' ? '¿Qué pequeño cambio notarías en casa?' : profile === 'school' ? '¿Qué indicador permitiría revisar el acuerdo?' : '¿Cómo podría mostrar ese aprendizaje?'}<textarea id="expected-demonstration" className="textarea" maxLength={500} value={expectedDemonstration} onChange={(event) => updateText(setExpectedDemonstration, event.target.value)} placeholder="Algo que se pueda observar, no una etiqueta…"/></label>
          <label htmlFor="own-support">{supportLabel}<textarea id="own-support" className="textarea" maxLength={1200} value={support} onChange={(event) => updateText(setSupport, event.target.value)} placeholder="Solo lo que hayas observado o que la persona haya expresado…"/></label>
          <label htmlFor="student-perspective">{voiceLabel}<textarea id="student-perspective" className="textarea" maxLength={500} value={studentPerspective} onChange={(event) => updateText(setStudentPerspective, event.target.value)} placeholder="Puedes dejarlo vacío si aún no lo has preguntado."/><small>Si falta su voz, SendIA lo mostrará como información pendiente; no supondrá cómo se siente.</small></label>
          <label className="known-needs-label" htmlFor="known-needs">¿Hay apoyos ya conocidos?<textarea id="known-needs" className="textarea" maxLength={500} value={knownNeeds} onChange={(event) => updateText(setKnownNeeds, event.target.value)} placeholder="Solo apoyos que la familia o la escuela ya haya compartido."/><small>Se tratarán como contexto aportado por ti. La IA no inferirá diagnósticos ni concluirá que explican la situación.</small></label>
          <label className="country-select" htmlFor="own-country">País o contexto (opcional)<select id="own-country" value={country} onChange={(event) => setCountry(event.target.value)}><option value="">Sin especificar</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><small>Orienta el vocabulario; no se consultan leyes locales.</small></label>
        </details>
        <label className="ai-consent"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)}/><span>Soy una persona adulta, quité los datos identificativos y acepto enviar esta información a Gemini para recibir preguntas y opciones.</span></label>
        <p className="ai-transparency">Tu descripción no se guarda en SendIA. El paso elegido se guarda solo si pulsas «Guardar».</p>
        <details className="send-preview"><summary>Qué se envía y cómo se usa</summary><p>Gemini recibe la situación y los datos opcionales que escribiste para generar preguntas y alternativas. Puede haber más de una solicitud durante el recorrido.</p><p>Este es el contenido que enviarías:</p><pre>{JSON.stringify(providerPreview, null, 2)}</pre></details>
        {possibleNameWarnings.length > 0 && <div className="possible-name-warning" role="alert"><strong>Revisa posibles nombres propios:</strong><p>La detección es una señal aproximada y puede equivocarse. Comprueba los campos y el resumen. Si ya revisaste y el texto no identifica a nadie, confirma para continuar.</p><label><input type="checkbox" checked={warningAcknowledged} onChange={(event) => setWarningAcknowledged(event.target.checked)}/> Ya revisé este texto</label><button className="button button-secondary button-small" disabled={!warningAcknowledged || loading} onClick={() => generate(lastAction)}>Continuar después de revisar</button></div>}
        {error && possibleNameWarnings.length === 0 && <div className="ai-retry" role="alert"><p>{error}</p><button className="button button-secondary button-small" disabled={loading} onClick={() => generate(lastAction)}>{loading ? 'Reintentando…' : 'Reintentar'}</button></div>}
        <div className="case-actions"><button className="button button-secondary" onClick={() => setStage(0)}>← Volver</button><button className="button button-primary" disabled={!aiConsent || loading || possibleNameWarnings.length > 0} onClick={() => generate('question')}><span aria-live="polite">{loading ? 'Preparando pregunta…' : 'Generar una pregunta'}</span> <span>→</span></button></div>
      </section>}
    {stage === 2 && question && <section className="case-board"><div className="case-board-intro"><span className="case-step-no">{progressLabel.toUpperCase()}</span><h2>{question.question}</h2><p className="muted">{question.rationale}</p></div><div className="question-choice-grid">{[...question.options, 'No lo sé todavía'].map((option) => <button key={option} type="button" className={'question-choice ' + (answer === option ? 'selected' : '')} aria-pressed={answer === option} onClick={() => updateText(setAnswer, option)}><span className="choice-select">{answer === option ? '✓' : '↗'}</span><strong>{option}</strong></button>)}</div><label className="free-text-label" htmlFor="own-answer">O responde con tus palabras <span className="optional-label">(opcional)</span></label><textarea id="own-answer" className="textarea" maxLength={600} value={answer && !question.options.includes(answer) && answer !== 'No lo sé todavía' ? answer : ''} onChange={(event) => updateText(setAnswer, event.target.value)} placeholder="Sin nombres ni información identificativa…"/><details className="send-preview"><summary>Ver exactamente qué información se enviará a Gemini</summary><p>Además de instrucciones generales de SendIA, Gemini recibirá estos datos:</p><pre>{JSON.stringify(providerPreview, null, 2)}</pre></details>{possibleNameWarnings.length > 0 && <div className="possible-name-warning" role="alert"><strong>Revisa posibles nombres propios:</strong><p>La detección es aproximada y puede equivocarse. Comprueba el resumen y confirma si el texto no identifica a nadie.</p><label><input type="checkbox" checked={warningAcknowledged} onChange={(event) => setWarningAcknowledged(event.target.checked)}/> Ya revisé este texto</label><button className="button button-secondary button-small" disabled={!warningAcknowledged || loading} onClick={() => generate(lastAction)}>Continuar después de revisar</button></div>}{error && possibleNameWarnings.length === 0 && <div className="ai-retry" role="alert"><p>{error}</p><button className="button button-secondary button-small" disabled={loading} onClick={() => generate(lastAction)}>{loading ? 'Reintentando…' : 'Reintentar'}</button></div>}<div className="case-actions"><button className="button button-secondary" onClick={() => setStage(1)}>← Volver</button><button className="button button-primary" disabled={!answer.trim() || loading || possibleNameWarnings.length > 0} onClick={() => generate(answersHistory.length < 2 ? 'question' : 'guidance')}><span aria-live="polite">{loading ? 'Preparando…' : answersHistory.length < 2 ? 'Responder y ver otra pregunta' : 'Responder y ver opciones'}</span> <span>→</span></button></div><button className="case-secondary-action" disabled={loading || possibleNameWarnings.length > 0} onClick={() => generate('guidance')}>Ya tengo suficiente · ver opciones para probar</button></section>}
    {stage === 3 && guidance && !approved && <section className="case-board">
        <div className="case-board-intro"><span className="case-step-no">BORRADOR GENERADO CON IA · {profileCopy.label.toUpperCase()}</span><h2>{guidance.summary}</h2><p>{guidance.goalClear ? profile === 'family' ? 'Son ideas pequeñas para explorar en casa; elige solo las que encajen con vuestra realidad.' : profile === 'school' ? 'Son opciones para deliberar y coordinar; el equipo conserva la decisión y puede editarlas.' : 'La meta se mantiene; las opciones cambian la forma de acceder o demostrar el aprendizaje.' : 'Aún falta aclarar el objetivo. Antes de adaptar, guarda una pregunta para conversar.'}</p></div>
      <div className="case-callout"><strong>Antes de continuar</strong><span>{guidance.caution}</span></div>
      <div className="student-voice-note"><strong>Voz del niño o estudiante · {guidance.studentVoiceStatus === 'known' ? 'aportada' : guidance.studentVoiceStatus === 'contradictory' ? 'hay datos distintos' : 'pendiente'}</strong><p>{guidance.studentVoice || 'Todavía no se ha recogido. No atribuimos preferencias ni emociones.'}</p>{guidance.studentVoiceStatus !== 'known' && <p><strong>Pregunta posible:</strong> {guidance.studentQuestion}</p>}</div>
      <details className="hypothesis-alternatives"><summary>Ver observaciones, dudas e hipótesis</summary>
        <div className="generated-columns">
          <article><h3>Observaciones</h3><ul>{guidance.observations.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><h3>Interpretaciones</h3><ul>{guidance.interpretations.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><h3>Información pendiente</h3><ul>{guidance.pending.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      <div className="hypothesis-grid">{guidance.hypotheses.map((item) => <article className="hypothesis-card" key={item.title}>
          <span className="case-label">POSIBILIDAD · NO ES UNA CONCLUSIÓN</span><h3>{item.title}</h3><p>{item.possibility}</p>{item.evidenceRefs?.length ? <small className="evidence-provenance"><b>Se apoya en:</b> {evidenceSources(item.evidenceRefs)}</small> : null}
          <details className="hypothesis-alternatives"><summary>Qué la apoya, qué falta y otra explicación</summary>
            <strong>Podría apoyarla</strong><ul>{item.supporting.map((value) => <li key={value}>{value}</li>)}</ul>
            <strong>Falta saber</strong><ul>{item.missing.map((value) => <li key={value}>{value}</li>)}</ul>
            <strong>Otra posibilidad</strong><ul>{item.alternatives.map((value) => <li key={value}>{value}</li>)}</ul>
          </details>
        </article>)}</div>
        <details className="hypothesis-alternatives"><summary>Ver preguntas y respuestas de esta exploración</summary><ol>{answersHistory.map((item, index) => <li key={index}><strong>{item.question}</strong><p>{item.answer}</p></li>)}</ol></details>
      </details>
      <section className="generated-options"><h3>{guidance.goalClear ? profile === 'family' ? 'Ideas pequeñas para probar en casa' : profile === 'school' ? 'Opciones para coordinar y valorar' : 'Opciones que responden a lo observado' : 'Primero, aclaremos el objetivo'}</h3><p>{guidance.goalClear ? `${profile === 'family' ? 'Objetivo que importa' : profile === 'school' ? 'Resultado que se conserva' : 'Meta que se conserva'}: ${guidance.diversification[0]?.learningGoal ?? learningGoal}` : 'Esta acción recoge información; todavía no es una adaptación.'}</p>
        <div className="diversification-options">{guidance.diversification.map((option, index) =>
          <button type="button" key={`${option.principle}-${index}`} className={'diversification-option ' + (selectedOption === index ? 'selected' : '')} aria-pressed={selectedOption === index} onClick={() => chooseDiversification(index)}>
            <span className="case-label">{guidance.goalClear ? plainPrincipleLabels[option.principle as keyof typeof plainPrincipleLabels] ?? 'Opción para explorar' : 'ACLARAR ANTES DE ADAPTAR'}</span><strong>{option.strategy}</strong>
            <small><b>Qué barrera explora:</b> {option.barrier}</small><small><b>Qué dato la sustenta:</b> {option.evidence}</small>{option.evidenceRefs?.length ? <small className="evidence-provenance"><b>Origen:</b> {evidenceSources(option.evidenceRefs)}</small> : null}{guidance.goalClear && <><small><b>Fortaleza o interés:</b> {option.strengthOrInterest || 'No se aportó un dato; no se presupone.'}</small><small><b>Qué observar:</b> {option.indicator}</small></>}
          </button>)}
        </div>
      </section>
      {profile === 'family' ? <aside className="case-support-note"><strong>Cuándo pedir apoyo</strong><span>Si esto persiste, afecta al bienestar o dificulta el aprendizaje, puede ser útil conversar con el centro educativo o con un profesional cualificado. Esta herramienta no reemplaza ese acompañamiento.</span></aside> : profile === 'school' ? <aside className="case-support-note"><strong>Propuesta para deliberar, no instrucción normativa</strong><span>El centro decide qué medidas son pertinentes. Si hay dudas persistentes sobre el acceso al aprendizaje o el bienestar, conviene coordinar con orientación y la familia.</span></aside> : <details className="orientation-options"><summary>Opciones para conversar con el equipo de orientación</summary><p>Son temas para dialogar en equipo si las medidas habituales no alcanzan. No son recomendaciones automáticas; la escuela y orientación deciden qué corresponde.</p><ul><li>Enriquecimiento de actividades.</li><li>Agrupamientos flexibles.</li><li>Compactación curricular.</li><li>Flexibilización de tiempos o trayectos.</li></ul></details>}
      {selectedOption !== null && draftStep && <article className="next-step-card"><span className="next-step-label">EL PASO QUE HAS ELEGIDO</span><h3>{guidance.diversification[selectedOption].strategy}</h3><p><strong>Objetivo:</strong> {draftStep.objective}</p><p><strong>Pregunta:</strong> {draftStep.question}</p><p><strong>Qué observar:</strong> {draftStep.indicator}</p><p><strong>Quién y cuándo:</strong> {draftStep.responsible} · {draftStep.reviewIn}</p><p className="muted">Podrás cambiarlo más adelante en «Mis planes».</p></article>}
      {selectedOption !== null && draftStep && <details className="conversation-guide"><summary>Preparar una conversación con el equipo o la familia</summary><p>No necesitas llegar con una solución cerrada. Este resumen puede ayudarte a explicar qué quieres explorar y qué necesitas acordar.</p><div className="conversation-guide-text"><p>Quisiera que conversemos sobre cómo acompañar esta situación de aprendizaje.</p><p><strong>Meta:</strong> {guidance.goalClear ? guidance.diversification[selectedOption].learningGoal : 'Aclarar la meta antes de adaptar la actividad.'}</p><p><strong>Paso que quiero explorar:</strong> {guidance.diversification[selectedOption].strategy}</p><p><strong>Qué observar:</strong> {guidance.diversification[selectedOption].indicator}</p><p><strong>Para acordar:</strong> ¿Qué opina el estudiante? ¿Quién puede acompañar este paso y cuándo lo revisamos? {draftStep.reviewIn}</p></div><button type="button" className="button button-secondary button-small" onClick={copyConversationGuide}>Copiar resumen</button><span className="conversation-copy-status" role="status">{conversationCopyStatus}</span></details>}
      <div className="case-actions">
        <button className="button button-primary" disabled={selectedOption === null || !draftStep} onClick={savePlan}>{betaMode ? 'Guardar este paso del ejemplo' : guidance.goalClear ? 'Guardar este paso' : 'Guardar la pregunta para aclarar la meta'}</button>
      </div>
      {selectedOption === null && <p className="field-hint">Elige una opción para continuar. La decisión final es tuya.</p>}
      <p className="demo-disclaimer">Es una sugerencia para explorar, no un diagnóstico. Puedes cambiarla o descartarla.</p>
    </section>}
    {stage === 3 && guidance && approved && <section className="case-board plan-saved-state"><div className="case-board-intro"><span className="case-step-no">PASO GUARDADO</span><h2>{betaMode ? 'Plan ficticio guardado.' : 'Ya tienes un primer paso.'}</h2><p>{betaMode ? 'El plan está marcado como demostración ficticia y se guarda solo en este navegador.' : 'Quedó guardado en este navegador. Desde el plan puedes preparar un borrador para familia, aula o centro; nada se comparte automáticamente.'}</p></div><a className="button button-primary" href={planId ? `/planes/${planId}` : '/planes/plan-aula'}>Abrir el plan guardado →</a>{profile === 'teacher' && <a className="button button-secondary" href="/crear">Crear o adaptar una actividad →</a>}{betaMode && <a className="case-back-link" href="/beta/docentes/casos">Volver a los casos ficticios</a>}</section>}
    {error && !betaMode && possibleNameWarnings.length === 0 && <p className="field-hint">Si Gemini no está disponible, <a href="/comprender?modo=demo">abre la demo preparada sin IA en vivo</a>. Se reiniciará este formulario y solo verás datos ficticios.</p>}
  </div>;
  return betaMode ? <TeacherBetaShell showLibrary>{content}</TeacherBetaShell> : <AppShell>{content}</AppShell>;
}
