'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { copy } from '@/lib/i18n/es-419';
import sendiaLogo from '@/app/images/logo.png';

type NavIconName = 'home' | 'explore' | 'family' | 'create' | 'plans' | 'team' | 'building' | 'private' | 'impact' | 'ideas';

const items: { href: string; label: string; icon: NavIconName }[] = [
  { href: '/espacio', label: 'Inicio', icon: 'home' },
  { href: '/espacio-seguro', label: 'Espacio privado', icon: 'private' },
  { href: '/comprender', label: 'Comprender', icon: 'explore' },
];

function NavGlyph({ name }: { name: NavIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'home' && <><path d="m3.5 10 8.5-7 8.5 7"/><path d="M5.5 9v11h13V9M9.5 20v-6h5v6"/><circle cx="18" cy="5" r="1.5"/></>}
    {name === 'explore' && <><path d="M2.8 12s3.3-6.3 9.2-6.3 9.2 6.3 9.2 6.3-3.3 6.3-9.2 6.3S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.7"/><path d="m17.8 4.2 1.4-1.4M20 7h2"/></>}
    {name === 'family' && <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 15.5a4.4 4.4 0 0 1 6.5 3.5"/><path d="M4 4.5c.8-1 1.8-1.5 3-1.5"/></>}
    {name === 'create' && <><path d="m4 16.8-.9 4.1 4.1-.9L19.6 7.6a2.2 2.2 0 0 0-3.1-3.1L4 16.8Z"/><path d="m14.9 6.1 3.1 3.1M4 16.8l3.2 3.2"/><path d="M5 4v3M3.5 5.5h3"/></>}
    {name === 'plans' && <><rect x="5" y="4.5" width="15" height="17" rx="2"/><path d="M9 4.5V3h7v1.5M8.5 10h8M8.5 14h8M8.5 18h5"/><path d="m2.5 10 1 1 1.8-2M2.5 15l1 1 1.8-2"/></>}
    {name === 'team' && <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 15.5a4.4 4.4 0 0 1 6.5 3.5"/><path d="M13 5.3a3 3 0 0 1 4.3-.3"/></>}
    {name === 'building' && <><path d="M4 21V5.5L12 2l8 3.5V21"/><path d="M2 21h20M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1M10.5 21v-3.5h3V21"/><path d="M2 5.5 12 2l10 3.5"/></>}
    {name === 'private' && <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/><circle cx="12" cy="14" r=".7" fill="currentColor"/></>}
    {name === 'impact' && <><path d="M4 20V5M4 20h17"/><path d="m7 15 4-4 3 2 5-6"/><circle cx="19" cy="7" r="1.5"/><path d="M7 4h3"/></>}
    {name === 'ideas' && <><path d="M9 18h6M10 21h4M8.2 14.8a7 7 0 1 1 7.6 0c-.9.6-1.3 1.4-1.4 2.2h-4.8c-.1-.8-.5-1.6-1.4-2.2Z"/><path d="M12 1.5v2M3.7 5 5 6.3M20.3 5 19 6.3"/></>}
  </svg>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isClassroomSection = pathname.startsWith('/comprender/aula') || pathname.startsWith('/crear') || pathname.startsWith('/planes');
  const isCenterSection = pathname.startsWith('/comprender/centro') || pathname.startsWith('/colaboracion');
  const active = isClassroomSection ? '/comprender/aula' : isCenterSection ? '/comprender/centro' : pathname === '/familias' || pathname.startsWith('/comprender/casa') ? '/comprender/casa' : pathname;
  const current = pathname === '/familias' ? 'Hoja de ruta' : pathname.startsWith('/comprender/centro') ? 'Comprender · Centro' : pathname.startsWith('/comprender/casa') ? 'Comprender · Familia' : pathname.startsWith('/comprender/aula') ? 'Comprender · Aula' : pathname.startsWith('/crear') ? 'Crear' : pathname.startsWith('/planes') ? 'Mis planes' : pathname.startsWith('/colaboracion/ideas') ? 'Lluvia de ideas' : pathname.startsWith('/colaboracion') ? 'Colaboración' : items.find((item) => item.href === active)?.label ?? 'SendIA';
  return <div className="app">
    <aside className="sidebar" aria-label="Navegación principal">
      <Link href="/" className="brand" aria-label="SendIA, volver al inicio"><Image className="sendia-logo sendia-logo-sidebar" src={sendiaLogo} alt="SendIA" priority/></Link>
      <div className="nav-label">Espacio personal</div>
      <nav>{items.map((item) => <div key={item.href}><Link href={item.href} className={`nav-link ${item.href === '/comprender' ? active.startsWith('/comprender') ? 'active' : '' : active === item.href ? 'active' : ''}`} aria-current={item.href === '/comprender' ? pathname === '/comprender' ? 'page' : undefined : active === item.href ? 'page' : undefined}><span className="nav-icon"><NavGlyph name={item.icon}/></span><span>{item.label}</span></Link>{item.href === '/comprender' && <div className="nav-subgroup" aria-label="Espacios de Comprender">
        <Link href="/comprender/aula" className={`nav-link nav-link-sub ${isClassroomSection ? 'active' : ''}`} aria-current={pathname === '/comprender/aula' ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="explore"/></span><span>Desde el aula</span></Link>
        <div className="nav-subgroup-home"><Link href="/crear" className={`nav-link nav-link-sub nav-link-home ${pathname.startsWith('/crear') ? 'active' : ''}`} aria-current={pathname.startsWith('/crear') ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="create"/></span><span>Crear</span></Link><Link href="/planes/plan-aula" className={`nav-link nav-link-sub nav-link-home ${pathname.startsWith('/planes') ? 'active' : ''}`} aria-current={pathname.startsWith('/planes') ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="plans"/></span><span>Mis planes</span></Link></div>
        <Link href="/comprender/centro" className={`nav-link nav-link-sub ${isCenterSection ? 'active' : ''}`} aria-current={pathname === '/comprender/centro' ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="building"/></span><span>Desde el centro</span></Link>
        <div className="nav-subgroup-home"><Link href="/colaboracion" className={`nav-link nav-link-sub nav-link-home ${pathname === '/colaboracion' ? 'active' : ''}`} aria-current={pathname === '/colaboracion' ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="team"/></span><span>Colaboración</span></Link><Link href="/colaboracion/ideas" className={`nav-link nav-link-sub nav-link-home nav-link-deeper ${pathname.startsWith('/colaboracion/ideas') ? 'active' : ''}`} aria-current={pathname.startsWith('/colaboracion/ideas') ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="ideas"/></span><span>Lluvia de ideas</span></Link></div>
        <Link href="/comprender/casa" className={`nav-link nav-link-sub ${active === '/comprender/casa' ? 'active' : ''}`} aria-current={pathname === '/comprender/casa' ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="family"/></span><span>Desde casa</span></Link>
        <div className="nav-subgroup-home"><Link href="/familias" className={`nav-link nav-link-sub nav-link-home ${pathname === '/familias' ? 'active' : ''}`} aria-current={pathname === '/familias' ? 'page' : undefined}><span className="nav-icon"><NavGlyph name="family"/></span><span>Hoja de ruta</span></Link></div>
      </div>}</div>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-note"><strong>Protege la identidad</strong>Usa un alias ficticio. No escribas nombres ni datos que identifiquen a estudiantes. {copy.product.noDiagnosis}<Link href="/datos">Cómo cuidamos los datos →</Link></div><div className="profile"><div className="avatar" aria-hidden="true">MR</div><div><div className="profile-name">Marta Rivas · Docente</div><div className="profile-role">Perfil ficticio · demostración</div></div></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">SendIA <span> / {current}</span></div><div className="top-actions"><span className="demo-pill">◈ &nbsp;Entorno de demostración</span></div></header>{children}</main>
  </div>;
}
