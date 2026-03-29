// components/admin/AdminInvitados.tsx
'use client'

import { useState } from 'react'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { TIPOS_ACTIVIDAD } from '@/congreso.config'
import { agregarInvitado, actualizarInvitado, eliminarInvitado } from '@/lib/services/invitados'
import {
  obtenerActividadDeInvitado, guardarActividad,
  obtenerPaneles, crearPanel, agregarInvitadoAPanel, actualizarPanel,
} from '@/lib/services/actividades'
import type { Invitado, Actividad, TipoActividad } from '@/types'

type DatosInvitado = Omit<Invitado, 'id'>

type DatosActividad = {
  tipo:        TipoActividad
  titulo:      string
  resumen:     string
  fecha:       string
  horaInicio:  string
  horaFin:     string
  sala:        string
  moderador:   string
}

const VACIO_INVITADO: DatosInvitado = {
  nombre: '', rol: '', institucion: '', bio: '',
  foto: '/invitados/', confirmado: false, email: '',
  mostrarEnPagina: false, mostrarEnCarrusel: false,
}


const VACIO_ACTIVIDAD: DatosActividad = {
  tipo: 'conferencia', titulo: '', resumen: '',
  fecha: '', horaInicio: '', horaFin: '', sala: '', moderador: '',
}

const camposInvitado: { nombre: keyof DatosInvitado; etiqueta: string }[] = [
  { nombre: 'nombre',      etiqueta: 'Nombre' },
  { nombre: 'rol',         etiqueta: 'Rol / Cargo' },
  { nombre: 'institucion', etiqueta: 'Institución' },
  { nombre: 'email',       etiqueta: 'Email' },
  { nombre: 'foto',        etiqueta: 'Ruta de foto' },
]

const camposActividad: { nombre: keyof DatosActividad; etiqueta: string; tipo?: string }[] = [
  { nombre: 'titulo',     etiqueta: 'Título' },
  { nombre: 'fecha',      etiqueta: 'Fecha',       tipo: 'date' },
  { nombre: 'horaInicio', etiqueta: 'Hora inicio',  tipo: 'time' },
  { nombre: 'horaFin',    etiqueta: 'Hora fin',     tipo: 'time' },
  { nombre: 'sala',       etiqueta: 'Sala / Lugar' },
  { nombre: 'moderador',  etiqueta: 'Moderador' },
]

