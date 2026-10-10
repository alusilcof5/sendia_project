export type IdentifierKind = 'correo' | 'teléfono' | 'DNI/NIE' | 'centro educativo' | 'presentación de persona' | 'nombre compuesto';
export type DirectIdentifier = { kind: IdentifierKind; value: string };

const patterns: { kind: IdentifierKind; expression: RegExp }[] = [
  { kind: 'correo', expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: 'teléfono', expression: /\b(?:\+34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d{3}){2}\b/g },
  { kind: 'DNI/NIE', expression: /\b(?:[XYZ]\d{7}[A-Z]|\d{8}[A-Z])\b/gi },
  { kind: 'centro educativo', expression: /\b(?:CEIP|C\.?E\.?I\.?P\.?|IES|CIFP|escuela|colegio|centro|instituto|liceo)\s+(?:de\s+)?(?:[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)(?:\s+(?:de|del|la|las|los|y|[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)){0,5}/gu },
  { kind: 'presentación de persona', expression: /\b(?:me llamo|mi nombre es|soy|se llama|estudiante|alumn[oa]|niñ[oa]|docente|profesor[oa]|orientador[oa])\s+(?:[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*)(?:\s+[A-ZÁÉÍÓÚÜÑ][\p{L}'-]*){0,2}/gu },
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

export function identifierMessage(kinds: IdentifierKind[]): string {
  const detected = [...new Set(kinds)];
  const detail = detected.length ? ` (${detected.join(', ')})` : '';
  return `El texto parece incluir datos identificativos${detail}. Elimínalos antes de continuar; SendIA no anonimiza automáticamente.`;
}
