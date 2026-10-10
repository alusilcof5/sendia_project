export type Situation = 'participation' | 'frustration' | 'relationships' | 'challenge';
export type Observation = { id: string; text: string; category: 'observation' | 'interpretation' | 'pending' };
export type EvidenceStatus = 'compatible' | 'insufficient' | 'contradictory' | 'unsupported';
export type CaseObservation = { id: string; text: string; source: 'initial' | 'new'; kind: 'observation' | 'interpretation' | 'unknown' };
export type HypothesisReview = { id: string; title: string; summary: string; status: EvidenceStatus; supporting: string[]; missing: string[]; alternatives: string[]; usefulToKnow: string };
export type DemoBranch = 'skill-specific' | 'insufficient' | 'contradictory';
export type NextStep = { objective: string; question: string; why: string; action: string; responsible: string; indicator: string; reviewIn: string };
export type ActionPlan = { title: string; objective: string; strategies: { id: string; title: string; detail: string; responsible: string; cadence: string }[]; reviewDate: string; status: 'draft' | 'active' | 'pending-approval' | 'approved' | 'completed' };

export function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseQuestionResponse(value: unknown): { question: string; options: string[] } {
  if (!isStringRecord(value) || typeof value.question !== 'string' || !Array.isArray(value.options) || !value.options.every((option) => typeof option === 'string')) throw new Error('La respuesta no tiene el formato esperado.');
  return { question: value.question, options: value.options };
}

export function parseHypothesisReview(value: unknown): HypothesisReview {
  const textArray = (entry: unknown) => Array.isArray(entry) && entry.every((item) => typeof item === 'string');
  if (!isStringRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.summary !== 'string' ||
    !['compatible', 'insufficient', 'contradictory', 'unsupported'].includes(String(value.status)) ||
    !textArray(value.supporting) || !textArray(value.missing) || !textArray(value.alternatives) || typeof value.usefulToKnow !== 'string') {
    throw new Error('La revisión de hipótesis no tiene el formato esperado.');
  }
  return value as unknown as HypothesisReview;
}


export type AdaptiveQuestion = { question: string; options: string[]; rationale: string };
export type GeneratedHypothesis = { title: string; possibility: string; supporting: string[]; missing: string[]; alternatives: string[] };
export type DiversificationOption = { title: string; representation: string; actionAndExpression: string; engagement: string };
export type GeneratedGuidance = { summary: string; observations: string[]; interpretations: string[]; pending: string[]; hypotheses: GeneratedHypothesis[]; options: DiversificationOption[]; nextStep: NextStep; caution: string };

function boundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}

function boundedStringArray(value: unknown, minItems: number, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value) && value.length >= minItems && value.length <= maxItems && value.every((item) => boundedString(item, 1, maxLength));
}

export function parseAdaptiveQuestion(value: unknown): AdaptiveQuestion {
  if (!isStringRecord(value) || !boundedString(value.question, 8, 500) || !boundedString(value.rationale, 8, 700) || !boundedStringArray(value.options, 2, 5, 120)) {
    throw new Error('La pregunta generada no tiene el formato esperado.');
  }
  return { question: value.question.trim(), rationale: value.rationale.trim(), options: value.options.map((option) => option.trim()) };
}

export function parseGeneratedGuidance(value: unknown): GeneratedGuidance {
  if (!isStringRecord(value) || !boundedString(value.summary, 8, 700) || !boundedString(value.caution, 8, 700) ||
    !boundedStringArray(value.observations, 0, 8, 500) || !boundedStringArray(value.interpretations, 0, 8, 500) || !boundedStringArray(value.pending, 0, 8, 500) ||
    !Array.isArray(value.hypotheses) || value.hypotheses.length < 1 || value.hypotheses.length > 3 ||
    !Array.isArray(value.options) || value.options.length < 2 || value.options.length > 3) {
    throw new Error('La propuesta generada no tiene el formato esperado.');
  }
  const hypotheses = value.hypotheses.map((item) => {
    if (!isStringRecord(item) || !boundedString(item.title, 3, 160) || !boundedString(item.possibility, 8, 500) ||
      !boundedStringArray(item.supporting, 0, 6, 400) || !boundedStringArray(item.missing, 0, 6, 400) ||
      !boundedStringArray(item.alternatives, 1, 6, 400)) {
      throw new Error('Una hipótesis generada no tiene el formato esperado.');
    }
    const possibility = item.possibility.trim();
    return { title: item.title.trim(), possibility: /^podría ser que\b/i.test(possibility) ? possibility : `Podría ser que ${possibility.charAt(0).toLowerCase()}${possibility.slice(1)}`, supporting: item.supporting.map((entry) => entry.trim()), missing: item.missing.map((entry) => entry.trim()), alternatives: item.alternatives.map((entry) => entry.trim()) };
  });
  const options = value.options.map((item) => {
    if (!isStringRecord(item) || !boundedString(item.title, 3, 120) || !boundedString(item.representation, 8, 300) || !boundedString(item.actionAndExpression, 8, 300) || !boundedString(item.engagement, 8, 300)) throw new Error("Una opción de diversificación no tiene el formato esperado.");
    return { title: item.title.trim(), representation: item.representation.trim(), actionAndExpression: item.actionAndExpression.trim(), engagement: item.engagement.trim() };
  });
  const step = value.nextStep;
  const stepKeys = ['objective', 'question', 'why', 'action', 'responsible', 'indicator', 'reviewIn'] as const;
  if (!isStringRecord(step) || !stepKeys.every((key) => boundedString(step[key], 1, 500))) {
    throw new Error('El siguiente paso generado no tiene el formato esperado.');
  }
  const pending = value.pending.map((entry) => entry.trim()).slice(0, 6);
  if (!pending.some((entry) => /estudiante|su voz|qué piensa|cómo vive/i.test(entry))) pending.push('Preguntar al estudiante cómo vive la situación y qué le ayudaría.');
  if (!pending.some((entry) => /familia|persona cuidadora/i.test(entry))) pending.push('Cuando proceda, recoger también la perspectiva de la familia.');
  return {
    summary: value.summary.trim(), observations: value.observations.map((entry) => entry.trim()), interpretations: value.interpretations.map((entry) => entry.trim()),
    pending, hypotheses, options,
    nextStep: Object.fromEntries(stepKeys.map((key) => [key, (step[key] as string).trim()])) as unknown as NextStep,
    caution: value.caution.trim(),
  };
}
