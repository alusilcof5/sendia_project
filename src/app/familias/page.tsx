import type { Metadata } from 'next';
import { FamilyRoadmapFlow } from '@/components/family-roadmap-flow';

export const metadata: Metadata = {
  title: 'Acompañamiento familiar · SendIA',
  description: 'Tres recorridos para familias: orientarse tras una identificación, preparar una conversación con el centro o explorar una situación cotidiana.',
};

export default function FamiliesPage() {
  return <FamilyRoadmapFlow />;
}
