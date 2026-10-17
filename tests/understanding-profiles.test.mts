import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/understanding/generate/route.ts';

test('los tres perfiles producen instrucciones adaptativas diferentes y el endpoint los valida', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  const systems: string[] = [];
  globalThis.fetch = async (_input, init) => {
    const payload = JSON.parse(String(init?.body));
    systems.push(payload.systemInstruction.parts[0].text);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ question: '¿Qué ha cambiado en esta situación?', options: ['La tarea', 'El momento'], rationale: 'Ayuda a identificar el contexto.' }) }] } }] }), { status: 200 });
  };
  try {
    for (const [index, profile] of ['teacher', 'school', 'family'].entries()) {
      const response = await POST(new Request('http://localhost/api/understanding/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': `198.51.100.${index + 1}` },
        body: JSON.stringify({ action: 'question', profile, situation: 'other', observation: 'Situación de ejemplo sin identificadores.', adultConsent: true }),
      }));
      assert.equal(response.status, 200);
    }
    assert.match(systems[0], /PERFIL: DOCENTE EN EL AULA/);
    assert.match(systems[1], /PERFIL: EQUIPO DE CENTRO/);
    assert.match(systems[2], /PERFIL: FAMILIA EN CASA/);
    assert.equal(new Set(systems).size, 3);

    const invalid = await POST(new Request('http://localhost/api/understanding/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'question', profile: 'student', situation: 'other', observation: 'Situación de ejemplo.', adultConsent: true }),
    }));
    assert.equal(invalid.status, 400);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
  }
});
