import type { Situation } from '@/lib/schemas';

export const locale = 'es-419' as const;

export const aiSituationLabels: Record<Situation, string> = {
  participation: 'participación', frustration: 'inicio y bloqueo', relationships: 'relaciones', challenge: 'reto y aprendizaje',
  asynchrony: 'ritmos distintos entre áreas', perfectionism: 'miedo a equivocarse', motivation: 'interés y motivación', transitions: 'cambios y transiciones',
};

export const copy = {
  product: {
    name: 'SendIA',
    tagline: 'Cada senda se descubre acompañando.',
    noDiagnosis: 'SendIA no diagnostica ni reemplaza la experiencia de quienes acompañan al estudiante.',
  },
  flow: {
    describe: 'Cuéntanos qué ocurre.',
    context: 'Añade contexto si lo sabes. Puedes dejarlo en blanco.',
    question: 'Responde esta pregunta o pasa directamente a las opciones para probar.',
    nextStep: 'Elige un paso pequeño. Podrás editarlo después en «Mis planes».',
  },
  privacy: {
    noStudentIdentifiers: 'No incluyas nombres ni datos que identifiquen a estudiantes.',
    localStorage: 'Se guarda solo en este navegador.',
    providerDisclosure: 'La información se envía al proveedor de IA únicamente después de tu consentimiento.',
  },
  glossary: [
    { term: 'Altas capacidades', definition: 'Expresión amplia para describir perfiles de aprendizaje avanzados o talentos. El uso y los términos cambian según el país.' },
    { term: 'Superdotación y sobredotación', definition: 'Términos usados en algunos países para ciertos perfiles de altas capacidades; no son diagnósticos que SendIA pueda determinar.' },
    { term: 'NEE y necesidades específicas de apoyo educativo', definition: 'Categorías y expresiones cuyo significado formal varía por país y sistema educativo.' },
  ],
} as const;

export type SupportedLocale = 'es-419' | 'pt-BR' | 'en';
export const dictionaries: Partial<Record<SupportedLocale, typeof copy>> = { 'es-419': copy };

export const countries = [
  ['AG', 'Antigua y Barbuda'], ['AR', 'Argentina'], ['BS', 'Bahamas'], ['BB', 'Barbados'],
  ['BZ', 'Belice'], ['BO', 'Bolivia'], ['BR', 'Brasil'], ['CA', 'Canadá'], ['CL', 'Chile'],
  ['CO', 'Colombia'], ['CR', 'Costa Rica'], ['CU', 'Cuba'], ['DM', 'Dominica'],
  ['DO', 'República Dominicana'], ['EC', 'Ecuador'], ['SV', 'El Salvador'], ['US', 'Estados Unidos'],
  ['GD', 'Granada'], ['GT', 'Guatemala'], ['GY', 'Guyana'], ['HT', 'Haití'], ['HN', 'Honduras'],
  ['JM', 'Jamaica'], ['MX', 'México'], ['NI', 'Nicaragua'], ['PA', 'Panamá'], ['PY', 'Paraguay'],
  ['PE', 'Perú'], ['KN', 'San Cristóbal y Nieves'], ['LC', 'Santa Lucía'],
  ['VC', 'San Vicente y las Granadinas'], ['SR', 'Surinam'], ['TT', 'Trinidad y Tobago'],
  ['UY', 'Uruguay'], ['VE', 'Venezuela'],
] as const;

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatMonth(value: string | Date): string {
  return formatDate(value, { month: 'long', year: 'numeric' });
}
