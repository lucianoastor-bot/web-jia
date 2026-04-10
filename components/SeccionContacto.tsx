// components/SeccionContacto.tsx
// Sección de contacto para el home. La página /contacto puede usar este componente.

export default function SeccionContacto() {
  return (
    <section className="section" id="contacto">
      <div className="section__eyebrow">Contacto</div>
      <h2 className="section__title">Consultas e información</h2>

      <p className="section__body" style={{ marginTop: '1rem' }}>
        Ante cualquier duda sobre las jornadas, la convocatoria o el proceso
        de envío de resúmenes, no dudes en comunicarte con el equipo organizador.
      </p>

      <div style={{ marginTop: '2.5rem' }}>
        <p style={{
          fontSize: '0.68rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--c-mid)',
          fontWeight: 500,
          marginBottom: '0.6rem',
        }}>
          Correo electrónico
        </p>
        <a
          href="mailto:ia.jornadas.hya@gmail.com"
          style={{
            fontSize: '1.1rem',
            color: 'var(--c-dark)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            borderBottom: '1px solid var(--c-turq)',
            paddingBottom: '0.1rem',
            transition: 'color 0.2s',
          }}
        >
          ia.jornadas.hya@gmail.com
        </a>
      </div>
    </section>
  )
}
