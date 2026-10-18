const mapLayers = [
  {
    id: 'public',
    title: 'Orientación pública · MEC',
    subtitle: 'Orientación ciudadana y materiales vigentes',
    items: ['El Programa de Educación Inclusiva mantiene una línea de Altas Habilidades Intelectuales y Superdotación', 'Brinda orientación a la ciudadanía y publica guías de identificación y estrategias educativas', 'Contacto: educacion.inclusiva@mec.gub.uy · 1825 int. 02205/02206'],
    status: 'Canal público activo; consultar orientación',
  },
  {
    id: 'university',
    title: 'Atención especializada · UDE',
    subtitle: 'Centro de Atención e Investigación en AH/SD',
    items: ['Coordina consultas para procesos de identificación con aportes de la persona, su familia y docentes', 'Publica talleres para familias y actividades para niñas, niños y adolescentes; fechas a coordinar', 'Contacto para consultar disponibilidad: giahsd@ude.edu.uy'],
    status: 'Servicio publicado; coordinar disponibilidad',
  },
  {
    id: 'community',
    title: 'Acompañamiento · ALHAS',
    subtitle: 'Apoyo a familias, personas y centros educativos',
    items: ['Publica orientación a docentes y centros, identificaciones cualitativas y encuentros para familias', 'Ofrece formación y acompañamiento; solicitá información para conocer modalidad, alcance y costos', 'Contacto en Uruguay: 095 328 481 · info@alhas.com.uy'],
    status: 'Contacto y solicitud de entrevista disponibles',
  },
  {
    id: 'schools',
    title: 'Enriquecimiento escolar · Crandon',
    subtitle: 'Programa Nuevos Desafíos · Inicial y Primaria',
    items: ['La institución informa que el programa está en marcha y convoca a estudiantes con altas capacidades o desempeños destacados', 'Desarrolla proyectos guiados por intereses, indagación y trabajo con especialistas', 'Es una propuesta del centro; consultar criterios de ingreso y disponibilidad'],
    status: 'Actividad documentada en 2026; acceso institucional',
  },
  {
    id: 'knowledge',
    title: 'Recursos educativos · Ceibal',
    subtitle: 'Herramientas generales que permiten ampliar desafíos',
    items: ['Matific y el portal REA de Ceibal están disponibles para el trabajo educativo', 'Incluyen actividades y recursos de enriquecimiento, matemática y pensamiento computacional', 'Son apoyos generales: no identifican ni brindan atención especializada en AH/SD'],
    status: 'Recursos de acceso general; no específicos de AH/SD',
  },
];

const sources = [
  { group: 'Orientación pública · MEC', title: 'Programa de Educación Inclusiva', href: 'https://www.gub.uy/ministerio-educacion-cultura/edinclusiva', status: 'Página vigente al 30/03/2026; incluye Altas Habilidades Intelectuales y Superdotación como línea de trabajo y ofrece orientación a ciudadanía e instituciones. Contacto: educacion.inclusiva@mec.gub.uy · 1825 int. 02205/02206' },
  { group: 'Orientación pública · MEC', title: 'Orientaciones sobre identificación desde la Educación Inclusiva', href: 'https://www.gub.uy/ministerio-educacion-cultura/sites/ministerio-educacion-cultura/files/documentos/publicaciones/Orientaciones%20identificaci%C3%B3n.pdf', status: 'Material oficial disponible para consulta; orienta a comprender perfiles, integrar varias perspectivas y priorizar derechos' },
  { group: 'Orientación pública · MEC', title: 'Dossier de atención educativa a estudiantes con altas habilidades/superdotación', href: 'https://www.gub.uy/ministerio-educacion-cultura/comunicacion/publicaciones/dossier-sobre-atencion-educativa-estudiantes-altas-habilidades', status: 'Publicación oficial disponible para familias, docentes y centros; incluye normativa y estrategias educativas' },
  { group: 'Atención especializada · UDE', title: 'Centro de Atención e Investigación en Altas Habilidades/Superdotación', href: 'https://ude.edu.uy/altas-habilidades-superdotacion/', status: 'El centro publica identificación coordinada, talleres y contacto directo para consultar fechas y disponibilidad: giahsd@ude.edu.uy' },
  { group: 'Acompañamiento · ALHAS', title: 'Servicios para personas, familias y centros educativos', href: 'https://alhas.com.uy/quienes-somos/', status: 'La organización publica orientación a centros, identificaciones cualitativas, encuentros familiares y formación; se solicita entrevista o consulta para conocer condiciones. Uruguay: 095 328 481 · info@alhas.com.uy' },
  { group: 'Propuesta educativa · Crandon', title: 'Primaria · Programa Nuevos Desafíos', href: 'https://www.crandon.edu.uy/primaria/', status: 'La página institucional ofrece el programa para estudiantes con altas capacidades; su actividad está documentada en agosto de 2026. Consultar criterios y cupos con el centro' },
  { group: 'Propuesta educativa · Crandon', title: 'Proyectos de ciencias activos en Nuevos Desafíos', href: 'https://www.crandon.edu.uy/aprender-desde-la-pregunta-proyectos-de-ciencias-en-nuevos-desafios/', status: 'Publicación del 20/08/2026 describe equipos activos en proyectos de indagación con especialistas' },
  { group: 'Recursos generales · Ceibal', title: 'Portal de estudiantes y acceso a Matific', href: 'https://estudiantes.ceibal.edu.uy/', status: 'Plataforma de acceso disponible; Matific es un recurso general para matemática, no una atención específica a altas habilidades' },
  { group: 'Recursos generales · Ceibal', title: 'Portal de Recursos Educativos Abiertos', href: 'https://rea.ceibal.edu.uy/?nivel=6', status: 'Catálogo de recursos educativos disponible; uso general, no ruta de identificación ni atención especializada' },
];

