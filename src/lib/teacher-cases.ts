import type { Situation } from './schemas';

export type TeacherCase = {
  id: string;
  title: string;
  situation: Situation;
  observation: string;
  context: string;
  support: string;
};

export const teacherCases: TeacherCase[] = [
  { id: 'mirada-01', title: 'Termina antes que el grupo', situation: 'challenge', observation: 'En varias actividades breves termina antes que la mayoría y después deja de trabajar.', context: 'Ocurre sobre todo en ejercicios repetitivos. No sabemos si completa todos los objetivos ni qué sucede con tareas de mayor profundidad.', support: 'Le gusta explicar distintas maneras de resolver problemas.' },
  { id: 'mirada-02', title: 'Le cuesta iniciar una tarea abierta', situation: 'frustration', observation: 'Ante una consigna abierta tarda en empezar y pide que le indiquen el primer paso.', context: 'Con instrucciones divididas en pasos comienza con más facilidad, aunque solo se ha observado en una ocasión.', support: 'Disfruta diseñar y construir cuando puede elegir materiales.' },
  { id: 'mirada-03', title: 'Participa de forma irregular', situation: 'participation', observation: 'Participa mucho en algunos debates y permanece en silencio en otras actividades.', context: 'No se ha comparado el tema, el formato de participación ni el tamaño del grupo.', support: 'En conversaciones individuales comparte preguntas e ideas elaboradas.' },
  { id: 'mirada-04', title: 'Se frustra cuando algo no sale', situation: 'frustration', observation: 'Cuando una actividad requiere varios intentos, a veces la abandona o dice que no puede.', context: 'No sabemos si influye la dificultad, el tiempo disponible o cómo se recibe el error en el grupo.', support: 'Se implica en retos elegidos por sí mismo y revisa sus ideas cuando tiene tiempo.' },
  { id: 'mirada-05', title: 'Pregunta por temas que no tocan', situation: 'challenge', observation: 'Durante algunas explicaciones hace preguntas relacionadas con el tema, pero que se alejan de la actividad prevista.', context: 'Sucede más cuando la explicación se prolonga. No sabemos qué conceptos ha comprendido ni qué preguntas considera importantes.', support: 'Le interesa conectar los contenidos con situaciones cotidianas.' },
  { id: 'mirada-06', title: 'Hay desacuerdos en el trabajo en equipo', situation: 'relationships', observation: 'En trabajos grupales insiste en una propuesta y el equipo tarda en acordar cómo continuar.', context: 'Faltan las perspectivas de las demás personas del grupo y ejemplos de cómo se distribuyen las tareas.', support: 'Suele detectar detalles y proponer alternativas al resolver problemas.' },
  { id: 'mirada-07', title: 'Evita mostrar su trabajo', situation: 'participation', observation: 'Completa algunas tareas, pero evita compartirlas en voz alta o enseñarlas al grupo.', context: 'No sabemos si prefiere otros formatos, necesita más tiempo o le preocupa la reacción de otras personas.', support: 'Explica sus ideas con más detalle en conversaciones tranquilas.' },
  { id: 'mirada-08', title: 'Rinde de forma distinta según la materia', situation: 'challenge', observation: 'Resuelve con autonomía algunas tareas de ciencias y necesita apoyo frecuente para organizar textos escritos.', context: 'Las tareas tienen demandas distintas y no se han comparado los pasos, el tiempo ni los apoyos disponibles.', support: 'Le interesan los experimentos y suele recordar detalles de lo que observa.' },
  { id: 'mirada-09', title: 'Le cuesta cambiar de actividad', situation: 'frustration', observation: 'Al terminar una actividad preferida, protesta o tarda en incorporarse a la siguiente.', context: 'No se ha observado si un aviso previo o conocer la secuencia del día facilita la transición.', support: 'Se concentra con profundidad cuando el tema despierta su interés.' },
  { id: 'mirada-10', title: 'Pide más desafío y también ayuda', situation: 'challenge', observation: 'Solicita tareas más complejas, pero en algunas actividades nuevas necesita acompañamiento para comenzar.', context: 'No sabemos qué parte de la tarea nueva le resulta difícil ni qué apoyos le permiten avanzar.', support: 'Disfruta explorar problemas con más de una solución posible.' },
];
