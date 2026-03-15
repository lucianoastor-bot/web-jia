// app/conferencias/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conferencias — Jornadas: La IA en Debate',
  description: 'Speakers y conferencias invitadas de las Jornadas La IA en Debate, FHyA UNR 2026.',
}

// app/conferencias/page.tsx
export default function Conferencias() {
  return (
    <main className="page">
      <div className="section">
        <div className="section__eyebrow">Speakers</div>
        <h1 className="section__title">Conferencias</h1>
        <div className="placeholder">
          <div>
            <span className="placeholder__icon">🎤</span>
            <p className="placeholder__title">Próximamente</p>
            <p className="placeholder__text">
              Estamos confirmando a quienes serán las personas<br />
              invitadas a disertar en las jornadas.<br />
              La información estará disponible en breve.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
