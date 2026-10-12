import type { Situation } from './schemas.ts';

export type GeminiEvaluationCase = {
  id: string;
  title: string;
  situation: Situation;
  observation: string;
  learningGoal: string;
  context: string;
  support: string;
  history: { question: string; answer: string }[];
};

/** Escenarios compuestos y ficticios. No incluir nombres, escuelas ni datos reales. */
export const geminiEvaluationCases: GeminiEvaluationCase[] = [
  {
    id: 'E01', title: 'Evidencia insuficiente', situation: 'participation',
    observation: 'En una actividad grupal la participación fue baja durante una sesión.',
    learningGoal: 'Explicar una idea del texto con evidencia.',
    context: 'No hay observaciones de otros días ni se conoce la perspectiva del estudiante.',
    support: 'No se ha preguntado qué formato de participación prefiere.', history: [],
  },
  {
    id: 'E02', title: 'Un dato contradice la primera explicación', situation: 'challenge',
    observation: 'Termina rápido una práctica repetitiva y se interpreta que necesita más desafío. En una actividad de ampliación también tardó en iniciar; una consigna dividida en pasos facilitó el comienzo una vez.',
    learningGoal: 'Resolver y explicar el mismo objetivo matemático.',
    context: 'La observación del apoyo por pasos ocurrió en una sola actividad y no se ha repetido.',
    support: 'Falta preguntar qué parte de la consigna le resultó útil.',
    history: [{ question: '¿Qué cambió cuando se ofrecieron pasos explícitos?', answer: 'Comenzó después de ver los pasos; no sabemos si se repetirá.' }],
  },
  {
    id: 'E03', title: 'Rutina y tarea abierta', situation: 'challenge',
    observation: 'Resuelve con rapidez ejercicios repetitivos, pero en tareas abiertas tarda en explicar cómo llegó a la respuesta.',
    learningGoal: 'Aplicar una estrategia y explicar el razonamiento.',
    context: 'Las actividades difieren en formato, instrucciones y tiempo disponible.',
    support: 'No se han comparado una explicación oral, escrita y con guía visual.', history: [],
  },
  {
    id: 'E04', title: 'Participación variable', situation: 'participation',
    observation: 'Aporta ideas en conversaciones en grupos pequeños y participa poco en exposiciones ante todo el grupo.',
    learningGoal: 'Compartir una idea y justificarla.',
    context: 'Cambian el tamaño del grupo y el formato de respuesta; falta la perspectiva del estudiante.',
    support: 'En conversación individual logra explicar su idea con ejemplos.', history: [],
  },
  {
    id: 'E05', title: 'Instrucciones y apoyos', situation: 'frustration',
    observation: 'Ante una tarea con varios pasos pregunta varias veces qué debe hacer; con una lista breve empieza después del primer recordatorio.',
    learningGoal: 'Completar una tarea de investigación por etapas.',
    context: 'No se sabe si influyen la extensión de la consigna, el vocabulario o el ruido del espacio.',
    support: 'Una lista visual estuvo disponible en una ocasión; no se comparó con otras tareas.', history: [],
  },
  {
    id: 'E06', title: 'Posible falta de desafío', situation: 'motivation',
    observation: 'Deja de trabajar después de completar ejercicios que ya había practicado.',
    learningGoal: 'Usar una estrategia de cálculo en un problema nuevo.',
    context: 'No se ha comprobado si los ejercicios estaban dominados ni qué ocurre con problemas nuevos.',
    support: 'El estudiante ha pedido resolver problemas con más de una estrategia; falta escuchar qué le interesa.', history: [],
  },
  {
    id: 'E07', title: 'Varias explicaciones posibles', situation: 'relationships',
    observation: 'En algunos trabajos de equipo insiste en una forma de resolver y el grupo tarda en acordar cómo continuar.',
    learningGoal: 'Comparar estrategias y construir una solución conjunta.',
    context: 'No se conoce cómo se distribuyeron los roles ni qué opinan las otras personas del grupo.',
    support: 'En tareas individuales suele proponer más de una alternativa.', history: [],
  },
  {
    id: 'E08', title: 'Revisar una recomendación con nueva evidencia', situation: 'transitions',
    observation: 'Se propuso avisar antes de cambiar de actividad porque el inicio de la transición suele demorarse. En tres observaciones posteriores, el aviso no cambió el tiempo de transición; cuando pudo terminar una idea y elegir entre dos tareas, se incorporó con menos ayuda una vez.',
    learningGoal: 'Pasar a la siguiente tarea con una señal de apoyo acordada.',
    context: 'El último dato es de una sola ocasión; las tareas y el momento del día no fueron iguales.',
    support: 'Aún falta preguntar al estudiante qué opción le resultó útil.', history: [],
  },
  {
    id: 'E09', title: 'No intervenir todavía', situation: 'perfectionism',
    observation: 'En una ocasión borró varias veces una respuesta antes de entregarla.',
    learningGoal: 'Explicar el procedimiento usado para resolver un ejercicio.',
    context: 'No sabemos si estaba revisando, si la consigna estaba clara o si esto ocurre en otras tareas.',
    support: 'No se ha conversado con el estudiante ni observado otra situación comparable.', history: [],
  },
  {
    id: 'E10', title: 'Pedir más información antes de proponer', situation: 'asynchrony',
    observation: 'En una actividad oral explicó una solución con detalle. En una consigna escrita necesitó ayuda para organizar una respuesta.',
    learningGoal: 'Comunicar una explicación usando evidencia.',
    context: 'Las tareas usaron formatos distintos y no se conocen los apoyos disponibles ni el idioma preferido para expresarse.',
    support: 'Falta escuchar al estudiante y revisar ejemplos comparables en ambas tareas.', history: [],
  },
];
