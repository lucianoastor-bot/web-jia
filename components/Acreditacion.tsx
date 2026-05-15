'use client'
// components/Acreditacion.tsx

import { useMemo, useState, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore/lite'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { actualizarParticipanteEnPropuesta, type DatosParticipanteUpdate } from '@/lib/services/propuestas'
import { PERTENENCIAS } from '@/congreso.config'
import type { Propuesta, Invitado } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────

type PersonaAcred = {
  clave:        string
  nombre:       string
  email:        string
  dni:          string
  cuil:         string
  pertenencia:  string
  pago:         boolean
  acreditado:   boolean
  requierePago: boolean
  propuestaIds: string[]
  invitadoId?:         string   // presente si viene de la colección 'invitados'
  institucionInvitado?: string  // institución — solo para invitados
}

type Editando = { clave: string; campo: 'dni' | 'cuil'; valor: string }
type Filtro   = 'pendientes' | 'todos' | 'acreditados'

// ── Helpers ───────────────────────────────────────────────────

const nc = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ')


function buildPersonas(propuestas: Propuesta[], invitados: Invitado[]): PersonaAcred[] {
  const map = new Map<string, PersonaAcred>()

  const agregarDePropuesta = (
    nombre: string, email: string, dni: string, cuil: string,
    pertenencia: string, pago: boolean, acreditado: boolean,
    requierePago: boolean, propuestaId: string,
  ) => {
    if (!nombre.trim()) return
    const k = nc(nombre)
    if (map.has(k)) {
      const p = map.get(k)!
      if (!p.email        && email)        p.email        = email
      if (!p.dni          && dni)          p.dni          = dni
      if (!p.cuil         && cuil)         p.cuil         = cuil
      if (!p.pertenencia  && pertenencia)  p.pertenencia  = pertenencia
      if (!p.pago         && pago)         p.pago         = pago
      if (!p.acreditado   && acreditado)   p.acreditado   = acreditado
      if (!p.requierePago && requierePago) p.requierePago = requierePago
      if (!p.propuestaIds.includes(propuestaId)) p.propuestaIds.push(propuestaId)
    } else {
      map.set(k, { clave: k, nombre: nombre.trim(), email, dni, cuil, pertenencia, pago, acreditado, requierePago, propuestaIds: [propuestaId] })
    }
  }

  propuestas.forEach(prop => {
    const a = prop.autor
    agregarDePropuesta(a.nombre, a.email, a.documento ?? '', a.cuil ?? '', a.pertenencia, a.pago ?? false, a.acreditado ?? false, a.requierePago ?? false, prop.id)
    ;(prop.coautores ?? []).forEach(c =>
      agregarDePropuesta(c.nombre, c.email, c.documento ?? '', c.cuil ?? '', c.pertenencia, c.pago ?? false, c.acreditado ?? false, c.requierePago ?? false, prop.id))
    ;(prop.participantes ?? []).forEach(pa =>
      agregarDePropuesta(pa.nombre, pa.email, pa.documento ?? '', pa.cuil ?? '', pa.pertenencia, pa.pago ?? false, pa.acreditado ?? false, pa.requierePago ?? false, prop.id))
  })

  // Invitados — si ya existe por nombre (también es autor de propuesta),
  // solo se agrega el invitadoId. Si no existe, se crea la entrada.
  invitados.forEach(inv => {
    if (!inv.nombre.trim()) return
    const k = nc(inv.nombre)
    if (map.has(k)) {
      const p = map.get(k)!
      p.invitadoId          = inv.id
      p.institucionInvitado = inv.institucion
      if (!p.acreditado && inv.acreditado) p.acreditado = true
      if (!p.dni && inv.documento) p.dni = inv.documento
      if (!p.cuil && inv.cuil)     p.cuil = inv.cuil
    } else {
      map.set(k, {
        clave: k, nombre: inv.nombre.trim(),
        email: inv.email ?? '', dni: inv.documento ?? '', cuil: inv.cuil ?? '',
        pertenencia: '', pago: false, requierePago: false,
        acreditado: inv.acreditado ?? false,
        propuestaIds: [],
        invitadoId: inv.id, institucionInvitado: inv.institucion,
      })
    }
  })

  return [...map.values()].sort((a, b) => {
    const ap = (n: string) => n.trim().split(/\s+/).slice(-1)[0]
    return ap(a.nombre).localeCompare(ap(b.nombre), 'es')
  })
}

// ── Componente ────────────────────────────────────────────────

export default function Acreditacion() {
  const { usuario } = useAuth()
  const { propuestas, loading: loadingProps, cargar: cargarProps } = usePropuestas()
  const { invitados, loading: loadingInvs,  cargar: cargarInvs  } = useInvitados()
  const router = useRouter()

  const loading = loadingProps || loadingInvs
  const cargar  = useCallback(() => { cargarProps(); cargarInvs() }, [cargarProps, cargarInvs])

  const [busqueda,   setBusqueda]   = useState('')
  const [filtro,     setFiltro]     = useState<Filtro>('pendientes')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [acreditando, setAcreditando] = useState<Set<string>>(new Set())
  const [editando,   setEditando]   = useState<Editando | null>(null)

  // Overrides locales — se aplican sobre los datos de Firestore de forma
  // optimista para evitar recargar la lista entera con cada cambio menor.
  const [overrides, setOverrides] = useState<Map<string, Partial<PersonaAcred>>>(new Map())

  const applyOverride = (clave: string, patch: Partial<PersonaAcred>) =>
    setOverrides(prev => new Map(prev).set(clave, { ...(prev.get(clave) ?? {}), ...patch }))

  // ── Lista de personas con overrides aplicados ─────────────
  const personas = useMemo(() => {
    const base = buildPersonas(propuestas, invitados)
    return base.map(p => {
      const o = overrides.get(p.clave)
      return o ? { ...p, ...o } : p
    })
  }, [propuestas, overrides])

  const stats = useMemo(() => ({
    total:       personas.length,
    conPago:     personas.filter(p => !p.invitadoId && p.pago).length,
    acreditados: personas.filter(p => p.acreditado).length,
    pendientes:  personas.filter(p => !p.acreditado).length,
  }), [personas])

  const resultados = useMemo(() => {
    const q = nc(busqueda)
    let lista = personas
    if (q.length >= 2)
      lista = lista.filter(p => nc(p.nombre).includes(q) || p.dni.includes(q) || p.email.toLowerCase().includes(q))
    if (filtro === 'pendientes')  lista = lista.filter(p => !p.acreditado)
    if (filtro === 'acreditados') lista = lista.filter(p => p.acreditado)
    return lista
  }, [personas, busqueda, filtro])

  // ── Escritura en Firestore (en background, sin recargar) ──
  const escribir = useCallback(async (clave: string, datos: DatosParticipanteUpdate) => {
    const persona = personas.find(p => p.clave === clave)
    if (!persona) return

    // Actualizar en todas las propuestas donde aparece
    if (persona.propuestaIds.length > 0) {
      const props = propuestas.filter(p => persona.propuestaIds.includes(p.id))
      for (const prop of props) {
        await actualizarParticipanteEnPropuesta(prop, clave, datos)
      }
    }

    // Actualizar en la colección 'invitados' si corresponde
    if (persona.invitadoId) {
      const patch: Record<string, unknown> = {}
      if (datos.acreditado !== undefined) patch.acreditado = datos.acreditado
      if (datos.documento  !== undefined) patch.documento  = datos.documento
      if (datos.cuil       !== undefined) patch.cuil       = datos.cuil
      if (Object.keys(patch).length > 0)
        await updateDoc(doc(db, 'invitados', persona.invitadoId), patch)
    }
  }, [personas, propuestas])

  // Cambios menores: override inmediato + write en background
  const guardar = useCallback((clave: string, datos: DatosParticipanteUpdate) => {
    const patch: Partial<PersonaAcred> = {}
    if (datos.pago         !== undefined) patch.pago         = datos.pago
    if (datos.acreditado   !== undefined) patch.acreditado   = datos.acreditado
    if (datos.requierePago !== undefined) patch.requierePago = datos.requierePago
    if (datos.pertenencia  !== undefined) patch.pertenencia  = datos.pertenencia
    if (datos.documento    !== undefined) patch.dni          = datos.documento
    if (datos.cuil         !== undefined) patch.cuil         = datos.cuil
    applyOverride(clave, patch)
    escribir(clave, datos)   // fire and forget — no await
  }, [escribir])

  // Acreditar: override + await + refresca stats pero no scroll
  const acreditar = useCallback(async (clave: string, valor: boolean) => {
    setAcreditando(prev => new Set([...prev, clave]))
    applyOverride(clave, { acreditado: valor })
    try {
      await escribir(clave, { acreditado: valor })
    } finally {
      setAcreditando(prev => { const s = new Set(prev); s.delete(clave); return s })
    }
  }, [escribir])

  // Guardar campo editado inline (DNI/CUIL)
  const guardarCampo = useCallback(() => {
    if (!editando) return
    guardar(editando.clave, { [editando.campo === 'dni' ? 'documento' : 'cuil']: editando.valor })
    setEditando(null)
  }, [editando, guardar])

  const toggleExpandido = (clave: string) =>
    setExpandidos(prev => {
      const s = new Set(prev)
      s.has(clave) ? s.delete(clave) : s.add(clave)
      return s
    })

  const handleLogout = async () => { await signOut(auth); router.push('/login') }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'rgba(35,22,81,0.35)', fontSize: '0.9rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f9' }}>

      {/* Top bar */}
      <div style={{
        background: 'var(--c-dark)', color: '#fff',
        padding: '0.75rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 'var(--nav-h)', zIndex: 30, gap: '1rem',
      }}>
        <div>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--c-turq)', margin: 0 }}>Acreditación</p>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{usuario?.nombre}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => { setOverrides(new Map()); cargar() }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '0.3rem 0.7rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
            ↺ Actualizar
          </button>
          {usuario?.rol === 'organizador' && (
            <a href="/admin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textDecoration: 'none' }}>Admin</a>
          )}
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.75rem' }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '1rem 1rem 4rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total',       value: stats.total,       color: 'var(--c-dark)' },
            { label: 'Con pago',    value: stats.conPago,     color: '#2a7a3a' },
            { label: 'Pendientes',  value: stats.pendientes,  color: '#b45a00' },
            { label: 'Acreditados', value: stats.acreditados, color: '#2374ab' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(35,22,81,0.08)' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.6rem', color: 'rgba(35,22,81,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.2rem 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Búsqueda + filtros */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(35,22,81,0.1)', padding: '0.75rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', pointerEvents: 'none', opacity: 0.4 }}>🔍</span>
            <input
              type="search"
              placeholder="Buscar por nombre, DNI o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', border: '1.5px solid rgba(35,22,81,0.15)', borderRadius: 6, fontSize: '0.95rem', background: '#fafafa', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {([['pendientes', 'Sin acreditar'], ['todos', 'Todos'], ['acreditados', 'Acreditados']] as [Filtro, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFiltro(val)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: 20,
                  border: filtro === val ? 'none' : '1px solid rgba(35,22,81,0.18)',
                  background: filtro === val ? 'var(--c-dark)' : 'transparent',
                  color: filtro === val ? '#fff' : 'rgba(35,22,81,0.6)',
                  fontSize: '0.8rem', fontWeight: filtro === val ? 600 : 400,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'rgba(35,22,81,0.38)' }}>
              {resultados.length} persona{resultados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Listado */}
        {resultados.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(35,22,81,0.35)', padding: '3rem 0', fontSize: '0.9rem' }}>
            {busqueda.length >= 2 ? 'Ningún resultado para esa búsqueda.' : 'No hay personas en este estado.'}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {resultados.map(persona => {
            const expandido  = expandidos.has(persona.clave)
            const enAccion   = acreditando.has(persona.clave)
            const esInvitado = !!persona.invitadoId

            return (
              <div
                key={persona.clave}
                style={{
                  background: '#fff', borderRadius: 10,
                  border: persona.acreditado ? '1.5px solid rgba(35,140,70,0.3)' : '1px solid rgba(35,22,81,0.1)',
                  overflow: 'hidden',
                }}
              >
                {/* ── Fila principal (siempre visible) ── */}
                <div style={{ padding: '0.75rem 1rem 0.65rem' }}>

                  {/* Nombre + chevron */}
                  <div
                    onClick={() => toggleExpandido(persona.clave)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}
                  >
                    <p style={{
                      margin: 0, fontWeight: 700, fontSize: '0.92rem', flex: 1, minWidth: 0,
                      color: persona.acreditado ? '#1e6b35' : 'var(--c-dark)',
                    }}>
                      {persona.acreditado && <span style={{ marginRight: '0.35rem' }}>✓</span>}
                      {persona.nombre}
                    </p>
                    <span style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.7rem', userSelect: 'none', flexShrink: 0 }}>
                      {expandido ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Email + badge + acreditar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(35,22,81,0.42)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {persona.email || '—'}
                    </p>

                    {/* Badge: invitado (no paga) o pago toggle */}
                    {esInvitado ? (
                      <span style={{
                        padding: '0.3em 0.65em', borderRadius: 20,
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                        background: '#eef0fb', color: '#3a3a8c',
                      }}>
                        Invitado/a
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const msg = persona.pago
                            ? `¿Quitar el pago de ${persona.nombre}?`
                            : `¿Confirmar pago de ${persona.nombre}?`
                          if (window.confirm(msg)) guardar(persona.clave, { pago: !persona.pago })
                        }}
                        title={persona.pago ? 'Quitar pago' : 'Marcar como pagado'}
                        style={{
                          padding: '0.3em 0.65em', borderRadius: 20, border: 'none', cursor: 'pointer',
                          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                          background: persona.pago ? '#dcf5e7' : '#fde8e8',
                          color:      persona.pago ? '#1e6b35' : '#9b1c1c',
                        }}
                      >
                        {persona.pago ? '✓ Pagó' : '✗ Sin pago'}
                      </button>
                    )}

                    {/* Botón Acreditar */}
                    <button
                      onClick={() => acreditar(persona.clave, !persona.acreditado)}
                      disabled={enAccion}
                      style={{
                        padding: '0.45rem 1rem', border: 'none', borderRadius: 7,
                        fontSize: '0.82rem', fontWeight: 700, cursor: enAccion ? 'default' : 'pointer',
                        background: persona.acreditado ? '#e6f4ec' : 'var(--c-dark)',
                        color:      persona.acreditado ? '#1e6b35' : '#fff',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {enAccion ? '...' : persona.acreditado ? '✓ Acreditado/a' : 'Acreditar →'}
                    </button>
                  </div>
                </div>

                {/* ── Detalle expandido ── */}
                {expandido && (
                  <div style={{ borderTop: '1px solid rgba(35,22,81,0.07)', padding: '0.9rem 1rem 1rem' }}>

                    {/* DNI / CUIL */}
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                      {(['dni', 'cuil'] as const).map(campo => {
                        const esEditando = editando?.clave === persona.clave && editando.campo === campo
                        const valor = campo === 'dni' ? persona.dni : persona.cuil
                        return (
                          <div key={campo}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', display: 'block', marginBottom: '0.2rem' }}>
                              {campo.toUpperCase()}
                            </span>
                            {esEditando ? (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <input
                                  autoFocus
                                  value={editando!.valor}
                                  onChange={e => setEditando({ ...editando!, valor: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') guardarCampo(); if (e.key === 'Escape') setEditando(null) }}
                                  style={{ width: 130, padding: '0.3rem 0.5rem', border: '1.5px solid var(--c-dark)', borderRadius: 4, fontSize: '0.85rem' }}
                                />
                                <button onClick={guardarCampo} style={{ padding: '0.3rem 0.6rem', background: 'var(--c-dark)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                                <button onClick={() => setEditando(null)} style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: '1px solid rgba(35,22,81,0.2)', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.88rem', color: 'var(--c-dark)' }}>
                                {valor || '—'}
                                {' '}
                                <button
                                  onClick={() => setEditando({ clave: persona.clave, campo, valor: valor ?? '' })}
                                  style={{ background: 'none', border: 'none', color: 'rgba(35,22,81,0.35)', cursor: 'pointer', fontSize: '0.72rem', padding: 0, textDecoration: 'underline' }}
                                >
                                  {valor ? 'editar' : '+ ingresar'}
                                </button>
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Pertenencia/Rol + Requiere boleta */}
                    {esInvitado ? (
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', display: 'block', marginBottom: '0.25rem' }}>Institución</span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--c-dark)' }}>{persona.institucionInvitado || '—'}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', display: 'block', marginBottom: '0.25rem' }}>Pertenencia</span>
                          <select
                            value={persona.pertenencia}
                            onChange={e => guardar(persona.clave, { pertenencia: e.target.value })}
                            style={{ padding: '0.35rem 0.6rem', border: '1px solid rgba(35,22,81,0.2)', borderRadius: 6, fontSize: '0.85rem', color: 'var(--c-dark)', background: '#fff', cursor: 'pointer' }}
                          >
                            {!persona.pertenencia && <option value="">— seleccionar —</option>}
                            {PERTENENCIAS.map(p => (
                              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
                            ))}
                          </select>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.83rem', color: 'rgba(35,22,81,0.65)', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={persona.requierePago}
                            onChange={e => guardar(persona.clave, { requierePago: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-dark)' }}
                          />
                          Requiere boleta de pago
                        </label>
                      </div>
                    )}

                    {/* Desacreditar (solo si está acreditado) */}
                    {persona.acreditado && (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(35,22,81,0.06)' }}>
                        <button
                          onClick={() => acreditar(persona.clave, false)}
                          style={{ padding: '0.35rem 0.8rem', border: '1px solid rgba(35,22,81,0.2)', borderRadius: 6, background: 'transparent', color: 'rgba(35,22,81,0.5)', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Desacreditar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
