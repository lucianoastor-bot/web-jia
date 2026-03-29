// lib/services/actividades.ts
// Operaciones sobre la colección 'actividades' en Firestore.

import {
  collection, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, doc, arrayUnion, arrayRemove,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Actividad, TipoActividad } from '@/types'

// Actividad individual (conferencia, otro) — un solo invitado
export async function obtenerActividadDeInvitado(invitadoId: string): Promise<Actividad | null> {
  const q = query(collection(db, 'actividades'), where('invitadoId', '==', invitadoId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Actividad
}

// Guardar actividad individual (conferencia, otro, mesa, pósters)
export async function guardarActividad(
  invitadoId: string,
  datos: Omit<Actividad, 'id' | 'propuestasIds' | 'invitadosIds'>,
  actividadId?: string,
) {
  if (actividadId) {
    return updateDoc(doc(db, 'actividades', actividadId), { ...datos })
  }
  return addDoc(collection(db, 'actividades'), { invitadoId, ...datos })
}

// Paneles — múltiples invitados
export async function obtenerPaneles(): Promise<Actividad[]> {
  const q = query(collection(db, 'actividades'), where('tipo', '==', 'panel'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Actividad))
}

export async function crearPanel(
  datos: Omit<Actividad, 'id' | 'invitadoId' | 'propuestasIds'>,
  primerInvitadoId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'actividades'), {
    ...datos,
    tipo: 'panel',
    invitadosIds: [primerInvitadoId],
  })
  return ref.id
}

export async function agregarInvitadoAPanel(panelId: string, invitadoId: string) {
  return updateDoc(doc(db, 'actividades', panelId), {
    invitadosIds: arrayUnion(invitadoId),
  })
}

export async function quitarInvitadoDePanel(panelId: string, invitadoId: string) {
  return updateDoc(doc(db, 'actividades', panelId), {
    invitadosIds: arrayRemove(invitadoId),
  })
}

export async function actualizarPanel(
  panelId: string,
  datos: Omit<Actividad, 'id' | 'tipo' | 'invitadoId' | 'propuestasIds' | 'invitadosIds'>,
) {
  return updateDoc(doc(db, 'actividades', panelId), { ...datos })
}

// Todas las actividades
export async function obtenerActividades(): Promise<Actividad[]> {
  const snap = await getDocs(collection(db, 'actividades'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Actividad))
}

// Crear / actualizar actividad genérica (sin invitadoId)
export async function crearActividad(datos: Omit<Actividad, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'actividades'), { ...datos })
  return ref.id
}

export async function actualizarActividad(id: string, datos: Partial<Omit<Actividad, 'id'>>) {
  return updateDoc(doc(db, 'actividades', id), { ...datos })
}

export async function eliminarActividad(id: string) {
  return deleteDoc(doc(db, 'actividades', id))
}
