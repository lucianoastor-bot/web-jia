// components/admin/AdminActividades.tsx
'use client'

import { useState, useMemo } from 'react'
import { useActividades } from '@/lib/hooks/useActividades'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { crearActividad, actualizarActividad, eliminarActividad, quitarInvitadoDePanel, asignarInvitado, desasignarInvitado } from '@/lib/services/actividades'
import { asignarPropuesta, desasignarPropuesta } from '@/lib/services/propuestas'
import { TIPOS_ACTIVIDAD, TIPOS_PROPUESTA, EJES, RESTRICCIONES_ACTIVIDAD } from '@/congreso.config'
import type { Actividad, TipoActividad, TipoPropuesta } from '@/types'

// Qué tipos de propuesta acepta cada tipo de actividad
const PROPUESTAS_COMPATIBLES: Partial<Record<TipoActividad, TipoPropuesta[]>> = {
  mesa:    ['ponencia', 'relato'],
  pósters: ['poster'],
  panel:   ['panel'],
}

type DatosActividad = {
  tipo:        TipoActividad
  titulo:      string
  resumen:     string
  fecha:       string
  horaInicio:  string
  horaFin:     string
  sala:        string
  moderador:   string
  descriptor:  string
  descripcion: string
}

const VACIO: DatosActividad = {
  tipo: 'conferencia', titulo: '', resumen: '',
  fecha: '', horaInicio: '', horaFin: '',
  sala: '', moderador: '', descriptor: '', descripcion: '',
}

const camposComunes: { nombre: keyof DatosActividad; etiqueta: string; tipo?: string }[] = [
  { nombre: 'titulo',     etiqueta: 'Título' },
  { nombre: 'fecha',      etiqueta: 'Fecha',       tipo: 'date' },
  { nombre: 'horaInicio', etiqueta: 'Hora inicio',  tipo: 'time' },
  { nombre: 'horaFin',    etiqueta: 'Hora fin',     tipo: 'time' },
  { nombre: 'sala',       etiqueta: 'Sala / Lugar' },
]

