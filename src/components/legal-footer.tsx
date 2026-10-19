import Link from 'next/link';

const links = [
  { href: '/cookies', label: 'Política de cookies' },
  { href: '/privacidad', label: 'Política de privacidad' },
  { href: '/aviso-legal', label: 'Aviso legal' },
  { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
];

export function LegalFooter() {
  return <footer className="legal-footer" aria-label="Información legal">
    <div className="legal-footer-contact"><span>SendIA · Desarrollado por Ana Lucía Silva Córdoba</span><a href="mailto:sendia@gmail.com">Contacto: sendia@gmail.com</a></div>
    <nav aria-label="Enlaces legales">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
  </footer>;
}
