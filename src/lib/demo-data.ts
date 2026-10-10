import type { ActionPlan, CaseObservation, DemoBranch, HypothesisReview, NextStep } from './schemas';

export const alexCase = {
  name: 'Alex',
  age: 10,
  label: 'CASO FICTICIO · DATOS SIMULADOS',
  observations: [
    { id: 'o1', kind: 'observation', source: 'initial', text: 'Termina rápidamente algunos ejercicios de matemáticas.' },
    { id: 'o2', kind: 'observation', source: 'initial', text: 'Su participación disminuye en determinadas actividades.' },
    { id: 'o3', kind: 'observation', source: 'initial', text: 'En algunas tareas abiertas necesita ayuda para empezar.' },
    { id: 'o4', kind: 'unknown', source: 'initial', text: 'Todavía no sabemos si domina los objetivos de todas esas tareas.' },
    { id: 'o5', kind: 'unknown', source: 'initial', text: 'Aún no hemos explorado sus intereses, fortalezas ni qué contextos facilitan su participación.' },
  ] satisfies CaseObservation[],
};

const h = (id: string, title: string, summary: string, status: HypothesisReview['status'], supporting: string[], missing: string[], alternatives: string[], usefulToKnow: string): HypothesisReview =>
  ({ id, title, summary, status, supporting, missing, alternatives, usefulToKnow });

export const initialHypotheses: HypothesisReview[] = [
  h('challenge', 'Algunas actividades podrían ofrecer un reto insuficiente', 'Terminar rápido puede ser una pista, pero no confirma dominio ni falta de reto.', 'insufficient',
    ['Termina rápidamente algunos ejercicios rutinarios.'], ['No sabemos si alcanza los objetivos de todas las tareas.', 'No tenemos ejemplos de tareas con distinto nivel de profundidad.'], ['La tarea puede ser conocida o breve.', 'El formato, el interés o el contexto podrían influir.'], 'Qué objetivos resuelve con autonomía y cómo responde cuando debe explicar, transferir o profundizar.'),
  h('format', 'El formato o las instrucciones podrían influir en el inicio', 'La ayuda para empezar aparece en tareas abiertas; aún no sabemos qué parte del formato influye.', 'compatible',
    ['En algunas tareas abiertas necesita ayuda para empezar.'], ['Cómo se presentan las instrucciones.', 'Si una consigna por pasos cambia el inicio.'], ['La planificación o factores del momento también pueden intervenir.'], 'Qué ocurre al mantener el contenido y ofrecer instrucciones más explícitas o por pasos.'),
  h('context', 'Podrían intervenir otros factores aún desconocidos', 'La participación baja en determinadas actividades, no en todas; el contexto está poco descrito.', 'insufficient',
    ['La participación baja en determinadas actividades.'], ['Momento del día, duración, agrupamiento e intereses.', 'La perspectiva de Alex.'], ['Reto, instrucciones, clima del grupo, energía o una combinación.'], 'En qué contextos participa más y qué diferencias reconoce Alex.'),
];

const skillSpecific: HypothesisReview[] = [
  h('challenge', 'El reto insuficiente no está demostrado', 'La rapidez en ejercicios rutinarios no permite concluir que domine las habilidades de tareas abiertas.', 'insufficient',
    ['Resuelve correctamente ejercicios rutinarios.'], ['Cómo explica su razonamiento en otros formatos.', 'Si necesita profundizar en los mismos objetivos u otros.'], ['El dominio puede variar según la habilidad.', 'Las tareas abiertas pueden exigir explicar y planificar.'], 'Separar qué habilidad demuestra cada tarea antes de decidir si ampliar o dar apoyo.'),
  h('format', 'La tarea abierta puede exigir apoyos distintos', 'La dificultad al explicar y el apoyo para empezar son compatibles con una necesidad de estructura, pero no la demuestran.', 'compatible',
    ['Necesita ayuda para iniciar algunas tareas abiertas.', 'Le cuesta explicar el razonamiento en este formato.'], ['Qué ocurre con una consigna explícita o una guía de pasos.'], ['Puede ser una habilidad específica, el formato o una combinación.'], 'Comparar explicación oral, escrita y guiada sin cambiar el objetivo.'),
  h('context', 'Otras condiciones siguen abiertas', 'El nuevo dato describe diferencias entre tareas, no su causa.', 'insufficient',
    ['El rendimiento varía entre ejercicios rutinarios y tareas abiertas.'], ['La perspectiva de Alex y el contexto de cada actividad.'], ['Interés, planificación, lenguaje de la consigna, tiempo o conocimientos previos.'], 'Preguntar a Alex qué parte le resulta fácil o difícil y en qué condiciones.'),
];

const insufficient: HypothesisReview[] = initialHypotheses.map((item) => ({
  ...item, summary: 'No se ha incorporado información suficiente para revisar esta explicación.', status: 'insufficient',
  missing: [...item.missing, 'Falta una comparación contextualizada entre tareas.'],
  usefulToKnow: 'Recoger ejemplos comparables antes de recomendar una intervención.',
}));

