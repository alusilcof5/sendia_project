import { NextResponse } from 'next/server';
import { parseStoredPlan } from '@/lib/plan-store';
import { isStringRecord, parseGeneratedOutputs } from '@/lib/schemas';
import { containsDirectIdentifier, findDirectIdentifiers, identifierMessage } from '@/lib/privacy';
import { prompts } from '@/lib/i18n/prompts.es-419';

export const runtime = 'nodejs';
export const maxDuration = 60;

const outputSchema = {
  type: 'object', additionalProperties: false, required: ['teacher', 'family', 'school'], properties: {
    teacher: { type: 'object', additionalProperties: false, required: ['goal', 'variants'], properties: {
      goal: { type: 'string' }, variants: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['level', 'task', 'materials', 'observation', 'withoutTechnology'], properties: { level: { type: 'string', enum: ['apoyo', 'base', 'ampliación'] }, task: { type: 'string' }, materials: { type: 'string' }, observation: { type: 'string' }, withoutTechnology: { type: 'boolean' } } }, minItems: 3, maxItems: 3 },
    } },
    family: { type: 'object', additionalProperties: false, required: ['guide', 'questions', 'homeActivity', 'avoidConclusion'], properties: { guide: { type: 'string' }, questions: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 }, homeActivity: { type: 'string' }, avoidConclusion: { type: 'string' } } },
    school: { type: 'object', additionalProperties: false, required: ['situation', 'observations', 'openQuestions', 'indicator', 'reviewDate', 'consultWhen'], properties: { situation: { type: 'string' }, observations: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, openQuestions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 }, indicator: { type: 'string' }, reviewDate: { type: 'string' }, consultWhen: { type: 'string' } } },
  },
};

function toProviderSchema(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    if (key === 'additionalProperties') return [];
    if (key === 'type' && typeof item === 'string') return [[key, item.toUpperCase()]];
    if (key === 'properties' && isStringRecord(item)) return [[key, Object.fromEntries(Object.entries(item).map(([name, property]) => [name, isStringRecord(property) ? toProviderSchema(property) : property]))]];
    if (key === 'items' && isStringRecord(item)) return [[key, toProviderSchema(item)]];
    return [[key, item]];
  }));
}

const requestCounts = new Map<string, { count: number; until: number }>();
// Límite temporal por proceso: útil para la demo, pero no distribuido ni suficiente para producción.
function limited(client: string): boolean {
  const now = Date.now();
  for (const [key, entry] of requestCounts) if (entry.until < now) requestCounts.delete(key);
  const entry = requestCounts.get(client);
  if ((entry?.count ?? 0) >= 4) return true;
  requestCounts.set(client, { count: (entry?.count ?? 0) + 1, until: entry?.until ?? now + 10 * 60_000 });
  return false;
}

function extractText(payload: unknown): { text: string; truncated: boolean } {
  if (!isStringRecord(payload) || !Array.isArray(payload.candidates)) throw new Error('Gemini no devolvió una respuesta estructurada.');
  const candidate = payload.candidates.find((item) => isStringRecord(item) && isStringRecord(item.content) && Array.isArray(item.content.parts));
  if (!isStringRecord(candidate)) throw new Error('Gemini no devolvió contenido.');
  const content = candidate.content;
  const parts = isStringRecord(content) && Array.isArray(content.parts) ? content.parts : [];
  const part = parts.find((item) => isStringRecord(item) && typeof item.text === 'string');
  if (!isStringRecord(part)) throw new Error('Gemini no devolvió texto.');
  return { text: part.text as string, truncated: candidate.finishReason === 'MAX_TOKENS' };
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 }); }
  if (!isStringRecord(body) || body.action !== 'outputs' || body.adultConsent !== true || body.confirmed !== true) return NextResponse.json({ error: 'Confirma que eres una persona adulta y que quieres enviar este plan para generar borradores.' }, { status: 400 });
  const plan = parseStoredPlan(body.plan);
  if (!plan || plan.status !== 'approved') return NextResponse.json({ error: 'Solo se pueden preparar borradores a partir de un plan aprobado.' }, { status: 400 });
  const planText = [plan.title, plan.objective, ...plan.strategies.flatMap((strategy) => [strategy.title, strategy.detail, strategy.responsible, strategy.cadence]), plan.indicator ?? '', plan.question ?? ''].join('\n');
  const identifiers = findDirectIdentifiers(planText);
  if (identifiers.length) return NextResponse.json({ error: identifierMessage(identifiers.map(({ kind }) => kind)) }, { status: 400 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'La IA generativa aún no está configurada en el servidor.' }, { status: 503 });
  const client = request.headers.get('x-real-ip')?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(client)) return NextResponse.json({ error: 'Alcanzaste el límite temporal de materiales generados. Inténtalo más tarde.' }, { status: 429 });

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const system = prompts.outputs;
  const user = `Genera los tres borradores a partir de este plan aprobado por una persona adulta. No incluyas identificadores.\nPLAN_JSON: ${JSON.stringify({ title: plan.title, objective: plan.objective, strategies: plan.strategies.map(({ title, detail, responsible, cadence }) => ({ title, detail, responsible, cadence })), indicator: plan.indicator, question: plan.question, reviewDate: plan.reviewDate })}`;
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user + (attempt ? `\n${prompts.outputRetry}` : '') }] }], generationConfig: { maxOutputTokens: 4_500, thinkingConfig: { thinkingLevel: 'low' }, responseMimeType: 'application/json', responseSchema: toProviderSchema(outputSchema) } }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        const message = response.status === 404 ? `El modelo «${model}» no está disponible. Revisa GEMINI_MODEL.` : response.status === 429 ? 'Gemini alcanzó su límite temporal de solicitudes.' : 'Gemini no pudo generar los borradores. Inténtalo más tarde.';
        return NextResponse.json({ error: message }, { status: 502 });
      }
      try {
        const result = extractText(await response.json());
        if (result.truncated) throw new Error('Respuesta incompleta.');
        const parsed = parseGeneratedOutputs(JSON.parse(result.text));
        const outputText = JSON.stringify(parsed);
        if (containsDirectIdentifier(outputText) || /(?:\b\d+(?:[.,]\d+)?\s*%|\bpor ciento\b)/i.test(outputText)) throw new Error('La respuesta requiere revisión por privacidad.');
        return NextResponse.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    throw new Error('No se pudo validar la respuesta.');
  } catch (error) {
    console.error('[SendIA outputs] respuesta no validada', error instanceof Error ? error.message : 'error desconocido');
    return NextResponse.json({ error: 'Gemini no devolvió borradores completos y válidos. Inténtalo otra vez.' }, { status: 502 });
  }
}
