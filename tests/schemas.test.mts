import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAdaptiveQuestion, parseGeneratedGuidance, parseGeneratedOutputs } from '../src/lib/schemas.ts';

test('valida y normaliza una pregunta adaptativa', () => {
  const result = parseAdaptiveQuestion({ question: '¿Qué cambia?', rationale: 'Ayuda a observar el contexto.', options: ['La tarea', 'El momento'] });
  assert.equal(result.question, '¿Qué cambia?');
  assert.equal(result.options.length, 2);
  assert.throws(() => parseAdaptiveQuestion({ question: '', rationale: 'x', options: [] }));
});

test('valida hipótesis y opciones pertinentes con evidencia', () => {
  const result = parseGeneratedGuidance({
    summary: 'Probar una variación pequeña.', goalClear: true, goalClarificationQuestion: '¿Qué se espera que aprenda?', studentVoiceStatus: 'pending', studentVoice: '', studentQuestion: '¿Qué te ayudaría en esta actividad?', caution: 'Es una posibilidad, no una conclusión.', observations: ['Tarda en comenzar.'], interpretations: [], pending: [],
    hypotheses: [{ title: 'Formato', possibility: 'el formato actual podría influir', supporting: ['La tarea es abierta.'], missing: ['Preguntar al estudiante.'], alternatives: ['También puede influir el tiempo disponible.'] }],
    diversification: [
      { principle: 'representación', barrier: 'La consigna extensa puede dificultar el inicio.', evidence: 'Pide ayuda con el primer paso.', learningGoal: 'Completar la tarea por etapas.', strategy: 'Presentar instrucciones en pasos visibles.', strengthOrInterest: 'No se aportó.', indicator: 'Si inicia con menos recordatorios.', level: 'ordinaria' },
    ],
    nextStep: { objective: 'Observar el inicio.', question: '¿Qué facilita comenzar?', why: 'Reduce dudas.', action: 'Probar instrucciones por pasos.', responsible: 'Docente', indicator: 'Si inicia y qué apoyo usa.', reviewIn: 'En una semana' },
  });
  assert.match(result.hypotheses[0].possibility, /^Podría ser que/i);
  assert.equal(result.diversification.length, 1);
  assert.equal(result.studentVoiceStatus, 'pending');
  assert.throws(() => parseGeneratedGuidance({ goalClear: true, diversification: [], hypotheses: [], pending: [], observations: [], interpretations: [] }));
});

test('permite guardar una pregunta cuando la meta aún no se conoce, sin ofrecer adaptaciones', () => {
  const result = parseGeneratedGuidance({
    summary: 'Primero aclaremos qué aprendizaje se buscaba.', goalClear: false, goalClarificationQuestion: '¿Qué se esperaba que aprendiera en esta actividad?', studentVoiceStatus: 'pending', studentVoice: '', studentQuestion: '¿Qué parte de la actividad te interesó?',
    caution: 'Sin la meta no es posible valorar una adaptación.', observations: ['Terminó antes que el grupo.'], interpretations: [], pending: ['Falta conocer el criterio de éxito.'],
    hypotheses: [{ title: 'Información incompleta', possibility: 'no se cuenta con la meta de aprendizaje', supporting: ['No se registró el criterio.'], missing: ['Qué debía aprender.'], alternatives: ['La actividad podía tener varias metas.'] }],
    diversification: [{ principle: 'no aplica', barrier: 'La meta no está explicitada.', evidence: 'No se anotó qué debía aprender.', learningGoal: 'Pendiente de aclaración.', strategy: 'Preguntar al equipo qué aprendizaje se buscaba y cómo se comprobaría.', strengthOrInterest: '', indicator: 'Meta y criterio de éxito acordados.', level: 'ordinaria' }],
    nextStep: { objective: 'Aclarar la meta.', question: '¿Qué se esperaba aprender?', why: 'Permite decidir qué observar antes de adaptar.', action: 'Conversar con quien planificó la actividad.', responsible: 'Docente', indicator: 'Meta y criterio de éxito anotados.', reviewIn: 'Antes de la próxima actividad' },
  });
  assert.equal(result.goalClear, false);
  assert.equal(result.diversification[0].principle, 'no aplica');
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
