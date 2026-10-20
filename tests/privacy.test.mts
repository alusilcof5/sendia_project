import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoDirectIdentifiers, containsDirectIdentifier, findDirectIdentifiers, findPossibleNameWarnings, identifierMessage, isDisallowedDocumentUpload } from '../src/lib/privacy.ts';

test('detecta datos personales y de instituciones educativas en un texto compuesto', () => {
  const input = 'María García López, 4ºB del CEIP San Juan de Barcelona, DNI 12345678Z, tiene un diagnóstico de TDAH';
  const found = findDirectIdentifiers(input);
  assert.equal(containsDirectIdentifier(input), true);
  assert.ok(found.some(({ kind }) => kind === 'nombre compuesto'));
  assert.ok(found.some(({ kind }) => kind === 'institución educativa'));
  assert.ok(found.some(({ kind }) => kind === 'documento de identidad'));
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

test('detecta documentos regionales y direcciones, y marca posibles nombres para revisión', () => {
  assert.equal(containsDirectIdentifier('CPF 123.456.789-09'), true);
  assert.equal(containsDirectIdentifier('Vive en Calle Roble 123, Lima'), true);
  assert.deepEqual(findPossibleNameWarnings('María participa más en tareas abiertas.'), ['María']);
});

test('detecta identificadores sintéticos habituales en Uruguay', () => {
  for (const input of [
    'CI: 4.123.456-7',
    'C.I. 4.123.456-7',
    'Celular 099 123 456',
    'Celular +598 99 123 456',
    'Teléfono 2 900 1234',
    'Fecha de nacimiento: 03/04/2014',
    'Nació el 3-4-2014',
  ]) assert.equal(containsDirectIdentifier(input), true, input);
});

test('no bloquea una descripción educativa general sin identificadores conocidos', () => {
  const input = 'En matemática, el grupo puede elegir explicar con palabras o un esquema. Revisaremos la opción dentro de una semana.';
  assert.equal(containsDirectIdentifier(input), false);
  assert.doesNotThrow(() => assertNoDirectIdentifiers(input));
});

test('el bloqueo de persistencia detecta nombres en campos etiquetados', () => {
  assert.throws(() => assertNoDirectIdentifiers('{"responsible":"Ana Lucía Silva"}'), /datos identificativos/);
});

test('la política del endpoint rechaza cuerpos multipart usados para enviar PDF o imágenes', () => {
  const form = new FormData();
  form.set('payload', JSON.stringify({ adultConsent: true }));
  form.set('document', new Blob(['%PDF-1.7 synthetic content']), 'caso-ficticio.pdf');
  const request = new Request('http://localhost/api/crear', { method: 'POST', body: form });
  assert.equal(isDisallowedDocumentUpload(request.headers.get('content-type')), true);
  assert.equal(isDisallowedDocumentUpload('application/json'), false);
});

test('construye un mensaje común para interfaz y endpoint', () => {
  assert.match(identifierMessage(['documento de identidad']), /documento de identidad/);
});

import { teacherCases } from '../src/lib/teacher-cases.ts';

test('los doce casos de docente son ficticios y no activan el filtro de identificadores', () => {
  assert.equal(teacherCases.length, 12);
  for (const item of teacherCases) {
    assert.match(item.id, /^(?:mirada|caso)-\d{2}$/);
    assert.equal(containsDirectIdentifier([item.title, item.observation, item.context, item.support].join(' ')), false, item.id);
  }
});
