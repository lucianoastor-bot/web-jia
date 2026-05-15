'use client'
// components/Acreditacion.tsx
// Módulo de acreditación de expositores en el evento.

import { useMemo, useState, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { actualizarParticipanteEnPropuesta, type DatosParticipanteUpdate } from '@/lib/services/propuestas'
import { COORDINADORES, COMITE_ORGANIZADOR, COMITE_ACADEMICO, PERTENENCIAS } from '@/congreso.config'
import type { Propuesta } from '@/types'

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
}

type Editando = { clave: string; campo: 'dni' | 'cuil'; valor: string }
type Filtro   = 'pendientes' | 'todos' | 'acreditados'

// ── Helpers ───────────────────────────────────────────────────

const nc = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ')

const ORGS = new Set([
  ...COORDINADORES,
  ...COMITE_ORGANIZADOR,
  ...COMITE_ACADEMICO,
].map(nc))

const etiquetaPertenencia = (v: string) =>
  PERTENENCIAS.find(p => p.valor === v)?.etiqueta ?? v

function buildPersonas(propuestas: Propuesta[]): PersonaAcred[] {
  const map = new Map<string, PersonaAcred>()

  const agregar = (
    nombre: string, email: string, dni: string, cuil: string,
    pertenencia: string, pago: boolean, acreditado: boolean,
    requierePago: boolean, propuestaId: string,
  ) => {
    if (!nombre.trim()) return
    const k = nc(nombre)
    if (ORGS.has(k)) return   // excluir organización

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
      map.set(k, {
        clave: k, nombre: nombre.trim(), email, dni, cuil,
        pertenencia, pago, acreditado, requierePago,
        propuestaIds: [propuestaId],
      })
    }
  }

  propuestas.forEach(prop => {
    const a = prop.autor
    agregar(a.nombre, a.email, a.documento ?? '', a.cuil ?? '',
      a.pertenencia, a.pago ?? false, a.acreditado ?? false,
      a.requierePago ?? false, prop.id)

    ;(prop.coautores ?? []).forEach(c =>
      agregar(c.nombre, c.email, c.documento ?? '', c.cuil ?? '',
        c.pertenencia, c.pago ?? false, c.acreditado ?? false,
        c.requierePago ?? false, prop.id)
    )
    ;(prop.participantes ?? []).forEach(pa =>
      agregar(pa.nombre, pa.email, pa.documento ?? '', pa.cuil ?? '',
        pa.pertenencia, pa.pago ?? false, pa.acreditado ?? false,
        pa.requierePago ?? false, prop.id)
    )
  })

  return [...map.values()].sort((a, b) => {
    const ap = (n: string) => n.trim().split(/\s+/).slice(-1)[0]
    return ap(a.nombre).localeCompare(ap(b.nombre), 'es')
  })
}

// ── Estilos inline reutilizables ──────────────────────────────

const pill = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.22em 0.65em', borderRadius: 20,
  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', background: bg, color,
  whiteSpace: 'nowrap',
})

// ── Componente principal ──────────────────────────────────────

