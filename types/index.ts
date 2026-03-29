// types/index.ts
import type { TIPOS_PROPUESTA, TIPOS_ACTIVIDAD, PERTENENCIAS, ESTADOS_PROPUESTA } from '@/congreso.config'

export type Invitado = {
  id: string
  nombre: string
  rol: string
  institucion: string
  bio: string
  foto: string
  confirmado: boolean
  email?: string
}

export type Eje = {
  num: string
  titulo: string
  descripcion: string
}

export type Noticia = {
  id?: string
  fecha: string
  titulo: string
  resumen: string
  enlace?: string
}

export type Usuario = {
  email: string
  nombre: string
  rol: 'organizador'
}

// ─── Participante ────────────────────────────────────────────
// Objeto embebido dentro de Propuesta. No tiene colección propia.

export type Participante = {
  nombre:      string
  institucion: string
  email:       string
  documento:  string   // DNI / Pasaporte
  pertenencia: typeof PERTENENCIAS[number]['valor']
}

// ─── Propuesta ───────────────────────────────────────────────
// Lo que envía un participante. Se evalúa individualmente.

export type Propuesta = {
  id:           string
  tipo:         typeof TIPOS_PROPUESTA[number]['valor']
  titulo:       string
  resumen:      string          // máx 400 palabras
  eje:          string          // '01' … '08'
  autor:        Participante
  coautores?:   Participante[]
  estado:       typeof ESTADOS_PROPUESTA[number]['valor']
  actividadId?: string          // se asigna al armar el programa
  embeddings?:  number[]        // para uso futuro (similitud semántica)
}

// ─── Actividad ───────────────────────────────────────────────
// Lo que aparece en el programa. Puede o no venir de propuestas.

export type TipoActividad  = typeof TIPOS_ACTIVIDAD[number]['valor']
export type TipoPropuesta  = typeof TIPOS_PROPUESTA[number]['valor']
export type Pertenencia    = typeof PERTENENCIAS[number]['valor']
export type EstadoPropuesta = typeof ESTADOS_PROPUESTA[number]['valor']

export type Actividad = {
  id:            string
  tipo:          TipoActividad
  titulo:        string
  resumen?:      string

  // Scheduling
  fecha?:        string          // 'YYYY-MM-DD'
  horaInicio?:   string          // 'HH:MM'
  horaFin?:      string
  sala?:         string

  // Mesa / Pósters → agrupan propuestas aceptadas
  propuestasIds?: string[]

  // Keynote → referencia a Invitado existente
  invitadoId?:   string

  // Panel → participantes propios o invitados registrados
  participantes?: Participante[]
  invitadosIds?:  string[]
  moderador?:     string

  // Otro (taller, presentación de libro, etc.)
  descripcion?:  string
}
