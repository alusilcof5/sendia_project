import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Propuesta académica | SendIA',
  description: 'Fundamentación, diseño pedagógico, arquitectura de IA, salvaguardas y evaluación propuesta para SendIA.',
};

const sources = [
  { text: 'OECD · inclusión de estudiantes con altas capacidades', href: 'https://doi.org/10.1787/c3f9ed87-en' },
  { text: 'Estudio sobre recursos para la atención de AACC en Uruguay', href: 'https://doi.org/10.1080/2331186X.2024.2422741' },
  { text: 'Revisión sistemática sobre formación docente en América Latina', href: 'https://doi.org/10.4151/07189729-Vol.65-Iss.1-Art.1824' },
  { text: 'CAST · Directrices DUA 3.0', href: 'https://udlguidelines.cast.org/es/' },
  { text: 'UNESCO · Guía para el uso de IA generativa en educación', href: 'https://unesdoc.unesco.org/ark:/48223/pf0000389227' },
];

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
        <div className="academic-eyebrow">SENDIA · PROPUESTA EDUCATIVA · URUGUAY</div>
        <h1>Que una primera impresión no cierre las posibilidades de aprender.</h1>
        <p>SendIA acompaña a docentes, familias y centros a comprender situaciones educativas, explorar más de una explicación y acordar un paso pedagógico pequeño, inclusivo y revisable. La IA organiza posibilidades; las personas deciden.</p>
        <div className="academic-short-actions">
          <a className="button academic-pdf-button" href="/docs/sendia-propuesta-academica.pdf" download>Descargar propuesta académica completa (PDF) <span>↓</span></a>
          <Link href="/comprender" className="button academic-explore-button">Explorar SendIA <span>↗</span></Link>
        </div>
        <small>Equipo responsable: Ana Lucía Silva Córdoba · Uruguay. Prototipo funcional; pilotaje con personas y evaluación profesional pendientes.</small>
      </section>

      <div className="academic-short-content">
        <section className="academic-short-section" aria-labelledby="short-need">
          <div className="academic-short-index">01 · PROBLEMA EDUCATIVO</div>
          <div><h2 id="short-need">Una necesidad relevante, con respuestas que dependen del contexto</h2>
            <p>Las altas capacidades no cuentan con una definición internacional única y los sistemas difieren en sus políticas, recursos y respuestas. La OCDE identifica la necesidad de fortalecer gobernanza, capacidades profesionales, apoyos escolares y evaluación de programas. En América Latina, una revisión sistemática reciente encontró pocas experiencias de formación inicial y políticas explícitas en los estudios incluidos. En Uruguay, un estudio descriptivo de 55 participantes y análisis documental reportó carencias de formación y apoyos; sus resultados sitúan el problema localmente, pero no son una estimación representativa de todas las familias o centros.</p>
            <p>SendIA no afirma que todas las personas con AACC vivan la misma experiencia. Aborda una necesidad práctica: ofrecer a las personas adultas un proceso para observar con más precisión, considerar barreras del contexto y pensar respuestas educativas sin convertir una conducta en etiqueta.</p>
            <div className="academic-source-links">{sources.slice(0, 3).map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>{source.text} ↗</a>)}</div>
            <p className="academic-short-caveat">Estas fuentes justifican la pertinencia del problema y el diseño; no demuestran la eficacia ni el impacto de SendIA.</p>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-audience">
          <div className="academic-short-index">02 · A QUIÉN ACOMPAÑA</div>
          <div><h2 id="short-audience">Una herramienta para personas adultas; el estudiante está en el centro</h2>
            <div className="academic-short-cards"><article><h3>Docentes</h3><p>Exploran una situación de aula, organizan observaciones y preparan un plan. En <Link href="/crear">Crear</Link> pueden diseñar, adaptar o modificar una actividad, revisar el borrador y descargarlo.</p></article><article><h3>Familias</h3><p>En <Link href="/familias">Desde casa</Link> eligen entre tres recorridos: orientarse tras una identificación, preparar una conversación con el centro o pensar una situación cotidiana.</p></article><article><h3>Centros educativos</h3><p>El espacio institucional permite gestionar miembros por invitación y rol, compartir planes de forma explícita y aportar al seguimiento común. La lluvia de ideas sincronizada es otro módulo, con códigos propios.</p></article><article><h3>Estudiantes</h3><p>Son las personas a quienes afecta la decisión, no el usuario directo de esta versión. Su perspectiva debe escucharse y no ser sustituida por inferencias de la IA.</p></article></div>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-method">
          <div className="academic-short-index">03 · MODELO DE ACOMPAÑAMIENTO</div>
          <div><h2 id="short-method">De una situación concreta a un paso que se pueda revisar</h2>
            <div className="academic-short-flow"><article><b>1</b><span><strong>Describir:</strong> definir la meta, el contexto y lo que se observó; separar lo sabido de lo que falta.</span></article><article><b>2</b><span><strong>Preguntar:</strong> responder preguntas adaptativas mediante opciones o texto libre; incorporar fortalezas, barreras y voz del estudiante.</span></article><article><b>3</b><span><strong>Explorar:</strong> contrastar hipótesis prudentes y alternativas, sin diagnosticar ni atribuir causas.</span></article><article><b>4</b><span><strong>Elegir:</strong> valorar opciones ordinarias de diversificación para la misma meta, con responsable e indicador observable.</span></article><article><b>5</b><span><strong>Revisar:</strong> registrar qué ocurrió y decidir si mantener, cambiar o retirar el ajuste.</span></article></div>
            <p>La aplicación controla las etapas; Gemini devuelve contenido acotado y tipado. La persona adulta puede editar, descartar o detenerse. Un plan personal no se guarda hasta que la persona lo decide.</p>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-foundation">
          <div className="academic-short-index">04 · FUNDAMENTO PEDAGÓGICO</div>
          <div><h2 id="short-foundation">Diseñar posibilidades sin prescribir una respuesta universal</h2>
            <div className="academic-short-cards"><article><h3>Diseño Universal para el Aprendizaje</h3><p>El DUA 3.0 inspira alternativas de implicación, representación y acción y expresión, vinculadas a una meta y a barreras que se hayan descrito. No se usa como lista automática ni reemplaza el juicio docente.</p></article><article><h3>Evaluación formativa</h3><p>El plan propone un cambio pequeño y reversible y una señal que ayude a observar qué facilitaría la participación o el aprendizaje. La observación guía una decisión posterior; no prueba causalidad.</p></article><article><h3>Respuesta educativa a AACC</h3><p>Se pueden explorar reto, profundidad, ritmo, intereses y oportunidades de enriquecimiento. No se presupone que una persona necesite una estrategia por pertenecer a una categoría.</p></article><article><h3>Agencia y colaboración</h3><p>La voz del estudiante, la perspectiva familiar y el conocimiento profesional aportan información distinta. El espacio institucional facilita acuerdos explícitos, sin asumir que compartir siempre sea adecuado.</p></article></div>
            <div className="academic-source-links">{sources.slice(3).map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>{source.text} ↗</a>)}</div>
            <p className="academic-short-caveat">El DUA es un marco de diseño y no una receta para AACC. SendIA no diagnostica, no interpreta informes ni recomienda medidas extraordinarias por cuenta propia.</p>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-ai">
          <div className="academic-short-index">05 · IA GENERATIVA</div>
          <div><h2 id="short-ai">Tres funciones acotadas; ninguna decide por el equipo</h2>
            <p>En Comprender, el servidor orquesta secuencialmente tres tareas funcionales con Gemini: generar preguntas, ordenar un mapa pedagógico vinculado a la información aportada y proponer un plan desde ese mapa. Es una cadena controlada por la aplicación, no un grupo de agentes autónomos ni un sistema que aprende del alumnado. Las respuestas pasan por esquemas y validaciones técnicas; eso verifica formato y algunas reglas, no la verdad o calidad pedagógica.</p>
            <p>La hoja de ruta familiar y el diseño de actividades usan recorridos de generación estructurada distintos. La bibliografía familiar aporta contexto editorial al prompt; Gemini no consulta en vivo las fuentes ni recupera evidencia para justificar cada sugerencia. Los resultados son borradores que una persona adulta debe valorar.</p>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-data">
          <div className="academic-short-index">06 · DATOS Y LÍMITES</div>
          <div><h2 id="short-data">Qué se guarda y qué protección falta validar</h2>
            <div className="academic-status-grid"><div><strong>Experiencia personal</strong><span>Planes, actividades y respuestas de Impacto permanecen en el navegador salvo que la persona use una función explícita de exportación o comparta un plan desde el espacio institucional.</span></div><div><strong>Espacio institucional</strong><span>Usa Supabase para cuentas de correo, roles, invitaciones y planes seleccionados. La familia accede solo a los planes compartidos con su cuenta; la lluvia de ideas permanece separada.</span></div></div>
            <p>El texto enviado a Gemini sale del dispositivo tras consentimiento; los documentos adjuntos a Crear se envían completos. Los avisos y filtros identifican solo algunos datos: no equivalen a anonimización. El correo verifica acceso a una cuenta, no el cargo ni la autorización institucional. La configuración actual es de prototipo y no acredita cumplimiento normativo ni está aprobada para datos identificables de menores.</p>
            <p className="academic-short-caveat">Para demos y primeras pruebas, utilizar exclusivamente casos ficticios o compuestos y no subir informes reales.</p>
          </div>
        </section>

        <section className="academic-short-section" aria-labelledby="short-evaluation">
          <div className="academic-short-index">07 · ESTADO Y EVALUACIÓN</div>
          <div><h2 id="short-evaluation">Prototipo funcional; evidencia de uso e impacto pendiente</h2>
            <div className="academic-status-grid"><div><strong>Implementado</strong><span>Comprender con Gemini, planes locales, Crear con revisión y descarga, tres recorridos familiares, colaboración institucional con Supabase e invitaciones, y lluvia de ideas separada.</span></div><div><strong>Preparado, aún no validado</strong><span>Impacto conserva un cuestionario exploratorio local para comparar percepciones adultas antes y después. No hay pilotaje reportado ni evidencia de cambio en estudiantes.</span></div></div>
            <p>La documentación registra una ejecución de escenarios ficticios con 10 de 10 respuestas que cumplieron el esquema de salida. Este dato es una comprobación técnica de formato: no mide exactitud, prudencia, utilidad, sesgo ni impacto. Las simulaciones de recorrido tampoco sustituyen observaciones con participantes o revisión independiente de especialistas.</p>
            <p>La siguiente evaluación debe observar si docentes y familias entienden qué hacer, completan las tareas y pueden explicar el paso elegido; después, profesionales deberían revisar salidas variadas con una pauta común. Solo tras corregir problemas y acordar protección de datos corresponde planificar una prueba institucional. Informar número, perfiles, contexto y límites; no hacer afirmaciones causales.</p>
          </div>
        </section>

        <section className="academic-short-footer"><div><strong>Propuesta extensa y bibliografía</strong><p>El informe descargable desarrolla la necesidad, el modelo pedagógico, el uso real de IA, los módulos actuales, el flujo de datos, las salvaguardas, la evaluación propuesta y las limitaciones.</p></div><a className="button academic-pdf-button" href="/docs/sendia-propuesta-academica.pdf" download>Descargar informe completo (PDF) <span>↓</span></a></section>
      </div>

      <footer className="academic-footer"><Link className="public-brand" href="/"><span className="brand-mark">S</span><span className="brand-name">SendIA</span></Link><span>Cada senda se descubre acompañando.</span><Link href="/comprender" className="button button-primary">Explorar SendIA →</Link></footer>
    </main>
  );
}
