// app/admin/page.tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// Módulos del panel
import AdminBienvenida from '@/components/admin/AdminBienvenida'
import AdminInvitados from '@/components/admin/AdminInvitados'
import AdminNovedades from '@/components/admin/AdminNovedades'
import AdminActividades from '@/components/admin/AdminActividades'
import AdminPropuestas from '@/components/admin/AdminPropuestas'
import AdminDistribucion from '@/components/admin/AdminDistribucion'
import AdminParticipantes from '@/components/admin/AdminParticipantes'
import Link from 'next/link'

const MENU = [
  { id: 'bienvenida',   label: 'Bienvenida' },
  { id: 'novedades',    label: 'Novedades' },
  { id: 'invitados',    label: 'Invitados' },
  { id: 'propuestas',   label: 'Propuestas' },
  { id: 'actividades',  label: 'Actividades' },
  // { id: 'embeddings',    label: 'Generar Embeddings' },  // pendiente
  // { id: 'distribuir-ia', label: 'Distribuir con IA' },   // pendiente
  { id: 'distribuir',     label: 'Distribución' },
  { id: 'participantes',  label: 'Participantes' },
]

export default function Admin() {
  const { user, usuario, loading } = useAuth()
  const router  = useRouter()
  const [active, setActive] = useState('bienvenida')

  useEffect(() => {
    if (!loading && (!user || !usuario)) {
      router.push('/login')
    } else if (!loading && usuario && usuario.rol !== 'organizador') {
      router.push('/acreditacion')
    }
  }, [user, usuario, loading, router])

  if (loading) return <div className="admin-loading">Cargando...</div>
  if (!usuario) return null

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const renderModule = () => {
    switch (active) {
      case 'bienvenida': return <AdminBienvenida />
      case 'invitados':  return <AdminInvitados />
      case 'novedades':  return <AdminNovedades />
      case 'propuestas':   return <AdminPropuestas />
      case 'actividades':  return <AdminActividades />
      case 'distribuir':    return <AdminDistribucion onAgregar={() => setActive('actividades')} />
      case 'participantes': return <AdminParticipantes />
      default:              return (
        <div className="admin-placeholder">
          <p>Módulo <strong>{active}</strong> — próximamente</p>
        </div>
      )
    }
  }

  return (
    <div className="admin">

      {/* Sidebar */}
      <aside className="admin__sidebar">
        <div className="admin__sidebar-header">
          <p className="admin__sidebar-title">Panel</p>
          <p className="admin__sidebar-user">{usuario.nombre}</p>
          <p className="admin__sidebar-rol">{usuario.rol}</p>
        </div>

        <nav className="admin__nav">
          {MENU.map(item => (
            <button
              key={item.id}
              className={`admin__nav-item ${active === item.id ? 'is-active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Link href="/acreditacion" className="admin__nav-item" style={{ textDecoration: 'none', opacity: 0.7 }}>
          Acreditación ↗
        </Link>

        <button className="admin__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <main className="admin__content">
        <div className="admin__content-inner">
          {renderModule()}
        </div>
      </main>

    </div>
  )
}
