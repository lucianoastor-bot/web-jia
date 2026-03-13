import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Jornadas IA en Debate — FHyA UNR',
  description: 'Jornadas: "La Inteligencia Artificial en Debate" — Facultad de Humanidades y Artes, Universidad Nacional de Rosario. 10, 11 y 12 de junio de 2026.',
  openGraph: {
    title: 'Jornadas: La IA en Debate',
    description: 'Facultad de Humanidades y Artes, UNR — 10, 11 y 12 de junio de 2026',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}