export default function AdminInvitados() {
  const { invitados, cargar } = useInvitados()

  const [form, setForm]         = useState<DatosInvitado>(VACIO_INVITADO)
  const [editando, setEditando] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)

  const [actividad, setActividad]     = useState<DatosActividad>(VACIO_ACTIVIDAD)
  const [actividadId, setActividadId] = useState<string | null>(null)
  const [cargandoK, setCargandoK]     = useState(false)
  const [mensajeK, setMensajeK]       = useState<string | null>(null)

  // Panel
  const [paneles, setPaneles]           = useState<Actividad[]>([])
  const [panelSeleccionado, setPanelSel] = useState<string>('nuevo')

  // ── Invitado ──────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.checked }))
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
        const ref = await agregarInvitado(form)
        setEditando(ref.id)
        setMensaje('Invitado guardado. Podés agregar los datos de la conferencia.')
      }
      await cargar()
    } catch {
      setMensaje('Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = async (inv: Invitado) => {
    const { id, ...datos } = inv
    setForm({ ...VACIO_INVITADO, ...datos })
    setEditando(id)
    setMensaje(null)
    setMensajeK(null)

    // Cargar actividad si existe
    const act = await obtenerActividadDeInvitado(id)
    if (act) {
      setActividad({
        tipo:       (act.tipo as TipoActividad) ?? 'conferencia',
        titulo:     act.titulo ?? '',
        resumen:    act.resumen ?? '',
        fecha:      act.fecha ?? '',
        horaInicio: act.horaInicio ?? '',
        horaFin:    act.horaFin ?? '',
        sala:       act.sala ?? '',
        moderador:  act.moderador ?? '',
      })
      setActividadId(act.id)
    } else {
      setActividad(VACIO_ACTIVIDAD)
      setActividadId(null)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este invitado?')) return
    await eliminarInvitado(id)
    setMensaje('Invitado eliminado.')
    handleCancelar()
    await cargar()
  }

  const handleCancelar = () => {
    setForm(VACIO_INVITADO)
    setEditando(null)
    setMensaje(null)
    setActividad(VACIO_ACTIVIDAD)
    setActividadId(null)
    setMensajeK(null)
    setPaneles([])
    setPanelSel('nuevo')
  }

  // ── Keynote ───────────────────────────────────────────────

  const handleChangeK = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setActividad(a => ({ ...a, [name]: value }))
    if (name === 'tipo' && value === 'panel') {
      const lista = await obtenerPaneles()
      setPaneles(lista)
      setPanelSel('nuevo')
    }
  }

  const handleSeleccionarPanel = (panelId: string) => {
    setPanelSel(panelId)
    if (panelId === 'nuevo') {
      setActividad(a => ({ ...VACIO_ACTIVIDAD, tipo: 'panel' }))
    } else {
      const panel = paneles.find(p => p.id === panelId)
      if (panel) {
        setActividad({
          tipo:       'panel',
          titulo:     panel.titulo ?? '',
          resumen:    panel.resumen ?? '',
          fecha:      panel.fecha ?? '',
          horaInicio: panel.horaInicio ?? '',
          horaFin:    panel.horaFin ?? '',
          sala:       panel.sala ?? '',
          moderador:  panel.moderador ?? '',
        })
      }
    }
  }

  const handleSubmitActividad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setCargandoK(true)
    setMensajeK(null)
    try {
      if (actividad.tipo === 'panel') {
        if (panelSeleccionado === 'nuevo') {
          // Crear panel nuevo con este invitado como primero
          const id = await crearPanel(actividad, editando)
          setActividadId(id)
          setPaneles(ps => [...ps, { id, ...actividad, invitadosIds: [editando] }])
          setPanelSel(id)
        } else {
          // Agregar invitado a panel existente y actualizar sus datos
          await agregarInvitadoAPanel(panelSeleccionado, editando)
          await actualizarPanel(panelSeleccionado, actividad)
          setActividadId(panelSeleccionado)
        }
      } else {
        await guardarActividad(editando, actividad, actividadId ?? undefined)
        if (!actividadId) {
          const act = await obtenerActividadDeInvitado(editando)
          if (act) setActividadId(act.id)
        }
      }
      setMensajeK('Actividad guardada.')
    } catch {
      setMensajeK('Error al guardar la actividad.')
    } finally {
      setCargandoK(false)
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="admin-module">

      {/* ── Sección 1: Invitado ── */}
      <h2 className="admin-module__title">
        {editando ? 'Editar invitado' : 'Agregar invitado'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">
          {camposInvitado.map(c => (
            <div key={c.nombre} className="admin-form__field">
              <label className="admin-form__label">{c.etiqueta}</label>
              <input
                className="admin-form__input"
                type="text"
                name={c.nombre}
                value={(form[c.nombre] as string) ?? ''}
                onChange={handleChange}
                required={['nombre', 'rol', 'institucion'].includes(c.nombre)}
              />
            </div>
          ))}
        </div>

        <div className="admin-form__field admin-form__field--full" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label className="admin-form__checkbox">
            <input type="checkbox" name="confirmado" checked={!!form.confirmado} onChange={handleCheck} />
            Participación confirmada
          </label>
          <label className="admin-form__checkbox">
            <input type="checkbox" name="mostrarEnPagina" checked={!!form.mostrarEnPagina} onChange={handleCheck} />
            Mostrar en página
          </label>
          <label className="admin-form__checkbox">
            <input type="checkbox" name="mostrarEnCarrusel" checked={!!form.mostrarEnCarrusel} onChange={handleCheck} />
            Mostrar en carrusel
          </label>
        </div>

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
          <button type="submit" className="admin-btn admin-btn--primary" disabled={cargando}>
            {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar'}
          </button>
          {editando && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={handleCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ── Sección 2: Conferencia (solo cuando hay invitado guardado) ── */}
      {editando && (
        <>
          <h2 className="admin-module__title" style={{ marginTop: '2.5rem' }}>
            Actividad en el programa
          </h2>

          <form className="admin-form" onSubmit={handleSubmitActividad}>

            {/* Tipo */}
            <div className="admin-form__field admin-form__field--full">
              <label className="admin-form__label">Tipo de actividad</label>
              <select
                className="admin-form__input"
                name="tipo"
                value={actividad.tipo}
                onChange={handleChangeK}
              >
                {TIPOS_ACTIVIDAD.map(t => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            {/* Selector de panel existente */}
            {actividad.tipo === 'panel' && (
              <div className="admin-form__field admin-form__field--full">
                <label className="admin-form__label">Panel</label>
                <select
                  className="admin-form__input"
                  value={panelSeleccionado}
                  onChange={e => handleSeleccionarPanel(e.target.value)}
                >
                  <option value="nuevo">— Crear nuevo panel —</option>
                  {paneles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.titulo || '(sin título)'} · {p.invitadosIds?.length ?? 0} invitados
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="admin-form__grid">
              {camposActividad
                .filter(c => c.nombre !== 'moderador' || actividad.tipo === 'conferencia' || actividad.tipo === 'panel' || actividad.tipo === 'mesa')
                .map(c => (
                  <div key={c.nombre} className="admin-form__field">
                    <label className="admin-form__label">{c.etiqueta}</label>
                    <input
                      className="admin-form__input"
                      type={c.tipo ?? 'text'}
                      name={c.nombre}
                      value={actividad[c.nombre] as string}
                      onChange={handleChangeK}
                    />
                  </div>
                ))}
            </div>

            <div className="admin-form__field admin-form__field--full">
              <label className="admin-form__label">Resumen / descripción</label>
              <textarea
                className="admin-form__textarea"
                name="resumen"
                value={actividad.resumen}
                onChange={handleChangeK}
                rows={3}
              />
            </div>

            {mensajeK && <p className="admin-form__msg">{mensajeK}</p>}

            <div className="admin-form__actions">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={cargandoK}>
                {cargandoK ? 'Guardando...' : actividadId ? 'Actualizar actividad' : 'Agregar actividad'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── Lista ── */}
      <h2 className="admin-module__title" style={{ marginTop: '3rem' }}>
        Invitados ({invitados.length}) · confirmados ({invitados.filter(i => i.confirmado).length})
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
            </div>
            <div className="admin-list__item-actions">
              <button className="admin-btn admin-btn--small" onClick={() => handleEditar(inv)}>
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
