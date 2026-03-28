// types/index.ts

export type Invitado = {
  id: string
  nombre: string
  rol: string
  institucion: string
  bio: string
  foto: string
  email?: string
  titulo?: string
  fecha?: string
  hora?: string
  lugar?: string
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
