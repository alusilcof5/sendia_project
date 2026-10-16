'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { clearSendiaLocalData } from '@/lib/local-data';

export function PrivacyPage() {
  const [message, setMessage] = useState('');
  const clear = () => {
    if (!window.confirm('Se borrarán de este navegador tus planes, actividades creadas, respuestas de impacto y sesión de demostración. Esta acción no se puede deshacer. ¿Quieres continuar?')) return;
    try { clearSendiaLocalData(); setMessage('Se borraron los datos de SendIA guardados en este navegador.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudieron borrar los datos locales.'); }
  };

  return <AppShell><div className="content privacy-page">
    <div className="eyebrow">SENDIA · PRIVACIDAD</div>
    <h1 className="page-title serif">Cómo cuidamos los datos</h1>
    <p className="subtitle">SendIA es un prototipo. Úsalo con información ficticia o anonimizada; no ingreses nombres ni datos que permitan reconocer a estudiantes.</p>
    <section className="panel"><h2>Cuando exploras una situación</h2><ul><li>El texto se procesa en tu navegador y se envía a Gemini solo cuando aceptas el envío.</li><li>El servidor de SendIA no guarda el texto de la situación ni la respuesta generada.</li><li>Los planes aprobados y las respuestas de impacto se guardan localmente en este navegador. No se sincronizan con otros dispositivos.</li><li>La detección de identificadores es automática y puede equivocarse; una advertencia no significa que el texto esté anonimizado. Revisa el contenido por tu cuenta.</li><li>La clave de Gemini permanece en el servidor y no se entrega al navegador.</li></ul></section>
    <section className="panel section-space"><h2>Cuando creas una actividad</h2><ul><li>Puedes adjuntar un único PDF (hasta 8 MB) o un TXT/Markdown (hasta 100 KB). El contenido del PDF se envía completo a Gemini; SendIA no extrae ni anonimiza su texto. Los archivos de texto se leen para incluir su contenido en la solicitud.</li><li>No subas documentos con nombres, datos personales, información sensible o detalles que identifiquen a un estudiante. Revísalos y anonimízalos antes.</li><li>El archivo no se guarda en SendIA. La actividad final solo se almacena en este navegador si eliges «Guardar en mis actividades».</li><li>La descarga se genera en tu dispositivo después de que confirmes la revisión docente. El archivo descargado queda bajo tu control.</li></ul></section>
    <section className="panel section-space"><h2>Tablero colaborativo en tiempo real</h2><ul><li>Si entras en una sala de lluvia de ideas, SendIA crea una sesión anónima y guarda el tablero, las notas y los votos en el proyecto Supabase configurado para la aplicación.</li><li>Las personas con el código pueden solicitar acceso a esa sala y ver su contenido. Comparte el código solo con el equipo acordado.</li><li>La persona que creó la sala puede eliminarla. Al hacerlo, también se borran sus notas, votos y membresías.</li><li>El botón de borrado de esta página solo limpia los datos locales de este navegador; no elimina las salas remotas de Supabase.</li><li>La colaboración de planes sigue siendo una simulación; no comparte los planes guardados en tu navegador.</li></ul></section>
    <section className="panel section-space local-data-delete"><h2>Borrar lo guardado en este navegador</h2><p>Esto elimina planes, actividades creadas, respuestas de impacto y la sesión de demostración de SendIA en este navegador.</p><button className="button button-secondary" onClick={clear}>Borrar todos mis datos locales</button>{message && <p role="status">{message}</p>}</section>
  </div></AppShell>;
}
