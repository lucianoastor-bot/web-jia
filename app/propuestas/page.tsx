// app/propuestas/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Propuestas — Jornadas: La IA en Debate',
  description: 'Convocatoria y pautas para el envío de resúmenes. Jornadas: La IA en Debate, FHyA UNR 2026.',
}

const EJES = [
  'Inteligencia Artificial y educación',
  'Inteligencia Artificial y producción artística y cultural',
  'Inteligencia Artificial, escritura y traducción',
  'Filosofía de la Inteligencia Artificial',
  'Problemas éticos del uso de la Inteligencia Artificial',
  'Impacto de la Inteligencia Artificial en la sociedad, la economía y el trabajo',
  'Inteligencia Artificial, vínculos, salud mental y redes sociales',
  'Inteligencia Artificial: utopía y distopía',
]

export default function Propuestas() {
  return (
    <main className="page">
      <div className="section">

        <div className="section__eyebrow">Convocatoria</div>
        <h1 className="section__title">Envío de resúmenes</h1>

        <p className="section__body">
          La Facultad de Humanidades y Artes de la Universidad Nacional de Rosario
          convoca a las Jornadas: <em>La Inteligencia Artificial en Debate</em>, dirigidas
          a estudiantes, graduados y docentes de la Facultad de Humanidades y Artes y de
          la comunidad universitaria que deseen compartir experiencias e investigaciones
          sobre la temática. El evento se desarrollará los días 10, 11 y 12 de junio de 2026.
        </p>

        {/* Plazo */}
        <div style={{ margin: '3rem 0', padding: '2rem', background: 'rgba(35,22,81,0.04)', borderLeft: '3px solid var(--c-turq)' }}>
          <p style={{ fontSize: '1.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 500, marginBottom: '0.5rem' }}>
            Plazo para el envío de resúmenes
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--c-dark)', fontFamily: 'var(--font-sans)' }}>
            20 de abril de 2026
          </p>
        </div>

        {/* Ejes */}
        <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginTop: '1rem' }}>
          Ejes temáticos
        </h2>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '720px', counterReset: 'none' }}>
          {EJES.map((eje, i) => (
            <li key={i} style={{ display: 'flex', gap: '1.2rem', alignItems: 'baseline', borderBottom: '1px solid rgba(35,22,81,0.06)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-turq)', minWidth: '1.5rem', letterSpacing: '0.05em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.6 }}>
                {eje}
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
              Ponencias · Relatos de experiencias · Pósters
            </p>
            <p className="section__body">
              Se debe enviar un resumen de hasta 400 palabras siguiendo las pautas
              generales para la presentación de resúmenes.
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
          
          <a href="https://forms.gle/SKB7J1o7beuXAsGz5"
            className="btn btn--primary"
            style={{ display: 'inline-block', background: 'var(--c-dark)', borderColor: 'var(--c-dark)', color: 'var(--c-white)' }}
            target="_blank"
          >
            Formulario de envío →
          </a>
        </div>

      </div>
    </main>
  )
}