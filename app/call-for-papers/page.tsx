const ejes = [
  'Inteligencia Artificial y educación',
  'Inteligencia Artificial y producción artística y cultural',
  'Inteligencia Artificial, escritura y traducción',
  'Filosofía de la Inteligencia Artificial',
  'Problemas éticos del uso de la Inteligencia Artificial',
  'Impacto de la Inteligencia Artificial en la sociedad, la economía y el trabajo',
  'Inteligencia Artificial, vínculos, salud mental y redes sociales',
  'Inteligencia Artificial: utopía y distopía',
]

export default function CallForPapers() {
  return (
    <div className="pagina-wrapper">

      {/* ── ENCABEZADO ── */}
      <section className="pagina-header">
        <div className="contenedor">
          <p className="pagina-label">Jornadas: La IA en Debate · FHyA · UNR · 2026</p>
          <h1 className="pagina-titulo">Call for Papers</h1>
          <p className="pagina-subtitulo">Envío de resúmenes</p>
        </div>
      </section>

      {/* ── CONTENIDO ── */}
      <section className="seccion">
        <div className="contenedor">
          <div className="cfp-grid">

            {/* ── Columna principal ── */}
            <div className="cfp-main">

              {/* Presentación */}
              <div className="cfp-bloque">
                <p className="cfp-texto">
                  La <strong>Facultad de Humanidades y Artes</strong> convoca a las{' '}
                  <strong>Jornadas "La Inteligencia Artificial en Debate"</strong>,
                  dirigidas a estudiantes, graduados y docentes de la Facultad de
                  Humanidades y Artes y de la comunidad universitaria que deseen
                  compartir experiencias e investigaciones sobre la temática. El evento
                  se desarrollará los días <strong>10, 11 y 12 de junio de 2026</strong>.
                </p>
              </div>

              {/* Plazo */}
              <div className="cfp-bloque">
                <h2 className="cfp-subtitulo">Plazo para el envío de resúmenes</h2>
                <p className="cfp-fecha-destacada">20 de abril de 2026</p>
              </div>

              {/* Modalidades */}
              <div className="cfp-bloque">
                <h2 className="cfp-subtitulo">Modalidades de participación</h2>

                <div className="cfp-modalidad">
                  <h3 className="cfp-modalidad-titulo">
                    Ponencias · Relatos de experiencias · Pósters
                  </h3>
                  <p className="cfp-texto">
                    Se debe enviar un resumen de hasta 400 palabras siguiendo las
                    pautas generales para la presentación de resúmenes.
                  </p>
                </div>

                <div className="cfp-modalidad">
                  <h3 className="cfp-modalidad-titulo">Paneles</h3>
                  <p className="cfp-texto">
                    Se aceptan paneles de entre 3 y 5 integrantes. El coordinador
                    debe enviar un resumen general del panel y los resúmenes
                    individuales de cada integrante. Todos los resúmenes se deben
                    incluir en un único archivo.
                  </p>
                </div>
              </div>

              {/* Pautas generales */}
              <div className="cfp-bloque">
                <h2 className="cfp-subtitulo">
                  Pautas generales para la presentación de resúmenes
                </h2>

                <div className="cfp-pautas">
                  <div className="cfp-pauta">
                    <span className="cfp-pauta-label">Encabezado</span>
                    <span className="cfp-pauta-valor">
                      Título en negritas (centrado), nombre y apellido del autor/es,
                      institución, correo electrónico
                    </span>
                  </div>
                  <div className="cfp-pauta">
                    <span className="cfp-pauta-label">Extensión</span>
                    <span className="cfp-pauta-valor">Máximo 400 palabras</span>
                  </div>
                  <div className="cfp-pauta">
                    <span className="cfp-pauta-label">Fuente</span>
                    <span className="cfp-pauta-valor">Arial 11, interlineado 1.5</span>
                  </div>
                  <div className="cfp-pauta">
                    <span className="cfp-pauta-label">Nombre del archivo</span>
                    <span className="cfp-pauta-valor">
                      <code className="cfp-codigo">APELLIDO_EJEx</code>
                      {' '}— apellido del autor y número de eje seleccionado
                    </span>
                  </div>
                  <div className="cfp-pauta">
                    <span className="cfp-pauta-label">Formatos</span>
                    <span className="cfp-pauta-valor">.doc · .docx · .odt · .rtf</span>
                  </div>
                </div>
              </div>

              {/* Botón envío */}
              <a href="https://forms.gle/SKB7J1o7beuXAsGz5" target="_blank" rel="noopener noreferrer" className="btn-primary cfp-btn">
                {'Formulario de envío →'}
              </a>

            </div>

            {/* ── Sidebar ── */}
            <aside className="cfp-aside">

              <div className="cfp-aside-bloque">
                <h3 className="cfp-aside-titulo">Ejes temáticos</h3>
                <ol className="cfp-ejes">
                  {ejes.map((eje, i) => (
                    <li key={i} className="cfp-eje">
                      <span className="cfp-eje-num">{i + 1}</span>
                      <span className="cfp-eje-texto">{eje}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </aside>

          </div>
        </div>
      </section>

    </div>
  )
}