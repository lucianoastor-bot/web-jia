import type { Metadata } from 'next'
import { Lora, Outfit } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'
import { CONGRESO } from '@/congreso.config'

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
  title: `${CONGRESO.nombreCorto} — ${CONGRESO.siglas} — ${CONGRESO.anio}`,
  description: `${CONGRESO.nombre} — ${CONGRESO.institucion}, ${CONGRESO.universidad} - ${CONGRESO.fechaTexto} - ${CONGRESO.ciudad}, ${CONGRESO.pais}.`,
  openGraph: {
    title: CONGRESO.nombre,
    description: `Jornadas académicas · ${CONGRESO.siglas} · ${CONGRESO.anio} · ${CONGRESO.ciudad}`,
    url: CONGRESO.url,
    siteName: CONGRESO.nombre,
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
