import Hero from '@/components/Hero'

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Content sections — replace placeholder with real sections */}
      <div className="content" id="contenido">
        <div className="placeholder reveal">
          <div>
            <span className="placeholder__icon">⬚</span>
            <p className="placeholder__title">Sección de contenido</p>
            <p className="placeholder__text">
              Aquí irán los ejes temáticos, modalidades,<br />
              programa, speakers y demás contenidos.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