const contradictory: HypothesisReview[] = [
  h('challenge', 'El reto insuficiente no explica por sí solo el inicio', 'Que también necesite ayuda en una tarea de ampliación cuestiona que la falta de reto explique el inicio.', 'contradictory',
    ['Termina rápidamente algunos ejercicios rutinarios.'], ['Qué objetivos y habilidades mide cada actividad.', 'Si las instrucciones por pasos facilitan el inicio de forma consistente.'], ['Las instrucciones, la planificación o la incertidumbre pueden influir.'], 'Comprobar qué cambia al aclarar los pasos manteniendo el desafío.'),
  h('format', 'La estructura de las instrucciones merece explorarse', 'El apoyo por pasos coincide con un inicio más fácil en este ejemplo; una observación no demuestra causalidad.', 'compatible',
    ['La consigna por pasos facilitó el inicio de esta tarea.'], ['Si ocurre de nuevo en otra actividad comparable.'], ['Familiaridad, interés o acompañamiento adulto también podrían influir.'], 'Repetir una observación breve y preguntar a Alex qué le ayudó.'),
  h('context', 'El contexto sigue siendo una explicación abierta', 'El efecto de una consigna puede depender de la tarea y del momento.', 'insufficient',
    ['La participación cambia según la actividad.'], ['La perspectiva de Alex y diferencias entre contextos.'], ['Formato, desafío, energía, agrupamiento u otros factores.'], 'Registrar el contexto mínimo junto con el inicio, sin convertirlo en evaluación.'),
];

export const demoBranches: Record<DemoBranch, { label: string; newInformation: CaseObservation; changeSummary: string; reviews: HypothesisReview[]; nextStep: NextStep }> = {
  'skill-specific': {
    label: 'Dominio diferente según la tarea',
    newInformation: { id: 'n1', kind: 'observation', source: 'new', text: 'Alex resuelve correctamente ejercicios rutinarios, pero tiene dificultades para explicar su razonamiento en tareas abiertas.' },
    changeSummary: 'La rapidez en ejercicios rutinarios no demuestra dominio en explicación o transferencia. Las habilidades pueden variar según la tarea.',
    reviews: skillSpecific,
    nextStep: { objective: 'Distinguir el objetivo matemático de las demandas de explicación y planificación.', question: '¿Qué cambia cuando Alex explica el mismo razonamiento de forma oral, escrita o con una guía de pasos?', why: 'Permite separar el objetivo matemático de las demandas de planificación y expresión.', action: 'Comparar una tarea breve con el mismo objetivo y registrar qué apoyos necesita para explicar el razonamiento.', responsible: 'Tutoría, con la perspectiva de Alex', indicator: 'Si inicia y explica cada paso con autonomía o qué apoyo utiliza.', reviewIn: 'En 2 semanas, tras dos observaciones breves' },
  },
  insufficient: {
    label: 'Aún faltan datos',
    newInformation: { id: 'n2', kind: 'unknown', source: 'new', text: 'Todavía no hay ejemplos comparables que indiquen qué objetivos domina ni qué ocurre en tareas abiertas.' },
    changeSummary: 'No apareció evidencia nueva para diferenciar las hipótesis. No sería proporcionado recomendar un cambio curricular todavía.',
    reviews: insufficient,
    nextStep: { objective: 'Recoger una comparación breve antes de plantear cambios educativos.', question: '¿Qué objetivo concreto resuelve Alex sin ayuda y qué parte de una tarea abierta le cuesta iniciar?', why: 'Comparar objetivo, formato y apoyo reduce incertidumbre sin etiquetar la causa.', action: 'Elegir un ejercicio rutinario y una tarea abierta del mismo objetivo; anotar inicio, apoyo y explicación.', responsible: 'Tutoría', indicator: 'Objetivo de cada tarea, si inicia y qué apoyo usa.', reviewIn: 'Tras una observación breve la próxima semana' },
  },
  contradictory: {
    label: 'Un dato cuestiona la primera explicación',
    newInformation: { id: 'n3', kind: 'observation', source: 'new', text: 'En una tarea de ampliación también necesitó ayuda para empezar; una consigna dividida en pasos facilitó el inicio.' },
    changeSummary: 'Este dato cuestiona que la falta de reto baste para explicar el inicio. El apoyo por pasos coincide con una mejora puntual que habrá que observar de nuevo.',
    reviews: contradictory,
    nextStep: { objective: 'Comprobar si una consigna estructurada facilita el inicio sin reducir el desafío.', question: '¿Se repite un inicio más autónomo cuando las instrucciones se ofrecen por pasos en otra tarea?', why: 'Comprueba si la estructura es relevante sin retirar el desafío ni asumir causalidad.', action: 'Probar una consigna por pasos en una tarea comparable y preguntar a Alex qué le ayudó a empezar.', responsible: 'Tutoría, con la perspectiva de Alex', indicator: 'Si inicia sin ayuda, qué paso necesita y cómo valora el apoyo.', reviewIn: 'En 2 semanas, con una segunda observación' },
  },
};

export const demoPlan: ActionPlan = {
  title: 'Más caminos para aprender',
  objective: 'Aumentar la participación en actividades de aula durante las próximas cuatro semanas.',
  reviewDate: '2026-11-07',
  status: 'draft',
  strategies: [
    { id: 's1', title: 'Ofrecer dos formas de empezar', detail: 'Presentar una opción breve y otra de mayor profundidad para iniciar la actividad.', responsible: 'Tutoría', cadence: 'En actividades de lengua y ciencias' },
    { id: 's2', title: 'Acordar una señal de ayuda', detail: 'Elegir con el estudiante una señal discreta para pedir una ampliación o aclaración.', responsible: 'Tutoría + estudiante', cadence: 'Revisar cada viernes' },
    { id: 's3', title: 'Registrar qué facilita la participación', detail: 'Anotar el tipo de propuesta y si comenzó, continuó o pidió apoyo, sin valorar la conducta.', responsible: 'Equipo docente', cadence: 'Dos veces por semana' },
  ],
};
