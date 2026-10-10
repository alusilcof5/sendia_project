import { NextResponse } from 'next/server';
import { isStringRecord, parseAdaptiveQuestion, parseGeneratedGuidance, type AdaptiveQuestion, type GeneratedGuidance, type Situation } from '@/lib/schemas';
import { containsDirectIdentifier } from '@/lib/privacy';

export const runtime = 'nodejs';
export const maxDuration = 30;

const situationIds: Situation[] = ['participation', 'frustration', 'relationships', 'challenge'];
const situationNames: Record<Situation, string> = { participation: 'participación', frustration: 'inicio y bloqueo', relationships: 'relaciones', challenge: 'reto y aprendizaje' };
const questionSchema = { type: 'object', additionalProperties: false, required: ['question', 'options', 'rationale'], properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } } };
const guidanceSchema = { type: 'object', additionalProperties: false, required: ['summary', 'observations', 'pending', 'hypotheses', 'nextStep', 'caution'], properties: {
  summary: { type: 'string' }, observations: { type: 'array', items: { type: 'string' } }, pending: { type: 'array', items: { type: 'string' } },
  hypotheses: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'possibility', 'supporting', 'missing', 'alternatives'], properties: { title: { type: 'string' }, possibility: { type: 'string' }, supporting: { type: 'array', items: { type: 'string' } }, missing: { type: 'array', items: { type: 'string' } }, alternatives: { type: 'array', items: { type: 'string' } } } } },
  nextStep: { type: 'object', additionalProperties: false, required: ['objective', 'question', 'why', 'action', 'responsible', 'indicator', 'reviewIn'], properties: { objective: { type: 'string' }, question: { type: 'string' }, why: { type: 'string' }, action: { type: 'string' }, responsible: { type: 'string' }, indicator: { type: 'string' }, reviewIn: { type: 'string' } } }, caution: { type: 'string' }
} };

function toGeminiSchema(value: Record<string, unknown>): Record<string, unknown> {
  const translated: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'additionalProperties') continue;
    if (key === 'type' && typeof item === 'string') translated.type = item.toUpperCase();
    else if (key === 'properties' && isStringRecord(item)) translated.properties = Object.fromEntries(Object.entries(item).map(([name, property]) => [name, isStringRecord(property) ? toGeminiSchema(property) : property]));
    else if (key === 'items' && isStringRecord(item)) translated.items = toGeminiSchema(item);
    else translated[key] = item;
  }
  return translated;
}

