'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { endTeacherDemoSession } from '@/lib/teacher-session';
import sendiaLogo from '@/app/images/logo.png';

export function TeacherBetaShell({ children, showLibrary = false }: { children: ReactNode; showLibrary?: boolean }) {
  const router = useRouter();
  const exit = () => { endTeacherDemoSession(); router.replace('/'); };
  return <div className="teacher-beta-app">
    <header className="teacher-beta-header">
      <Link className="teacher-beta-brand" href="/" aria-label="SendIA, volver al inicio"><Image className="sendia-logo sendia-logo-beta" src={sendiaLogo} alt="SendIA"/><small>BETA DOCENTE</small></Link>
      <nav aria-label="Navegación de la beta docente">
        {showLibrary && <Link href="/beta/docentes/casos">Biblioteca de ejemplos</Link>}
        <Link href="/comprender">Demo de Alex</Link>
        {showLibrary ? <button type="button" onClick={exit}>Cerrar sesión</button> : <Link href="/">Volver a SendIA</Link>}
      </nav>
    </header>
    <main className="teacher-beta-main">{children}</main>
  </div>;
}
