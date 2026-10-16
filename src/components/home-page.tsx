"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from './app-shell';
import { readPlans, type StoredPlan } from '@/lib/plan-store';
import { locale } from '@/lib/i18n/es-419';

export function HomePage() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () => { setPlans(readPlans()); setReady(true); };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  const activePlans = plans.filter((plan) => plan.status === 'approved');
  const pendingActions = activePlans.reduce((sum, plan) => sum + plan.strategies.filter((strategy) => !plan.completedStrategies.includes(strategy.id)).length, 0);
  return <AppShell><div className="content home-start-page">
    <div className="eyebrow">SENDIA · ESPACIO DE ACOMPAÑAMIENTO</div>
    <section className="home-start-hero">
      <div>
        <span className="case-label">PARA FAMILIAS Y PROFESIONALES EDUCATIVOS</span>
        <h1 className="page-title serif">Empieza por<br/><em>una situación.</em></h1>
        <p className="subtitle">Trabaja una situación real sin datos que identifiquen al estudiante, o prueba con un ejemplo. SendIA te ayudará a ordenar preguntas y acordar un siguiente paso.</p>
        <div className="home-hero-actions"><Link className="home-hero-primary" href="/comprender?modo=propio">Comprender una situación <span>→</span></Link><Link className="home-hero-secondary" href="/crear">Crear o adaptar una actividad</Link></div>
      </div>
      <div className="home-hero-art" aria-hidden="true"><span className="home-hero-orbit home-hero-orbit-a"/><span className="home-hero-orbit home-hero-orbit-b"/><span className="home-hero-core">?</span><span className="home-hero-note home-note-one">OBSERVAR</span><span className="home-hero-note home-note-two">PREGUNTAR</span><span className="home-hero-note home-note-three">ACORDAR</span><span className="home-hero-art-caption">Una pregunta<br/>abre caminos.</span></div>
    </section>

    <section className="home-plan-overview" aria-labelledby="home-plans-title">
      <div className="home-plan-overview-heading"><div><span className="eyebrow">TU SEGUIMIENTO</span><h2 id="home-plans-title">Los pasos también cuentan.</h2><p>Pequeños acuerdos que puedes revisar con el tiempo.</p></div><Link className="text-link" href="/planes/plan-aula">Abrir Mis planes <span>→</span></Link></div>
      {!ready ? <div className="home-plan-empty"><p>Cargando tus planes guardados en este navegador…</p></div> : plans.length === 0 ? <div className="home-plan-empty"><span className="home-empty-mark" aria-hidden="true">↗</span><div><strong>Aún no hay un plan en marcha.</strong><p>Cuando explores una situación y guardes un paso, lo encontrarás aquí.</p></div><Link className="text-link" href="/comprender?modo=propio">Crear mi primer paso →</Link></div> : <div className="home-plan-summary"><div className="home-stat"><span className="home-stat-index">01</span><strong>{new Intl.NumberFormat(locale).format(activePlans.length)}</strong><span>planes en marcha</span></div><div className="home-stat"><span className="home-stat-index">02</span><strong>{new Intl.NumberFormat(locale).format(pendingActions)}</strong><span>acciones por revisar</span></div><div className="home-plan-latest"><span className="home-stat-index">EL MÁS RECIENTE</span><strong>{plans[0].title}</strong><span>Revisar este paso en «Mis planes».</span><Link href="/planes/plan-aula">Retomar el seguimiento →</Link></div></div>}
    </section>

    <div className="home-start-options">
      <Link href="/comprender?modo=propio" className="panel home-start-card home-start-primary">
        <span className="home-card-number">01 · TU SITUACIÓN</span>
        <h2>Comprender antes de decidir</h2>
        <p>Describe una situación real de forma anónima o usa una inventada. Responde preguntas guiadas; tú eliges si envías el texto a Gemini.</p>
        <span className="text-link">Empezar paso a paso <span>→</span></span>
      </Link>
      <Link href="/comprender?modo=demo" className="panel home-start-card">
        <span className="home-card-number">02 · DEMO PREPARADA · SIN IA EN VIVO</span>
        <h2>Ver el caso ficticio de Alex</h2>
        <p>Recorre la historia completa con datos simulados. No requiere conexión con Gemini ni guarda un plan.</p>
        <span className="text-link">Iniciar demo <span>→</span></span>
      </Link>
    </div>

    <nav className="home-next-links" aria-label="Otras áreas de SendIA">
      <Link href="/planes/plan-aula"><span className="home-link-icon">↗</span><strong>Mis planes</strong><span>Revisar acuerdos y próximos pasos →</span></Link>
      <Link href="/colaboracion"><span className="home-link-icon">◎</span><strong>Colaboración</strong><span>Preparar una conversación de equipo →</span></Link>
      <Link href="/impacto"><span className="home-link-icon">⌁</span><strong>Impacto</strong><span>Conocer el seguimiento del pilotaje →</span></Link>
    </nav>
  </div></AppShell>;
}
