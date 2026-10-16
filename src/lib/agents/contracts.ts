import { isStringRecord, type DiversificationOption, type GeneratedHypothesis, type NextStep } from '../schemas.ts';

export const evidenceFields = [
  'observation', 'learningGoal', 'currentEvidence', 'expectedDemonstration',
  'studentPerspective', 'context', 'strengthsAndInterests', 'knownSupportNeeds', 'history',
] as const;
export type EvidenceField = typeof evidenceFields[number];

export type EvidenceStatement = { text: string; evidenceRefs: EvidenceField[] };
export type PedagogicalMap = {
  goalClear: boolean;
  goalEvidenceRefs: EvidenceField[];
  goalClarificationQuestion: string;
  studentVoiceStatus: 'known' | 'pending' | 'contradictory';
  studentVoice: string;
  studentVoiceEvidenceRefs: EvidenceField[];
  studentQuestion: string;
  observations: EvidenceStatement[];
  interpretations: EvidenceStatement[];
  pending: { question: string; reason: string; evidenceRefs: EvidenceField[] }[];
  hypotheses: (GeneratedHypothesis & { evidenceRefs: EvidenceField[] })[];
  barriers: EvidenceStatement[];
};

export type AgentPlan = {
  summary: string;
  goalClear: boolean;
  goalClarificationQuestion: string;
  diversification: (DiversificationOption & { evidenceRefs: EvidenceField[] })[];
  nextStep: NextStep;
  caution: string;
};

const string = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max;
const strings = (value: unknown, maxItems: number, maxLength: number, minItems = 0): value is string[] => Array.isArray(value) && value.length >= minItems && value.length <= maxItems && value.every((item) => string(item, 1, maxLength));
const refsValid = (value: unknown, available: Set<string>, min = 1): value is EvidenceField[] => Array.isArray(value) && value.length >= min && value.length <= evidenceFields.length && value.every((item) => evidenceFields.includes(item) && available.has(item)) && new Set(value).size === value.length;

export function parsePedagogicalMap(value: unknown, availableFields: Set<string>): PedagogicalMap {
  const statementArray = (items: unknown): items is EvidenceStatement[] => Array.isArray(items) && items.length <= 8 && items.every((item) => isStringRecord(item) && string(item.text, 1, 500) && refsValid(item.evidenceRefs, availableFields));
  if (!isStringRecord(value) || typeof value.goalClear !== 'boolean' || !Array.isArray(value.goalEvidenceRefs) || !string(value.goalClarificationQuestion, 5, 400) ||
      !['known', 'pending', 'contradictory'].includes(String(value.studentVoiceStatus)) || !string(value.studentVoice, 0, 500) || !string(value.studentQuestion, 5, 300) ||
      !Array.isArray(value.studentVoiceEvidenceRefs) ||
      !statementArray(value.observations) || !statementArray(value.interpretations) || !statementArray(value.barriers) ||
      !Array.isArray(value.pending) || value.pending.length > 8 || !value.pending.every((item) => isStringRecord(item) && string(item.question, 5, 400) && string(item.reason, 3, 400) && refsValid(item.evidenceRefs, availableFields, 0)) ||
      !Array.isArray(value.hypotheses) || value.hypotheses.length < 1 || value.hypotheses.length > 3 || !value.hypotheses.every((item) => isStringRecord(item) &&
        string(item.title, 3, 160) && string(item.possibility, 8, 500) && strings(item.supporting, 6, 400) && strings(item.missing, 6, 400) && strings(item.alternatives, 6, 400, 1) && refsValid(item.evidenceRefs, availableFields))) {
    throw new Error('La síntesis pedagógica no cumple el esquema esperado.');
  }
  if (value.goalClear && !refsValid(value.goalEvidenceRefs, availableFields)) throw new Error('La meta no tiene una referencia a información aportada.');
  if (!value.goalClear && (value.goalEvidenceRefs.length > 0 || !string(value.goalClarificationQuestion, 5, 400))) throw new Error('La meta pendiente debe aclararse antes de diseñar opciones.');
  if (value.goalClear === false && value.studentVoiceStatus === 'pending' && value.studentVoice !== '') throw new Error('No se puede atribuir una voz pendiente.');
  if (value.studentVoiceStatus === 'pending' && value.studentVoice !== '') throw new Error('No se puede atribuir una voz pendiente.');
  if (value.studentVoiceStatus === 'pending' && value.studentVoiceEvidenceRefs.length > 0) throw new Error('La voz pendiente no puede tener referencias de voz conocida.');
  if (value.studentVoiceStatus !== 'pending' && (!string(value.studentVoice, 1, 500) || !refsValid(value.studentVoiceEvidenceRefs, availableFields) || !value.studentVoiceEvidenceRefs.some((ref) => ref === 'studentPerspective' || ref === 'history'))) throw new Error('La voz conocida debe tener texto y una referencia de origen válida.');
  return value as unknown as PedagogicalMap;
}

