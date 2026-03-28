import { NOTICIAS_DEFECTO } from '@/congreso.config'

export default function Noticias() {
  return (
    <section className="noticias" id="noticias">
      <div className="noticias__inner">

        <h2 className="section__title">Novedades</h2>

        <div className="noticias__grid">
          {NOTICIAS_DEFECTO.map((n, i) => (
            <article key={i} className="noticia-card">
              <span className="noticia-card__fecha">{n.fecha}</span>
              <h3 className="noticia-card__titulo">{n.titulo}</h3>
              <p className="noticia-card__resumen">{n.resumen}</p>
              {n.enlace && (
                <a href={n.enlace} className="noticia-card__link">
                  Leer más →
                </a>
              )}
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
