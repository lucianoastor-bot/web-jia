// app/acreditacion/page.tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'

export default function Acreditacion() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !usuario)) {
      router.replace('/login')
    }
  }, [user, usuario, loading, router])

  if (loading) return <div className="admin-loading">Cargando...</div>
  if (!usuario)  return null

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  return (
    <div className="admin">

      {/* Sidebar */}
      <aside className="admin__sidebar">
        <div className="admin__sidebar-header">
          <p className="admin__sidebar-title">Acreditación</p>
          <p className="admin__sidebar-user">{usuario.nombre}</p>
          <p className="admin__sidebar-rol">{usuario.rol}</p>
        </div>

        <nav className="admin__nav">
          {/* futuras secciones de acreditación */}
        </nav>

        {usuario.rol === 'organizador' && (
          <Link href="/admin" className="admin__nav-item" style={{ textDecoration: 'none', opacity: 0.7 }}>
            ← Panel admin
          </Link>
        )}

        <button className="admin__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <main className="admin__content">
        <div className="admin__content-inner">
          <div className="admin-module">
            <h2 className="admin-module__title">Acreditación</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Módulo en construcción.
            </p>
          </div>
        </div>
      </main>

    </div>
  )
}
