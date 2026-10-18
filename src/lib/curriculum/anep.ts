export type CurriculumLevel = 'primaria' | 'secundaria' | 'bachillerato';
export type CurriculumSource = { title: string; url: string };

const ebiIndex = 'https://www.anep.edu.uy/documentos-curriculares/ebi/programas-ebi-2023-2023';
const emsIndex = 'https://anep.edu.uy/documentos-curriculares/ems';
const emsFirstGrade = 'https://www.anep.edu.uy/documentos-curriculares/ems/programas-primer-grado';
const emsSecondThird = 'https://anep.edu.uy/documentos-curriculares/ems/programas-2do-y-3ero';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#039;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
}

async function fetchIndex(url: string) {
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error('No se pudo consultar el índice curricular de ANEP.');
  return response.text();
}

type IndexedDocument = CurriculumSource & { context: string };

function linkedDocuments(html: string, baseUrl: string): IndexedDocument[] {
  const matches = html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi);
  const result: IndexedDocument[] = [];
  for (const match of matches) {
    const href = match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const title = stripHtml(match[2]);
    if (!href || !title || !/\.pdf(?:$|[?#])/i.test(href)) continue;
    try {
      const url = new URL(href, baseUrl);
      if (url.protocol !== 'https:' || !['anep.edu.uy', 'www.anep.edu.uy'].includes(url.hostname)) continue;
      const before = html.slice(Math.max(0, (match.index ?? 0) - 1400), match.index ?? 0);
      const after = html.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 350);
      result.push({ title, url: url.toString(), context: stripHtml(`${before} ${after}`) });
    } catch { /* Ignore malformed links from the ANEP index. */ }
  }
  return [...new Map(result.map((source) => [source.url, source])).values()];
}

function ebiTramo(level: CurriculumLevel, grade: string) {
  const numericGrade = Number(grade);
  if (level === 'primaria') return numericGrade <= 2 ? 2 : numericGrade <= 4 ? 3 : 4;
  return numericGrade <= 8 ? 5 : 6;
}

function subjectScore(title: string, area: string) {
  const normalizedTitle = normalize(title);
  const tokens = normalize(area).split(' ').filter((token) => token.length > 2 && !['area', 'materia', 'asignatura'].includes(token));
  if (!tokens.length) return 0;
  return tokens.filter((token) => normalizedTitle.includes(token)).length / tokens.length;
}

export async function findANEPPrograms({ level, grade, subsystem, area }: {
  level: CurriculumLevel; grade: string; subsystem: 'DGES' | 'DGETP'; area: string;
}): Promise<CurriculumSource[]> {
  const indexUrls = level === 'bachillerato'
    ? [emsIndex, grade === '1' ? emsFirstGrade : emsSecondThird]
    : [ebiIndex];
  const pages = await Promise.all(indexUrls.map(async (url) => ({ url, html: await fetchIndex(url) })));
  const docs = pages.flatMap(({ url, html }) => linkedDocuments(html, url));

  let candidates = docs;
  if (level === 'bachillerato') {
    const gradePattern = grade === '1' ? /1(?:er|º|°|ro)?\s*(?:grado|año)?\s*(?:del\s*)?(?:plan\s*(?:para\s*la\s*)?)?ems/i
      : grade === '2' ? /2(?:do|º|°)?\s*(?:grado\s*(?:del\s*)?)?ems/i : /3(?:er|º|°|ro)?\s*(?:grado\s*(?:del\s*)?)?ems/i;
    candidates = candidates.filter((source) => gradePattern.test(`${source.title} ${source.context}`));
    const withSubsystem = candidates.filter((source) => `${source.title} ${source.context}`.includes(subsystem));
    if (withSubsystem.length) candidates = withSubsystem;
  } else {
    const tramo = ebiTramo(level, grade);
    candidates = candidates.filter((source) => new RegExp(`tramo\\s*${tramo}\\b`, 'i').test(source.title));
    const expectedBody = level === 'primaria' ? 'DGEIP' : subsystem;
    const withSubsystem = candidates.filter((source) => `${source.title} ${source.context}`.includes(expectedBody));
    if (withSubsystem.length) candidates = withSubsystem;
  }

  const ranked = candidates.map((source) => ({ ...source, score: subjectScore(source.title, area) }))
    .filter((source) => source.score > 0).sort((a, b) => b.score - a.score);
  const bestScore = ranked[0]?.score ?? 0;
  if (!bestScore) return [];
  return ranked.filter((source) => source.score === bestScore).slice(0, 3).map(({ title, url }) => ({ title, url }));
}

export function curriculumIndexSources(level: CurriculumLevel): CurriculumSource[] {
  return level === 'bachillerato'
    ? [{ title: 'ANEP · Documentos curriculares de Educación Media Superior', url: emsIndex }]
    : [{ title: 'ANEP · Programas de Educación Básica Integrada', url: ebiIndex }];
}
