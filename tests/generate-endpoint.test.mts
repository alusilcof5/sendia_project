import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/understanding/generate/route.ts';
import { teacherCases } from '../src/lib/teacher-cases.ts';

const exploration = {
  goalClear: false, goalEvidenceRefs: [], goalClarificationQuestion: '¿Qué aprendizaje concreto se busca en esta actividad?',
  studentVoiceStatus: 'pending', studentVoice: '', studentVoiceEvidenceRefs: [], studentQuestion: '¿Qué parte de la actividad te resulta más clara?',
  observations: [{ text: 'La participación varía entre actividades.', evidenceRefs: ['observation'] }],
  interpretations: [], pending: [], barriers: [],
  hypotheses: [{ title: 'Formato de la actividad', possibility: 'Podría ser que el formato influya en la participación.', supporting: ['La observación indica variación entre actividades.'], missing: ['Falta comparar las tareas.'], alternatives: ['El ritmo o el agrupamiento también podrían influir.'], evidenceRefs: ['observation'] }],
};
const plan = {
  summary: 'Primero conviene aclarar qué aprendizaje se busca.', goalClear: false, goalClarificationQuestion: '¿Qué aprendizaje concreto se busca en esta actividad?',
  diversification: [{ principle: 'no aplica', barrier: 'La meta todavía no está definida.', evidence: 'No se aportó una meta de aprendizaje.', learningGoal: 'Aclarar la meta antes de elegir una adaptación.', strategy: 'Conversar con el equipo para acordar qué aprendizaje se espera.', strengthOrInterest: '', indicator: 'Si el equipo puede expresar la meta con claridad.', level: 'ordinaria', evidenceRefs: ['observation'] }],
  nextStep: { objective: 'Acordar la meta antes de adaptar.', question: '¿Qué aprendizaje concreto se busca?', why: 'Sin una meta explícita no se puede valorar una adaptación.', action: 'Revisar la consigna y acordar la meta con el equipo.', responsible: 'Docente', indicator: 'La meta queda formulada en una frase observable.', reviewIn: 'En una semana' },
  caution: 'Esta propuesta organiza lo aportado; no es una evaluación del estudiante.',
};

test('endpoint smoke: diez casos ficticios recorren síntesis y planificación estructuradas', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls += 1;
    const request = JSON.parse(String(init?.body));
    assert.ok([2800, 3000].includes(request.generationConfig.maxOutputTokens));
    const response = calls % 2 === 1 ? exploration : plan;
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(response) }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    for (const [index, item] of teacherCases.slice(0, 10).entries()) {
      const response = await POST(new Request('http://localhost/api/understanding/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': `192.0.2.${index + 1}` },
        body: JSON.stringify({ action: 'guidance', situation: item.situation, observation: item.observation, context: item.context, support: item.support, adultConsent: true, history: [] }),
      }));
      assert.equal(response.status, 200, `caso ${item.id}`);
      const body = await response.json();
      assert.equal(body.goalClear, false, `caso ${item.id}: no inventa meta`);
      assert.equal(body.diversification.length, 1, `caso ${item.id}: aclara antes de adaptar`);
      assert.deepEqual(body.hypotheses[0].evidenceRefs, ['observation']);
    }
    assert.equal(calls, 20);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
  }
});
