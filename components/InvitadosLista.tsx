'use client'

import Image from 'next/image'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { validarFoto } from '@/lib/utils/formato'

export default function InvitadosLista() {
  const { invitados: todos, loading } = useInvitados()
  const invitados = todos.filter(inv => inv.confirmado)

  if (loading) return (
    <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
  )

  return (
    <div className="invitados-pagina__grilla" id="conferencias">
      {invitados.map((inv) => (
            <article key={inv.id} className="invitado-completo">

              <div className="invitado-completo__foto-wrap">
                <Image
                  className="invitado-completo__foto"
                  src={validarFoto(inv.foto)}
                  alt={inv.nombre}
                  width={300}
                  height={300}
                />
              </div>

              <div className="invitado-completo__contenido">
                <div className="invitado-completo__encabezado">
                  <h2 className="invitado-completo__nombre">{inv.nombre}</h2>
                  <p className="invitado-completo__rol">{inv.rol}</p>
                  <p className="invitado-completo__institucion">{inv.institucion}</p>
                </div>
                <p className="invitado-completo__bio">{inv.bio}</p>
              </div>

            </article>
          ))}
    </div>
  )
}
