export type IdentifierKind = 'correo' | 'teléfono' | 'documento de identidad' | 'dirección' | 'institución educativa' | 'presentación de persona' | 'nombre compuesto' | 'fecha exacta';
export type DirectIdentifier = { kind: IdentifierKind; value: string };

/** Creates a random, non-semantic case label locally in the browser. It is not an anonymizer. */
export function createCaseAlias(): string {
  const bytes = new Uint8Array(3);
  globalThis.crypto.getRandomValues(bytes);
  return `caso-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const patterns: { kind: IdentifierKind; expression: RegExp }[] = [
  { kind: 'correo', expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: 'teléfono', expression: /\b(?:\+34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d{3}){2}\b/g },
  // Uruguay: mobile numbers are commonly written as 09x xxx xxx or +598 9x xxx xxx.
  { kind: 'teléfono', expression: /\b(?:\+598[\s.-]?)?0?9[1-9](?:[\s.-]?\d{3}){2}\b/g },
  { kind: 'teléfono', expression: /\b(?!20\d{2}[-.\s]?20\d{2}\b)(?:\+598[\s.-]?)?2[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { kind: 'documento de identidad', expression: /\b(?:[XYZ]\d{7}[A-Z]|\d{8}[A-Z])\b/gi },
  { kind: 'documento de identidad', expression: /\b[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi },
  { kind: 'documento de identidad', expression: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g },
  { kind: 'documento de identidad', expression: /\b\d{1,2}\.\d{3}\.\d{3}-[\dK]\b/gi },
  { kind: 'documento de identidad', expression: /\b(?:DNI|documento|c\.?\s*i\.?(?=\s|[:#-])|cédula(?:\s+de\s+identidad)?|cedula(?:\s+de\s+identidad)?|RUT|CPF|CURP|identificación)\s*(?:N[.°º]?\s*)?[:#-]?\s*[A-Z0-9.-]{5,20}\b/gi },
  { kind: 'fecha exacta', expression: /\b(?:fecha\s+de\s+nacimiento|nacido(?:a)?\s+el|nació\s+el|nacimiento)\s*[:#-]?\s*\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/gi },
  { kind: 'dirección', expression: /\b(?:calle|avenida|av\.?|bulevar|bvar\.?|camino|ruta|pasaje|manzana|lote|jirón|jr\.?|carrera|rua|street|road)\s+[\w#.-]+(?:\s+(?:n[.°º]?\s*)?\d+[A-Z]?)?(?:\s*,?\s*[\w.-]+){0,3}/giu },
  { kind: 'institución educativa', expression: /\b(?:CEIP|IES|CIFP|escuela|colegio|centro\s+educativo|institución\s+educativa|instituto|liceo)\s+(?:de\s+)?(?:[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)(?:\s+(?:de|del|la|las|los|y|[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)){0,5}/gu },
  { kind: 'presentación de persona', expression: /\b(?:responsable|responsible|docente|profesor[oa]|orientador[oa]|coordinador[oa]|contacto)\s*["']?\s*[:=]\s*["']?\s*[A-ZÁÉÍÓÚÜÑ][\p{L}'-]+(?:\s+[A-ZÁÉÍÓÚÜÑ][\p{L}'-]+){1,2}/gu },
  { kind: 'presentación de persona', expression: /\b(?:me llamo|mi nombre es|soy|nombre(?:\s+completo)?(?:\s+del\s+(?:estudiante|alumno|alumna|niño|niña))?|se llama|estudiante|alumn[oa]|niñ[oa]|hij[oa]|docente|profesor[oa]|orientador[oa])\s*(?:es|:|,)?\s+(?:[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)(?:\s+[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*){0,2}/gu },
  { kind: 'nombre compuesto', expression: /\b[A-ZÁÉÍÓÚÜÑ][\p{L}'-]+\s+[A-ZÁÉÍÓÚÜÑ][\p{L}'-]+\s+[A-ZÁÉÍÓÚÜÑ][\p{L}'-]+\b/gu },
];

export function findDirectIdentifiers(text: string): DirectIdentifier[] {
  const findings: DirectIdentifier[] = [];
  for (const { kind, expression } of patterns) {
    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      findings.push({ kind, value: match[0] });
    }
  }
  return findings;
}

export function containsDirectIdentifier(text: string): boolean {
  return findDirectIdentifiers(text).length > 0;
}

export function assertNoDirectIdentifiers(text: string): void {
  const findings = findDirectIdentifiers(text);
  if (findings.length) throw new Error(identifierMessage(findings.map(({ kind }) => kind)));
}

/** Solo se aceptan cuerpos JSON con texto revisable; los archivos binarios se rechazan en el servidor. */
export function isDisallowedDocumentUpload(contentType: string | null): boolean {
  return Boolean(contentType?.toLowerCase().includes('multipart/form-data'));
}

const actionVerbs = 'participa|pregunta|dijo|dice|pidió|pide|comenzó|comienza|terminó|termina|escribió|escribe|resolvió|resuelve|necesita|prefiere|evita|abandona';
const possibleNamePattern = new RegExp(`\\b([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{1,}(?:\\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{1,})?)\\s+(?:${actionVerbs})\\b`, 'gu');

/** Señal heurística revisable; no bloquea ni afirma que el texto esté anonimizado. */
export function findPossibleNameWarnings(text: string): string[] {
  possibleNamePattern.lastIndex = 0;
  return [...text.matchAll(possibleNamePattern)].map((match) => match[1]).filter((name) => !/^(?:El|La|En|Durante|Cuando|Si|Luego|Hoy|A veces|Por ejemplo|El estudiante|La estudiante)$/i.test(name));
}

export function identifierMessage(kinds: IdentifierKind[]): string {
  const detected = [...new Set(kinds)];
  const detail = detected.length ? ` (${detected.join(', ')})` : '';
  return `El texto parece incluir datos identificativos${detail}. Elimínalos antes de continuar; SendIA no anonimiza automáticamente.`;
}
