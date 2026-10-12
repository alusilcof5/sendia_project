'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { clearSendiaLocalData } from '@/lib/local-data';

export function PrivacyPage() {
  const [message, setMessage] = useState('');
  const clear = () => {
    if (!window.confirm('Se borrarán de este navegador tus planes, respuestas de impacto y sesión de demostración. Esta acción no se puede deshacer. ¿Quieres continuar?')) return;
    try { clearSendiaLocalData(); setMessage('Se borraron los datos de SendIA guardados en este navegador.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudieron borrar los datos locales.'); }
  };

  return <AppShell><div className="content privacy-page">
    <div className="eyebrow">SENDIA · PRIVACIDAD</div>
    <h1 className="page-title serif">Cómo cuidamos los datos</h1>
    <p className="subtitle">SendIA es un prototipo. Úsalo con información ficticia o anonimizada; no ingreses nombres ni datos que permitan reconocer a estudiantes.</p>
    <section className="panel"><h2>Cuando exploras una situación</h2><ul><li>El texto se procesa en tu navegador y se envía a Gemini solo cuando aceptas el envío.</li><li>El servidor de SendIA no guarda el texto de la situación ni la respuesta generada.</li><li>Los planes aprobados y las respuestas de impacto se guardan localmente en este navegador. No se sincronizan con otros dispositivos.</li><li>La detección de identificadores es automática y puede equivocarse; una advertencia no significa que el texto esté anonimizado. Revisa el contenido por tu cuenta.</li><li>La clave de Gemini permanece en el servidor y no se entrega al navegador.</li></ul></section>
    <section className="panel section-space"><h2>Colaboración y demostración</h2><p>Compartir planes es una simulación: SendIA no transmite tus planes a otras personas. El acceso de la beta docente también es demostrativo y no protege información real.</p></section>
    <section className="panel section-space local-data-delete"><h2>Borrar lo guardado en este navegador</h2><p>Esto elimina planes, respuestas de impacto y la sesión de demostración de SendIA en este navegador.</p><button className="button button-secondary" onClick={clear}>Borrar todos mis datos locales</button>{message && <p role="status">{message}</p>}</section>
  </div></AppShell>;
}
