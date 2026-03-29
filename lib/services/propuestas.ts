// lib/services/propuestas.ts
// Operaciones sobre la colección 'propuestas' en Firestore.

import {
  collection, addDoc, updateDoc, deleteDoc,
  getDocs, doc, serverTimestamp, deleteField,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Propuesta, EstadoPropuesta } from '@/types'

type DatosPropuesta = Omit<Propuesta, 'id' | 'embeddings'>

export async function obtenerPropuestas(): Promise<Propuesta[]> {
  const snap = await getDocs(collection(db, 'propuestas'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Propuesta))
}

export async function agregarPropuesta(datos: DatosPropuesta): Promise<string> {
  // Firestore no acepta valores undefined — filtrar antes de guardar
  const limpio = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined))
  const ref = await addDoc(collection(db, 'propuestas'), {
    ...limpio,
    creado: serverTimestamp(),
  })
  return ref.id
}

export async function actualizarPropuesta(id: string, datos: Partial<DatosPropuesta>) {
  return updateDoc(doc(db, 'propuestas', id), { ...datos })
}

export async function actualizarEstado(id: string, estado: EstadoPropuesta) {
  return updateDoc(doc(db, 'propuestas', id), { estado })
}

export async function eliminarPropuesta(id: string) {
  return deleteDoc(doc(db, 'propuestas', id))
}

// ── Vinculación con Actividad ─────────────────────────────────

export async function asignarPropuesta(propuestaId: string, actividadId: string) {
  return updateDoc(doc(db, 'propuestas', propuestaId), { actividadId })
}

export async function desasignarPropuesta(propuestaId: string) {
  return updateDoc(doc(db, 'propuestas', propuestaId), { actividadId: deleteField() })
}
