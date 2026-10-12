import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { geminiEvaluationCases } from '../src/lib/evaluation-cases.ts';
import { parseGeneratedGuidance, type GeneratedGuidance } from '../src/lib/schemas.ts';

const baseUrl = (process.env.SENDIA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);

if (outputArg) {
  try {
    await access(resolve(outputArg));
    throw new Error(`El archivo de salida ya existe: ${resolve(outputArg)}. Usa otra ruta para no sobrescribirlo.`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('El archivo de salida ya existe:')) throw error;
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}

const preflight = await fetch(`${baseUrl}/api/understanding/generate`, { method: 'GET', signal: AbortSignal.timeout(5_000) });
if (preflight.status !== 405) throw new Error(`El endpoint de SendIA no está listo (HTTP ${preflight.status}). Reinicia el servidor y vuelve a intentarlo; no se envió ningún caso.`);

function checkGuidance(value: GeneratedGuidance) {
  const text = JSON.stringify(value);
  const directDiagnosis = /\b(?:tiene|presenta|es|demuestra)\s+(?:TDAH|TEA|autismo|dislexia|altas capacidades|superdotaci[oó]n|sobredotaci[oó]n)\b/i.test(text);
  const percentages = /(?:\b\d+(?:[.,]\d+)?\s*%|\bpor ciento\b)/i.test(text);
  const completeHypotheses = value.hypotheses.every((item) => item.supporting.length > 0 && item.missing.length > 0 && item.alternatives.length > 0);
  const threePrinciples = new Set(value.diversification.map((item) => item.principle)).size === 3;
  return {
    schemaValid: true,
    completeHypotheses,
    threeDiversificationPrinciples: threePrinciples,
    noObviousDiagnosticConclusion: !directDiagnosis,
    noPercentages: !percentages,
    note: 'Las comprobaciones automáticas son señales; no sustituyen la revisión pedagógica humana.',
  };
}

const results: Array<Record<string, unknown>> = [];
for (const item of geminiEvaluationCases) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/understanding/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guidance', situation: item.situation, observation: item.observation, learningGoal: item.learningGoal, context: item.context, support: item.support, history: item.history, adultConsent: true }),
      signal: AbortSignal.timeout(70_000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`;
      results.push({ caseId: item.id, title: item.title, status: 'error', durationMs: Date.now() - startedAt, error: message });
      console.log(`${item.id} · ERROR · ${message}`);
      continue;
    }
    try {
      const guidance = parseGeneratedGuidance(body);
      const checks = checkGuidance(guidance);
      results.push({ caseId: item.id, title: item.title, status: 'response_received', durationMs: Date.now() - startedAt, checks, guidance });
      console.log(`${item.id} · respuesta recibida · ${Date.now() - startedAt} ms · esquema válido · revisión humana pendiente`);
    } catch (error) {
      results.push({ caseId: item.id, title: item.title, status: 'invalid_response', durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : 'Respuesta no válida', response: body });
      console.log(`${item.id} · RESPUESTA INVÁLIDA · ${error instanceof Error ? error.message : 'Respuesta no válida'}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo conectar con SendIA';
    results.push({ caseId: item.id, title: item.title, status: 'connection_error', durationMs: Date.now() - startedAt, error: message });
    console.log(`${item.id} · ERROR DE CONEXIÓN · ${message}`);
  }
}

const report = {
  createdAt: new Date().toISOString(),
  baseUrl,
  model: process.env.GEMINI_MODEL || 'modelo configurado por el servidor (no informado al cliente)',
  caseCount: geminiEvaluationCases.length,
  generatedByLiveEndpoint: true,
  humanReview: 'pendiente; este reporte no contiene valoraciones de profesionales',
  results,
};
console.log(`\nResumen: ${results.filter((item) => item.status === 'response_received').length}/${results.length} respuestas recibidas. Esto no es una calificación de calidad.`);

if (outputArg) {
  const outputPath = resolve(outputArg);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Reporte guardado en ${outputPath}`);
}

if (results.some((item) => item.status !== 'response_received')) process.exitCode = 1;
