// components/admin/AdminActividades.tsx
'use client'

import { useState, useMemo } from 'react'
import { useActividades } from '@/lib/hooks/useActividades'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import {
  crearActividad, actualizarActividad, eliminarActividad,
  actualizarParticipantesPanel, desasignarInvitado,
} from '@/lib/services/actividades'
import { asignarPropuesta, desasignarPropuesta } from '@/lib/services/propuestas'
import { TIPOS_ACTIVIDAD, TIPOS_PROPUESTA, EJES, RESTRICCIONES_ACTIVIDAD, PROPUESTAS_COMPATIBLES, CONGRESO, SALAS, FRANJAS_HORARIAS } from '@/congreso.config'
import type { Actividad, TipoActividad, TipoPropuesta, ParticipantePanel } from '@/types'

type DatosActividad = {
  tipo:        TipoActividad
  titulo:      string
  resumen:     string
  fecha:       string
  horaInicio:  string
  horaFin:     string
  sala:        string
  moderador:   string   // conferencia, mesa
  coordinador: string   // panel
  descriptor:  string
  descripcion: string
  invitadoId:  string   // conferencia
}

const VACIO: DatosActividad = {
  tipo: 'conferencia', titulo: '', resumen: '',
  fecha: '', horaInicio: '', horaFin: '',
  sala: '', moderador: '', coordinador: '', descriptor: '', descripcion: '',
  invitadoId: '',
}

const VACIO_PARTICIPANTE: ParticipantePanel = {
  nombre: '', institucion: '', tituloPonencia: '', invitadoId: '',
}

