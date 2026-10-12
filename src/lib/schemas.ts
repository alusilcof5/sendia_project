export type Situation = 'participation' | 'frustration' | 'relationships' | 'challenge' | 'asynchrony' | 'perfectionism' | 'motivation' | 'transitions';
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
export type DiversificationOption = { principle: 'representación' | 'acción y expresión' | 'implicación' | 'no aplica'; barrier: string; evidence: string; learningGoal: string; strategy: string; strengthOrInterest: string; indicator: string; level: 'ordinaria' };
export type GeneratedGuidance = { summary: string; goalClear: boolean; goalClarificationQuestion: string; studentVoiceStatus: 'known' | 'pending' | 'contradictory'; studentVoice: string; studentQuestion: string; observations: string[]; interpretations: string[]; pending: string[]; hypotheses: GeneratedHypothesis[]; diversification: DiversificationOption[]; nextStep: NextStep; caution: string };
export type GeneratedOutputs = {
  teacher: { goal: string; variants: { level: 'apoyo' | 'base' | 'ampliación'; task: string; materials: string; observation: string; withoutTechnology: boolean }[] };
  family: { guide: string; questions: [string, string, string]; homeActivity: string; avoidConclusion: string };
  school: { situation: string; observations: string[]; openQuestions: string[]; indicator: string; reviewDate: string; consultWhen: string };
};

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
  if (!isStringRecord(value) || !boundedString(value.summary, 8, 700) || !boundedString(value.caution, 8, 700) || typeof value.goalClear !== 'boolean' ||
    !boundedString(value.goalClarificationQuestion, 5, 400) || !['known', 'pending', 'contradictory'].includes(String(value.studentVoiceStatus)) ||
    typeof value.studentVoice !== 'string' || value.studentVoice.length > 500 || !boundedString(value.studentQuestion, 5, 300) ||
    !boundedStringArray(value.observations, 0, 8, 500) || !boundedStringArray(value.interpretations, 0, 8, 500) || !boundedStringArray(value.pending, 0, 8, 500) ||
    !Array.isArray(value.hypotheses) || value.hypotheses.length < 1 || value.hypotheses.length > 3 ||
    !Array.isArray(value.diversification) || value.diversification.length > 3) {
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
  const diversification = value.diversification.map((item) => {
    if (!isStringRecord(item) || !['representación', 'acción y expresión', 'implicación', 'no aplica'].includes(String(item.principle)) ||
      !boundedString(item.barrier, 5, 300) || !boundedString(item.evidence, 5, 400) || !boundedString(item.learningGoal, 5, 300) ||
      !boundedString(item.strategy, 8, 400) || typeof item.strengthOrInterest !== 'string' || item.strengthOrInterest.length > 300 ||
      !boundedString(item.indicator, 5, 300) || item.level !== 'ordinaria') throw new Error('Una medida de diversificación no tiene el formato esperado.');
    return { principle: item.principle as DiversificationOption['principle'], barrier: item.barrier.trim(), evidence: item.evidence.trim(), learningGoal: item.learningGoal.trim(), strategy: item.strategy.trim(), strengthOrInterest: item.strengthOrInterest.trim(), indicator: item.indicator.trim(), level: 'ordinaria' as const };
  });
  if (diversification.some((item) => item.principle === 'no aplica') && diversification.length !== 1) throw new Error('Una aclaración de meta no debe mezclar opciones de adaptación.');
  if (!value.goalClear && (diversification.length !== 1 || diversification[0].principle !== 'no aplica')) throw new Error('Aclara la meta antes de proponer ajustes.');
  if (value.goalClear && diversification.length === 0) throw new Error('Incluye al menos una opción pertinente para la meta.');
  if (value.goalClear && new Set(diversification.map((item) => item.learningGoal.trim().toLocaleLowerCase())).size !== 1) throw new Error('Las opciones deben conservar la misma meta de aprendizaje.');
  if (value.studentVoiceStatus === 'pending' && value.studentVoice.trim()) throw new Error('La voz pendiente del estudiante no debe presentarse como conocida.');
  if (value.studentVoiceStatus !== 'pending' && !value.studentVoice.trim()) throw new Error('Indica qué voz del estudiante se aportó o qué dato es contradictorio.');
  const step = value.nextStep;
  const stepKeys = ['objective', 'question', 'why', 'action', 'responsible', 'indicator', 'reviewIn'] as const;
  if (!isStringRecord(step) || !stepKeys.every((key) => boundedString(step[key], 1, 500))) {
    throw new Error('El siguiente paso generado no tiene el formato esperado.');
  }
  const pending = value.pending.map((entry) => entry.trim()).slice(0, 8);
  return {
    summary: value.summary.trim(), goalClear: value.goalClear, goalClarificationQuestion: value.goalClarificationQuestion.trim(), studentVoiceStatus: value.studentVoiceStatus as GeneratedGuidance['studentVoiceStatus'], studentVoice: value.studentVoice.trim(), studentQuestion: value.studentQuestion.trim(), observations: value.observations.map((entry) => entry.trim()), interpretations: value.interpretations.map((entry) => entry.trim()),
    pending, hypotheses, diversification,
    nextStep: Object.fromEntries(stepKeys.map((key) => [key, (step[key] as string).trim()])) as unknown as NextStep,
    caution: value.caution.trim(),
  };
}

