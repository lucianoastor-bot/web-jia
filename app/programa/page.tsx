// app/programa/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programa — Jornadas: La IA en Debate',
  description: 'Programa de las Jornadas La IA en Debate, FHyA UNR 2026.',
}

// app/programa/page.tsx
export default function Programa() {
  return (
    <main className="page">
      <div className="section">
        <div className="section__eyebrow">10 · 11 · 12 de junio de 2026</div>
        <h1 className="section__title">Programa</h1>
        <div className="placeholder">
          <div>
            <p className="placeholder__title">Próximamente</p>
          </div>
        </div>
      </div>
    </main>
  )
}
