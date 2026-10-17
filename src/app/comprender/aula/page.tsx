import { UnderstandingFlow } from '@/components/understanding-flow';

export const metadata = { title: 'Comprender desde el aula · SendIA' };

export default function ComprenderAula() {
  return <UnderstandingFlow initialProfile="teacher" />;
}