// Días del congreso derivados de CONGRESO.fechaInicio
const FECHAS_JORNADA = [0, 1, 2].map(d => {
  const ms   = CONGRESO.fechaInicio.getTime() + d * 86_400_000
  const date = new Date(ms)
  const valor = date.toISOString().slice(0, 10)
  const etiqueta = new Date(valor + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return { valor, etiqueta }
})

// Slots de hora de 08:00 a 21:00 en intervalos de 30 min
const HORAS = Array.from({ length: 27 }, (_, i) => {
  const min = 480 + i * 30
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
})

const camposTexto: { nombre: keyof DatosActividad; etiqueta: string }[] = [
  { nombre: 'titulo', etiqueta: 'Título' },
  { nombre: 'sala',   etiqueta: 'Sala / Lugar' },
]

export default function AdminActividades() {
  const { actividades, cargar }         = useActividades()
  const { invitados }                   = useInvitados()
  const { propuestas, cargar: cargarP } = usePropuestas()

  const [form, setForm]         = useState<DatosActividad>(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)
  const [filtro, setFiltro]       = useState<TipoActividad | 'todas'>('todas')
  const [expandida, setExpandida] = useState<string | null>(null)

  // Filtros propuestas disponibles
  const [filtroPTipo,  setFiltroPTipo]  = useState<TipoPropuesta | 'todos'>('todos')
  const [filtroPEje,   setFiltroPEje]   = useState<string>('todos')
  const [filtroPBusca, setFiltroPBusca] = useState<string>('')

  // Nuevo participante (panel)
  const [nuevoP, setNuevoP] = useState<ParticipantePanel>(VACIO_PARTICIPANTE)

  // ── Handlers form ──────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      const datos: Omit<Actividad, 'id'> = {
        tipo:   form.tipo,
        titulo: form.titulo,
        ...(form.resumen    && { resumen:    form.resumen }),
        ...(form.fecha      && { fecha:      form.fecha }),
        ...(form.horaInicio && { horaInicio: form.horaInicio }),
        ...(form.horaFin    && { horaFin:    form.horaFin }),
        ...(form.sala       && { sala:       form.sala }),
        ...(['conferencia', 'mesa'] as TipoActividad[]).includes(form.tipo) && form.moderador
          ? { moderador: form.moderador } : {},
        ...(form.tipo === 'panel'       && form.coordinador && { coordinador: form.coordinador }),
        ...(form.tipo === 'otro'        && form.descriptor  && { descriptor:  form.descriptor }),
        ...(form.tipo === 'otro'        && form.descripcion && { descripcion: form.descripcion }),
        ...(form.tipo === 'conferencia' && form.invitadoId  && { invitadoId:  form.invitadoId }),
      }
      if (editando) {
        await actualizarActividad(editando, datos)
        // Si se quitó el conferencista, eliminarlo del documento
        if (form.tipo === 'conferencia' && !form.invitadoId) {
          const prevId = actividades.find(a => a.id === editando)?.invitadoId
          if (prevId) await desasignarInvitado(editando)
        }
        setMensaje('Actividad actualizada.')
      } else {
        const newId = await crearActividad(datos)
        setEditando(newId)
        setMensaje('Actividad creada. Podés agregar participantes o propuestas.')
      }
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
      coordinador: act.coordinador ?? '',
      descriptor:  act.descriptor  ?? '',
      descripcion: act.descripcion ?? '',
      invitadoId:  act.invitadoId  ?? '',
    })
    setEditando(act.id)
    setMensaje(null)
    setNuevoP(VACIO_PARTICIPANTE)
    setFiltroPTipo('todos')
    setFiltroPEje('todos')
    setFiltroPBusca('')
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
    setMensaje(null)
    setNuevoP(VACIO_PARTICIPANTE)
    setFiltroPTipo('todos')
    setFiltroPEje('todos')
    setFiltroPBusca('')
  }

  // ── Participantes de panel ─────────────────────────────────

  // Siempre derivados del estado de actividades (se actualiza con cargar())
  const participantesPanel = useMemo(() =>
    actividades.find(a => a.id === editando)?.participantes ?? [],
    [actividades, editando]
  )

  const handleAgregarParticipante = async () => {
    if (!editando || !nuevoP.nombre.trim()) return
    const limpio: ParticipantePanel = {
      nombre: nuevoP.nombre.trim(),
      ...(nuevoP.institucion   && { institucion:   nuevoP.institucion.trim() }),
      ...(nuevoP.tituloPonencia && { tituloPonencia: nuevoP.tituloPonencia.trim() }),
      ...(nuevoP.invitadoId    && { invitadoId:    nuevoP.invitadoId }),
    }
    await actualizarParticipantesPanel(editando, [...participantesPanel, limpio])
    setNuevoP(VACIO_PARTICIPANTE)
    await cargar()
  }

  const handleQuitarParticipante = async (idx: number) => {
    if (!editando) return
    await actualizarParticipantesPanel(
      editando,
      participantesPanel.filter((_, i) => i !== idx)
    )
    await cargar()
  }

  // Cuando se selecciona un invitado del dropdown, auto-llena el form
  const handleSeleccionarInvitadoPanel = (invitadoId: string) => {
    const inv = invitados.find(i => i.id === invitadoId)
    if (!inv) return
    setNuevoP(p => ({
      ...p,
      nombre:     inv.nombre,
      institucion: inv.institucion,
      invitadoId: inv.id,
    }))
  }

  // ── Propuestas ─────────────────────────────────────────────

  const tiposCompatibles = editando ? (PROPUESTAS_COMPATIBLES[form.tipo]?.tipos ?? []) : []

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

  // Al asignar propuesta de panel → auto-poblar coordinador y participantes
  const handleAsignar = async (propuestaId: string) => {
    if (!editando) return
    const propuesta = propuestas.find(p => p.id === propuestaId)
    await asignarPropuesta(propuestaId, editando)
    if (propuesta?.tipo === 'panel') {
      const participantes: ParticipantePanel[] = [
        { nombre: propuesta.autor.nombre, institucion: propuesta.autor.institucion },
        ...(propuesta.participantes ?? []).map(p => ({
          nombre:      p.nombre,
          institucion: p.institucion,
        })),
      ]
      await actualizarActividad(editando, {
        titulo:       propuesta.titulo,
        coordinador:  propuesta.autor.nombre,
        participantes,
      })
      setForm(f => ({ ...f, titulo: propuesta.titulo, coordinador: propuesta.autor.nombre }))
      await cargar()
    }
    await cargarP()
  }

  const handleDesasignar = async (propuestaId: string) => {
    await desasignarPropuesta(propuestaId)
    await cargarP()
  }

  // ── Conferencista ──────────────────────────────────────────

  const invitadosDisponibles = useMemo(() => {
    const asignados = new Set(
      actividades
        .filter(a => a.tipo === 'conferencia' && a.invitadoId && a.id !== editando)
        .map(a => a.invitadoId!)
    )
    return invitados.filter(i => !asignados.has(i.id))
  }, [actividades, invitados, editando])

  // ── Helpers ────────────────────────────────────────────────

  const tipoEtiqueta = (tipo: TipoActividad) =>
    TIPOS_ACTIVIDAD.find(t => t.valor === tipo)?.etiqueta ?? tipo

  const actividadesFiltradas = filtro === 'todas'
    ? actividades
    : actividades.filter(a => a.tipo === filtro)

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="admin-module">

      {/* ── Formulario ── */}
      <h2 className="admin-module__title">
        {editando ? 'Editar actividad' : 'Nueva actividad'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>

        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Tipo</label>
          <select className="admin-form__input" name="tipo" value={form.tipo} onChange={handleChange}>
            {TIPOS_ACTIVIDAD.map(t => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>
        </div>

        {/* Conferencista — aparece inmediatamente al seleccionar 'conferencia' */}
        {form.tipo === 'conferencia' && (
          <div className="admin-form__field admin-form__field--full">
            <label className="admin-form__label">Conferencista</label>
            <select className="admin-form__input" name="invitadoId" value={form.invitadoId} onChange={handleChange}>
              <option value="">— Sin asignar —</option>
              {invitadosDisponibles.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.nombre} · {inv.rol}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tipo personalizado — aparece inmediatamente al seleccionar 'otro' */}
        {form.tipo === 'otro' && (
          <div className="admin-form__field admin-form__field--full">
            <label className="admin-form__label">
              Tipo <span style={{ opacity: 0.5, fontWeight: 400 }}>(ej: taller, presentación de libro, workshop…)</span>
            </label>
            <input
              className="admin-form__input"
              type="text"
              name="descriptor"
              value={form.descriptor}
              onChange={handleChange}
              placeholder="taller, workshop, presentación…"
            />
          </div>
        )}

        <div className="admin-form__grid">
          {/* Título */}
          {camposTexto.filter(c => c.nombre === 'titulo').map(c => (
            <div key={c.nombre} className="admin-form__field admin-form__field--full">
              <label className="admin-form__label">{c.etiqueta}</label>
              <input
                className="admin-form__input"
                type="text"
                name={c.nombre}
                value={form[c.nombre] as string}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          {/* Fecha */}
          <div className="admin-form__field">
            <label className="admin-form__label">Fecha</label>
            <select className="admin-form__input" name="fecha" value={form.fecha} onChange={handleChange}>
              <option value="">— Sin definir —</option>
              {FECHAS_JORNADA.map(f => (
                <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
              ))}
            </select>
          </div>

          {/* Sala — desde config */}
          <div className="admin-form__field">
            <label className="admin-form__label">Sala / Lugar</label>
            <select className="admin-form__input" name="sala" value={form.sala} onChange={handleChange}>
              <option value="">— Sin definir —</option>
              {SALAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Franja horaria — atajo que rellena inicio y fin */}
          <div className="admin-form__field admin-form__field--full">
            <label className="admin-form__label">
              Franja horaria <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(elige una o ajusta manualmente)</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                className="admin-form__input"
                style={{ flex: '2 1 200px' }}
                value={`${form.horaInicio}|${form.horaFin}`}
                onChange={e => {
                  const [inicio, fin] = e.target.value.split('|')
                  setForm(f => ({ ...f, horaInicio: inicio ?? '', horaFin: fin ?? '' }))
                }}
              >
                <option value="|">— Franja predefinida —</option>
                {FRANJAS_HORARIAS.map(f => (
                  <option key={f.etiqueta} value={`${f.inicio}|${f.fin}`}>{f.etiqueta}</option>
                ))}
              </select>
              <select className="admin-form__input" style={{ flex: '1 1 100px' }} name="horaInicio" value={form.horaInicio} onChange={handleChange}>
                <option value="">Inicio</option>
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select className="admin-form__input" style={{ flex: '1 1 100px' }} name="horaFin" value={form.horaFin} onChange={handleChange}>
                <option value="">Fin</option>
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Moderador — conferencia y mesa */}
          {(['conferencia', 'mesa'] as TipoActividad[]).includes(form.tipo) && (
            <div className="admin-form__field">
              <label className="admin-form__label">Moderador</label>
              <input className="admin-form__input" type="text" name="moderador" value={form.moderador} onChange={handleChange} />
            </div>
          )}

          {/* Coordinador — panel */}
          {form.tipo === 'panel' && (
            <div className="admin-form__field">
              <label className="admin-form__label">Coordinador</label>
              <input className="admin-form__input" type="text" name="coordinador" value={form.coordinador} onChange={handleChange} />
            </div>
          )}
        </div>


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


      {/* ── Participantes (panel y otro) ── */}
      {editando && (form.tipo === 'panel' || form.tipo === 'otro') && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '0.75rem' }}>
            <h2 className="admin-module__title" style={{ margin: 0 }}>
              Participantes ({participantesPanel.length})
            </h2>
          </div>

          {/* Lista de participantes */}
          <div className="admin-list">
            {participantesPanel.length === 0 && (
              <p className="admin-list__empty">Sin participantes asignados aún.</p>
            )}
            {participantesPanel.map((p, idx) => (
              <div key={idx} className="admin-list__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="admin-list__item-info">
                    <p className="admin-list__item-name">{p.nombre}</p>
                    {p.institucion && <p className="admin-list__item-sub">{p.institucion}</p>}
                    {p.tituloPonencia && (
                      <p className="admin-list__item-sub" style={{ fontStyle: 'italic' }}>
                        "{p.tituloPonencia}"
                      </p>
                    )}
                  </div>
                  <div className="admin-list__item-actions">
                    <button
                      className="admin-btn admin-btn--small admin-btn--danger"
                      onClick={() => handleQuitarParticipante(idx)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agregar participante */}
          <p className="admin-form__label" style={{ marginTop: '1.25rem', marginBottom: '0.5rem', opacity: 0.5, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Agregar participante
          </p>
          <div style={{ border: '1px solid rgba(35,22,81,0.1)', borderRadius: '4px', padding: '0.75rem' }}>
            {/* Selector rápido desde invitados */}
            <div className="admin-form__field" style={{ marginBottom: '0.5rem' }}>
              <label className="admin-form__label">Desde invitados (opcional)</label>
              <select
                className="admin-form__input"
                value={nuevoP.invitadoId ?? ''}
                onChange={e => handleSeleccionarInvitadoPanel(e.target.value)}
              >
                <option value="">— Cargar desde invitados —</option>
                {invitados.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.nombre} · {inv.institucion}</option>
                ))}
              </select>
            </div>
            <div className="admin-form__grid">
              <div className="admin-form__field">
                <label className="admin-form__label">Nombre *</label>
                <input
                  className="admin-form__input"
                  type="text"
                  value={nuevoP.nombre}
                  onChange={e => setNuevoP(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="admin-form__field">
                <label className="admin-form__label">Institución</label>
                <input
                  className="admin-form__input"
                  type="text"
                  value={nuevoP.institucion ?? ''}
                  onChange={e => setNuevoP(p => ({ ...p, institucion: e.target.value }))}
                />
              </div>
              <div className="admin-form__field admin-form__field--full">
                <label className="admin-form__label">Título de la ponencia</label>
                <input
                  className="admin-form__input"
                  type="text"
                  value={nuevoP.tituloPonencia ?? ''}
                  onChange={e => setNuevoP(p => ({ ...p, tituloPonencia: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--small"
              onClick={handleAgregarParticipante}
              disabled={!nuevoP.nombre.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              + Agregar
            </button>
          </div>
        </>
      )}

      {/* ── Propuestas (mesa, pósters, panel) ── */}
      {editando && tiposCompatibles.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '0.75rem' }}>
            <h2 className="admin-module__title" style={{ margin: 0 }}>
              Propuestas asignadas ({propuestasAsignadas.length}{maxPropuestas ? `/${maxPropuestas}` : ''})
            </h2>
            {minPropuestas !== null && propuestasAsignadas.length < minPropuestas && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)' }}>mínimo {minPropuestas}</span>
            )}
            {maxPropuestas !== null && propuestasAsignadas.length >= maxPropuestas && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)' }}>máximo alcanzado</span>
            )}
          </div>

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
                  <button className="admin-btn admin-btn--small admin-btn--danger" onClick={() => handleDesasignar(p.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros disponibles */}
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
                    {form.tipo !== 'panel' && ` · Eje ${p.eje}`}
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
        </>
      )}

      {/* ── Lista de actividades ── */}
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
        {actividadesFiltradas.map(act => {
          const propAct   = propuestas.filter(p => p.actividadId === act.id)
          const invitado  = act.invitadoId ? invitados.find(i => i.id === act.invitadoId) : null
          const abierta   = expandida === act.id
          return (
            <div key={act.id} className="admin-list__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>

              {/* Fila principal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="admin-list__item-info" style={{ flex: 1 }}>
                  <p className="admin-list__item-name">
                    {act.titulo || '(sin título)'}
                    <span className="admin-badge admin-badge--pending" style={{ marginLeft: '0.5rem' }}>
                      {act.tipo === 'otro' && act.descriptor ? act.descriptor : tipoEtiqueta(act.tipo)}
                    </span>
                  </p>
                  <p className="admin-list__item-sub">
                    {[act.fecha, act.horaInicio && `${act.horaInicio}–${act.horaFin}`, act.sala]
                      .filter(Boolean).join(' · ')}
                  </p>
                  {act.tipo === 'panel' && (
                    <p className="admin-list__item-sub">
                      {act.coordinador && `Coord.: ${act.coordinador} · `}
                      {act.participantes?.length ?? 0} participante{(act.participantes?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                  )}
                  {act.tipo === 'conferencia' && invitado && (
                    <p className="admin-list__item-sub">{invitado.nombre}</p>
                  )}
                  {(() => {
                    const cfg = PROPUESTAS_COMPATIBLES[act.tipo]
                    if (!cfg?.etiqueta) return null
                    const ejes = cfg.mostrarEje
                      ? [...new Set(propAct.map(p => p.eje))].sort().join(', ')
                      : ''
                    return (
                      <p className="admin-list__item-sub">
                        {propAct.length} {cfg.etiqueta}{propAct.length !== 1 ? 's' : ''}
                        {ejes && ` · Eje ${ejes}`}
                      </p>
                    )
                  })()}
                </div>
                <div className="admin-list__item-actions" style={{ flexShrink: 0 }}>
                  <button
                    className="admin-btn admin-btn--small"
                    onClick={() => setExpandida(abierta ? null : act.id)}
                  >
                    {abierta ? 'Cerrar' : 'Ver'}
                  </button>
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

              {/* Detalle expandible */}
              {abierta && (
                <div style={{ padding: '0.75rem', background: 'rgba(35,22,81,0.04)', borderRadius: '4px', fontSize: '0.86rem', color: '#444', lineHeight: 1.7 }}>

                  {/* Conferencia */}
                  {act.tipo === 'conferencia' && invitado && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{invitado.nombre}</span>
                      {invitado.rol && <span> · {invitado.rol}</span>}
                      {invitado.institucion && <span> · {invitado.institucion}</span>}
                    </div>
                  )}
                  {act.moderador && (
                    <p><span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Moderador </span>{act.moderador}</p>
                  )}

                  {/* Panel / Otro — participantes */}
                  {(act.tipo === 'panel' || act.tipo === 'otro') && (
                    <>
                      {act.coordinador && (
                        <p style={{ marginBottom: '0.35rem' }}>
                          <span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coordinador </span>
                          {act.coordinador}
                        </p>
                      )}
                      {(act.participantes ?? []).length > 0 && (
                        <ul style={{ margin: '0.25rem 0 0.25rem 1rem', padding: 0 }}>
                          {(act.participantes ?? []).map((p, i) => (
                            <li key={i}>
                              <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                              {p.institucion && <span style={{ color: '#666' }}> · {p.institucion}</span>}
                              {p.tituloPonencia && <span style={{ fontStyle: 'italic', color: '#555' }}> — "{p.tituloPonencia}"</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}

                  {/* Actividades que agrupan propuestas (mesa, pósters, y cualquier tipo futuro con etiqueta) */}
                  {PROPUESTAS_COMPATIBLES[act.tipo]?.etiqueta && propAct.length > 0 && (
                    <ul style={{ margin: '0.25rem 0 0.25rem 1rem', padding: 0 }}>
                      {propAct.map(p => (
                        <li key={p.id}>
                          <span style={{ fontWeight: 500 }}>{p.titulo}</span>
                          <span style={{ color: '#666' }}> · {p.autor.nombre}</span>
                          {PROPUESTAS_COMPATIBLES[act.tipo]?.mostrarEje && (
                            <span style={{ color: '#999' }}> · Eje {p.eje}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {act.moderador && PROPUESTAS_COMPATIBLES[act.tipo]?.etiqueta && (
                    <p><span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Moderador </span>{act.moderador}</p>
                  )}

                  {/* Resumen */}
                  {act.resumen && (
                    <p style={{ marginTop: '0.5rem', color: '#555', borderTop: '1px solid rgba(35,22,81,0.08)', paddingTop: '0.5rem' }}>
                      {act.resumen}
                    </p>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>

    </div>
  )
}
