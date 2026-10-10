import test from 'node:test';
import assert from 'node:assert/strict';
import { containsDirectIdentifier, findDirectIdentifiers, identifierMessage } from '../src/lib/privacy.ts';

test('detecta datos personales y del centro en un texto compuesto', () => {
  const input = 'María García López, 4ºB del CEIP San Juan de Barcelona, DNI 12345678Z, tiene un diagnóstico de TDAH';
  const found = findDirectIdentifiers(input);
  assert.equal(containsDirectIdentifier(input), true);
  assert.ok(found.some(({ kind }) => kind === 'nombre compuesto'));
  assert.ok(found.some(({ kind }) => kind === 'centro educativo'));
  assert.ok(found.some(({ kind }) => kind === 'DNI/NIE'));
});

test('no confunde curso, calificación ni fecha con identificadores', () => {
  const input = 'curso 2024-2025 sacó 10 en 2025-10-10';
  assert.deepEqual(findDirectIdentifiers(input), []);
  assert.equal(containsDirectIdentifier(input), false);
});

test('detecta correo, teléfono y presentación de una persona', () => {
  assert.equal(containsDirectIdentifier('Contacto: ana@example.org'), true);
  assert.equal(containsDirectIdentifier('Teléfono: +34 612 345 678'), true);
  assert.equal(containsDirectIdentifier('El estudiante Alex participa'), true);
});

test('construye un mensaje común para interfaz y endpoint', () => {
  assert.match(identifierMessage(['DNI/NIE']), /DNI\/NIE/);
});

import { teacherCases } from '../src/lib/teacher-cases.ts';

test('los doce casos de docente son ficticios y no activan el filtro de identificadores', () => {
  assert.equal(teacherCases.length, 12);
  for (const item of teacherCases) {
    assert.match(item.id, /^(?:mirada|caso)-\d{2}$/);
    assert.equal(containsDirectIdentifier([item.title, item.observation, item.context, item.support].join(' ')), false, item.id);
  }
});