export function UruguaySupportMap({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return <details className="uy-support-disclosure" open={defaultOpen}>
    <summary>
      <span className="uy-disclosure-mark" aria-hidden="true">UY</span>
      <span className="uy-disclosure-copy"><strong>Mapa de apoyos e iniciativas en Uruguay</strong><small>Qué existe, qué ofrece y qué conviene consultar antes de derivar.</small></span>
      <span className="uy-disclosure-action"><span className="uy-action-closed">Abrir informe</span><span className="uy-action-open">Cerrar informe</span><span className="uy-action-icon" aria-hidden="true">＋</span></span>
    </summary>

    <div className="uy-support-report">
        <header className="uy-report-header">
        <div><span className="eyebrow">RELEVAMIENTO WEB · 18 DE OCTUBRE DE 2026</span><h2>Recursos e iniciativas con actividad actual comprobable.</h2></div>
        <p>Este mapa incluye solo canales, servicios, programas o recursos cuya fuente oficial o institucional indica disponibilidad o actividad actual. El acceso, los cupos, los costos y las fechas deben confirmarse directamente.</p>
      </header>

      <div className="uy-map-graphic" role="group" aria-label="Mapa conceptual de apoyos e iniciativas actualmente disponibles en Uruguay">
        <div className="uy-map-center"><span>EN EL CENTRO</span><strong>Estudiante<br/>y familia</strong><small>Escuela · comunidad</small></div>
        <div className="uy-map-connectors" aria-hidden="true"><i/><i/><i/><i/><i/></div>
        <div className="uy-map-nodes">{mapLayers.map((layer, index) => <article className={`uy-map-node uy-map-node-${index + 1}`} key={layer.id}><span>0{index + 1}</span><strong>{layer.title}</strong><small>{layer.subtitle}</small></article>)}</div>
      </div>
      <p className="uy-map-caption">Mapa conceptual, no geográfico. La inclusión en el mapa no garantiza cupo ni acceso gratuito. Ceibal aparece aparte como recurso general, no como servicio especializado en altas habilidades.</p>

      <section className="uy-report-reading"><div><span className="eyebrow">CÓMO LEER EL MAPA</span><h3>La existencia de una iniciativa no garantiza acceso.</h3></div><div className="uy-layer-list">{mapLayers.map((layer) => <article key={layer.id}><div><strong>{layer.title}</strong><small>{layer.subtitle}</small></div><ul>{layer.items.map((item) => <li key={item}>{item}</li>)}</ul><span className="uy-status">{layer.status}</span></article>)}</div></section>

      <section className="uy-report-findings"><span className="eyebrow">QUÉ MUESTRA EL MAPA ACTUAL</span><div className="uy-findings-grid"><article><b>01</b><h3>El MEC es la puerta pública de orientación</h3><p>El Programa de Educación Inclusiva mantiene una línea sobre altas habilidades y superdotación y publica guías para familias, centros y profesionales. Es un canal de orientación y materiales, no un servicio de identificación individual.</p></article><article><b>02</b><h3>Hay dos vías especializadas de consulta</h3><p>UDE publica un centro de atención e investigación con identificación coordinada y talleres. ALHAS publica acompañamiento, orientación a centros y encuentros familiares. En ambos casos hay que consultar agenda y condiciones.</p></article><article><b>03</b><h3>Crandon documenta un programa escolar en marcha</h3><p>Nuevos Desafíos trabaja con estudiantes de Inicial y Primaria con altas capacidades o desempeños destacados. En agosto de 2026 publicó proyectos activos de indagación. Es una propuesta institucional y su acceso depende del centro.</p></article><article><b>04</b><h3>Ceibal suma recursos generales de enriquecimiento</h3><p>Matific y el portal REA ofrecen herramientas para ampliar actividades y desafíos. No encontramos una ruta específica de identificación o atención AH/SD en Ceibal; por eso se presenta como recurso complementario, no como programa especializado.</p></article></div></section>

      <aside className="uy-report-conclusion"><span aria-hidden="true">↗</span><div><strong>¿Qué lugar puede ocupar SendIA?</strong><p>Como complemento: ayudar a familias, docentes y centros a ordenar observaciones, preparar una conversación y acordar un paso pedagógico revisable. No sustituye servicios, no identifica ni diagnostica, y puede ayudar a hacer más visibles los recursos existentes.</p></div></aside>

      <section className="uy-report-sources"><div className="uy-sources-heading"><div><span className="eyebrow">FUENTES PARA CONSULTAR</span><h3>Revisá la información con cada organización</h3></div><p>Las páginas pueden cambiar. Confirmá directamente la oferta, los criterios de acceso, la cobertura, los costos y las fechas vigentes.</p></div>
        {Array.from(new Set(sources.map((source) => source.group))).map((group) => <div className="uy-source-group" key={group}><h4>{group}</h4><ul>{sources.filter((source) => source.group === group).map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true">↗</span></a><small>{source.status}</small></li>)}</ul></div>)}
      </section>

      <footer className="uy-report-method"><strong>Alcance y límites.</strong> Revisión de fuentes públicas al 18/10/2026. Se excluyeron cursos ya finalizados, antecedentes históricos, planes sin evidencia de ejecución actual y proyectos académicos que aún no acreditan implementación. Puede haber ofertas activas difundidas por contacto directo que no aparezcan en la web. La inclusión no certifica calidad, disponibilidad, resultados, cobertura nacional ni gratuidad. Los recursos Ceibal son generales y no equivalen a una atención especializada en altas habilidades/superdotación.</footer>
    </div>
  </details>;
}
