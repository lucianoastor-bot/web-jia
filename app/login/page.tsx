// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'

export default function Login() {
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router                = useRouter()
  const { user, usuario, loading: authLoading } = useAuth()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && usuario) {
      router.push('/admin')
    }
  }, [usuario, authLoading, router])

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError('Error al iniciar sesión. Intentá de nuevo.')
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <main className="page">
      <div className="login">
        <div className="login__card">
          <h1 className="login__title">Panel de organización</h1>
          <p className="login__sub">Jornadas: La IA en Debate · FHyA · UNR 2026</p>

          <button
            className="login__btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Ingresar con Google'}
          </button>

          {error && <p className="login__error">{error}</p>}
        </div>
      </div>
    </main>
  )
}