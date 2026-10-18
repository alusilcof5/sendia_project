export const understandingProfiles = {
  teacher: {
    label: 'Docentes',
    title: 'Desde el aula',
    description: 'Explorá qué ocurre durante una actividad y qué cambio pequeño podés probar.',
    example: 'Termina rápido y después se desconecta.',
    focus: 'aula',
    prompts: `PERFIL: DOCENTE EN EL AULA. Prioriza la meta curricular, la consigna, el ritmo, el agrupamiento, los apoyos y la voz del estudiante. Las propuestas deben ser ordinarias, realistas para el grupo, reversibles y aplicables con el tiempo y recursos descritos.`,
    question: 'Adapta la pregunta al contexto del aula y pregunta primero por la meta, la tarea o la voz del estudiante.',
  },
  school: {
    label: 'Centros educativos',
    title: 'Desde el centro',
    description: 'Ordena una necesidad compartida, las perspectivas implicadas y una coordinación posible.',
    example: 'Cada docente responde de forma distinta y falta un acuerdo común.',
    focus: 'centro',
    prompts: `PERFIL: EQUIPO DE CENTRO. Distingue necesidades de un estudiante de barreras organizativas. Explora coordinación, recursos disponibles, criterios compartidos, participación de familia, estudiante y profesionales, responsables e indicadores de aplicación. Presenta cualquier medida como propuesta para deliberación; nunca como obligación legal ni decisión ya tomada. Si redactas un acuerdo, que sea un borrador editable y no un protocolo normativo.`,
    question: 'Adapta la pregunta a la coordinación del centro: identifica quién observa, qué respuesta existe ya y qué falta acordar, sin perder la perspectiva del estudiante.',
  },
  family: {
    label: 'Familias',
    title: 'Desde casa',
    description: 'Comprendé una situación cotidiana y pensá cómo acompañar sin culpa ni presión.',
    example: 'Los deberes terminan en discusiones y no sabemos cómo ayudar.',
    focus: 'casa',
    prompts: `PERFIL: FAMILIA EN CASA. Usa lenguaje cálido, claro y libre de tecnicismos. Reconoce la preocupación sin culpabilizar al niño ni a la familia. Explora rutinas, contexto, bienestar, recursos y la voz del niño. Ofrece acciones pequeñas para casa, explica qué se busca observar y evita convertir a la familia en terapeuta o docente. Si la situación persiste, afecta al bienestar o dificulta el acceso al aprendizaje, sugiere conversar con el centro o con un profesional cualificado, sin inferir diagnósticos.`,
    question: 'Adapta la pregunta al hogar; pregunta con calidez qué ocurre antes y después, qué ha expresado el niño y qué pequeño cambio familiar sería viable.',
  },
} as const;

export type UnderstandingProfile = keyof typeof understandingProfiles;

export function isUnderstandingProfile(value: unknown): value is UnderstandingProfile {
  return typeof value === 'string' && Object.hasOwn(understandingProfiles, value);
}
