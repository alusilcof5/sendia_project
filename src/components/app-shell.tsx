'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { copy } from '@/lib/i18n/es-419';

const items = [
  { href: '/espacio', label: 'Inicio', icon: '⌂' },
  { href: '/comprender', label: 'Comprender', icon: '◉' },
  { href: '/planes/plan-aula', label: 'Mis planes', icon: '▤' },
  { href: '/colaboracion', label: 'Colaboración', icon: '♧' },
  { href: '/impacto', label: 'Impacto', icon: '↗' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith('/planes') ? '/planes/plan-aula' : pathname;
  const current = items.find((item) => item.href === active)?.label ?? 'SendIA';
  return <div className="app">
    <aside className="sidebar" aria-label="Navegación principal">
      <Link href="/" className="brand" aria-label="SendIA, volver al inicio"><span className="brand-mark" aria-hidden="true">S</span><span><span className="brand-name">{copy.product.name}</span><span className="brand-caption">{copy.product.tagline}</span></span></Link>
      <div className="nav-label">Espacio personal</div>
      <nav>{items.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${active === item.href ? 'active' : ''}`} aria-current={active === item.href ? 'page' : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-note"><strong>Un espacio cuidado</strong>La información de demostración es ficticia. {copy.product.noDiagnosis}<Link href="/datos">Cómo cuidamos los datos →</Link></div><div className="profile"><div className="avatar" aria-hidden="true">MR</div><div><div className="profile-name">Marta Rivas · Docente</div><div className="profile-role">Perfil ficticio · demostración</div></div></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">SendIA <span> / {current}</span></div><div className="top-actions"><span className="demo-pill">◈ &nbsp;Entorno de demostración</span></div></header>{children}</main>
  </div>;
}
