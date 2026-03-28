// lib/services/noticias.ts

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Noticia } from '@/types'

type DatosNoticia = Omit<Noticia, 'id'>

export async function agregarNoticia(datos: DatosNoticia) {
  return addDoc(collection(db, 'noticias'), { ...datos, creado: serverTimestamp() })
}

export async function actualizarNoticia(id: string, datos: DatosNoticia) {
  return updateDoc(doc(db, 'noticias', id), { ...datos })
}

export async function eliminarNoticia(id: string) {
  return deleteDoc(doc(db, 'noticias', id))
}
