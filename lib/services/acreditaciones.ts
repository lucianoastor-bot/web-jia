// lib/services/acreditaciones.ts
// Operaciones sobre la colección 'acreditaciones' en Firestore.
// Cada documento representa a una persona identificada por email.

import {
  collection, doc, getDoc, setDoc, updateDoc, getDocs,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Acreditacion } from '@/types'

// ID de documento: clave(p.nombre) — igual al key del Map en AdminParticipantes.
// Usar el nombre evita el problema de participantes sin email.
export const nombreToId = (nombreClave: string) =>
  nombreClave.replace(/[^a-z0-9]/g, '_')

export async function obtenerAcreditaciones(): Promise<Acreditacion[]> {
  const snap = await getDocs(collection(db, 'acreditaciones'))
  return snap.docs.map(d => d.data() as Acreditacion)
}

export async function upsertAcreditacion(
  nombreClave: string,
  datos: Partial<Omit<Acreditacion, 'nombreClave'>>,
) {
  const id   = nombreToId(nombreClave)
  const ref  = doc(db, 'acreditaciones', id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, datos)
  } else {
    await setDoc(ref, {
      nombreClave,
      acreditado: false,
      pago:       false,
      ...datos,
    })
  }
}
