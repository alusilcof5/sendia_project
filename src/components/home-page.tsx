import Link from 'next/link';
import { AppShell } from './app-shell';

export function HomePage() {
  return <AppShell><div className="content">
    <div className="welcome-row"><div><div className="eyebrow">SÁBADO, 10 DE OCTUBRE</div><h1 className="page-title serif">Buenos días, Alex</h1><p className="subtitle">Pequeños cambios empiezan con una mirada más amplia.</p></div><Link href="/comprender" className="button button-primary">＋ &nbsp;Explorar una situación</Link></div>
    <div className="summary-grid"><article className="summary-card"><div className="summary-top"><span>Planes en marcha</span><span>↗</span></div><div className="summary-value">2</div><div className="summary-foot">1 revisión esta semana</div></article><article className="summary-card"><div className="summary-top"><span>Por revisar</span><span>◷</span></div><div className="summary-value">1</div><div className="summary-foot">Una propuesta espera tu mirada</div></article><article className="summary-card"><div className="summary-top"><span>Acuerdos compartidos</span><span>♧</span></div><div className="summary-value">3</div><div className="summary-foot">Con permisos elegidos por ti</div></article></div>
    <div className="home-grid"><section className="panel"><div className="panel-heading"><h2>Planes recientes</h2><Link href="/planes/plan-aula" className="text-link">Ver mis planes&nbsp; →</Link></div>
      <Link href="/planes/plan-aula" className="plan-row"><span className="plan-symbol">✳</span><span><div className="plan-title">Más caminos para aprender</div><div className="plan-meta">Aula · revisión el 7 nov</div></span><span className="status">En marcha</span></Link>
      <Link href="/planes/plan-aula" className="plan-row"><span className="plan-symbol" style={{background:'#f5ebe5',color:'#a56b5b'}}>⌁</span><span><div className="plan-title">Pausas que ayudan</div><div className="plan-meta">Casa · creado hace 2 días</div></span><span className="status draft">Borrador</span></Link>
      <div className="section-space"><div className="panel-heading"><h2>Para esta semana</h2><span className="muted" style={{fontSize:10}}>2 tareas</span></div>
        <div className="task-row"><span className="check" aria-hidden="true"/><div><div className="task-title">Probar dos formas de empezar una actividad</div><div className="task-date">Plan «Más caminos para aprender» · jueves</div></div></div>
        <div className="task-row"><span className="check" aria-hidden="true"/><div><div className="task-title">Anotar qué propuestas facilitan la participación</div><div className="task-date">Plan «Más caminos para aprender» · viernes</div></div></div>
      </div></section>
      <div><Link href="/comprender" className="panel quick-card"><div className="eyebrow">UN MOMENTO PARA COMPRENDER</div><h2>¿Qué está intentando decir esta situación?</h2><p>Explora una experiencia con preguntas que te ayudan a mirar desde distintos ángulos.</p><span className="text-link">Empezar a explorar&nbsp; →</span></Link>
        <section className="panel section-space"><div className="panel-heading"><h2>Una mirada para hoy</h2><span className="muted">✳</span></div><p style={{fontFamily:'Georgia,serif',fontSize:17,lineHeight:1.55,color:'#596a60',margin:'0 0 12px'}}>«Comprender no es encontrar una respuesta rápida, sino abrir mejores preguntas.»</p><span className="muted" style={{fontSize:10}}>Una idea para compartir con tu equipo</span></section></div>
    </div>
  </div></AppShell>;
}
