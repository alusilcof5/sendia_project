import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiEvaluationCases } from '../src/lib/evaluation-cases.ts';
import { containsDirectIdentifier } from '../src/lib/privacy.ts';

test('la batería contiene once escenarios ficticios diferentes y sin identificadores directos', () => {
  assert.equal(geminiEvaluationCases.length, 11);
  assert.equal(new Set(geminiEvaluationCases.map((item) => item.id)).size, 11);
  assert.equal(geminiEvaluationCases.find((item) => item.id === 'E11')?.learningGoal, '');
  for (const item of geminiEvaluationCases) {
    assert.ok(item.observation.length >= 20, item.id);
    assert.equal(containsDirectIdentifier([item.title, item.observation, item.learningGoal, item.context, item.support, ...item.history.flatMap((row) => [row.question, row.answer])].join(' ')), false, item.id);
  }
});
