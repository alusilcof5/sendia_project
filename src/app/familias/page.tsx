import type { Metadata } from 'next';
import { FamilyRoadmapFlow } from '@/components/family-roadmap-flow';

export const metadata: Metadata = {
  title: 'Hoja de ruta familiar · ¿Y ahora qué? | SendIA',
  description: 'Una hoja de ruta informativa generada con IA para ayudar a familias a ordenar preguntas y preparar próximos pasos tras una identificación de altas capacidades.',
};

export default function FamiliesPage() {
  return <FamilyRoadmapFlow />;
}
