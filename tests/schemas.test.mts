import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAdaptiveQuestion, parseGeneratedGuidance, parseGeneratedOutputs } from '../src/lib/schemas.ts';

test('valida y normaliza una pregunta adaptativa', () => {
  const result = parseAdaptiveQuestion({ question: '¿Qué cambia?', rationale: 'Ayuda a observar el contexto.', options: ['La tarea', 'El momento'] });
  assert.equal(result.question, '¿Qué cambia?');
  assert.equal(result.options.length, 2);
  assert.throws(() => parseAdaptiveQuestion({ question: '', rationale: 'x', options: [] }));
});

test('valida hipótesis y tres alternativas de diversificación', () => {
  const result = parseGeneratedGuidance({
    summary: 'Probar una variación pequeña.', caution: 'Es una posibilidad, no una conclusión.', observations: ['Tarda en comenzar.'], interpretations: [], pending: [],
    hypotheses: [{ title: 'Formato', possibility: 'el formato actual podría influir', supporting: ['La tarea es abierta.'], missing: ['Preguntar al estudiante.'], alternatives: ['También puede influir el tiempo disponible.'] }],
    diversification: [
      { principle: 'representación', strategy: 'Presentar instrucciones en pasos visibles.', level: 'ordinaria' },
      { principle: 'acción y expresión', strategy: 'Permitir explicar oralmente el procedimiento.', level: 'ordinaria' },
      { principle: 'implicación', strategy: 'Ofrecer una elección de tema para practicar.', level: 'ordinaria' },
    ],
    nextStep: { objective: 'Observar el inicio.', question: '¿Qué facilita comenzar?', why: 'Reduce dudas.', action: 'Probar instrucciones por pasos.', responsible: 'Docente', indicator: 'Si inicia y qué apoyo usa.', reviewIn: 'En una semana' },
  });
  assert.match(result.hypotheses[0].possibility, /^Podría ser que/i);
  assert.equal(result.diversification.length, 3);
  assert.ok(result.pending.some((item) => /estudiante/i.test(item)));
});

test('valida los materiales para docente, familia y escuela', () => {
  const result = parseGeneratedOutputs({
    teacher: { goal: 'Explicar una estrategia de resolución.', variants: [
      { level: 'apoyo', task: 'Resolver con pasos numerados.', materials: 'Papel y lápiz.', observation: 'Si completa los pasos.', withoutTechnology: true },
      { level: 'base', task: 'Resolver y explicar una estrategia.', materials: 'Guía impresa.', observation: 'Qué estrategia elige.', withoutTechnology: false },
      { level: 'ampliación', task: 'Comparar dos soluciones.', materials: 'Problema abierto.', observation: 'Si compara argumentos.', withoutTechnology: false },
    ] },
    family: { guide: 'Conversen sobre qué ayuda a empezar.', questions: ['¿Qué parte te interesa?', '¿Qué te ayuda?', '¿Qué probarías?'], homeActivity: 'Resolver un acertijo juntos.', avoidConclusion: 'No concluir que una conducta tiene una sola causa.' },
    school: { situation: 'Participación variable en tareas.', observations: ['Participa más en debates.'], openQuestions: ['¿Qué opina el estudiante?'], indicator: 'Si participa en distintos formatos.', reviewDate: 'En una semana', consultWhen: 'Si persiste o afecta el bienestar.' },
  });
  assert.equal(result.teacher.variants.length, 3);
  assert.equal(result.family.questions.length, 3);
  assert.throws(() => parseGeneratedOutputs({ teacher: { goal: 'Meta', variants: [] }, family: {}, school: {} }));
});