export default function Acreditacion() {
  const { usuario } = useAuth()
  const { propuestas, loading, cargar } = usePropuestas()
  const router = useRouter()

  const [busqueda,  setBusqueda]  = useState('')
  const [filtro,    setFiltro]    = useState<Filtro>('pendientes')
  const [guardando, setGuardando] = useState<Set<string>>(new Set())
  const [editando,  setEditando]  = useState<Editando | null>(null)

  // ── Lista de personas ──────────────────────────────────────
  const personas = useMemo(() => buildPersonas(propuestas), [propuestas])

  const stats = useMemo(() => ({
    total:        personas.length,
    conPago:      personas.filter(p => p.pago).length,
    acreditados:  personas.filter(p => p.acreditado).length,
    pendientes:   personas.filter(p => p.pago && !p.acreditado).length,
  }), [personas])

  const resultados = useMemo(() => {
    const q = nc(busqueda)
    let lista = personas

    if (q.length >= 2) {
      lista = lista.filter(p =>
        nc(p.nombre).includes(q) ||
        p.dni.includes(q) ||
        p.email.toLowerCase().includes(q)
      )
    }

    if (filtro === 'pendientes')  lista = lista.filter(p => !p.acreditado)
    if (filtro === 'acreditados') lista = lista.filter(p => p.acreditado)

    return lista
  }, [personas, busqueda, filtro])

  // ── Actualización ─────────────────────────────────────────
  const guardar = useCallback(async (clave: string, datos: DatosParticipanteUpdate) => {
    const persona = personas.find(p => p.clave === clave)
    if (!persona) return
    setGuardando(prev => new Set([...prev, clave]))
    try {
      const props = propuestas.filter(p => persona.propuestaIds.includes(p.id))
      for (const prop of props) {
        await actualizarParticipanteEnPropuesta(prop, clave, datos)
      }
      await cargar()
    } finally {
      setGuardando(prev => { const s = new Set(prev); s.delete(clave); return s })
    }
  }, [personas, propuestas, cargar])

  const guardarCampoEdicion = useCallback(async () => {
    if (!editando) return
    await guardar(editando.clave, { [editando.campo === 'dni' ? 'documento' : 'cuil']: editando.valor })
    setEditando(null)
  }, [editando, guardar])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'rgba(35,22,81,0.35)', fontSize: '0.9rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f9' }}>

      {/* ── Top bar ── */}
      <div style={{
        background: 'var(--c-dark)', color: '#fff',
        padding: '0.75rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 'var(--nav-h)', zIndex: 30,
        gap: '1rem',
      }}>
        <div>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--c-turq)', margin: 0 }}>
            Acreditación
          </p>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{usuario?.nombre}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => cargar()}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '0.3rem 0.7rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
          >
            ↺ Actualizar
          </button>
          {usuario?.rol === 'organizador' && (
            <a href="/admin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textDecoration: 'none' }}>Admin</a>
          )}
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.75rem' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '1rem 1rem 4rem' }}>

        {/* ── Búsqueda ── */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="search"
            placeholder="Buscar por nombre, DNI o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem',
              border: '1.5px solid rgba(35,22,81,0.15)', borderRadius: 8,
              fontSize: '1rem', background: '#fff', boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.6rem', marginBottom: '1rem',
        }}>
          {[
            { label: 'Total',        value: stats.total,       color: 'var(--c-dark)' },
            { label: 'Con pago',     value: stats.conPago,     color: '#2a7a3a' },
            { label: 'Pendientes',   value: stats.pendientes,  color: '#b45a00' },
            { label: 'Acreditados',  value: stats.acreditados, color: '#2374ab' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 8, padding: '0.6rem',
              textAlign: 'center', border: '1px solid rgba(35,22,81,0.08)',
            }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.6rem', color: 'rgba(35,22,81,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.2rem 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {([
            ['pendientes',  'Sin acreditar'],
            ['todos',       'Todos'],
            ['acreditados', 'Acreditados'],
          ] as [Filtro, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltro(val)}
              style={{
                padding: '0.45rem 1rem', borderRadius: 20,
                border: filtro === val ? 'none' : '1px solid rgba(35,22,81,0.18)',
                background: filtro === val ? 'var(--c-dark)' : '#fff',
                color: filtro === val ? '#fff' : 'rgba(35,22,81,0.6)',
                fontSize: '0.82rem', fontWeight: filtro === val ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.75rem', color: 'rgba(35,22,81,0.4)' }}>
            {resultados.length} persona{resultados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Listado ── */}
        {resultados.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(35,22,81,0.35)', padding: '3rem 0', fontSize: '0.9rem' }}>
            {busqueda.length >= 2 ? 'Ningún resultado para esa búsqueda.' : 'No hay personas en este estado.'}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {resultados.map(persona => {
            const ocupado = guardando.has(persona.clave)
            const editDNI  = editando?.clave === persona.clave && editando.campo === 'dni'
            const editCUIL = editando?.clave === persona.clave && editando.campo === 'cuil'

            return (
              <div
                key={persona.clave}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  border: persona.acreditado
                    ? '1.5px solid rgba(35,100,60,0.25)'
                    : '1px solid rgba(35,22,81,0.1)',
                  overflow: 'hidden',
                  opacity: ocupado ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Franja superior si está acreditado */}
                {persona.acreditado && (
                  <div style={{
                    background: '#e6f4ec', padding: '0.4rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>✓</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a7a3a' }}>Acreditado/a</span>
                  </div>
                )}

                <div style={{ padding: '1rem' }}>

                  {/* Nombre */}
                  <p style={{
                    fontSize: '1rem', fontWeight: 700, color: 'var(--c-dark)',
                    margin: '0 0 0.15rem', lineHeight: 1.2,
                  }}>
                    {persona.nombre}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(35,22,81,0.45)', margin: '0 0 0.85rem' }}>
                    {persona.email || '—'}
                  </p>

                  {/* DNI / CUIL */}
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    {/* DNI */}
                    <div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', display: 'block' }}>DNI</span>
                      {editDNI ? (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <input
                            autoFocus
                            value={editando!.valor}
                            onChange={e => setEditando({ ...editando!, valor: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') guardarCampoEdicion(); if (e.key === 'Escape') setEditando(null) }}
                            style={{ width: 110, padding: '0.3rem 0.5rem', border: '1.5px solid var(--c-dark)', borderRadius: 4, fontSize: '0.85rem' }}
                          />
                          <button onClick={guardarCampoEdicion} style={{ padding: '0.3rem 0.6rem', background: 'var(--c-dark)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditando(null)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid rgba(35,22,81,0.2)', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.88rem', color: 'var(--c-dark)' }}>
                          {persona.dni || '—'}
                          {' '}
                          <button
                            onClick={() => setEditando({ clave: persona.clave, campo: 'dni', valor: persona.dni })}
                            style={{ background: 'none', border: 'none', color: 'rgba(35,22,81,0.35)', cursor: 'pointer', fontSize: '0.72rem', padding: 0, textDecoration: 'underline' }}
                          >
                            {persona.dni ? 'editar' : '+ ingresar'}
                          </button>
                        </span>
                      )}
                    </div>

                    {/* CUIL */}
                    <div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', display: 'block' }}>CUIL</span>
                      {editCUIL ? (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <input
                            autoFocus
                            value={editando!.valor}
                            onChange={e => setEditando({ ...editando!, valor: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') guardarCampoEdicion(); if (e.key === 'Escape') setEditando(null) }}
                            style={{ width: 130, padding: '0.3rem 0.5rem', border: '1.5px solid var(--c-dark)', borderRadius: 4, fontSize: '0.85rem' }}
                          />
                          <button onClick={guardarCampoEdicion} style={{ padding: '0.3rem 0.6rem', background: 'var(--c-dark)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditando(null)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid rgba(35,22,81,0.2)', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.88rem', color: 'var(--c-dark)' }}>
                          {persona.cuil || '—'}
                          {' '}
                          <button
                            onClick={() => setEditando({ clave: persona.clave, campo: 'cuil', valor: persona.cuil })}
                            style={{ background: 'none', border: 'none', color: 'rgba(35,22,81,0.35)', cursor: 'pointer', fontSize: '0.72rem', padding: 0, textDecoration: 'underline' }}
                          >
                            {persona.cuil ? 'editar' : '+ ingresar'}
                          </button>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pago + Pertenencia */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.85rem' }}>

                    {/* Badge PAGÓ — tappable */}
                    <button
                      onClick={() => guardar(persona.clave, { pago: !persona.pago })}
                      disabled={ocupado}
                      title={persona.pago ? 'Marcar como no pagado' : 'Marcar como pagado'}
                      style={{
                        ...pill(
                          persona.pago ? '#dcf5e7' : '#fde8e8',
                          persona.pago ? '#1e6b35' : '#9b1c1c',
                        ),
                        border: 'none', cursor: 'pointer',
                        padding: '0.35em 0.8em', fontSize: '0.72rem',
                      }}
                    >
                      {persona.pago ? '✓ Pagó' : '✗ Sin pago'}
                    </button>

                    {/* Pertenencia */}
                    <select
                      value={persona.pertenencia}
                      disabled={ocupado}
                      onChange={e => guardar(persona.clave, { pertenencia: e.target.value })}
                      style={{
                        padding: '0.3rem 0.5rem', border: '1px solid rgba(35,22,81,0.2)',
                        borderRadius: 6, fontSize: '0.82rem', color: 'var(--c-dark)',
                        background: '#fff', cursor: 'pointer',
                      }}
                    >
                      {!persona.pertenencia && <option value="">— pertenencia —</option>}
                      {PERTENENCIAS.map(p => (
                        <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requiere boleta */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.82rem', color: 'rgba(35,22,81,0.65)',
                    cursor: 'pointer', marginBottom: '1rem', userSelect: 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={persona.requierePago}
                      disabled={ocupado}
                      onChange={e => guardar(persona.clave, { requierePago: e.target.checked })}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-dark)' }}
                    />
                    Requiere boleta de pago
                  </label>

                  {/* Botón acreditar */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {persona.acreditado && (
                      <button
                        onClick={() => guardar(persona.clave, { acreditado: false })}
                        disabled={ocupado}
                        style={{
                          padding: '0.45rem 0.9rem', border: '1px solid rgba(35,22,81,0.2)',
                          borderRadius: 6, background: 'transparent',
                          color: 'rgba(35,22,81,0.5)', fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Desacreditar
                      </button>
                    )}
                    <button
                      onClick={() => guardar(persona.clave, { acreditado: !persona.acreditado })}
                      disabled={ocupado}
                      style={{
                        padding: '0.65rem 1.5rem',
                        background: persona.acreditado ? '#e6f4ec' : 'var(--c-dark)',
                        color: persona.acreditado ? '#2a7a3a' : '#fff',
                        border: 'none', borderRadius: 8,
                        fontSize: '0.9rem', fontWeight: 700,
                        cursor: ocupado ? 'default' : 'pointer',
                        letterSpacing: '0.04em',
                        minWidth: 140,
                      }}
                    >
                      {ocupado ? '...' : persona.acreditado ? '✓ Acreditado/a' : 'Acreditar →'}
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
