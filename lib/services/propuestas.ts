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

// ── Actualización de datos de participante ───────────────────
// Busca a una persona (por nombre normalizado) dentro de la propuesta
// y actualiza sus campos en autor, coautores[] y participantes[].

type DatosParticipanteUpdate = {
  pertenencia?: string
  pago?:        boolean
  acreditado?:  boolean
}

const nc = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ')

export async function actualizarParticipanteEnPropuesta(
  propuesta: Propuesta,
  nombreClave: string,
  datos: DatosParticipanteUpdate,
) {
  const updates: Record<string, unknown> = {}

  // Autor — actualización campo a campo con notación de punto
  if (nc(propuesta.autor.nombre) === nombreClave) {
    for (const [k, v] of Object.entries(datos)) {
      if (v !== undefined) updates[`autor.${k}`] = v
    }
  }

  // Coautores — hay que reemplazar el array completo
  if (propuesta.coautores?.some(c => nc(c.nombre) === nombreClave)) {
    updates['coautores'] = propuesta.coautores!.map(c =>
      nc(c.nombre) === nombreClave ? { ...c, ...datos } : c
    )
  }

  // Participantes de panel
  if (propuesta.participantes?.some(pa => nc(pa.nombre) === nombreClave)) {
    updates['participantes'] = propuesta.participantes!.map(pa =>
      nc(pa.nombre) === nombreClave ? { ...pa, ...datos } : pa
    )
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'propuestas', propuesta.id), updates)
  }
}

// ── Vinculación con Actividad ─────────────────────────────────

export async function asignarPropuesta(propuestaId: string, actividadId: string) {
  return updateDoc(doc(db, 'propuestas', propuestaId), { actividadId })
}

export async function desasignarPropuesta(propuestaId: string) {
  return updateDoc(doc(db, 'propuestas', propuestaId), { actividadId: deleteField() })
}
