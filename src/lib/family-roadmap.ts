import { isStringRecord } from '@/lib/schemas';
import { familySources, type FamilySourceId } from '@/lib/family-sources';

export const familyStages = [
  { id: 'new-identification', label: 'Acabamos de recibir una identificación o evaluación de altas capacidades' },
  { id: 'understand-report', label: 'Tenemos un informe y queremos traducirlo a decisiones cotidianas' },
  { id: 'school-conversation', label: 'Queremos hablar con el centro educativo' },
  { id: 'exploring-support', label: 'Estamos buscando orientación o aún tenemos preguntas' },
  { id: 'review-support', label: 'Ya hay apoyos y queremos revisar cómo están funcionando' },
] as const;

export const familyFocuses = [
  { id: 'first-steps', label: 'Saber por dónde empezar' },
  { id: 'talk-child', label: 'Hablarlo con mi hijo o hija' },
  { id: 'school', label: 'Preparar una conversación con el centro' },
  { id: 'wellbeing', label: 'Acompañar su bienestar y sus intereses' },
  { id: 'learning', label: 'Pensar apoyos para el aprendizaje' },
  { id: 'review', label: 'Revisar lo que ya estamos haciendo' },
] as const;

export const familyAgeBands = [
  { id: 'early-years', label: 'Hasta 5 años' },
  { id: 'primary', label: '6–11 años' },
  { id: 'secondary', label: '12–17 años' },
  { id: 'adult', label: '18 años o más' },
  { id: 'prefer-not', label: 'Prefiero no indicarlo' },
] as const;

export type FamilyStageId = typeof familyStages[number]['id'];
export type FamilyFocusId = typeof familyFocuses[number]['id'];
export type FamilyAgeBandId = typeof familyAgeBands[number]['id'];

export type FamilyRoadmap = {
  summary: string;
  firstSteps: { title: string; action: string; reason: string }[];
  nextSteps: { title: string; action: string; reason: string }[];
  childConversation: string[];
  schoolConversation: string[];
  humanSupport: string;
  keepInMind: string;
  sourceIds: FamilySourceId[];
};

const bounded = (value: unknown, max: number, min = 1): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max;
const stringList = (value: unknown, minItems: number, maxItems: number, maxLength: number): value is string[] => Array.isArray(value) && value.length >= minItems && value.length <= maxItems && value.every((item) => bounded(item, maxLength));

export function parseFamilyRoadmap(value: unknown): FamilyRoadmap {
  if (!isStringRecord(value) || !bounded(value.summary, 700, 12) || !bounded(value.humanSupport, 700, 12) || !bounded(value.keepInMind, 500, 12) ||
    !Array.isArray(value.firstSteps) || value.firstSteps.length < 2 || value.firstSteps.length > 3 ||
    !Array.isArray(value.nextSteps) || value.nextSteps.length < 2 || value.nextSteps.length > 3 ||
    !stringList(value.childConversation, 2, 4, 300) || !stringList(value.schoolConversation, 2, 4, 300) ||
    !Array.isArray(value.sourceIds) || value.sourceIds.length < 2 || value.sourceIds.length > 4 || new Set(value.sourceIds).size < 2 ||
    !value.sourceIds.every((id) => familySources.some((source) => source.id === id))) {
    throw new Error('La hoja de ruta no tiene el formato esperado.');
  }
  const parseSteps = (steps: unknown[]) => steps.map((step) => {
    if (!isStringRecord(step) || !bounded(step.title, 120, 3) || !bounded(step.action, 500, 8) || !bounded(step.reason, 350, 8)) {
      throw new Error('Un paso de la hoja de ruta no tiene el formato esperado.');
    }
    return { title: step.title.trim(), action: step.action.trim(), reason: step.reason.trim() };
  });
  return {
    summary: value.summary.trim(),
    firstSteps: parseSteps(value.firstSteps),
    nextSteps: parseSteps(value.nextSteps),
    childConversation: value.childConversation.map((item) => item.trim()),
    schoolConversation: value.schoolConversation.map((item) => item.trim()),
    humanSupport: value.humanSupport.trim(),
    keepInMind: value.keepInMind.trim(),
    sourceIds: [...new Set(value.sourceIds as FamilySourceId[])],
  };
}
