// components/admin/AdminBienvenida.tsx
'use client'

import { useAuth } from '@/lib/auth-context'

const ROL_DESCRIPCION: Record<string, string> = {
  organizador: 'cargar y gestionar invitados, participantes, paneles y propuestas, aprobar resúmenes recibidos, establecer restricciones para la distribución de mesas y ejecutar la distribución automática con IA o de forma manual',
}

export default function AdminBienvenida() {
  const { usuario } = useAuth()

  if (!usuario) return null
  
  return (
    <div className="admin-bienvenida">
      <h2 className="admin-bienvenida__titulo">
        Bienvenido/a, {usuario.nombre}
      </h2>
      <p className="admin-bienvenida__texto">
        Como <strong>{usuario.rol}</strong> podrás{' '}
        {ROL_DESCRIPCION[usuario.rol] ?? 'acceder a las funciones del panel'}.
      </p>
    </div>
  )
}
