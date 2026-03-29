// components/admin/AdminPropuestas.tsx
'use client'

import { useState } from 'react'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { agregarPropuesta, actualizarPropuesta, actualizarEstado, eliminarPropuesta } from '@/lib/services/propuestas'
import { TIPOS_PROPUESTA, PERTENENCIAS, ESTADOS_PROPUESTA, EJES } from '@/congreso.config'
import { CODIGOS_PRIORITARIOS, CODIGOS_RESTO } from '@/lib/data/codigosPais'
import type { Propuesta, TipoPropuesta, EstadoPropuesta, Participante } from '@/types'

// ── Tipos locales ─────────────────────────────────────────────

type DatosAutor = {
  nombre:        string
  institucion:   string
  email:         string
  documento:     string
  celularCodigo: string
  celular:       string
  pertenencia:   Participante['pertenencia']
}


type DatosPropuesta = {
  tipo:          TipoPropuesta
  titulo:        string
  resumen:       string
  eje:           string
  estado:        EstadoPropuesta
  autor:         DatosAutor
  descriptor:    string        // solo para tipo 'otro'
  participantes: DatosAutor[]  // solo para tipo 'panel'
}

// ── Constantes ────────────────────────────────────────────────

const VACIO_AUTOR: DatosAutor = {
  nombre: '', institucion: '', email: '', documento: '',
  celularCodigo: '+54', celular: '', pertenencia: 'externo',
}

const VACIO: DatosPropuesta = {
  tipo: 'ponencia', titulo: '', resumen: '',
  eje: '01', estado: 'pendiente', autor: VACIO_AUTOR,
  descriptor: '', participantes: [],
}

const BADGE_ESTADO: Record<EstadoPropuesta, string> = {
  'pendiente': 'admin-badge--pending',
  'revisión':  'admin-badge--revision',
  'aceptada':  'admin-badge--aceptada',
  'rechazada': 'admin-badge--rechazada',
}

// ── Componente ────────────────────────────────────────────────

