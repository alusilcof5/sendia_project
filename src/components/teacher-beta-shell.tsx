'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { endTeacherDemoSession } from '@/lib/teacher-session';

export function TeacherBetaShell({ children, showLibrary = false }: { children: ReactNode; showLibrary?: boolean }) {
  const router = useRouter();
  const exit = () => { endTeacherDemoSession(); router.replace('/'); };
  return <div className="teacher-beta-app">
    <header className="teacher-beta-header">
      <Link className="teacher-beta-brand" href="/"><span className="teacher-beta-mark">S</span><span><strong>SendIA</strong><small>BETA DOCENTE</small></span></Link>
      <nav aria-label="Navegación de la beta docente">
        {showLibrary && <Link href="/beta/docentes/casos">Biblioteca de ejemplos</Link>}
        <Link href="/comprender">Demo de Alex</Link>
        {showLibrary ? <button type="button" onClick={exit}>Cerrar sesión</button> : <Link href="/">Volver a SendIA</Link>}
      </nav>
    </header>
    <main className="teacher-beta-main">{children}</main>
  </div>;
}
