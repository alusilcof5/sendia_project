import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SendIA — Cada senda se descubre acompañando',
  description: 'Cada senda se descubre acompañando. Una guía para explorar situaciones educativas y convertir preguntas en estrategias revisables.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-UY"><body suppressHydrationWarning>{children}</body></html>;
}
