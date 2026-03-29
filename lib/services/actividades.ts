// lib/services/actividades.ts
// Operaciones sobre la colección 'actividades' en Firestore.

import {
  collection, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, doc, deleteField,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Actividad, ParticipantePanel } from '@/types'

// Actividad individual ligada a un invitado (conferencia creada desde AdminInvitados)
export async function obtenerActividadDeInvitado(invitadoId: string): Promise<Actividad | null> {
  const q = query(collection(db, 'actividades'), where('invitadoId', '==', invitadoId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Actividad
}

// Guardar actividad desde AdminInvitados (crea o actualiza)
export async function guardarActividad(
  invitadoId: string,
  datos: Omit<Actividad, 'id' | 'invitadoId'>,
  actividadId?: string,
) {
  if (actividadId) {
    return updateDoc(doc(db, 'actividades', actividadId), { ...datos })
  }
  return addDoc(collection(db, 'actividades'), { invitadoId, ...datos })
}

// Actividades existentes filtradas por tipo (para selectores en AdminInvitados)
export async function obtenerActividadesPorTipo(tipo: string): Promise<Actividad[]> {
  const q = query(collection(db, 'actividades'), where('tipo', '==', tipo))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Actividad))
}

// Alias para compatibilidad con código existente
export const obtenerPaneles = () => obtenerActividadesPorTipo('panel')

// Todas las actividades
export async function obtenerActividades(): Promise<Actividad[]> {
  const snap = await getDocs(collection(db, 'actividades'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Actividad))
}

// Crear / actualizar actividad genérica
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

// ── Participantes de panel ────────────────────────────────────

export async function actualizarParticipantesPanel(
  panelId: string,
  participantes: ParticipantePanel[],
) {
  return updateDoc(doc(db, 'actividades', panelId), { participantes })
}

// ── Vinculación invitado ↔ conferencia ────────────────────────

export async function asignarInvitado(actividadId: string, invitadoId: string) {
  return updateDoc(doc(db, 'actividades', actividadId), { invitadoId })
}

export async function desasignarInvitado(actividadId: string) {
  return updateDoc(doc(db, 'actividades', actividadId), { invitadoId: deleteField() })
}
