import type { Metadata } from 'next'
import SpeakersPage from '@/components/SpeakersPage'

export const metadata: Metadata = {
  title: 'Invitados — Jornadas: La IA en Debate',
  description: 'Invitados a las Jornadas: La IA en Debate, FHyA UNR 2026.',
}

export default function Invitados() {
  return (
    <main className="page">
      <SpeakersPage />
    </main>
  )
}
