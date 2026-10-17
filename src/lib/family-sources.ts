export const familySources = [
  {
    id: 'nagc-family',
    title: 'Family Tip Sheets',
    author: 'National Association for Gifted Children (NAGC)',
    year: 's. f.',
    note: 'Materiales para familias sobre conversación con hijos, desarrollo integral y colaboración con la escuela.',
    url: 'https://www.nagc.org/family-tip-sheets',
  },
  {
    id: 'sodergren-review',
    title: 'Parents of the Gifted: A Scoping Review of the Gifted Parent Literature',
    author: 'Celeste D. C. Sodergren y Todd Kettler · Journal for the Education of the Gifted',
    year: '2025',
    note: 'Revisión de alcance sobre lo que se ha investigado acerca de las familias; también señala lagunas en la literatura disponible.',
    url: 'https://doi.org/10.1177/01623532251323279',
  },
  {
    id: 'oecd-inclusion',
    title: 'Policy Approaches and Initiatives for the Inclusion of Gifted Students in OECD Countries',
    author: 'Alexandre Rutigliano y Nikita Quarshie · OECD Education Working Papers, n.º 262',
    year: '2021',
    note: 'Describe diferencias entre países en cómo definen y atienden las altas capacidades; las respuestas dependen del sistema y del contexto.',
    url: 'https://doi.org/10.1787/c3f9ed87-en',
  },
  {
    id: 'seng-support',
    title: 'Mental Health & Well-Being',
    author: 'Supporting Emotional Needs of the Gifted (SENG)',
    year: 's. f.',
    note: 'Distingue el apoyo comunitario no clínico de la atención profesional de salud mental y reúne recursos para familias.',
    url: 'https://sengifted.org/mental-health-well-being/mental_health/',
  },
  {
    id: 'tasca-review',
    title: 'Behavioral and Socio-Emotional Disorders in Intellectual Giftedness: A Systematic Review',
    author: 'Ilaria Tasca et al. · Child Psychiatry & Human Development',
    year: '2024',
    note: 'Revisión sistemática; sus resultados no permiten una conclusión única sobre la relación entre AACC y dificultades socioemocionales. Evita generalizar a partir de la identificación.',
    url: 'https://doi.org/10.1007/s10578-022-01420-w',
  },
] as const;

export type FamilySourceId = typeof familySources[number]['id'];

export const familySourceSummaries = familySources.map(({ id, title, author, year, note }) => ({ id, title, author, year, note }));
