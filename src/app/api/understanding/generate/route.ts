import { isStringRecord, parseAdaptiveQuestion, parseGeneratedGuidance, type AdaptiveQuestion, type GeneratedGuidance, type Situation } from '../../../../lib/schemas.ts';
import { availableEvidenceFields, parseAgentPlan, parsePedagogicalMap, type EvidenceField } from '../../../../lib/agents/contracts.ts';
import { GeminiAgentError, generateStructuredGemini } from '../../../../lib/agents/gemini.ts';
import { findDirectIdentifiers, identifierMessage } from '../../../../lib/privacy.ts';
import { aiSituationLabels, countries } from '../../../../lib/i18n/es-419.ts';
import { prompts } from '../../../../lib/i18n/prompts.es-419.ts';

export const runtime = 'nodejs';
export const maxDuration = 60;

const situationIds: Situation[] = ['participation', 'frustration', 'relationships', 'challenge', 'asynchrony', 'perfectionism', 'motivation', 'transitions', 'other'];
const defaultGeminiModel = 'gemini-3.8-flash';
const questionSchema = { type: 'object', additionalProperties: false, required: ['question', 'options', 'rationale'], properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } } };
const evidenceFieldSchema = { type: 'string', enum: ['observation', 'learningGoal', 'currentEvidence', 'expectedDemonstration', 'studentPerspective', 'context', 'strengthsAndInterests', 'knownSupportNeeds', 'history'] };
const evidenceRefsSchema = { type: 'array', items: evidenceFieldSchema };
const evidenceStatementSchema = { type: 'object', additionalProperties: false, required: ['text', 'evidenceRefs'], properties: { text: { type: 'string' }, evidenceRefs: evidenceRefsSchema } };
const explorationSchema = { type: 'object', additionalProperties: false, required: ['goalClear', 'goalEvidenceRefs', 'goalClarificationQuestion', 'studentVoiceStatus', 'studentVoice', 'studentVoiceEvidenceRefs', 'studentQuestion', 'observations', 'interpretations', 'pending', 'hypotheses', 'barriers'], properties: {
  goalClear: { type: 'boolean' }, goalEvidenceRefs: evidenceRefsSchema, goalClarificationQuestion: { type: 'string' },
  studentVoiceStatus: { type: 'string', enum: ['known', 'pending', 'contradictory'] }, studentVoice: { type: 'string' }, studentVoiceEvidenceRefs: evidenceRefsSchema, studentQuestion: { type: 'string' },
  observations: { type: 'array', items: evidenceStatementSchema }, interpretations: { type: 'array', items: evidenceStatementSchema }, barriers: { type: 'array', items: evidenceStatementSchema },
  pending: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'reason', 'evidenceRefs'], properties: { question: { type: 'string' }, reason: { type: 'string' }, evidenceRefs: evidenceRefsSchema } } },
  hypotheses: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'possibility', 'supporting', 'missing', 'alternatives', 'evidenceRefs'], properties: { title: { type: 'string' }, possibility: { type: 'string' }, supporting: { type: 'array', items: { type: 'string' } }, missing: { type: 'array', items: { type: 'string' } }, alternatives: { type: 'array', items: { type: 'string' } }, evidenceRefs: evidenceRefsSchema } } },
} };
const plannerSchema = { type: 'object', additionalProperties: false, required: ['summary', 'goalClear', 'goalClarificationQuestion', 'diversification', 'nextStep', 'caution'], properties: {
  summary: { type: 'string' }, goalClear: { type: 'boolean' }, goalClarificationQuestion: { type: 'string' },
  diversification: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['principle', 'barrier', 'evidence', 'learningGoal', 'strategy', 'strengthOrInterest', 'indicator', 'level', 'evidenceRefs'], properties: { principle: { type: 'string', enum: ['representación', 'acción y expresión', 'implicación', 'no aplica'] }, barrier: { type: 'string' }, evidence: { type: 'string' }, learningGoal: { type: 'string' }, strategy: { type: 'string' }, strengthOrInterest: { type: 'string' }, indicator: { type: 'string' }, level: { type: 'string', enum: ['ordinaria'] }, evidenceRefs: evidenceRefsSchema } } },
  nextStep: { type: 'object', additionalProperties: false, required: ['objective', 'question', 'why', 'action', 'responsible', 'indicator', 'reviewIn'], properties: { objective: { type: 'string' }, question: { type: 'string' }, why: { type: 'string' }, action: { type: 'string' }, responsible: { type: 'string' }, indicator: { type: 'string' }, reviewIn: { type: 'string' } } }, caution: { type: 'string' }
} };

