import type { Metadata } from 'next'
import { Lora, Outfit } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const lora = Lora({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400'],
  variable: '--font-lora',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jornadas: La IA en Debate — FHyA UNR 2026',
  description:
    'Jornadas: La Inteligencia Artificial en Debate — Facultad de Humanidades y Artes, Universidad Nacional de Rosario - 10, 11 y 12 de junio de 2026 - Rosario, Argentina.',
  openGraph: {
    title: 'Jornadas: La Inteligencia Artificial en Debate',
    description: 'Jornadas académicas · FHyA · UNR · Junio 2026 · Rosario',
    url: 'https://iajornadas.vercel.app',
    siteName: 'Jornadas: La Inteligencia Artificial en Debate',
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
    <html lang="es" className={`${lora.variable} ${outfit.variable}`} data-scroll-behavior="smooth">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
