import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { UruguaySupportMap } from '@/components/uruguay-support-map';

export const metadata: Metadata = {
  title: 'Mapa de apoyos en Uruguay · SendIA',
  description: 'Mapa conceptual e informe de iniciativas públicas, universitarias, asociativas y educativas vinculadas con las altas habilidades en Uruguay.',
};

export default function FamilyResourcesPage() {
  return <AppShell><div className="content family-page family-resources-page">
    <div className="eyebrow">DESDE CASA · RECURSOS PARA FAMILIAS</div>
    <header className="family-resource-heading">
      <span className="case-label">URUGUAY · INFORME Y MAPA</span>
      <h1 className="page-title">¿Qué apoyos existen<br/><em>y dónde buscarlos?</em></h1>
      <p>Un panorama de iniciativas públicas, universitarias, asociativas y educativas relacionadas con las altas habilidades. Revisá qué ofrece cada una y qué datos conviene confirmar antes de contactarla.</p>
    </header>
    <UruguaySupportMap defaultOpen/>
  </div></AppShell>;
}
