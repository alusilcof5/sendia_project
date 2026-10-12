import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Propuesta académica | SendIA',
  description: 'Propuesta educativa SendIA: fundamento, reto, funcionamiento, límites y evaluación.',
};

export default function ProposalPage() {
  return (
    <main className="academic-site academic-summary-page">
      <header className="public-nav academic-nav">
        <Link className="public-brand" href="/"><span className="brand-mark">S</span><span className="brand-name">SendIA</span></Link>
        <nav aria-label="Navegación principal">
          <Link href="/#que-es">Qué es</Link><Link href="/#como-funciona">Cómo funciona</Link><Link href="/#principios">Principios</Link><Link href="/propuesta" aria-current="page">Propuesta</Link>
        </nav>
        <Link href="/comprender" className="public-nav-cta">Explorar SendIA <span>↗</span></Link>
      </header>

      <section className="academic-short-hero">
        <div className="academic-eyebrow">PROPUESTA EDUCATIVA · RETO DE DIVERSIFICACIÓN</div>
        <h1>Una pregunta mejor puede abrir más caminos para aprender.</h1>
        <p>SendIA ayuda a docentes, familias y equipos educativos a comprender una situación concreta y acordar un siguiente paso pedagógico revisable para estudiantes con altas capacidades.</p>
        <div className="academic-short-actions">
          <a className="button academic-pdf-button" href="/docs/sendia-propuesta-academica.pdf" download>Descargar propuesta completa (PDF) <span>↓</span></a>
          <Link href="/comprender" className="button academic-explore-button">Explorar SendIA <span>↗</span></Link>
        </div>
        <small>El informe desarrolla la fundamentación, la elección del reto, el funcionamiento, las salvaguardas y el plan de evaluación.</small>
      </section>

      <div className="academic-short-content">
        <section className="academic-short-section" aria-labelledby="short-need">
          <div className="academic-short-index">01 · NECESIDAD Y RETO</div>
          <div><h2 id="short-need">Responder a necesidades educativas que pueden pasar inadvertidas</h2><p>La atención a las altas capacidades y las oportunidades de acceder a respuestas educativas adecuadas varían según el contexto. La OCDE describe desafíos de equidad en identificación y acceso a programas; una revisión sistemática regional señala brechas en formación docente y políticas, con diferencias entre países. SendIA responde al reto de <strong>diversificación y personalización de la formación y atención a brechas</strong> ayudando a pensar ajustes desde situaciones observables, sin convertir una conducta en diagnóstico.</p><div className="academic-source-links"><a href="https://doi.org/10.1787/c3f9ed87-en" target="_blank" rel="noreferrer">OCDE · informe internacional ↗</a><a href="https://doi.org/10.4151/07189729-vol.65-iss.1-art.1824" target="_blank" rel="noreferrer">Revisión latinoamericana ↗</a><a href="https://www.ministeriodeeducacion.gob.do/docs/direccion-de-educacion-especial/hXfm-manual-altas-capacidades-final-corregido-version-digitalpdf.pdf" target="_blank" rel="noreferrer">Ministerio de Educación dominicano ↗</a></div><p className="academic-short-caveat">La evidencia describe problemas y brechas en contextos concretos; no implica que todos los países tengan la misma situación ni demuestra el impacto de SendIA.</p></div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-audience">
          <div className="academic-short-index">02 · PERSONAS</div>
          <div><h2 id="short-audience">Adultos que acompañan; estudiantes cuya voz cuenta</h2><div className="academic-short-cards"><article><h3>Usuarios</h3><p>Docentes, familias y equipos educativos organizan observaciones, exploran preguntas y acuerdan qué probar.</p></article><article><h3>Beneficiarios</h3><p>Estudiantes con altas capacidades, cuyas experiencias, intereses y opiniones deben formar parte de las decisiones que les afectan.</p></article></div><p>El alumnado no usa directamente esta versión. La colaboración digital entre cuentas todavía no está implementada.</p></div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-method">
          <div className="academic-short-index">03 · FUNCIONAMIENTO</div>
          <div><h2 id="short-method">Un recorrido guiado, no un chatbot abierto</h2><div className="academic-short-flow"><article><b>1</b><span><strong>Describir</strong> una situación, una meta y hechos observables.</span></article><article><b>2</b><span><strong>Explorar</strong> con preguntas adaptativas y opciones de respuesta.</span></article><article><b>3</b><span><strong>Ordenar</strong> observaciones, interpretaciones, dudas e hipótesis abiertas.</span></article><article><b>4</b><span><strong>Elegir y revisar</strong> un ajuste ordinario, su responsable, indicador y fecha.</span></article></div><p>Gemini propone preguntas y borradores estructurados. Tras aprobar un plan y dar consentimiento, SendIA puede generar variantes de actividad para el docente, una guía para la familia y un resumen para la escuela. Son borradores editables; no se comparten automáticamente.</p></div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-foundation">
          <div className="academic-short-index">04 · FUNDAMENTO Y CUIDADO</div>
          <div><h2 id="short-foundation">Principios pedagógicos y límites claros</h2><div className="academic-short-cards"><article><h3>Diseño inclusivo</h3><p>El DUA orienta opciones de implicación, representación y acción y expresión, conservando metas de aprendizaje significativas.</p></article><article><h3>Evaluación formativa</h3><p>La observación y el seguimiento de una señal ayudan a decidir qué conviene ajustar después.</p></article><article><h3>Respuesta a altas capacidades</h3><p>Se exploran desafío, profundidad, ritmo, fortalezas e intereses a partir del contexto; no se prescriben perfiles ni estrategias universales.</p></article><article><h3>Agencia y privacidad</h3><p>La IA puede equivocarse. La persona adulta revisa y decide; no se deben introducir datos identificativos de menores.</p></article></div><p className="academic-short-caveat">SendIA no identifica ni diagnostica, no atribuye conductas a las altas capacidades y no sustituye a orientación ni al criterio docente. La validación del formato de IA no demuestra que una respuesta sea pedagógicamente correcta.</p></div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-evaluation">
          <div className="academic-short-index">05 · ESTADO Y EVALUACIÓN</div>
          <div><h2 id="short-evaluation">Prototipo funcional; impacto todavía no medido</h2><div className="academic-status-grid"><div><strong>Disponible</strong><span>Recorrido guiado con Gemini, caso ficticio, planes locales y borradores para tres destinatarios.</span></div><div><strong>Simulado o pendiente</strong><span>Colaboración entre cuentas, adaptación regional y evaluación con profesionales y comunidades educativas.</span></div></div><p>El siguiente paso propuesto es una prueba formativa con 3–6 personas adultas, usando casos ficticios: observar si completan el flujo, qué les confunde y si pueden explicar el paso elegido. Después, profesionales educativos podrían revisar las respuestas de IA con una pauta común. Estas actividades no se presentan como realizadas ni como prueba de impacto.</p></div>
        </section>

        <section className="academic-short-footer"><div><strong>¿Necesitas el fundamento completo?</strong><p>El PDF incluye marco pedagógico, elección del reto, recorrido, uso de Gemini, privacidad, alineación con la convocatoria, limitaciones, referencias y plan de pilotaje.</p></div><a className="button academic-pdf-button" href="/docs/sendia-propuesta-academica.pdf" download>Descargar informe completo (PDF) <span>↓</span></a></section>
      </div>

      <footer className="academic-footer"><Link className="public-brand" href="/"><span className="brand-mark">S</span><span className="brand-name">SendIA</span></Link><span>Cada senda se descubre acompañando.</span><Link href="/comprender" className="button button-primary">Explorar SendIA →</Link></footer>
    </main>
  );
}
