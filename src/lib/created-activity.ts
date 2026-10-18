import { isStringRecord } from './schemas.ts';

export type ActivityVariant = {
  route: 'representacion' | 'expresion' | 'profundizacion';
  title: string;
  change: string;
  task: string;
  materials: string;
  observe: string;
  teacherDecision?: 'pendiente' | 'usar' | 'ajustar' | 'descartar';
};

export type ActivityFollowUp = { tried: string; observed: string; nextStep: string; recordedAt: string };

export type CreatedActivity = {
  id: string;
  createdAt: string;
  mode: 'crear' | 'adaptar' | 'modificar';
  title: string;
  stage: string;
  area: string;
  objective: string;
  duration: string;
  materials: string[];
  steps: string[];
  variants: ActivityVariant[];
  reviewNote: string;
  agentMode?: 'general' | 'aula-aci';
  pedagogicalRationale?: string;
  evaluationCriteria?: string[];
  evaluationInstrument?: string;
  teacherGuidance?: string;
  curriculumSources?: { title: string; url: string }[];
  followUps?: ActivityFollowUp[];
};

const text = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max;
const textList = (value: unknown, min: number, max: number, maxLength: number): value is string[] => Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => text(item, 1, maxLength));

export function parseCreatedActivity(value: unknown): Omit<CreatedActivity, 'id' | 'createdAt' | 'mode' | 'stage' | 'area'> {
  if (!isStringRecord(value) || !text(value.title, 3, 160) || !text(value.objective, 5, 500) || !text(value.duration, 2, 100) ||
    !textList(value.materials, 1, 12, 200) || !textList(value.steps, 1, 8, 600) || !text(value.reviewNote, 5, 500) || !Array.isArray(value.variants) || value.variants.length !== 3) {
    throw new Error('La actividad generada no cumple el formato esperado.');
  }
  const variants = value.variants.map((item) => {
    if (!isStringRecord(item) || !['representacion', 'expresion', 'profundizacion'].includes(String(item.route)) ||
      !text(item.title, 3, 120) || !text(item.change, 5, 350) || !text(item.task, 5, 700) || !text(item.materials, 3, 250) || !text(item.observe, 5, 300)) {
      throw new Error('Una vía alternativa de la actividad no cumple el formato esperado.');
    }
    if (item.teacherDecision !== undefined && !['pendiente', 'usar', 'ajustar', 'descartar'].includes(String(item.teacherDecision))) throw new Error('La decisión docente de una vía no es válida.');
    return { route: item.route as ActivityVariant['route'], title: item.title.trim(), change: item.change.trim(), task: item.task.trim(), materials: item.materials.trim(), observe: item.observe.trim(), ...(item.teacherDecision ? { teacherDecision: item.teacherDecision as ActivityVariant['teacherDecision'] } : {}) };
  });
  if (new Set(variants.map((variant) => variant.route)).size !== 3) throw new Error('La actividad debe incluir tres vías distintas.');
  if (value.pedagogicalRationale !== undefined && value.pedagogicalRationale !== '' && !text(value.pedagogicalRationale, 5, 1200)) throw new Error('La fundamentación pedagógica no cumple el formato esperado.');
  if (value.evaluationCriteria !== undefined) {
    const criteria = value.evaluationCriteria;
    if (!Array.isArray(criteria) || criteria.length > 8) throw new Error('Los criterios de evaluación no cumplen el formato esperado.');
    if (criteria.length > 0 && (criteria.length < 2 || !criteria.every((item) => text(item, 1, 250)))) throw new Error('Los criterios de evaluación no cumplen el formato esperado.');
  }
  if (value.evaluationInstrument !== undefined && value.evaluationInstrument !== '' && !text(value.evaluationInstrument, 5, 800)) throw new Error('El instrumento de evaluación no cumple el formato esperado.');
  if (value.teacherGuidance !== undefined && value.teacherGuidance !== '' && !text(value.teacherGuidance, 5, 800)) throw new Error('Las orientaciones para el docente no cumplen el formato esperado.');
  let curriculumSources: CreatedActivity['curriculumSources'];
  if (value.curriculumSources !== undefined) {
    if (!Array.isArray(value.curriculumSources) || value.curriculumSources.length > 4 || !value.curriculumSources.every((source) => {
      if (!isStringRecord(source) || !text(source.title, 3, 200) || !text(source.url, 10, 1000)) return false;
      try { const url = new URL(source.url); return url.protocol === 'https:' && ['anep.edu.uy', 'www.anep.edu.uy'].includes(url.hostname); } catch { return false; }
    })) throw new Error('Las referencias curriculares no cumplen el formato esperado.');
    curriculumSources = value.curriculumSources.map((source) => ({ title: source.title.trim(), url: source.url.trim() }));
  }
  let followUps: ActivityFollowUp[] | undefined;
  if (value.followUps !== undefined) {
    if (!Array.isArray(value.followUps) || value.followUps.length > 20 || !value.followUps.every((entry) => isStringRecord(entry) && text(entry.tried, 3, 300) && text(entry.observed, 5, 1200) && typeof entry.nextStep === 'string' && entry.nextStep.length <= 800 && text(entry.recordedAt, 10, 40))) throw new Error('El registro de seguimiento no cumple el formato esperado.');
    followUps = value.followUps.map((entry) => ({ tried: entry.tried.trim(), observed: entry.observed.trim(), nextStep: entry.nextStep.trim(), recordedAt: entry.recordedAt }));
  }
  return {
    title: value.title.trim(), objective: value.objective.trim(), duration: value.duration.trim(), materials: value.materials.map((item) => item.trim()), steps: value.steps.map((item) => item.trim()), variants, reviewNote: value.reviewNote.trim(),
    ...(typeof value.pedagogicalRationale === 'string' && value.pedagogicalRationale.trim() ? { pedagogicalRationale: value.pedagogicalRationale.trim() } : {}),
    ...(Array.isArray(value.evaluationCriteria) && value.evaluationCriteria.length ? { evaluationCriteria: value.evaluationCriteria.map((item: string) => item.trim()) } : {}),
    ...(typeof value.evaluationInstrument === 'string' && value.evaluationInstrument.trim() ? { evaluationInstrument: value.evaluationInstrument.trim() } : {}),
    ...(typeof value.teacherGuidance === 'string' && value.teacherGuidance.trim() ? { teacherGuidance: value.teacherGuidance.trim() } : {}),
    ...(curriculumSources ? { curriculumSources } : {}),
    ...(followUps ? { followUps } : {}),
  };
}

export function parseSavedActivity(value: unknown): CreatedActivity | null {
  if (!isStringRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string' ||
    !['crear', 'adaptar', 'modificar'].includes(String(value.mode)) || !text(value.stage, 2, 100) || !text(value.area, 2, 100)) return null;
  if (value.agentMode !== undefined && !['general', 'aula-aci'].includes(String(value.agentMode))) return null;
  try { return { ...parseCreatedActivity(value), id: value.id, createdAt: value.createdAt, mode: value.mode as CreatedActivity['mode'], stage: value.stage, area: value.area, ...(value.agentMode ? { agentMode: value.agentMode as CreatedActivity['agentMode'] } : {}) }; }
  catch { return null; }
}
