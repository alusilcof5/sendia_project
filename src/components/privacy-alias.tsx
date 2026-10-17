'use client';

import { useState } from 'react';
import { createCaseAlias } from '@/lib/privacy';

export function PrivacyAlias({ subject = 'estudiante' }: { subject?: string }) {
  const [alias, setAlias] = useState('');
  const [feedback, setFeedback] = useState('');

  const createAlias = () => {
    setAlias(createCaseAlias());
    setFeedback('Alias creado en este dispositivo. No se guarda automáticamente.');
  };

  const copyAlias = async () => {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
      setFeedback('Copiado. Puedes usarlo en lugar del nombre real.');
    } catch {
      setFeedback('Selecciona el código y cópialo para usarlo en lugar del nombre real.');
    }
  };

  return <aside className="privacy-alias" aria-label="Crear un alias para proteger la identidad">
    <div className="privacy-alias-copy"><strong>Antes de escribir, crea un alias</strong><p>No pongas el nombre real de {subject}. Usa el código en su lugar. El alias ayuda a evitar el nombre, pero no anonimiza otros detalles del relato o de los documentos.</p></div>
    <div className="privacy-alias-actions"><button type="button" className="button button-secondary button-small" onClick={createAlias}>{alias ? 'Crear otro alias' : 'Crear alias'}</button>{alias && <><code aria-label="Alias generado">{alias}</code><button type="button" className="privacy-alias-copy-button" onClick={() => void copyAlias()}>Copiar</button></>}</div>
    {feedback && <span className="privacy-alias-feedback" role="status">{feedback}</span>}
  </aside>;
}
