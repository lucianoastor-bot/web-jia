// app/propuestas/page.tsx

import type { Metadata } from 'next'
import { CONGRESO, EJES } from '@/congreso.config'

export const metadata: Metadata = {
  title: `Propuestas — ${CONGRESO.nombreCorto}`,
  description: `Convocatoria y pautas para el envío de resúmenes. ${CONGRESO.nombre} — ${CONGRESO.siglas} — ${CONGRESO.anio}.`,
}

const subtitulo: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
  marginTop: '3rem',
  marginBottom: '1rem',
}

const etiqueta: React.CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--c-mid)',
  fontWeight: 600,
  marginBottom: '0.4rem',
}

export default function Propuestas() {
  return (
    <main className="page">
      <div className="section">

        <h1 className="section__title">Envío de resúmenes</h1>

        {/* Presentación */}
        <p className="section__body" style={{ marginTop: '1.5rem' }}>
          La {CONGRESO.institucion} de la {CONGRESO.universidad} convoca a las{' '}
          <strong>{CONGRESO.nombre}</strong>, dirigidas a investigadores, docentes, graduados
          y estudiantes que tengan interés en los debates generados a partir de la emergencia
          de los modelos de Inteligencia Artificial.
        </p>
        <p className="section__body" style={{ marginTop: '1rem' }}>
          Desde las Humanidades, las Artes y las Ciencias Sociales nos interrogamos por sus
          alcances, implicancias y proyecciones en nuestras prácticas y saberes. Proponemos
          un espacio de encuentro y reflexión colectiva que contribuya al debate desde nuestras
          disciplinas, enfoques y experiencias.
        </p>
        <p className="section__body" style={{ marginTop: '1rem' }}>
          Las Jornadas tendrán lugar en la
          Sede Centro de la {CONGRESO.institucion}: {CONGRESO.direccion}.
        </p>

        {/* Fechas clave */}
        <h2 className="section__title" style={subtitulo}>Fechas clave</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px', marginBottom: '1rem' }}>
          {[
            { label: 'Recepción de resúmenes',          valor: CONGRESO.plazoResumenes,        destacado: true },
            { label: 'Notificación de propuestas aceptadas', valor: CONGRESO.notificacionResumenes, destacado: false },
            { label: 'Jornadas',                         valor: CONGRESO.fechaTexto,            destacado: false },
          ].map(({ label, valor, destacado }) => (
            <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#555', flex: 1 }}>{label}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: destacado ? 'var(--c-coral)' : 'var(--c-dark)', whiteSpace: 'nowrap' }}>
                {valor}
              </span>
            </div>
          ))}
        </div>

        {/* Ejes temáticos */}
        <h2 className="section__title" style={subtitulo}>Ejes temáticos</h2>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '720px', counterReset: 'none', marginBottom: '1rem' }}>
          {EJES.map((eje, i) => (
            <li key={i} style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start', borderBottom: '1px solid var(--border-faint)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-turq)', minWidth: '1.5rem', letterSpacing: '0.05em', paddingTop: '0.2rem' }}>
                {eje.num}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.6, fontWeight: 600 }}>
                  {eje.titulo}
                </span>
                {eje.descripcion && (
                  <span style={{ fontSize: '0.85rem', color: '#777', lineHeight: 1.6 }}>
                    {eje.descripcion}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>

        {/* Modalidades */}
        <h2 className="section__title" style={subtitulo}>Modalidades de participación</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px', marginBottom: '1rem' }}>
          <div>
            <p style={etiqueta}>Ponencias · Relatos de experiencias</p>
            <p className="section__body">
              Se debe enviar un resumen de hasta 400 palabras siguiendo las pautas
              generales para la presentación de resúmenes.
            </p>
          </div>

          <div>
            <p style={etiqueta}>Pósters</p>
            <p className="section__body">
              Se debe enviar un resumen de hasta 400 palabras siguiendo las pautas
              generales. La evaluación se realizará sobre el resumen. De resultar
              seleccionado, se debe presentar el póster en formato impreso (A0 o A1,
              orientación vertical) durante la sesión de pósters del programa.
            </p>
          </div>

          <div>
            <p style={etiqueta}>Paneles</p>
            <p className="section__body">
              Se aceptan paneles de entre 3 y 5 integrantes. El coordinador debe enviar
              un resumen general del panel y los resúmenes individuales de cada integrante.
              Todos los resúmenes se deben incluir en un único archivo.
            </p>
          </div>
        </div>

        {/* Pautas */}
        <h2 className="section__title" style={subtitulo}>Pautas para el envío de resúmenes</h2>

        <table style={{ width: '100%', maxWidth: '720px', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <tbody>
            {[
              ['Encabezado', 'Título en negritas (centrado), nombre y apellido del autor/es, institución, correo electrónico'],
              ['Extensión',  'Hasta 400 palabras'],
              ['Formato',    '.doc · .docx · .odt · .rtf'],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.9rem 1.5rem 0.9rem 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-mid)', whiteSpace: 'nowrap', verticalAlign: 'top', width: '150px' }}>
                  {label}
                </td>
                <td style={{ padding: '0.9rem 0', fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Costos */}
        <h2 className="section__title" style={subtitulo}>Costos</h2>

        <table style={{ width: '100%', maxWidth: '720px', borderCollapse: 'collapse', marginBottom: '3rem' }}>
          <tbody>
            {[
              ['Expositor',                              '$60.000'],
              ['Expositor de la Facultad de Humanidades y Artes', '$40.000'],
              ['Expositor estudiante de la UNR',         '$10.000 (presentar certificado de Alumno Regular)'],
              ['Asistente con certificado',              '$10.000'],
              ['Asistente estudiante de la UNR con certificado', 'Gratuito (presentar certificado de Alumno Regular)'],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.9rem 1.5rem 0.9rem 0', fontSize: '0.88rem', color: '#444', verticalAlign: 'top', width: '340px' }}>
                  {label}
                </td>
                <td style={{ padding: '0.9rem 0', fontSize: '0.88rem', fontWeight: 600, color: 'var(--c-dark)', lineHeight: 1.6 }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* CTA */}
        <div style={{ marginBottom: '4rem' }}>
          <a
            href={CONGRESO.formularioResumenes}
            className="btn btn--primary"
            style={{ display: 'inline-block', background: 'var(--c-dark)', borderColor: 'var(--c-dark)', color: 'var(--c-white)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Formulario de envío →
          </a>
        </div>

      </div>
    </main>
  )
}
