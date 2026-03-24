type Noticia = {
  fecha: string
  titulo: string
  resumen: string
  link?: string
}

const NOTICIAS: Noticia[] = [
  {
    fecha: '10 mar 2026',
    titulo: 'Abrimos la convocatoria para el envío de resúmenes',
    resumen: 'Ya está disponible el formulario para presentar ponencias, paneles, relatos de experiencias y pósters. El plazo cierra el 20 de abril.',
    link: '/propuestas',
  },
  {
    fecha: '',
    titulo: '',
    resumen: '',
  },
  {
    fecha: '1 mar 2026',
    titulo: 'Las jornadas se realizarán los días 10, 11 y 12 de junio',
    resumen: 'La Facultad de Humanidades y Artes de la UNR será sede de las primeras Jornadas La Inteligencia Artificial en Debate.',
    link: '/contacto',
  },
]

export default function Noticias() {
  return (
    <section className="noticias" id="noticias">
      <div className="noticias__inner">

        <h2 className="section__title">Novedades</h2>

        <div className="noticias__grid">
          {NOTICIAS.map((n, i) => (
            <article key={i} className="noticia-card">
              <span className="noticia-card__fecha">{n.fecha}</span>
              <h3 className="noticia-card__titulo">{n.titulo}</h3>
              <p className="noticia-card__resumen">{n.resumen}</p>
              {n.link && (
                <a href={n.link} className="noticia-card__link">
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
