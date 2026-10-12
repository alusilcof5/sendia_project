import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/understanding/generate/route.ts';
import { teacherCases } from '../src/lib/teacher-cases.ts';

const validGuidance = {
  summary: 'Probar un cambio pequeño en el formato.', caution: 'Esta posibilidad no es una conclusión.',
  observations: ['La participación cambia entre tareas.'], interpretations: [], pending: [],
  hypotheses: [{ title: 'Formato de actividad', possibility: 'el formato podría influir en la participación', supporting: ['La observación varía según la tarea.'], missing: ['Falta conocer la perspectiva del estudiante.'], alternatives: ['El ritmo o el agrupamiento también podrían influir.'] }],
  diversification: [
    { principle: 'representación', strategy: 'Entregar una consigna breve y visual.', level: 'ordinaria' },
    { principle: 'acción y expresión', strategy: 'Permitir explicar la respuesta de forma oral.', level: 'ordinaria' },
    { principle: 'implicación', strategy: 'Ofrecer dos temas para practicar la misma meta.', level: 'ordinaria' },
  ],
  nextStep: { objective: 'Observar cuándo participa.', question: '¿Qué formato facilita participar?', why: 'Compara factores de la actividad.', action: 'Probar dos formatos con la misma meta.', responsible: 'Docente', indicator: 'Si participa y qué formato usa.', reviewIn: 'En una semana' },
};

test('endpoint smoke: diez casos docentes ficticios producen guía validable con respuesta simulada', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls += 1;
    const request = JSON.parse(String(init?.body));
    assert.equal(request.generationConfig.maxOutputTokens, 3500);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(validGuidance) }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    for (const [index, item] of teacherCases.slice(0, 10).entries()) {
      const response = await POST(new Request('http://localhost/api/understanding/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': `192.0.2.${index + 1}` },
        body: JSON.stringify({ action: 'guidance', situation: item.situation, observation: item.observation, context: item.context, support: item.support, adultConsent: true, history: [] }),
      }));
      assert.equal(response.status, 200, `caso ${item.id}`);
      const body = await response.json();
      assert.equal(body.diversification.length, 3, `caso ${item.id}`);
    }
    assert.equal(calls, 10);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
  }
});