export default function AdminActividades() {
  const { actividades, cargar }          = useActividades()
  const { invitados }                    = useInvitados()
  const { propuestas, cargar: cargarP }  = usePropuestas()

  const [form, setForm]               = useState<DatosActividad>(VACIO)
  const [editando, setEditando]       = useState<string | null>(null)
  const [actividadActual, setActual]  = useState<Actividad | null>(null)
  const [cargando, setCargando]       = useState(false)
  const [mensaje, setMensaje]         = useState<string | null>(null)
  const [filtro, setFiltro]           = useState<TipoActividad | 'todas'>('todas')

  // Filtros para propuestas disponibles
  const [filtroPTipo,  setFiltroPTipo]  = useState<TipoPropuesta | 'todos'>('todos')
  const [filtroPEje,   setFiltroPEje]   = useState<string>('todos')
  const [filtroPBusca, setFiltroPBusca] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      // Armar objeto limpio según tipo (Firestore no acepta undefined)
      const datos: Omit<Actividad, 'id'> = {
        tipo:   form.tipo,
        titulo: form.titulo,
        ...(form.resumen    && { resumen:    form.resumen }),
        ...(form.fecha      && { fecha:      form.fecha }),
        ...(form.horaInicio && { horaInicio: form.horaInicio }),
        ...(form.horaFin    && { horaFin:    form.horaFin }),
        ...(form.sala       && { sala:       form.sala }),
        ...( (['conferencia', 'panel', 'mesa'] as TipoActividad[]).includes(form.tipo) && form.moderador && {
          moderador: form.moderador,
        }),
        ...(form.tipo === 'otro' && form.descriptor  && { descriptor:  form.descriptor }),
        ...(form.tipo === 'otro' && form.descripcion && { descripcion: form.descripcion }),
        ...(form.tipo === 'panel' && !editando && { invitadosIds: [] as string[] }),
      }
      if (editando) {
        await actualizarActividad(editando, datos)
        setMensaje('Actividad actualizada.')
      } else {
        await crearActividad(datos)
        setMensaje('Actividad creada.')
      }
      setForm(VACIO)
      setEditando(null)
      setActual(null)
      await cargar()
    } catch {
      setMensaje('Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = (act: Actividad) => {
    setForm({
      tipo:        act.tipo,
      titulo:      act.titulo      ?? '',
      resumen:     act.resumen     ?? '',
      fecha:       act.fecha       ?? '',
      horaInicio:  act.horaInicio  ?? '',
      horaFin:     act.horaFin     ?? '',
      sala:        act.sala        ?? '',
      moderador:   act.moderador   ?? '',
      descriptor:  act.descriptor  ?? '',
      descripcion: act.descripcion ?? '',
    })
    setEditando(act.id)
    setActual(act)
    setMensaje(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    await eliminarActividad(id)
    setMensaje('Actividad eliminada.')
    if (editando === id) handleCancelar()
    await cargar()
  }

  const handleCancelar = () => {
    setForm(VACIO)
    setEditando(null)
    setActual(null)
    setMensaje(null)
    setFiltroPTipo('todos')
    setFiltroPEje('todos')
    setFiltroPBusca('')
  }

  const handleQuitarInvitado = async (invitadoId: string) => {
    if (!editando || !actividadActual) return
    await quitarInvitadoDePanel(editando, invitadoId)
    setActual(a => a ? {
      ...a,
      invitadosIds: (a.invitadosIds ?? []).filter(id => id !== invitadoId),
    } : null)
    await cargar()
  }

  // ── Propuestas ───────────────────────────────────────────────

  const tiposCompatibles = editando ? (PROPUESTAS_COMPATIBLES[form.tipo] ?? []) : []

  const propuestasAsignadas = useMemo(() =>
    propuestas.filter(p => p.actividadId === editando),
    [propuestas, editando]
  )

  const propuestasDisponibles = useMemo(() => {
    const busca = filtroPBusca.toLowerCase()
    return propuestas.filter(p =>
      p.estado === 'aceptada' &&
      !p.actividadId &&
      (tiposCompatibles as string[]).includes(p.tipo) &&
      (filtroPTipo === 'todos' || p.tipo === filtroPTipo) &&
      (filtroPEje  === 'todos' || p.eje  === filtroPEje) &&
      (!busca || p.titulo.toLowerCase().includes(busca) || p.autor.nombre.toLowerCase().includes(busca))
    ).sort((a, b) => a.eje.localeCompare(b.eje))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propuestas, editando, form.tipo, filtroPTipo, filtroPEje, filtroPBusca])

  const restriccion = form.tipo in RESTRICCIONES_ACTIVIDAD
    ? RESTRICCIONES_ACTIVIDAD[form.tipo as keyof typeof RESTRICCIONES_ACTIVIDAD]
    : null

  const maxPropuestas = restriccion && 'maxPropuestas' in restriccion ? restriccion.maxPropuestas : null
  const minPropuestas = restriccion && 'minPropuestas' in restriccion ? restriccion.minPropuestas : null

  const handleAsignar = async (propuestaId: string) => {
    if (!editando) return
    await asignarPropuesta(propuestaId, editando)
    await cargarP()
  }

  const handleDesasignar = async (propuestaId: string) => {
    await desasignarPropuesta(propuestaId)
    await cargarP()
  }

  // Invitado asignado a esta conferencia
  const invitadoActual = useMemo(() =>
    actividades.find(a => a.id === editando)?.invitadoId
      ? invitados.find(i => i.id === actividades.find(a => a.id === editando)?.invitadoId) ?? null
      : null,
    [actividades, editando, invitados]
  )

  // Invitados no asignados a ninguna conferencia (excluye el actual para no ocultarlo)
  const invitadosDisponibles = useMemo(() => {
    const asignados = new Set(
      actividades.filter(a => a.tipo === 'conferencia' && a.invitadoId && a.id !== editando)
        .map(a => a.invitadoId!)
    )
    return invitados.filter(i => !asignados.has(i.id))
  }, [actividades, invitados, editando])

  const handleAsignarInvitado = async (invitadoId: string) => {
    if (!editando) return
    await asignarInvitado(editando, invitadoId)
    await cargar()
  }

  const handleDesasignarInvitado = async () => {
    if (!editando) return
    await desasignarInvitado(editando)
    await cargar()
  }

  const tipoEtiqueta = (tipo: TipoActividad) =>
    TIPOS_ACTIVIDAD.find(t => t.valor === tipo)?.etiqueta ?? tipo

  const actividadesFiltradas = filtro === 'todas'
    ? actividades
    : actividades.filter(a => a.tipo === filtro)

  return (
    <div className="admin-module">

      {/* ── Formulario ── */}
      <h2 className="admin-module__title">
        {editando ? 'Editar actividad' : 'Nueva actividad'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>

        {/* Tipo */}
        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Tipo</label>
          <select className="admin-form__input" name="tipo" value={form.tipo} onChange={handleChange}>
            {TIPOS_ACTIVIDAD.map(t => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="admin-form__grid">
          {camposComunes.map(c => (
            <div key={c.nombre} className="admin-form__field">
              <label className="admin-form__label">{c.etiqueta}</label>
              <input
                className="admin-form__input"
                type={c.tipo ?? 'text'}
                name={c.nombre}
                value={form[c.nombre] as string}
                onChange={handleChange}
                required={c.nombre === 'titulo'}
              />
            </div>
          ))}

          {/* Moderador — para panel, mesa y conferencia */}
          {(['conferencia', 'panel', 'mesa'] as TipoActividad[]).includes(form.tipo) && (
            <div className="admin-form__field">
              <label className="admin-form__label">Moderador</label>
              <input
                className="admin-form__input"
                type="text"
                name="moderador"
                value={form.moderador}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {/* Descriptor — solo para 'otro' */}
        {form.tipo === 'otro' && (
          <div className="admin-form__field admin-form__field--full">
            <label className="admin-form__label">Descriptor <span style={{ opacity: 0.5, fontWeight: 400 }}>(ej: taller, presentación de libro)</span></label>
            <input
              className="admin-form__input"
              type="text"
              name="descriptor"
              value={form.descriptor}
              onChange={handleChange}
              placeholder="taller, workshop, presentación..."
            />
          </div>
        )}

        {/* Resumen / Descripción */}
        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">
            {form.tipo === 'otro' ? 'Descripción' : 'Resumen'}
          </label>
          <textarea
            className="admin-form__textarea"
            name={form.tipo === 'otro' ? 'descripcion' : 'resumen'}
            value={form.tipo === 'otro' ? form.descripcion : form.resumen}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {mensaje && <p className="admin-form__msg">{mensaje}</p>}

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={cargando}>
            {cargando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
          </button>
          {editando && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={handleCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ── Conferencista (solo conferencia al editar) ── */}
      {editando && form.tipo === 'conferencia' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '0.75rem' }}>
            <h2 className="admin-module__title" style={{ margin: 0 }}>
              Conferencista ({invitadoActual ? '1/1' : '0/1'})
            </h2>
            {!invitadoActual && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)' }}>requerido</span>
            )}
          </div>

          {invitadoActual ? (
            <div className="admin-list">
              <div className="admin-list__item">
                <div className="admin-list__item-info">
                  <p className="admin-list__item-name">{invitadoActual.nombre}</p>
                  <p className="admin-list__item-sub">{invitadoActual.rol} · {invitadoActual.institucion}</p>
                </div>
                <div className="admin-list__item-actions">
                  <button
                    className="admin-btn admin-btn--small admin-btn--danger"
                    onClick={handleDesasignarInvitado}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="admin-list__empty" style={{ marginBottom: '0.75rem' }}>Sin conferencista asignado.</p>
              <select
                className="admin-form__input"
                style={{ maxWidth: '420px' }}
                defaultValue=""
                onChange={e => e.target.value && handleAsignarInvitado(e.target.value)}
              >
                <option value="" disabled>Seleccionar invitado...</option>
                {invitadosDisponibles.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.nombre} · {inv.rol}
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      )}

      {/* ── Participantes (solo panel al editar) ── */}
      {editando && actividadActual?.tipo === 'panel' && (
        <>
          <h2 className="admin-module__title" style={{ marginTop: '2.5rem' }}>
            Participantes ({actividadActual.invitadosIds?.length ?? 0})
          </h2>
          <div className="admin-list">
            {(actividadActual.invitadosIds ?? []).length === 0 && (
              <p className="admin-list__empty">Sin participantes asignados.</p>
            )}
            {(actividadActual.invitadosIds ?? []).map(id => {
              const inv = invitados.find(i => i.id === id)
              return (
                <div key={id} className="admin-list__item">
                  <div className="admin-list__item-info">
                    <p className="admin-list__item-name">{inv?.nombre ?? id}</p>
                    {inv && <p className="admin-list__item-sub">{inv.rol} · {inv.institucion}</p>}
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

      {/* ── Propuestas (mesa, pósters, panel) ── */}
      {editando && tiposCompatibles.length > 0 && (
        <>
          {/* Cabecera con conteo y restricción */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '0.75rem' }}>
            <h2 className="admin-module__title" style={{ margin: 0 }}>
              Propuestas asignadas ({propuestasAsignadas.length}{maxPropuestas ? `/${maxPropuestas}` : ''})
            </h2>
            {minPropuestas !== null && propuestasAsignadas.length < minPropuestas && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)' }}>
                mínimo {minPropuestas}
              </span>
            )}
            {maxPropuestas !== null && propuestasAsignadas.length >= maxPropuestas && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)' }}>
                máximo alcanzado
              </span>
            )}
          </div>

          {/* Asignadas */}
          <div className="admin-list">
            {propuestasAsignadas.length === 0 && (
              <p className="admin-list__empty">Sin propuestas asignadas aún.</p>
            )}
            {propuestasAsignadas.map(p => (
              <div key={p.id} className="admin-list__item">
                <div className="admin-list__item-info">
                  <p className="admin-list__item-name">{p.titulo}</p>
                  <p className="admin-list__item-sub">
                    {p.autor.nombre}
                    {p.autor.institucion && ` · ${p.autor.institucion}`}
                    {' · '}Eje {p.eje}
                  </p>
                </div>
                <div className="admin-list__item-actions">
                  <button
                    className="admin-btn admin-btn--small admin-btn--danger"
                    onClick={() => handleDesasignar(p.id)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Disponibles */}
          {/* Filtros de disponibles */}
          <div style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            <p className="admin-form__label" style={{ opacity: 0.5, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Disponibles para agregar
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="admin-form__input"
                type="text"
                placeholder="Buscar por título o autor..."
                value={filtroPBusca}
                onChange={e => setFiltroPBusca(e.target.value)}
                style={{ flex: '1 1 180px', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
              />
              {tiposCompatibles.length > 1 && (
                <select
                  className="admin-form__input"
                  style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                  value={filtroPTipo}
                  onChange={e => setFiltroPTipo(e.target.value as TipoPropuesta | 'todos')}
                >
                  <option value="todos">Todos los tipos</option>
                  {tiposCompatibles.map(t => (
                    <option key={t} value={t}>{TIPOS_PROPUESTA.find(tp => tp.valor === t)?.etiqueta ?? t}</option>
                  ))}
                </select>
              )}
              <select
                className="admin-form__input"
                style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                value={filtroPEje}
                onChange={e => setFiltroPEje(e.target.value)}
              >
                <option value="todos">Todos los ejes</option>
                {EJES.map(e => (
                  <option key={e.num} value={e.num}>{e.num} — {e.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-list">
            {propuestasDisponibles.length === 0 && (
              <p className="admin-list__empty">Sin resultados.</p>
            )}
            {propuestasDisponibles.map(p => (
              <div key={p.id} className="admin-list__item">
                <div className="admin-list__item-info">
                  <p className="admin-list__item-name">{p.titulo}</p>
                  <p className="admin-list__item-sub">
                    {p.autor.nombre}
                    {p.autor.institucion && ` · ${p.autor.institucion}`}
                    {' · '}Eje {p.eje}
                  </p>
                </div>
                <div className="admin-list__item-actions">
                  <button
                    className="admin-btn admin-btn--small"
                    onClick={() => handleAsignar(p.id)}
                    disabled={maxPropuestas !== null && propuestasAsignadas.length >= maxPropuestas}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
          {propuestasDisponibles.length === 0 && propuestasAsignadas.length === 0 && (
            <p className="admin-list__empty" style={{ marginTop: '0.5rem' }}>
              No hay propuestas aceptadas disponibles de este tipo.
            </p>
          )}
        </>
      )}

      {/* ── Lista ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '3rem', marginBottom: '0.5rem' }}>
        <h2 className="admin-module__title" style={{ margin: 0 }}>
          Actividades ({actividadesFiltradas.length})
        </h2>
        <select
          className="admin-form__input"
          style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
          value={filtro}
          onChange={e => setFiltro(e.target.value as TipoActividad | 'todas')}
        >
          <option value="todas">Todas</option>
          {TIPOS_ACTIVIDAD.map(t => (
            <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
          ))}
        </select>
      </div>

      <div className="admin-list">
        {actividadesFiltradas.length === 0 && (
          <p className="admin-list__empty">No hay actividades cargadas.</p>
        )}
        {actividadesFiltradas.map(act => (
          <div key={act.id} className="admin-list__item">
            <div className="admin-list__item-info">
              <p className="admin-list__item-name">
                {act.titulo || '(sin título)'}
                <span className="admin-badge admin-badge--pending" style={{ marginLeft: '0.5rem' }}>
                  {tipoEtiqueta(act.tipo)}
                </span>
              </p>
              <p className="admin-list__item-sub">
                {[act.fecha, act.horaInicio && `${act.horaInicio}–${act.horaFin}`, act.sala]
                  .filter(Boolean).join(' · ')}
              </p>
              {act.tipo === 'panel' && (
                <p className="admin-list__item-sub">
                  {act.moderador && `Moderador: ${act.moderador} · `}
                  {act.invitadosIds?.length ?? 0} participante{(act.invitadosIds?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              )}
              {act.tipo === 'conferencia' && act.invitadoId && (
                <p className="admin-list__item-sub">
                  {invitados.find(i => i.id === act.invitadoId)?.nombre ?? act.invitadoId}
                </p>
              )}
              {act.tipo === 'mesa' && (() => {
                const pp = propuestas.filter(p => p.actividadId === act.id)
                const ejes = [...new Set(pp.map(p => p.eje))].sort().join(', ')
                return (
                  <p className="admin-list__item-sub">
                    {pp.length} ponencia{pp.length !== 1 ? 's' : ''}
                    {ejes && ` · Eje ${ejes}`}
                  </p>
                )
              })()}
              {act.tipo === 'pósters' && (() => {
                const pp = propuestas.filter(p => p.actividadId === act.id)
                return (
                  <p className="admin-list__item-sub">
                    {pp.length} póster{pp.length !== 1 ? 's' : ''}
                  </p>
                )
              })()}
            </div>
            <div className="admin-list__item-actions">
              <button className="admin-btn admin-btn--small" onClick={() => handleEditar(act)}>
                Editar
              </button>
              <button
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => handleEliminar(act.id)}
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
