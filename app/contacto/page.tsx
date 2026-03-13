export default function Contacto() {
  return (
    <div className="pagina-wrapper">

      {/* ── ENCABEZADO ── */}
      <section className="pagina-header">
        <div className="contenedor">
          <p className="pagina-label">Jornadas IA en Debate · FHyA UNR · 2026</p>
          <h1 className="pagina-titulo">Contacto</h1>
        </div>
      </section>

      {/* ── CONTENIDO ── */}
      <section className="seccion">
        <div className="contenedor">
          <div className="contacto-inner">

            <div className="cfp-bloque">
              <h2 className="cfp-subtitulo">Consultas e información</h2>
              <p className="cfp-texto">
                Ante cualquier duda o inquietud sobre las jornadas, la convocatoria
                o el proceso de envío de resúmenes, no dudes en comunicarte con
                el equipo organizador.
              </p>
            </div>

            <div className="cfp-bloque">
              <h2 className="cfp-subtitulo">Correo electrónico</h2>
              <a href="mailto:ia.jornadas.hya@gmail.com" className="contacto-email">
                ia.jornadas.hya@gmail.com
              </a>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
