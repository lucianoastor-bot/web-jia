// app/programa/page.tsx

import type { Metadata } from 'next'
import Programa from '@/components/Programa'

export const metadata: Metadata = {
  title: 'Programa — Jornadas: La IA en Debate',
  description: 'Programa de las Jornadas La IA en Debate, FHyA UNR 2026.',
}

export default function ProgramaPage() {
  return <Programa />
}
