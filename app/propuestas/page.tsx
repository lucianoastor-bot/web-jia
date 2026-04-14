// app/propuestas/page.tsx

import type { Metadata } from 'next'
import { CONGRESO, EJES } from '@/congreso.config'

export const metadata: Metadata = {
  title: `Propuestas — ${CONGRESO.nombreCorto}`,
  description: `Convocatoria y pautas para el envío de resúmenes. ${CONGRESO.nombre} — ${CONGRESO.siglas} — ${CONGRESO.anio}.`,
}

export default function Propuestas() {
  return (
    <main className="page">
      <div className="section">
        <h1 className="section__title">Envío de resúmenes</h1>

        <p className="section__body">
          La {CONGRESO.institucion} de la {CONGRESO.universidad} convoca a las {CONGRESO.nombre},
          dirigidas a estudiantes, graduados y docentes de la {CONGRESO.institucion} y de la comunidad
          universitaria que deseen compartir experiencias e investigaciones sobre la temática.
          El evento se desarrollará los días {CONGRESO.fechaTexto}.
        </p>

        {/* Plazo */}
        <div style={{ margin: '3rem 0' }}>
          <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--c-mid)' }}>Plazo:</span>{' '}
            <span style={{ color: 'var(--c-coral)' }}>{CONGRESO.plazoResumenes}</span>
          </h2>
        </div>

        {/* Ejes */}
        <br />
        <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginTop: '1rem' }}>
          Ejes temáticos
        </h2>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '720px', counterReset: 'none' }}>
          {EJES.map((eje, i) => (
            <li key={i} style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start', borderBottom: '1px solid rgba(35,22,81,0.06)', paddingBottom: '0.75rem' }}>
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
        <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginTop: '3rem' }}>
          Modalidades de participación
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Ponencias · Relatos de experiencias
            </p>
            <p className="section__body">
              Se debe enviar un resumen de hasta 400 palabras siguiendo las pautas
              generales para la presentación de resúmenes.
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Pósters
            </p>
            <p className="section__body">
              Los pósters son una modalidad orientada a trabajos en curso, avances de investigación
              o propuestas exploratorias. Se debe enviar un resumen de hasta 400 palabras siguiendo
              las pautas generales. La evaluación se realiza sobre el resumen. De resultar
              seleccionado, se debe presentar el póster en formato impreso (A0 o A1, orientación
              vertical) durante la sesión de pósters del programa.
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Paneles
            </p>
            <p className="section__body">
              Se aceptan paneles de entre 3 y 5 integrantes. El coordinador debe enviar
              un resumen general del panel y los resúmenes individuales de cada integrante.
              Todos los resúmenes se deben incluir en un único archivo.
            </p>
          </div>

        </div>

        {/* Pautas */}
        <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginTop: '3rem' }}>
          Pautas generales para la presentación de resúmenes
        </h2>

        <table style={{ width: '100%', maxWidth: '720px', borderCollapse: 'collapse', marginBottom: '3rem' }}>
          <tbody>
            {[
              ['Encabezado', 'Título en negritas (centrado), nombre y apellido del autor/es, institución, correo electrónico'],
              ['Extensión', 'Máximo 400 palabras'],
              ['Fuente', 'Arial 11, interlineado 1.5'],
              ['Nombre del archivo', 'APELLIDO_EJEx — apellido del autor y número de eje seleccionado'],
              ['Formatos', '.doc · .docx · .odt · .rtf'],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: '1px solid rgba(35,22,81,0.07)' }}>
                <td style={{ padding: '0.9rem 1.5rem 0.9rem 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-mid)', whiteSpace: 'nowrap', verticalAlign: 'top', width: '180px' }}>
                  {label}
                </td>
                <td style={{ padding: '0.9rem 0', fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>
                  {label === 'Nombre del archivo'
                    ? <code style={{ fontFamily: 'monospace', background: 'rgba(35,22,81,0.06)', padding: '0.15rem 0.4rem', fontSize: '0.85rem' }}>{value}</code>
                    : value
                  }
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
