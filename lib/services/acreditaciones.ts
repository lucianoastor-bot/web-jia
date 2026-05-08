// lib/services/acreditaciones.ts
// Operaciones sobre la colección 'acreditaciones' en Firestore.
// Cada documento representa a una persona identificada por email.

import {
  collection, doc, getDoc, setDoc, updateDoc, getDocs,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Acreditacion } from '@/types'

// ID de documento: email en minúsculas, caracteres especiales → '_'
export const emailToId = (email: string) =>
  email.toLowerCase().replace(/[^a-z0-9]/g, '_')

export async function obtenerAcreditaciones(): Promise<Acreditacion[]> {
  const snap = await getDocs(collection(db, 'acreditaciones'))
  return snap.docs.map(d => d.data() as Acreditacion)
}

export async function upsertAcreditacion(
  email: string,
  datos: Partial<Omit<Acreditacion, 'email'>>,
) {
  const id  = emailToId(email)
  const ref = doc(db, 'acreditaciones', id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, datos)
  } else {
    await setDoc(ref, {
      email:       email.toLowerCase(),
      acreditado:  false,
      pago:        false,
      ...datos,
    })
  }
}
