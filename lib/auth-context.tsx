// lib/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

type Usuario = {
  email: string
  nombre: string
  rol: 'organizador'
}

type AuthContextType = {
  user: User | null
  usuario: Usuario | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  usuario: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('firebaseUser:', firebaseUser?.email)
    setUser(firebaseUser)

    if (firebaseUser?.email) {
      const ref  = doc(db, 'usuarios', firebaseUser.email)
      const snap = await getDoc(ref)
      console.log('snap exists:', snap.exists())
      console.log('snap data:', snap.data())

      if (snap.exists()) {
        setUsuario(snap.data() as Usuario)
      } else {
        setUsuario(null)
      }
    } else {
      setUsuario(null)
    }

    setLoading(false)
  })

  return () => unsub()
}, [])

  return (
    <AuthContext.Provider value={{ user, usuario, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
