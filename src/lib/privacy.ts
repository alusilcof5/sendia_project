/** Detects a small set of high-confidence direct identifiers before AI submission.
 * This is a guardrail, not automatic anonymisation or a complete PII detector.
 */
export function containsDirectIdentifier(text: string): boolean {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/;
  return email.test(text) || phone.test(text);
}