export function parseGeneratedOutputs(value: unknown): GeneratedOutputs {
  if (!isStringRecord(value) || !isStringRecord(value.teacher) || !isStringRecord(value.family) || !isStringRecord(value.school)) throw new Error('Los materiales no tienen el formato esperado.');
  const teacher = value.teacher;
  if (!boundedString(teacher.goal, 3, 500) || !Array.isArray(teacher.variants) || teacher.variants.length !== 3) throw new Error('La propuesta para el docente no tiene el formato esperado.');
  const expectedLevels = ['apoyo', 'base', 'ampliación'];
  const variants = teacher.variants.map((item, index) => {
    if (!isStringRecord(item) || item.level !== expectedLevels[index] || !boundedString(item.task, 5, 1200) || !boundedString(item.materials, 3, 500) || !boundedString(item.observation, 3, 500) || typeof item.withoutTechnology !== 'boolean') throw new Error('Una variante de la actividad no tiene el formato esperado.');
    return { level: item.level as GeneratedOutputs['teacher']['variants'][number]['level'], task: item.task.trim(), materials: item.materials.trim(), observation: item.observation.trim(), withoutTechnology: item.withoutTechnology };
  });
  if (!variants.some((item) => item.withoutTechnology)) throw new Error('Al menos una variante debe poder realizarse sin tecnología.');
  const family = value.family;
  if (!boundedString(family.guide, 8, 1800) || !boundedStringArray(family.questions, 3, 3, 300) || !boundedString(family.homeActivity, 5, 800) || !boundedString(family.avoidConclusion, 5, 600)) throw new Error('La guía para la familia no tiene el formato esperado.');
  const school = value.school;
  if (!boundedString(school.situation, 5, 700) || !boundedStringArray(school.observations, 1, 8, 500) || !boundedStringArray(school.openQuestions, 1, 8, 500) || !boundedString(school.indicator, 3, 500) || !boundedString(school.reviewDate, 3, 100) || !boundedString(school.consultWhen, 5, 700)) throw new Error('El resumen para la institución no tiene el formato esperado.');
  return { teacher: { goal: teacher.goal.trim(), variants }, family: { guide: family.guide.trim(), questions: family.questions.map((item) => item.trim()) as [string, string, string], homeActivity: family.homeActivity.trim(), avoidConclusion: family.avoidConclusion.trim() }, school: { situation: school.situation.trim(), observations: school.observations.map((item) => item.trim()), openQuestions: school.openQuestions.map((item) => item.trim()), indicator: school.indicator.trim(), reviewDate: school.reviewDate.trim(), consultWhen: school.consultWhen.trim() } };
}
