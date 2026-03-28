// lib/services/invitados.ts
// Operaciones sobre la colección 'invitados' en Firestore.
// Los componentes no llaman a Firestore directamente — usan estas funciones.

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import type { Invitado } from '@/types'

type DatosInvitado = Omit<Invitado, 'id'>

export async function agregarInvitado(datos: DatosInvitado) {
  return addDoc(collection(db, 'invitados'), { ...datos, creado: serverTimestamp() })
}

export async function actualizarInvitado(id: string, datos: DatosInvitado) {
  return updateDoc(doc(db, 'invitados', id), { ...datos })
}

export async function eliminarInvitado(id: string) {
  return deleteDoc(doc(db, 'invitados', id))
}
