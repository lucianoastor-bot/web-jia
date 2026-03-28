// components/admin/AdminInvitados.tsx
'use client'

import { useState } from 'react'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { agregarInvitado, actualizarInvitado, eliminarInvitado } from '@/lib/services/invitados'
import type { Invitado } from '@/types'

type DatosInvitado = Omit<Invitado, 'id'>

const VACIO: DatosInvitado = {
  nombre: '', rol: '', institucion: '', bio: '',
  foto: '/invitados/', confirmado: false, email: '', titulo: '', fecha: '', hora: '', lugar: '',
}

const campos: { nombre: keyof DatosInvitado; etiqueta: string; tipo?: string }[] = [
  { nombre: 'nombre',      etiqueta: 'Nombre' },
  { nombre: 'rol',         etiqueta: 'Rol / Cargo' },
  { nombre: 'institucion', etiqueta: 'Institución' },
  { nombre: 'email',       etiqueta: 'Email' },
  { nombre: 'titulo',      etiqueta: 'Título de la conferencia' },
  { nombre: 'fecha',       etiqueta: 'Fecha',  tipo: 'date' },
  { nombre: 'hora',        etiqueta: 'Hora',   tipo: 'time' },
  { nombre: 'lugar',       etiqueta: 'Lugar' },
  { nombre: 'foto',        etiqueta: 'Ruta de foto' },
]

export default function AdminInvitados() {
  const { invitados } = useInvitados()
  const [form, setForm]         = useState<DatosInvitado>(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleConfirmado = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, confirmado: e.target.checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      if (editando) {
        await actualizarInvitado(editando, form)
        setMensaje('Invitado actualizado.')
      } else {
        await agregarInvitado(form)
        setMensaje('Invitado agregado.')
      }
      setForm(VACIO)
      setEditando(null)
    } catch {
      setMensaje('Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = (inv: Invitado) => {
    const { id, ...datos } = inv
    setForm({ ...VACIO, ...datos })
    setEditando(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este invitado?')) return
    await eliminarInvitado(id)
    setMensaje('Invitado eliminado.')
  }

  const handleCancelar = () => {
    setForm(VACIO)
    setEditando(null)
    setMensaje(null)
  }

  return (
    <div className="admin-module">
      <h2 className="admin-module__title">
        {editando ? 'Editar invitado' : 'Agregar invitado'}
      </h2>

      {/* Formulario */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">
          {campos.map(c => (
            <div key={c.nombre} className="admin-form__field">
              <label className="admin-form__label">{c.etiqueta}</label>
              <input
                className="admin-form__input"
                type={c.tipo ?? 'text'}
                name={c.nombre}
                value={(form[c.nombre] as string) ?? ''}
                onChange={handleChange}
                required={['nombre', 'rol', 'institucion'].includes(c.nombre)}
              />
            </div>
          ))}
        </div>

        {/* Confirmado */}
        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              name="confirmado"
              checked={form.confirmado}
              onChange={handleConfirmado}
            />
            Participación confirmada
          </label>
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

        {mensaje && <p className="admin-form__msg">{mensaje}</p>}

        <div className="admin-form__actions">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar'}
          </button>
          {editando && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={handleCancelar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista */}
      <h2 className="admin-module__title" style={{ marginTop: '3rem' }}>
        Invitados cargados ({invitados.length}) · confirmados ({invitados.filter(i => i.confirmado).length})
      </h2>

      <div className="admin-list">
        {invitados.length === 0 && (
          <p className="admin-list__empty">No hay invitados cargados todavía.</p>
        )}
        {invitados.map(inv => (
          <div key={inv.id} className="admin-list__item">
            <div className="admin-list__item-info">
              <p className="admin-list__item-name">
                {inv.nombre}
                <span className={`admin-badge ${inv.confirmado ? 'admin-badge--ok' : 'admin-badge--pending'}`}>
                  {inv.confirmado ? 'confirmado' : 'a confirmar'}
                </span>
              </p>
              <p className="admin-list__item-sub">{inv.rol} · {inv.institucion}</p>
              {(inv.fecha || inv.hora || inv.lugar) && (
                <p className="admin-list__item-sub">{inv.fecha} {inv.hora} · {inv.lugar}</p>
              )}
            </div>
            <div className="admin-list__item-actions">
              <button
                className="admin-btn admin-btn--small"
                onClick={() => handleEditar(inv)}
              >
                Editar
              </button>
              <button
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => handleEliminar(inv.id)}
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
