import Hero from '@/components/Hero'
import Ejes from '@/components/Ejes'
import InvitadosCarrusel from '@/components/InvitadosCarrusel'
import Noticias from '@/components/Noticias'

export default function Home() {
  return (
    <main>
      <Hero />
      <div className="content" id="contenido">
        <InvitadosCarrusel />
        <Noticias />
        <Ejes />
      </div>
    </main>
  )
}
