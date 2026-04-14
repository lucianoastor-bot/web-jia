// components/admin/AdminNovedades.tsx
'use client'

import { useState } from 'react'
import { useNoticias } from '@/lib/hooks/useNoticias'
import { agregarNoticia, actualizarNoticia, eliminarNoticia } from '@/lib/services/noticias'
import type { Noticia } from '@/types'

type DatosNoticia = Omit<Noticia, 'id'>

const VACIO: DatosNoticia = {
  titulo: '',
  resumen: '',
  fecha: '',
  enlace: '',
  nuevaPestania: false,
}

export default function AdminNovedades() {
  const { noticias, cargar } = useNoticias()
  const [form, setForm]         = useState<DatosNoticia>(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(f => ({ ...f, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      if (editando) {
        await actualizarNoticia(editando, form)
        setMensaje('Novedad actualizada.')
      } else {
        await agregarNoticia(form)
        setMensaje('Novedad agregada.')
      }
      setForm(VACIO)
      setEditando(null)
      await cargar()
    } catch {
      setMensaje('Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = (n: Noticia) => {
    const { id, ...datos } = n
    setForm({ ...VACIO, ...datos })
    setEditando(id!)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta novedad?')) return
    await eliminarNoticia(id)
    setMensaje('Novedad eliminada.')
    await cargar()
  }

  const handleCancelar = () => {
    setForm(VACIO)
    setEditando(null)
    setMensaje(null)
  }

  return (
    <div className="admin-module">
      <h2 className="admin-module__title">
        {editando ? 'Editar novedad' : 'Agregar novedad'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">

          <div className="admin-form__field">
            <label className="admin-form__label">Título</label>
            <input
              className="admin-form__input"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Fecha</label>
            <input
              className="admin-form__input"
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Enlace (opcional)</label>
            <input
              className="admin-form__input"
              name="enlace"
              value={form.enlace ?? ''}
              onChange={handleChange}
              placeholder="/propuestas o https://..."
            />
          </div>

          <div className="admin-form__field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="nuevaPestania"
              name="nuevaPestania"
              checked={!!form.nuevaPestania}
              onChange={handleChange}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="nuevaPestania" className="admin-form__label" style={{ marginBottom: 0, cursor: 'pointer' }}>
              Abrir en nueva pestaña
            </label>
          </div>

        </div>

        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Resumen</label>
          <textarea
            className="admin-form__textarea"
            name="resumen"
            value={form.resumen}
            onChange={handleChange}
            rows={3}
            required
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
        Novedades cargadas ({noticias.filter(n => n.id).length})
      </h2>

      <div className="admin-list">
        {noticias.filter(n => n.id).length === 0 && (
          <p className="admin-list__empty">No hay novedades cargadas todavía.</p>
        )}
        {noticias.filter(n => n.id).map(n => (
          <div key={n.id} className="admin-list__item">
            <div className="admin-list__item-info">
              <p className="admin-list__item-name">{n.titulo}</p>
              <p className="admin-list__item-sub">{n.fecha}{n.enlace ? ` · ${n.enlace}` : ''}</p>
            </div>
            <div className="admin-list__item-actions">
              <button
                className="admin-btn admin-btn--small"
                onClick={() => handleEditar(n)}
              >
                Editar
              </button>
              <button
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => handleEliminar(n.id!)}
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
