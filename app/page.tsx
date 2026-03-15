import Hero from '@/components/Hero'
import Ejes from '@/components/Ejes'
import Speakers from '@/components/Speakers'
import Noticias from '@/components/Noticias'

export default function Home() {
  return (
    <main>
      <Hero />
      <div className="content" id="contenido">
        <Speakers />
        <Ejes />
        <Noticias />
      </div>
    </main>
  )
}