export default function AdminPropuestas() {
  const { propuestas, loading, cargar } = usePropuestas()

  const [form, setForm]         = useState<DatosPropuesta>(VACIO)
  const [editando, setEditando] = useState<string | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState<string | null>(null)

  // Filtros
  const [filtroTipo,   setFiltroTipo]   = useState<TipoPropuesta | 'todas'>('todas')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPropuesta | 'todas'>('todas')
  const [filtroEje,    setFiltroEje]    = useState<string>('todos')

  // ── Handlers form ──────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleAutorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, autor: { ...f.autor, [e.target.name]: e.target.value } }))
  }

  const handleParticipanteChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => {
      const participantes = [...f.participantes]
      participantes[idx] = { ...participantes[idx], [e.target.name]: e.target.value }
      return { ...f, participantes }
    })
  }

  const agregarParticipante = () => {
    setForm(f => ({ ...f, participantes: [...f.participantes, { ...VACIO_AUTOR }] }))
  }

  const quitarParticipante = (idx: number) => {
    setForm(f => ({ ...f, participantes: f.participantes.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)
    try {
      if (editando) {
        await actualizarPropuesta(editando, form)
        setMensaje('Propuesta actualizada.')
      } else {
        await agregarPropuesta(form)
        setMensaje('Propuesta agregada.')
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

  const handleEditar = (p: Propuesta) => {
    setForm({
      tipo:    p.tipo,
      titulo:  p.titulo,
      resumen: p.resumen,
      eje:     p.eje,
      estado:  p.estado,
      descriptor:    p.descriptor ?? '',
      participantes: (p.participantes ?? []).map(pa => ({
        nombre:        pa.nombre,
        institucion:   pa.institucion,
        email:         pa.email,
        documento:     pa.documento ?? '',
        celularCodigo: pa.celularCodigo ?? '+54',
        celular:       pa.celular ?? '',
        pertenencia:   pa.pertenencia,
      })),
      autor: {
        nombre:        p.autor.nombre,
        institucion:   p.autor.institucion,
        email:         p.autor.email,
        documento:     p.autor.documento,
        celularCodigo: p.autor.celularCodigo ?? '+54',
        celular:       p.autor.celular ?? '',
        pertenencia:   p.autor.pertenencia,
      },
    })
    setEditando(p.id)
    setMensaje(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelar = () => {
    setForm(VACIO)
    setEditando(null)
    setMensaje(null)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta propuesta?')) return
    await eliminarPropuesta(id)
    if (editando === id) handleCancelar()
    await cargar()
  }

  // Cambio de estado directo desde la lista
  const handleCambiarEstado = async (id: string, estado: EstadoPropuesta) => {
    await actualizarEstado(id, estado)
    await cargar()
  }

  // ── Filtrado y stats ───────────────────────────────────────

  const propuestasFiltradas = propuestas.filter(p => {
    if (filtroTipo   !== 'todas' && p.tipo   !== filtroTipo)   return false
    if (filtroEstado !== 'todas' && p.estado !== filtroEstado) return false
    if (filtroEje    !== 'todos' && p.eje    !== filtroEje)    return false
    return true
  })

  const stats = {
    total:     propuestas.length,
    pendiente: propuestas.filter(p => p.estado === 'pendiente').length,
    revision:  propuestas.filter(p => p.estado === 'revisión').length,
    aceptada:  propuestas.filter(p => p.estado === 'aceptada').length,
    rechazada: propuestas.filter(p => p.estado === 'rechazada').length,
  }

  const tipoEtiqueta = (tipo: TipoPropuesta) =>
    TIPOS_PROPUESTA.find(t => t.valor === tipo)?.etiqueta ?? tipo

  const ejeEtiqueta = (num: string) =>
    EJES.find(e => e.num === num)?.titulo ?? num

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="admin-module">

      {/* ── Formulario ── */}
      <h2 className="admin-module__title">
        {editando ? 'Editar propuesta' : 'Agregar propuesta'}
      </h2>

      <form className="admin-form" onSubmit={handleSubmit}>

        <div className="admin-form__grid">

          {/* Tipo */}
          <div className="admin-form__field">
            <label className="admin-form__label">Tipo</label>
            <select className="admin-form__input" name="tipo" value={form.tipo} onChange={handleChange}>
              {TIPOS_PROPUESTA.map(t => (
                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="admin-form__field">
            <label className="admin-form__label">Estado</label>
            <select className="admin-form__input" name="estado" value={form.estado} onChange={handleChange}>
              {ESTADOS_PROPUESTA.map(e => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </div>

          {/* Eje */}
          <div className="admin-form__field">
            <label className="admin-form__label">Eje temático</label>
            <select className="admin-form__input" name="eje" value={form.eje} onChange={handleChange}>
              {EJES.map(e => (
                <option key={e.num} value={e.num}>{e.num} — {e.titulo}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div className="admin-form__field">
            <label className="admin-form__label">Título</label>
            <input
              className="admin-form__input"
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              required
            />
          </div>

        </div>

        {/* Autor */}
        <p className="admin-form__label" style={{ marginBottom: '0.75rem', marginTop: '0.5rem', opacity: 0.5, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Autor/a
        </p>
        <div className="admin-form__grid">

          <div className="admin-form__field">
            <label className="admin-form__label">Nombre</label>
            <input
              className="admin-form__input"
              type="text"
              name="nombre"
              value={form.autor.nombre}
              onChange={handleAutorChange}
              required
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Institución</label>
            <input
              className="admin-form__input"
              type="text"
              name="institucion"
              value={form.autor.institucion}
              onChange={handleAutorChange}
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Email</label>
            <input
              className="admin-form__input"
              type="email"
              name="email"
              value={form.autor.email}
              onChange={handleAutorChange}
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Celular</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select
                className="admin-form__input"
                style={{ width: '130px', flexShrink: 0 }}
                name="celularCodigo"
                value={form.autor.celularCodigo}
                onChange={handleAutorChange}
              >
                <optgroup label="- · -">
                  {CODIGOS_PRIORITARIOS.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} {c.pais}</option>
                  ))}
                </optgroup>
                <optgroup label="- ·· -">
                  {CODIGOS_RESTO.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} {c.pais}</option>
                  ))}
                </optgroup>
              </select>
              <input
                className="admin-form__input"
                type="tel"
                name="celular"
                value={form.autor.celular}
                onChange={handleAutorChange}
                placeholder="341 5551234"
                pattern="[\d\s\-\(\)]{6,20}"
                title="Solo números, espacios y los caracteres - ( )"
              />
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">DNI / Pasaporte</label>
            <input
              className="admin-form__input"
              type="text"
              name="documento"
              value={form.autor.documento}
              onChange={handleAutorChange}
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Pertenencia</label>
            <select
              className="admin-form__input"
              name="pertenencia"
              value={form.autor.pertenencia}
              onChange={handleAutorChange}
            >
              {PERTENENCIAS.map(p => (
                <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Participantes del panel */}
        {form.tipo === 'panel' && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.75rem' }}>
              <p className="admin-form__label" style={{ opacity: 0.5, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                Participantes del panel
              </p>
              <button type="button" className="admin-btn admin-btn--small" onClick={agregarParticipante}>
                + Agregar
              </button>
            </div>
            {form.participantes.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: '0.75rem' }}>
                El autor/a es el coordinador del panel. Agregá los demás participantes.
              </p>
            )}
            {form.participantes.map((p, idx) => (
              <div key={idx} style={{ border: '1px solid rgba(35,22,81,0.1)', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.75rem', position: 'relative' }}>
                <p style={{ fontSize: '0.68rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Participante {idx + 1}
                </p>
                <div className="admin-form__grid">
                  <div className="admin-form__field">
                    <label className="admin-form__label">Nombre</label>
                    <input className="admin-form__input" type="text" name="nombre" value={p.nombre} onChange={e => handleParticipanteChange(idx, e)} required />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Institución</label>
                    <input className="admin-form__input" type="text" name="institucion" value={p.institucion} onChange={e => handleParticipanteChange(idx, e)} />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Email</label>
                    <input className="admin-form__input" type="email" name="email" value={p.email} onChange={e => handleParticipanteChange(idx, e)} />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Pertenencia</label>
                    <select className="admin-form__input" name="pertenencia" value={p.pertenencia} onChange={e => handleParticipanteChange(idx, e)}>
                      {PERTENENCIAS.map(per => (
                        <option key={per.valor} value={per.valor}>{per.etiqueta}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--danger"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => quitarParticipante(idx)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resumen */}
        <div className="admin-form__field admin-form__field--full" style={{ marginTop: '0.5rem' }}>
          <label className="admin-form__label">Resumen</label>
          <textarea
            className="admin-form__textarea"
            name="resumen"
            value={form.resumen}
            onChange={handleChange}
            rows={5}
            required
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

      {/* ── Stats + filtros ── */}
      <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h2 className="admin-module__title" style={{ margin: 0 }}>
            Propuestas ({propuestasFiltradas.length} / {stats.total})
          </h2>
          <span className="admin-badge admin-badge--pending">pendientes {stats.pendiente}</span>
          <span className="admin-badge admin-badge--revision">en revisión {stats.revision}</span>
          <span className="admin-badge admin-badge--aceptada">aceptadas {stats.aceptada}</span>
          <span className="admin-badge admin-badge--rechazada">rechazadas {stats.rechazada}</span>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="admin-form__input"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value as TipoPropuesta | 'todas')}
          >
            <option value="todas">Todos los tipos</option>
            {TIPOS_PROPUESTA.map(t => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>

          <select
            className="admin-form__input"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value as EstadoPropuesta | 'todas')}
          >
            <option value="todas">Todos los estados</option>
            {ESTADOS_PROPUESTA.map(e => (
              <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
            ))}
          </select>

          <select
            className="admin-form__input"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
            value={filtroEje}
            onChange={e => setFiltroEje(e.target.value)}
          >
            <option value="todos">Todos los ejes</option>
            {EJES.map(e => (
              <option key={e.num} value={e.num}>{e.num} — {e.titulo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="admin-list">
        {loading && <p className="admin-list__empty">Cargando...</p>}
        {!loading && propuestasFiltradas.length === 0 && (
          <p className="admin-list__empty">No hay propuestas.</p>
        )}
        {propuestasFiltradas.map(p => (
          <div key={p.id} className="admin-list__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>

            {/* Fila principal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div className="admin-list__item-info" style={{ flex: 1 }}>
                <p className="admin-list__item-name">
                  {p.titulo}
                  <span className={`admin-badge ${BADGE_ESTADO[p.estado]}`}>{p.estado}</span>
                  <span className="admin-badge admin-badge--pending">{tipoEtiqueta(p.tipo)}</span>
                </p>
                <p className="admin-list__item-sub">
                  {p.autor.nombre} · {p.autor.institucion} · Eje {p.eje}
                </p>
              </div>
              <div className="admin-list__item-actions" style={{ flexShrink: 0 }}>
                <button
                  className="admin-btn admin-btn--small"
                  onClick={() => setExpandida(expandida === p.id ? null : p.id)}
                >
                  {expandida === p.id ? 'Cerrar' : 'Ver'}
                </button>
                <button className="admin-btn admin-btn--small" onClick={() => handleEditar(p)}>
                  Editar
                </button>
                <button
                  className="admin-btn admin-btn--small admin-btn--danger"
                  onClick={() => handleEliminar(p.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            {/* Cambio rápido de estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estado:</span>
              {ESTADOS_PROPUESTA.map(e => (
                <button
                  key={e.valor}
                  className={`admin-btn admin-btn--small ${p.estado === e.valor ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                  onClick={() => handleCambiarEstado(p.id, e.valor)}
                  disabled={p.estado === e.valor}
                >
                  {e.etiqueta}
                </button>
              ))}
            </div>

            {/* Resumen expandible */}
            {expandida === p.id && (
              <div style={{ padding: '0.75rem', background: 'rgba(35,22,81,0.04)', borderRadius: '3px', fontSize: '0.88rem', color: '#444', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '0.4rem', fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Eje {p.eje} — {ejeEtiqueta(p.eje)}
                </p>
                <p>{p.resumen}</p>
                {p.autor.email && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                    {p.autor.email} · {PERTENENCIAS.find(per => per.valor === p.autor.pertenencia)?.etiqueta}
                  </p>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* ── Google Sheets (futuro) ── */}
      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(35,22,81,0.08)' }}>
        <button className="admin-btn admin-btn--ghost" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          ↓ Importar desde Google Sheets — próximamente
        </button>
      </div>

    </div>
  )
}
