// components/admin/AdminInvitados.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Invitado = {
  id?: string
  nombre: string
  rol: string
  institucion: string
  bio: string
  foto: string
  titulo: string
  fecha: string
  hora: string
  lugar: string
}

const EMPTY: Invitado = {
  nombre: '', rol: '', institucion: '', bio: '',
  foto: '/speakers/', titulo: '', fecha: '', hora: '', lugar: ''
}

export default function AdminInvitados() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [form, setForm]           = useState<Invitado>(EMPTY)
  const [editing, setEditing]     = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [msg, setMsg]             = useState<string | null>(null)

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'invitados'), snap => {
      setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitado)))
    })
    return () => unsub()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      if (editing) {
        await updateDoc(doc(db, 'invitados', editing), { ...form })
        setMsg('Invitado actualizado.')
      } else {
        await addDoc(collection(db, 'invitados'), { ...form, creado: serverTimestamp() })
        setMsg('Invitado agregado.')
      }
      setForm(EMPTY)
      setEditing(null)
    } catch (e) {
      setMsg('Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (inv: Invitado) => {
    setForm(inv)
    setEditing(inv.id!)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este invitado?')) return
    await deleteDoc(doc(db, 'invitados', id))
    setMsg('Invitado eliminado.')
  }

  const handleCancel = () => {
    setForm(EMPTY)
    setEditing(null)
    setMsg(null)
  }

  const fields: { name: keyof Invitado; label: string; type?: string }[] = [
    { name: 'nombre',     label: 'Nombre' },
    { name: 'rol',        label: 'Rol / Cargo' },
    { name: 'institucion',label: 'Institución' },
    { name: 'titulo',     label: 'Título de la conferencia' },
    { name: 'fecha',      label: 'Fecha' },
    { name: 'hora',       label: 'Hora' },
    { name: 'lugar',      label: 'Lugar' },
    { name: 'foto',       label: 'URL de foto' },
  ]

  return (
    <div className="admin-module">
      <h2 className="admin-module__title">
        {editing ? 'Editar invitado' : 'Agregar invitado'}
      </h2>

      {/* Formulario */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">
          {fields.map(f => (
            <div key={f.name} className="admin-form__field">
              <label className="admin-form__label">{f.label}</label>
              <input
                className="admin-form__input"
                name={f.name}
                value={form[f.name] as string}
                onChange={handleChange}
                required={['nombre','rol','institucion'].includes(f.name)}
              />
            </div>
          ))}
        </div>

        {/* Bio — textarea separado */}
        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Biografía</label>
          <textarea
            className="admin-form__textarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
          />
        </div>

        {msg && <p className="admin-form__msg">{msg}</p>}

        <div className="admin-form__actions">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
          </button>
          {editing && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista */}
      <h2 className="admin-module__title" style={{ marginTop: '3rem' }}>
        Invitados cargados ({invitados.length})
      </h2>

      <div className="admin-list">
        {invitados.length === 0 && (
          <p className="admin-list__empty">No hay invitados cargados todavía.</p>
        )}
        {invitados.map(inv => (
          <div key={inv.id} className="admin-list__item">
            <div className="admin-list__item-info">
              <p className="admin-list__item-name">{inv.nombre}</p>
              <p className="admin-list__item-sub">{inv.rol} · {inv.institucion}</p>
              <p className="admin-list__item-sub">{inv.fecha} {inv.hora} · {inv.lugar}</p>
            </div>
            <div className="admin-list__item-actions">
              <button
                className="admin-btn admin-btn--small"
                onClick={() => handleEdit(inv)}
              >
                Editar
              </button>
              <button
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => handleDelete(inv.id!)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
