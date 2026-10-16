import { isStringRecord } from './schemas.ts';

export type ActivityVariant = {
  route: 'representacion' | 'expresion' | 'profundizacion';
  title: string;
  change: string;
  task: string;
  materials: string;
  observe: string;
};

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
    return { route: item.route as ActivityVariant['route'], title: item.title.trim(), change: item.change.trim(), task: item.task.trim(), materials: item.materials.trim(), observe: item.observe.trim() };
  });
  if (new Set(variants.map((variant) => variant.route)).size !== 3) throw new Error('La actividad debe incluir tres vías distintas.');
  return { title: value.title.trim(), objective: value.objective.trim(), duration: value.duration.trim(), materials: value.materials.map((item) => item.trim()), steps: value.steps.map((item) => item.trim()), variants, reviewNote: value.reviewNote.trim() };
}

export function parseSavedActivity(value: unknown): CreatedActivity | null {
  if (!isStringRecord(value) || typeof value.id !== 'string' || typeof value.createdAt !== 'string' ||
    !['crear', 'adaptar', 'modificar'].includes(String(value.mode)) || !text(value.stage, 2, 100) || !text(value.area, 2, 100)) return null;
  try { return { ...parseCreatedActivity(value), id: value.id, createdAt: value.createdAt, mode: value.mode as CreatedActivity['mode'], stage: value.stage, area: value.area }; }
  catch { return null; }
}