export function parseAgentPlan(value: unknown, availableFields: Set<string>): AgentPlan {
  if (!isStringRecord(value)) throw new Error('El plan pedagógico no cumple el esquema esperado.');
  const nextStep = value.nextStep;
  if (!string(value.summary, 8, 700) || typeof value.goalClear !== 'boolean' || !string(value.goalClarificationQuestion, 5, 400) ||
      !Array.isArray(value.diversification) || value.diversification.length > 3 || !string(value.caution, 8, 700)) {
    throw new Error('El plan pedagógico no cumple el esquema esperado.');
  }
  const diversification = value.diversification.map((item) => {
    if (!isStringRecord(item) || !['representación', 'acción y expresión', 'implicación', 'no aplica'].includes(String(item.principle)) ||
      !string(item.barrier, 5, 300) || !string(item.evidence, 5, 400) || !string(item.learningGoal, 5, 300) || !string(item.strategy, 8, 400) ||
      typeof item.strengthOrInterest !== 'string' || item.strengthOrInterest.length > 300 || !string(item.indicator, 5, 300) || item.level !== 'ordinaria' ||
      !refsValid(item.evidenceRefs, availableFields)) throw new Error('Una opción pedagógica no tiene evidencia trazable o no cumple el esquema.');
    return { principle: item.principle as DiversificationOption['principle'], barrier: item.barrier.trim(), evidence: item.evidence.trim(), learningGoal: item.learningGoal.trim(), strategy: item.strategy.trim(), strengthOrInterest: item.strengthOrInterest.trim(), indicator: item.indicator.trim(), level: 'ordinaria' as const, evidenceRefs: item.evidenceRefs as EvidenceField[] };
  });
  if (!isStringRecord(nextStep) || !['objective', 'question', 'why', 'action', 'responsible', 'indicator', 'reviewIn'].every((key) => string(nextStep[key], 1, 500))) throw new Error('El siguiente paso no cumple el esquema esperado.');
  if (!value.goalClear && (diversification.length !== 1 || diversification[0].principle !== 'no aplica')) throw new Error('No se permiten adaptaciones si la meta no está clara.');
  if (value.goalClear && (diversification.length < 1 || diversification.some((item) => item.principle === 'no aplica') || new Set(diversification.map((item) => item.learningGoal.toLocaleLowerCase())).size !== 1)) throw new Error('Las opciones deben mantener una meta común y estar justificadas.');
  const step = nextStep as Record<string, string>;
  return { summary: value.summary.trim(), goalClear: value.goalClear, goalClarificationQuestion: value.goalClarificationQuestion.trim(), diversification, nextStep: Object.fromEntries(Object.entries(step).map(([key, text]) => [key, text.trim()])) as unknown as NextStep, caution: value.caution.trim() };
}

export function availableEvidenceFields(data: Record<string, unknown>): Set<string> {
  const fields: EvidenceField[] = ['observation', 'learningGoal', 'currentEvidence', 'expectedDemonstration', 'studentPerspective', 'context', 'strengthsAndInterests', 'knownSupportNeeds'];
  const available = new Set(fields.filter((field) => typeof data[field] === 'string' && (data[field] as string).trim().length > 0));
  if (Array.isArray(data.history) && data.history.length) available.add('history');
  return available;
}