function boundedText(value: unknown, max: number) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function tooLong(value: unknown, max: number) { return typeof value === 'string' && value.length > max; }
function validHistory(value: unknown) { return value === undefined || (Array.isArray(value) && value.length <= 3 && value.every((item) => isStringRecord(item) && boundedText(item.question, 600) && boundedText(item.answer, 600))); }

type RateEntry = { count: number; until: number };
const rateLimits = new Map<string, RateEntry>();
let globalWindowStart = Date.now();
let globalRequests = 0;

/**
 * Rate limiting local a esta instancia: los contadores viven en memoria,
 * se reinician al reiniciar el proceso y no se comparten entre instancias.
 * Es una protección básica para la demo, no un límite de producción.
 */
function checkRateLimit(client: string, cost = 1): string | null {
  const now = Date.now();
  for (const [key, entry] of rateLimits) if (entry.until < now) rateLimits.delete(key);
  const clientLimit = rateLimits.get(client);
  // Se permiten hasta 12 llamadas por ventana para poder ejecutar la batería ficticia de evaluación.
  if (clientLimit && clientLimit.count + cost > 12) return 'Se alcanzó el límite temporal de consultas. Inténtalo más tarde.';
  if (!clientLimit && rateLimits.size >= 5_000) return 'El servicio alcanzó temporalmente su capacidad. Inténtalo más tarde.';
  const configuredGlobalLimit = Number.parseInt(process.env.SENDIA_MAX_AI_REQUESTS_PER_HOUR || '120', 10);
  const globalLimit = Number.isFinite(configuredGlobalLimit) && configuredGlobalLimit > 0 ? configuredGlobalLimit : 120;
  if (now - globalWindowStart >= 60 * 60_000) { globalWindowStart = now; globalRequests = 0; }
  if (globalRequests + cost > globalLimit) return 'SendIA alcanzó el límite global de consultas de IA de esta hora. Inténtalo más tarde.';
  rateLimits.set(client, { count: (clientLimit?.count ?? 0) + cost, until: clientLimit?.until ?? now + 10 * 60_000 });
  globalRequests += cost;
  return null;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 20_000) return Response.json({ error: 'La solicitud supera el tamaño máximo permitido (20 KB).' }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Solicitud no válida.' }, { status: 400 }); }
  if (!isStringRecord(body) || body.adultConsent !== true || !['question', 'guidance'].includes(String(body.action)) || !situationIds.includes(body.situation as Situation) || !boundedText(body.observation, 1200) || (body.learningGoal !== undefined && typeof body.learningGoal !== 'string') || (body.context !== undefined && typeof body.context !== 'string') || (body.support !== undefined && typeof body.support !== 'string') || (body.studentPerspective !== undefined && typeof body.studentPerspective !== 'string') || (body.evidence !== undefined && typeof body.evidence !== 'string') || (body.expectedDemonstration !== undefined && typeof body.expectedDemonstration !== 'string') || (body.necesidadesConocidas !== undefined && typeof body.necesidadesConocidas !== 'string') || (body.answer !== undefined && typeof body.answer !== 'string') || (body.question !== undefined && typeof body.question !== 'string') || (body.pais !== undefined && (typeof body.pais !== 'string' || !countries.some(([code]) => code === body.pais))) || tooLong(body.learningGoal, 500) || tooLong(body.context, 1200) || tooLong(body.support, 1200) || tooLong(body.studentPerspective, 500) || tooLong(body.evidence, 600) || tooLong(body.expectedDemonstration, 500) || tooLong(body.necesidadesConocidas, 500) || tooLong(body.answer, 600) || tooLong(body.question, 600) || !validHistory(body.history)) return Response.json({ error: 'Revisa el consentimiento, la situación y los límites de texto.' }, { status: 400 });
  const submittedText = [body.observation, body.learningGoal, body.context, body.support, body.studentPerspective, body.evidence, body.expectedDemonstration, body.necesidadesConocidas, body.answer, body.question, ...(Array.isArray(body.history) ? body.history.flatMap((item) => isStringRecord(item) ? [item.question, item.answer] : []) : [])].filter((item): item is string => typeof item === 'string').join('\n');
  const identifiers = findDirectIdentifiers(submittedText);
  if (identifiers.length) return Response.json({ error: identifierMessage(identifiers.map(({ kind }) => kind)) }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'La IA generativa aún no está configurada. Añade GEMINI_API_KEY en el entorno del servidor.' }, { status: 503 });
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((item) => item.trim()).filter(Boolean).at(-1);
  const client = request.headers.get('x-real-ip')?.trim() || forwarded || 'local';
  const rateLimitError = checkRateLimit(client, body.action === 'guidance' ? 2 : 1);
  if (rateLimitError) return Response.json({ error: rateLimitError }, { status: 429 });

  const input = { situation: aiSituationLabels[body.situation as Situation], observation: body.observation, learningGoal: typeof body.learningGoal === 'string' ? body.learningGoal : '', evidence: typeof body.evidence === 'string' ? body.evidence : '', expectedDemonstration: typeof body.expectedDemonstration === 'string' ? body.expectedDemonstration : '', studentPerspective: typeof body.studentPerspective === 'string' ? body.studentPerspective : '', context: typeof body.context === 'string' ? body.context : '', strengths: typeof body.support === 'string' ? body.support : '', knownNeeds: typeof body.necesidadesConocidas === 'string' ? body.necesidadesConocidas : '', question: typeof body.question === 'string' ? body.question : '', answer: typeof body.answer === 'string' ? body.answer : '', history: Array.isArray(body.history) ? body.history as { question: string; answer: string }[] : [], country: typeof body.pais === 'string' ? body.pais : '' };
  const action = body.action as 'question' | 'guidance';
  const data = {
    situation: aiSituationLabels[body.situation as Situation], observation: input.observation, learningGoal: input.learningGoal,
    currentEvidence: input.evidence, expectedDemonstration: input.expectedDemonstration, studentPerspective: input.studentPerspective,
    context: input.context, strengthsAndInterests: input.strengths, knownSupportNeeds: input.knownNeeds, history: input.history,
    ...(input.country ? { country: input.country } : {}),
  };
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;
  const runAgent = (system: string, agentInput: unknown, schema: Record<string, unknown>, maxOutputTokens: number) =>
    generateStructuredGemini({ apiKey, model, system, input: agentInput, schema, maxOutputTokens, retryPrompt: prompts.retry });
  try {
    if (action === 'question') {
      const questionInput = { situation: data.situation, observation: data.observation, learningGoal: data.learningGoal, currentEvidence: data.currentEvidence, expectedDemonstration: data.expectedDemonstration, studentPerspective: data.studentPerspective, context: data.context, history: data.history };
      const raw = await runAgent(prompts.question, questionInput, questionSchema, 800);
      return Response.json(parseAdaptiveQuestion(raw), { headers: { 'Cache-Control': 'no-store' } });
    }

    // Agente B: organiza los datos y vincula cada afirmación a campos disponibles.
    const availableFields = availableEvidenceFields(data);
    const mapRaw = await runAgent(prompts.explorer, data, explorationSchema, 3_000);
    const map = parsePedagogicalMap(mapRaw, availableFields);
    const mapEvidenceRefs = new Set<EvidenceField>([
      ...map.goalEvidenceRefs, ...map.observations.flatMap((item) => item.evidenceRefs),
      ...map.interpretations.flatMap((item) => item.evidenceRefs), ...map.pending.flatMap((item) => item.evidenceRefs),
      ...map.hypotheses.flatMap((item) => item.evidenceRefs), ...map.barriers.flatMap((item) => item.evidenceRefs),
      ...map.studentVoiceEvidenceRefs,
    ]);
    if (!mapEvidenceRefs.size) throw new Error('La síntesis no contiene referencias a los datos de entrada.');

    // Agente C: recibe la síntesis validada y la meta, no el relato completo.
    const planRaw = await runAgent(prompts.planner, { learningGoal: data.learningGoal, map }, plannerSchema, 2_800);
    const plan = parseAgentPlan(planRaw, mapEvidenceRefs);
    if (plan.goalClear !== map.goalClear) throw new Error('La síntesis y el plan discrepan sobre la claridad de la meta.');

    const combined: GeneratedGuidance = {
      summary: plan.summary, goalClear: map.goalClear, goalClarificationQuestion: map.goalClarificationQuestion,
      studentVoiceStatus: map.studentVoiceStatus, studentVoice: map.studentVoice, studentQuestion: map.studentQuestion,
      observations: map.observations.map((item) => item.text), interpretations: map.interpretations.map((item) => item.text),
      pending: map.pending.map((item) => `${item.question} ${item.reason}`.trim()),
      hypotheses: map.hypotheses.map(({ evidenceRefs, ...item }) => ({ ...item, evidenceRefs })),
      diversification: plan.diversification, nextStep: plan.nextStep, caution: plan.caution,
    };
    return Response.json(parseGeneratedGuidance(combined), { headers: { 'Cache-Control': 'no-store' } });
  } catch (reason) {
    console.error('[SENDIA agentes] flujo no validado', reason instanceof Error ? reason.message : 'error desconocido');
    if (reason instanceof GeminiAgentError) return Response.json({ error: reason.message }, { status: reason.status });
    return Response.json({ error: 'SENDIA no pudo validar la síntesis y las opciones. Revisa la información o inténtalo otra vez.' }, { status: 502 });
  }
}
