// components/admin/AdminInvitados.tsx
'use client'

import { useState } from 'react'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { TIPOS_ACTIVIDAD } from '@/congreso.config'
import { agregarInvitado, actualizarInvitado, eliminarInvitado } from '@/lib/services/invitados'
import {
  obtenerActividadDeInvitado, guardarActividad,
  obtenerActividadesPorTipo, actualizarActividad, actualizarParticipantesPanel,
} from '@/lib/services/actividades'
import type { Invitado, Actividad, TipoActividad, ParticipantePanel } from '@/types'

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
  coordinador: string
}

const VACIO_INVITADO: DatosInvitado = {
  nombre: '', rol: '', institucion: '', bio: '',
  foto: '/invitados/', confirmado: false, email: '',
  mostrarEnPagina: false, mostrarEnCarrusel: false,
  linkedin: '', instagram: '', web: '',
}


const VACIO_ACTIVIDAD: DatosActividad = {
  tipo: 'conferencia', titulo: '', resumen: '',
  fecha: '', horaInicio: '', horaFin: '', sala: '', moderador: '', coordinador: '',
}

const camposInvitado: { nombre: keyof DatosInvitado; etiqueta: string }[] = [
  { nombre: 'nombre',      etiqueta: 'Nombre' },
  { nombre: 'rol',         etiqueta: 'Rol / Cargo' },
  { nombre: 'institucion', etiqueta: 'Institución' },
  { nombre: 'email',       etiqueta: 'Email' },
  { nombre: 'foto',        etiqueta: 'Ruta de foto' },
  { nombre: 'linkedin',    etiqueta: 'LinkedIn (URL)' },
  { nombre: 'instagram',   etiqueta: 'Instagram (URL)' },
  { nombre: 'web',         etiqueta: 'Sitio web (URL)' },
]

const camposActividad: { nombre: keyof DatosActividad; etiqueta: string; tipo?: string; soloTipo?: TipoActividad[] }[] = [
  { nombre: 'titulo',      etiqueta: 'Título' },
  { nombre: 'fecha',       etiqueta: 'Fecha',       tipo: 'date' },
  { nombre: 'horaInicio',  etiqueta: 'Hora inicio',  tipo: 'time' },
  { nombre: 'horaFin',     etiqueta: 'Hora fin',     tipo: 'time' },
  { nombre: 'sala',        etiqueta: 'Sala / Lugar' },
  { nombre: 'moderador',   etiqueta: 'Moderador',   soloTipo: ['conferencia', 'mesa'] },
  { nombre: 'coordinador', etiqueta: 'Coordinador', soloTipo: ['panel'] },
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

  // Actividades seleccionables (panel / otro)
  const [actividadesGrupo, setActividadesGrupo]   = useState<Actividad[]>([])
  const [actividadGrupoId, setActividadGrupoId]   = useState<string>('')

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
        tipo:        (act.tipo as TipoActividad) ?? 'conferencia',
        titulo:      act.titulo ?? '',
        resumen:     act.resumen ?? '',
        fecha:       act.fecha ?? '',
        horaInicio:  act.horaInicio ?? '',
        horaFin:     act.horaFin ?? '',
        sala:        act.sala ?? '',
        moderador:   act.moderador ?? '',
        coordinador: act.coordinador ?? '',
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
    setActividadesGrupo([])
    setActividadGrupoId('')
  }

  // ── Keynote ───────────────────────────────────────────────

  const TIPOS_INVITADO = ['conferencia', 'panel', 'otro'] as const
  type TipoInvitado   = typeof TIPOS_INVITADO[number]

  const handleChangeK = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setActividad(a => ({ ...a, [name]: value }))
    if (name === 'tipo' && (value === 'panel' || value === 'otro')) {
      const lista = await obtenerActividadesPorTipo(value)
      setActividadesGrupo(lista)
      setActividadGrupoId(lista[0]?.id ?? '')
    } else if (name === 'tipo') {
      setActividadesGrupo([])
      setActividadGrupoId('')
    }
  }

  const handleSeleccionarGrupo = (actividadId: string) => {
    setActividadGrupoId(actividadId)
    const act = actividadesGrupo.find(a => a.id === actividadId)
    if (act) {
      setActividad(a => ({
        ...a,
        titulo:      act.titulo ?? '',
        resumen:     act.resumen ?? '',
        fecha:       act.fecha ?? '',
        horaInicio:  act.horaInicio ?? '',
        horaFin:     act.horaFin ?? '',
        sala:        act.sala ?? '',
        coordinador: act.coordinador ?? '',
      }))
    }
  }

  const handleSubmitActividad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setCargandoK(true)
    setMensajeK(null)
    try {
      if (actividad.tipo === 'panel' || actividad.tipo === 'otro') {
        if (!actividadGrupoId) {
          setMensajeK('Seleccioná una actividad existente.')
          return
        }
        const nuevoParticipante: ParticipantePanel = {
          nombre:      form.nombre,
          institucion: form.institucion,
          invitadoId:  editando,
        }
        const actExistente = actividadesGrupo.find(a => a.id === actividadGrupoId)
        const participantesActuales = actExistente?.participantes ?? []
        const yaEsta = participantesActuales.some(p => p.invitadoId === editando)
        if (!yaEsta) {
          await actualizarParticipantesPanel(actividadGrupoId, [...participantesActuales, nuevoParticipante])
        }
        setActividadId(actividadGrupoId)
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

            {/* Tipo — solo conferencia, panel, otro */}
            <div className="admin-form__field admin-form__field--full">
              <label className="admin-form__label">Tipo de actividad</label>
              <select
                className="admin-form__input"
                name="tipo"
                value={actividad.tipo}
                onChange={handleChangeK}
              >
                {TIPOS_ACTIVIDAD.filter(t => TIPOS_INVITADO.includes(t.valor as TipoInvitado)).map(t => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            {/* Selector de actividad grupal (panel / otro) */}
            {(actividad.tipo === 'panel' || actividad.tipo === 'otro') && (
              <div className="admin-form__field admin-form__field--full">
                <label className="admin-form__label">
                  {actividad.tipo === 'panel' ? 'Panel existente' : 'Actividad existente'}
                </label>
                {actividadesGrupo.length === 0
                  ? <p style={{ fontSize: '0.82rem', color: '#999' }}>
                      No hay actividades de este tipo creadas todavía. Creá una desde el módulo Actividades.
                    </p>
                  : <select
                      className="admin-form__input"
                      value={actividadGrupoId}
                      onChange={e => handleSeleccionarGrupo(e.target.value)}
                    >
                      {actividadesGrupo.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.titulo || '(sin título)'} · {a.participantes?.length ?? 0} participantes
                        </option>
                      ))}
                    </select>
                }
              </div>
            )}

            <div className="admin-form__grid">
              {camposActividad
                .filter(c => !c.soloTipo || c.soloTipo.includes(actividad.tipo))
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
