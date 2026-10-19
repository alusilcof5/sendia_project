import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = { title: 'Política de cookies | SendIA' };

export default function CookiePolicyPage() {
  return <AppShell><article className="content privacy-page legal-document">
    <div className="eyebrow">SENDIA · INFORMACIÓN DE PRIVACIDAD</div><h1 className="page-title serif">Política de cookies</h1>
    <p className="subtitle">Información sobre cookies y almacenamiento del navegador en este prototipo, en el marco de la Ley N.º 18.331 y su reglamentación.</p>
    <section className="panel"><h2>Qué utiliza SendIA</h2><p>El código actual no incorpora cookies propias de publicidad ni una herramienta propia de analítica. Sí utiliza almacenamiento local y de sesión del navegador para planes, actividades, respuestas de Impacto, sesiones de demostración y sesiones de autenticación. Estos datos pueden persistir hasta que los borres desde SendIA o desde la configuración del navegador.</p><p>Supabase utiliza identificadores de usuario y tokens de sesión para autenticación y acceso a funciones colaborativas. Una sesión de autenticación anónima tiene un identificador persistente: no equivale a datos anónimos.</p></section>
    <section className="panel section-space"><h2>Servicios externos</h2><p>Cuando la persona adulta acepta enviar contenido a Gemini, ese contenido se transmite al servicio de Google para generar una respuesta. La carga de tipografías desde Google Fonts también puede generar una conexión con ese proveedor. Cada proveedor puede aplicar sus propias tecnologías y condiciones.</p></section>
    <section className="panel section-space"><h2>Cómo gestionar o borrar los datos</h2><p>Podés borrar los datos locales de SendIA desde «Cómo cuidamos los datos» o desde la configuración del navegador. El botón elimina las claves de la aplicación, incluida la sesión institucional con prefijo SendIA, pero no garantiza borrar todas las claves de autenticación de Supabase: la sesión anónima puede quedar guardada con otra clave. Para limpiar el almacenamiento completo, usá la configuración del navegador. Esto tampoco elimina registros remotos en Supabase ni contenido ya enviado a Google.</p><p>SendIA no ofrece actualmente un panel de preferencias. Si se incorporan tecnologías nuevas, se deberá revisar qué datos recogen, para qué se usan y qué información u opción de elección corresponde según la normativa aplicable.</p><p>Para consultas sobre privacidad, escribí a <a href="mailto:sendia@gmail.com">sendia@gmail.com</a>.</p></section>
    <p className="legal-updated">Estado: descripción del prototipo disponible a octubre de 2026.</p>
  </article></AppShell>;
}
