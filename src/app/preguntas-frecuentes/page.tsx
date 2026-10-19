import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = { title: 'Preguntas frecuentes | SendIA' };

const questions = [
  ['¿Quién puede usar SendIA?', 'Está pensada para personas adultas: docentes, familias y equipos educativos. El alumnado no debe utilizarla directamente. Esta versión todavía no verifica técnicamente la edad, por lo que se debe resolver un control de acceso antes de un despliegue institucional.'],
  ['¿SendIA diagnostica o confirma altas capacidades?', 'No. Ayuda a ordenar observaciones, preguntas y opciones pedagógicas. No diagnostica, no interpreta informes ni atribuye automáticamente una conducta a las altas capacidades.'],
  ['¿Qué alias tengo que usar?', 'Generá un código aleatorio distinto para cada situación y usalo en tus notas en vez del nombre. No uses iniciales, fecha de nacimiento, curso, centro ni apodos conocidos. El alias evita escribir el nombre, pero no oculta las pistas del relato: generalizá lugares y fechas y quitá detalles únicos.'],
  ['¿Con el alias queda anónimo el caso?', 'No necesariamente. Una combinación de hechos, lugares, fechas o circunstancias poco comunes puede permitir reconocer a alguien incluso sin su nombre. SendIA no garantiza anonimato y sus avisos automáticos no detectan todos los riesgos. Si dudás, no compartas ese contenido.'],
  ['¿Qué pasa cuando envío una situación a Gemini?', 'Solo se envía si una persona adulta acepta en el flujo. Gemini procesa el contenido para generar preguntas u opciones. SendIA no guarda la descripción como historial. Las condiciones actuales de Gemini restringen el uso de la API en apps dirigidas a menores o que probablemente sean usadas por ellos; SendIA no verifica la edad, así que esta compatibilidad debe resolverse antes de un piloto público.'],
  ['¿Puedo subir un informe escolar o clínico?', 'No. No subas informes, fotos, puntuaciones, datos de salud ni documentos que identifiquen o describan de forma sensible a un menor. SendIA rechaza PDF e imágenes. Solo admite TXT/Markdown: revisá el documento completo, quitá identificadores y adjuntá una copia; un filtro básico puede detectar algunos patrones, pero no garantiza anonimato.'],
  ['¿Dónde quedan mis planes?', 'Los planes personales se guardan en el almacenamiento local del navegador donde se crearon. El espacio institucional y la lluvia de ideas usan Supabase para los datos que allí se comparten. La opción de borrar datos locales no elimina los registros remotos.'],
  ['¿La propuesta de IA es una recomendación profesional?', 'No. Es un borrador que puede equivocarse. La persona adulta debe revisarlo, adaptarlo o descartarlo, y consultar al equipo educativo o profesional cuando la situación lo requiera.'],
];

export default function FaqPage() {
  return <AppShell><article className="content privacy-page legal-document faq-page">
    <div className="eyebrow">SENDIA · AYUDA</div><h1 className="page-title serif">Preguntas frecuentes</h1>
    <p className="subtitle">Lo esencial para empezar, cuidar la privacidad y entender los límites de la herramienta.</p>
    <div className="faq-list">{questions.map(([question, answer]) => <details className="panel faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    <aside className="alias-rule-callout"><strong>Regla para trabajar con menores</strong><p>Usá un alias aleatorio por situación; quitá nombres y cualquier detalle que permita reconocer al estudiante. No ingreses informes ni datos sensibles. Un alias no asegura anonimato.</p></aside>
  </article></AppShell>;
}