function boundedText(value: unknown, max: number) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function tooLong(value: unknown, max: number) { return typeof value === 'string' && value.length > max; }
function validHistory(value: unknown) { return value === undefined || (Array.isArray(value) && value.length <= 3 && value.every((item) => isStringRecord(item) && boundedText(item.question, 600) && boundedText(item.answer, 600))); }

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 }); }
  if (!isStringRecord(body) || body.adultConsent !== true || !['question', 'guidance'].includes(String(body.action)) || !situationIds.includes(body.situation as Situation) || !boundedText(body.observation, 1200) || (body.context !== undefined && typeof body.context !== 'string') || (body.support !== undefined && typeof body.support !== 'string') || (body.answer !== undefined && typeof body.answer !== 'string') || (body.question !== undefined && typeof body.question !== 'string') || tooLong(body.context, 1200) || tooLong(body.support, 1200) || tooLong(body.answer, 600) || tooLong(body.question, 600) || !validHistory(body.history)) return NextResponse.json({ error: 'Revisa el consentimiento, la situación y los límites de texto.' }, { status: 400 });
  const submittedText = [body.observation, body.context, body.support, body.answer, body.question, ...(Array.isArray(body.history) ? body.history.flatMap((item) => isStringRecord(item) ? [item.question, item.answer] : []) : [])].filter((item): item is string => typeof item === 'string').join('\n');
  if (containsDirectIdentifier(submittedText)) return NextResponse.json({ error: 'El texto parece incluir un correo o teléfono. Elimínalo antes de continuar; SendIA no anonimiza automáticamente.' }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'La IA generativa aún no está configurada. Añade GEMINI_API_KEY en el entorno del servidor.' }, { status: 503 });
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  for (const [key, entry] of rateLimits) if (entry.until < now) rateLimits.delete(key);
  const limit = rateLimits.get(forwarded);
  if (limit && limit.count >= 8) return NextResponse.json({ error: 'Se alcanzó el límite temporal de consultas. Inténtalo más tarde.' }, { status: 429 });
  rateLimits.set(forwarded, { count: (limit?.count ?? 0) + 1, until: limit?.until ?? now + 10 * 60_000 });

  const input = { situation: situationNames[body.situation as Situation], observation: body.observation, context: typeof body.context === 'string' ? body.context : '', strengths: typeof body.support === 'string' ? body.support : '', question: typeof body.question === 'string' ? body.question : '', answer: typeof body.answer === 'string' ? body.answer : '', history: Array.isArray(body.history) ? body.history as { question: string; answer: string }[] : [] };
  const action = body.action as 'question' | 'guidance';
  const instructions = action === 'question'
    ? 'Eres una guía de reflexión pedagógica para personas adultas. En español claro y respetuoso, plantea UNA pregunta breve, no inductiva y adaptada a las respuestas previas para distinguir posibles factores educativos. No repitas preguntas ya contestadas. Incluye 3 o 4 opciones concretas, incluida una opción para indicar que aún no se sabe o aportar otra respuesta. Nunca diagnostiques, no infieras altas capacidades, no atribuyas causalidad ni etiquetes. Considera fortalezas, contexto y voz del estudiante. No pidas nombres ni datos identificativos.'
    : 'Eres una guía de reflexión pedagógica para personas adultas. Ordena la información aportada y genera como máximo tres hipótesis prudentes, explícitamente posibles y no diagnósticas. Separa hechos observados de interpretaciones e información pendiente. Para cada hipótesis indica qué datos la apoyan, qué falta y explicaciones alternativas. Propón un paso pequeño, reversible y revisable con responsable, indicador observable y fecha o intervalo. No atribuyas automáticamente nada a altas capacidades, no diagnostiques, no uses porcentajes ni afirmes causalidad. No inventes datos, fuentes o resultados. Considera el contexto local y la voz del estudiante. Responde en español sencillo.';
  const schema = action === 'question' ? questionSchema : guidanceSchema;
  const transcript = input.history.map((item, index) => `${index + 1}. Pregunta: ${item.question} Respuesta adulta: ${item.answer}`).join('\n') || 'Aún no hay preguntas respondidas.';
  const userInput = action === 'question'
    ? `Situación: ${input.situation}\nObservación adulta: ${input.observation}\nContexto: ${input.context || 'No descrito'}\nFortalezas/intereses: ${input.strengths || 'No descritos'}\nHistorial de exploración: ${transcript}\nFormula una sola pregunta nueva que se adapte a lo aprendido y ayude a diferenciar qué falta observar.`
    : `Situación: ${input.situation}\nObservación: ${input.observation}\nContexto: ${input.context || 'No descrito'}\nFortalezas/intereses: ${input.strengths || 'No descritos'}\nPreguntas y respuestas de esta exploración: ${transcript}\nUsa el historial completo como evidencia contextual, no como prueba causal.`;
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts: [{ text: userInput }] }],
        generationConfig: {
          maxOutputTokens: 900,
          thinkingConfig: { thinkingLevel: 'low' },
          responseMimeType: 'application/json',
          responseSchema: toGeminiSchema(schema),
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) {
      const providerBody: unknown = await response.json().catch(() => null);
      const providerError = isStringRecord(providerBody) && isStringRecord(providerBody.error) ? providerBody.error : null;
      const providerStatus = providerError && typeof providerError.status === 'string' ? providerError.status : '';
      console.error('[SendIA Gemini] respuesta del proveedor', response.status, providerStatus || 'sin estado');
      const error = response.status === 401 || response.status === 403
        ? 'La clave de Gemini no es válida o no tiene acceso al modelo.'
        : response.status === 429
          ? 'Gemini alcanzó el límite de solicitudes o cuota del proyecto. Revisa los límites de Google AI Studio.'
          : response.status === 404
            ? 'El modelo de Gemini configurado no está disponible. Revisa GEMINI_MODEL.'
            : response.status === 400
              ? 'Gemini no aceptó la solicitud. Revisa el modelo configurado y el formato de respuesta.'
              : 'El servicio de Gemini no pudo responder. Inténtalo de nuevo en unos minutos.';
      return NextResponse.json({ error }, { status: 502 });
    }
    const payload: unknown = await response.json();
    if (!isStringRecord(payload) || !Array.isArray(payload.candidates)) throw new Error('Respuesta externa no válida.');
    const candidate: unknown = payload.candidates.find((item) => isStringRecord(item) && isStringRecord(item.content) && Array.isArray(item.content.parts));
    const content: unknown = isStringRecord(candidate) ? candidate.content : undefined;
    const parts: unknown[] = isStringRecord(content) && Array.isArray(content.parts) ? content.parts : [];
    const text: unknown = parts.find((part) => isStringRecord(part) && typeof part.text === 'string');
    if (!isStringRecord(text) || typeof text.text !== 'string') throw new Error('Gemini no devolvió contenido estructurado.');
    const decoded: unknown = JSON.parse(text.text);
    const parsed: AdaptiveQuestion | GeneratedGuidance = action === 'question' ? parseAdaptiveQuestion(decoded) : parseGeneratedGuidance(decoded);
    return NextResponse.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
  } catch (reason) {
    console.error('[SendIA Gemini] salida no validada', reason instanceof Error ? reason.message : 'error desconocido');
    if (reason instanceof Error && reason.name === 'TimeoutError') return NextResponse.json({ error: 'Gemini tardó demasiado en responder. Inténtalo de nuevo.' }, { status: 504 });
    return NextResponse.json({ error: 'Gemini no devolvió una respuesta que SendIA pueda validar. Inténtalo otra vez.' }, { status: 502 });
  }
}

type RateEntry = { count: number; until: number };
const rateLimits = new Map<string, RateEntry>();
