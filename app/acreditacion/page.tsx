// app/acreditacion/page.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Acreditacion from '@/components/Acreditacion'

export default function AcreditacionPage() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !usuario)) router.push('/login')
  }, [user, usuario, loading, router])

  if (loading)   return <div className="admin-loading">Cargando...</div>
  if (!usuario)  return null

  return <Acreditacion />
}
