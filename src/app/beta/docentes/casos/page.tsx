'use client';

import { useEffect, useState } from 'react';
import { TeacherBetaShell } from '@/components/teacher-beta-shell';
import { teacherCases } from '@/lib/teacher-cases';
import { endTeacherDemoSession, hasTeacherDemoSession } from '@/lib/teacher-session';

export default function TeacherCasesPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasTeacherDemoSession()) {
      window.location.replace('/beta/docentes/acceso');
      return;
    }
    setReady(true);
  }, []);

  if (!ready) return <TeacherBetaShell showLibrary><div className="teacher-beta-content"><p role="status">Comprobando el acceso de demostración…</p></div></TeacherBetaShell>;

  return <TeacherBetaShell showLibrary><div className="teacher-beta-content teacher-cases-page">
    <div className="eyebrow">BIBLIOTECA DOCENTE · DATOS FICTICIOS</div>
    <div className="teacher-cases-heading"><div><h1 className="page-title serif">Casos para mirar de otra manera.</h1><p className="subtitle">Diez situaciones inventadas para practicar preguntas, explorar contexto y preparar próximos pasos. No son perfiles de estudiantes reales.</p></div></div>
    <div className="pilot-banner"><strong>Beta docente · separada de la demo pública.</strong><span>Esta biblioteca es un espacio separado para docentes. Abrir un caso lo lleva al recorrido guiado de situación propia; puedes editar los datos ficticios antes de continuar.</span></div>
    <div className="teacher-cases-grid">{teacherCases.map((item, index) => <article className="panel teacher-case-card" key={item.id}>
      <div className="teacher-case-number">CASO {String(index + 1).padStart(2, '0')}</div>
      <h2>{item.title}</h2>
      <p>{item.observation}</p>
      <details><summary>Ver contexto y fortalezas</summary><p><strong>Contexto:</strong> {item.context}</p><p><strong>Fortaleza o interés:</strong> {item.support}</p></details>
      <a className="button button-primary button-small" href={'/beta/comprender?caso=' + item.id}>Abrir caso en Comprender →</a>
    </article>)}</div>
  </div></TeacherBetaShell>;
}
