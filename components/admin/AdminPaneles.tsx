// components/admin/AdminPaneles.tsx
'use client'

import { useState } from 'react'
import { usePaneles } from '@/lib/hooks/usePaneles'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { crearActividad, actualizarActividad, eliminarActividad, quitarInvitadoDePanel } from '@/lib/services/actividades'
import type { Actividad } from '@/types'

type DatosPanel = {
  titulo:      string
  resumen:     string
  fecha:       string
  horaInicio:  string
  horaFin:     string
  sala:        string
  moderador:   string
}

const VACIO: DatosPanel = {
  titulo: '', resumen: '', fecha: '',
  horaInicio: '', horaFin: '', sala: '', moderador: '',
}

const campos: { nombre: keyof DatosPanel; etiqueta: string; tipo?: string }[] = [
  { nombre: 'titulo',     etiqueta: 'Título del panel' },
  { nombre: 'fecha',      etiqueta: 'Fecha',       tipo: 'date' },
  { nombre: 'horaInicio', etiqueta: 'Hora inicio',  tipo: 'time' },
  { nombre: 'horaFin',    etiqueta: 'Hora fin',     tipo: 'time' },
  { nombre: 'sala',       etiqueta: 'Sala / Lugar' },
  { nombre: 'moderador',  etiqueta: 'Moderador' },
]

export default function AdminPaneles() {
  const { paneles, cargar }     = usePaneles()
  const { invitados }           = useInvitados()

  const [form, setForm]         = useState<DatosPanel>(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [panelActual, setPanelActual] = useState<Actividad | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      if (editando) {
        await actualizarActividad(editando, form)
        setMensaje('Panel actualizado.')
      } else {
        await crearActividad({ tipo: 'panel', invitadosIds: [], ...form })
        setMensaje('Panel creado.')
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

  const handleEditar = (panel: Actividad) => {
    setForm({
      titulo:     panel.titulo     ?? '',
      resumen:    panel.resumen    ?? '',
      fecha:      panel.fecha      ?? '',
      horaInicio: panel.horaInicio ?? '',
      horaFin:    panel.horaFin    ?? '',
      sala:       panel.sala       ?? '',
      moderador:  panel.moderador  ?? '',
    })
    setEditando(panel.id)
    setPanelActual(panel)
    setMensaje(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuitarInvitado = async (invitadoId: string) => {
    if (!editando || !panelActual) return
    await quitarInvitadoDePanel(editando, invitadoId)
    setPanelActual(p => p ? {
      ...p,
      invitadosIds: (p.invitadosIds ?? []).filter(id => id !== invitadoId),
    } : null)
    await cargar()
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este panel?')) return
    await eliminarActividad(id)
    setMensaje('Panel eliminado.')
    await cargar()
  }

  const handleCancelar = () => {
    setForm(VACIO)
    setEditando(null)
    setPanelActual(null)
    setMensaje(null)
  }

  return (
    <div className="admin-module">

      <h2 className="admin-module__title">
        {editando ? 'Editar panel' : 'Crear panel'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">
          {campos.map(c => (
            <div key={c.nombre} className="admin-form__field">
              <label className="admin-form__label">{c.etiqueta}</label>
              <input
                className="admin-form__input"
                type={c.tipo ?? 'text'}
                name={c.nombre}
                value={form[c.nombre]}
                onChange={handleChange}
                required={c.nombre === 'titulo'}
              />
            </div>
          ))}
        </div>

        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Descripción / resumen</label>
          <textarea
            className="admin-form__textarea"
            name="resumen"
            value={form.resumen}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {mensaje && <p className="admin-form__msg">{mensaje}</p>}

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={cargando}>
            {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear panel'}
          </button>
          {editando && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={handleCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Participantes del panel */}
      {editando && panelActual && (
        <>
          <h2 className="admin-module__title" style={{ marginTop: '2.5rem' }}>
            Participantes ({panelActual.invitadosIds?.length ?? 0})
          </h2>
          <div className="admin-list">
            {(panelActual.invitadosIds ?? []).length === 0 && (
              <p className="admin-list__empty">Sin participantes asignados.</p>
            )}
            {(panelActual.invitadosIds ?? []).map(id => {
              const inv = invitados.find(i => i.id === id)
              return (
                <div key={id} className="admin-list__item">
                  <div className="admin-list__item-info">
                    <p className="admin-list__item-name">
                      {inv ? inv.nombre : id}
                    </p>
                    {inv && (
                      <p className="admin-list__item-sub">{inv.rol} · {inv.institucion}</p>
                    )}
                  </div>
                  <div className="admin-list__item-actions">
                    <button
                      className="admin-btn admin-btn--small admin-btn--danger"
                      onClick={() => handleQuitarInvitado(id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Lista */}
      <h2 className="admin-module__title" style={{ marginTop: '3rem' }}>
        Paneles ({paneles.length})
      </h2>

      <div className="admin-list">
        {paneles.length === 0 && (
          <p className="admin-list__empty">No hay paneles creados todavía.</p>
        )}
        {paneles.map(panel => (
          <div key={panel.id} className="admin-list__item">
            <div className="admin-list__item-info">
              <p className="admin-list__item-name">{panel.titulo || '(sin título)'}</p>
              <p className="admin-list__item-sub">
                {[panel.fecha, panel.horaInicio && `${panel.horaInicio}–${panel.horaFin}`, panel.sala]
                  .filter(Boolean).join(' · ')}
              </p>
              <p className="admin-list__item-sub">
                {panel.moderador && `Moderador: ${panel.moderador} · `}
                {panel.invitadosIds?.length ?? 0} participante{(panel.invitadosIds?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="admin-list__item-actions">
              <button className="admin-btn admin-btn--small" onClick={() => handleEditar(panel)}>
                Editar
              </button>
              <button
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => handleEliminar(panel.id)}
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
