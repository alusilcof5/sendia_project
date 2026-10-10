'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { TeacherBetaShell } from '@/components/teacher-beta-shell';
import { startTeacherDemoSession } from '@/lib/teacher-session';

const demoEmail = 'docente@sendia.demo';
const demoPassword = 'sendia-demo';

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const enterDemo = () => {
    try {
      startTeacherDemoSession();
      window.location.assign('/beta/docentes/casos');
    } catch {
      setError('El navegador no permite iniciar la sesión de demostración. Prueba en una ventana normal.');
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== demoEmail || password !== demoPassword) {
      setError('Revisa el correo y la contraseña de demostración.');
      return;
    }
    enterDemo();
  };

  return <TeacherBetaShell><div className="teacher-beta-content teacher-access-page">
    <div className="eyebrow">SENDIA · ESPACIO DOCENTE</div>
    <section className="panel teacher-login-panel">
      <span className="case-label">ACCESO DE DEMOSTRACIÓN</span>
      <h1 className="page-title serif">Un espacio para explorar casos.</h1>
      <p className="subtitle">Consulta situaciones educativas ficticias y abre cada una en el recorrido guiado de SendIA.</p>
      <form className="teacher-login-form" onSubmit={submit}>
        <label>Correo de demostración<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="ai-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit">Entrar al espacio docente →</button>
      </form>
      <div className="teacher-demo-credentials"><strong>Credenciales para probar</strong><span>{demoEmail}</span><span>{demoPassword}</span></div>
      <button className="case-back-link teacher-demo-entry" type="button" onClick={enterDemo}>O entrar directamente a la demo docente →</button>
      <p className="pilot-privacy">Este acceso solo simula un login en esta demostración y se guarda en la sesión actual del navegador. No es una autenticación segura; no uses datos reales ni información de estudiantes.</p>
    </section>
  </div></TeacherBetaShell>;
}
