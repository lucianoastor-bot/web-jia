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
  mostrarEnPagina?:    boolean   // aparece en /invitados
  mostrarEnCarrusel?:  boolean   // aparece en el carrusel de inicio
  linkedin?:  string
  instagram?: string
  web?:       string
  academia?:  string
  facebook?:  string
  youtube?:   string
  // Acreditación — se guardan directamente en el documento del invitado
  acreditado?: boolean
  documento?:  string
  cuil?:       string
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
  nuevaPestania?: boolean
}

export type Usuario = {
  email: string
  nombre: string
  rol: 'organizador' | 'acreditacion'
}

// ─── Acreditacion ────────────────────────────────────────────
// Documento por persona (clave: email normalizado) en la
// colección 'acreditaciones'. Registra pago y acreditación.

export type Acreditacion = {
  nombreClave:  string   // clave(p.nombre) — identificador único, ID del doc en Firestore
  email?:       string   // referencia, no es la clave del documento
  acreditado:   boolean
  pago:         boolean
  pertenencia?: string   // override del valor en la propuesta
}

// ─── Participante ────────────────────────────────────────────
// Objeto embebido dentro de Propuesta. Incluye datos personales completos.

export type Participante = {
  nombre:          string
  institucion:     string
  email:           string
  documento:       string   // DNI / Pasaporte
  cuil?:           string   // CUIL (se carga en el mostrador si falta)
  celularCodigo:   string   // ej: '+54'
  celular:         string   // número sin código de país
  pertenencia:     typeof PERTENENCIAS[number]['valor']
  tituloPonencia?: string   // panel: título de la ponencia individual
  pago?:           boolean  // realizó el pago de inscripción
  acreditado?:     boolean  // recibió la acreditación en el evento
  requierePago?:   boolean  // se le enviará la boleta de pago
}

// ─── ParticipantePanel ───────────────────────────────────────
// Participante dentro de una actividad tipo panel.
// Sin datos personales sensibles — solo lo necesario para el programa.

export type ParticipantePanel = {
  nombre:          string
  institucion?:    string
  tituloPonencia?: string
  invitadoId?:     string   // link a Invitado (para bio/foto en difusión)
  rol?:            string   // etiqueta de rol para actividades tipo 'otro' (ej: "Panelista", "Disertante")
}

// ─── Propuesta ───────────────────────────────────────────────
// Lo que envía un participante. Se evalúa individualmente.

export type Propuesta = {
  id:              string
  tipo:            typeof TIPOS_PROPUESTA[number]['valor']
  titulo:          string
  resumen:         string          // máx 400 palabras
  eje:             string          // '01' … '08'
  autor:           Participante
  coautores?:      Participante[]
  estado:          typeof ESTADOS_PROPUESTA[number]['valor']
  evaluador?:      string
  resumenLink?:    string          // URL al documento del resumen
  actividadId?:    string          // se asigna al armar el programa
  orden?:          number          // posición dentro de la actividad
  embeddings?:     number[]        // para uso futuro (similitud semántica)
  participantes?:  Participante[]  // panel: integrantes adicionales al coordinador
  descriptor?:     string          // otro: etiqueta corta
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

  // Conferencia / Mesa — quien modera
  moderador?:    string

  // Panel — quien coordina (también es participante)
  coordinador?:  string
  participantes?: ParticipantePanel[]

  // Conferencia — invitado único
  invitadoId?:   string

  // Otro
  descriptor?:   string
  descripcion?:  string

  // Visibilidad pública
  mostrar?:      boolean   // false → oculta en /programa (default: true)
}
