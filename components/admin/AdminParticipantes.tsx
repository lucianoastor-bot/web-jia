// components/admin/AdminParticipantes.tsx
'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import type { Propuesta } from '@/types'
import { useInvitados }  from '@/lib/hooks/useInvitados'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { actualizarParticipanteEnPropuesta } from '@/lib/services/propuestas'
import { COORDINADORES, COMITE_ORGANIZADOR, COMITE_ACADEMICO, PERTENENCIAS } from '@/congreso.config'

// ── Tipos ─────────────────────────────────────────────────────

type Persona = {
  nombre:       string
  email:        string
  dni:          string
  institucion:  string
  pertenencia:  string
  pago:         boolean
  acreditado:   boolean
  categorias:   string[]
  propuestaIds: string[]
}

type EditandoState = {
  clave:     string   // clave(p.nombre) — identifica la fila de forma única
  tipo:      'pertenencia' | 'pago'
  valorTemp: string
}

type ModalState = {
  ids: string[]
  idx: number
}

// ── Constantes ────────────────────────────────────────────────

const CATEGORIAS_ORDEN = [
  'Coordinación',
  'Comité Organizador',
  'Comité Académico',
  'Invitado/a',
  'Participante',
  'Voluntario/a',
] as const

const ORGS = ['Coordinación', 'Comité Organizador', 'Comité Académico'] as const

const CATEGORIA_STYLE: Record<string, { bg: string; color: string }> = {
  'Coordinación':       { bg: 'rgba(35,22,81,0.82)',    color: '#fff'    },
  'Comité Organizador': { bg: 'rgba(35,116,171,0.14)',  color: '#1a5a8a' },
  'Comité Académico':   { bg: 'rgba(58,116,171,0.10)',  color: '#2a5580' },
  'Invitado/a':         { bg: 'rgba(77,204,189,0.18)',  color: '#1a8c7e' },
  'Participante':       { bg: 'rgba(200,150,50,0.12)',  color: '#8c6520' },
  'Voluntario/a':       { bg: 'rgba(100,180,100,0.14)', color: '#3a7a3a' },
}

const PERTENENCIA_STYLE: Record<string, { bg: string; color: string }> = {
  externo:    { bg: 'rgba(124,92,191,0.12)',  color: '#5c32a0' },
  comunidad:  { bg: 'rgba(35,116,171,0.13)',  color: '#1a5a8a' },
  estudiante: { bg: 'rgba(77,204,189,0.16)',  color: '#1a8c7e' },
}

// ── Helpers ───────────────────────────────────────────────────

const clave      = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ')
const apellidoDe = (n: string) => n.trim().split(/\s+/).slice(-1)[0]
const etiquetaP  = (v: string) => PERTENENCIAS.find(p => p.valor === v)?.etiqueta ?? v

/** Muestra flags pago/acreditación solo para participantes (no org ni invitados puros) */
const verFlags = (p: Persona) =>
  p.categorias.includes('Participante') &&
  !(p.categorias as string[]).some(c => (ORGS as readonly string[]).includes(c)) &&
  !p.categorias.includes('Invitado/a')

const badgeBase: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
}

// ── Componente ────────────────────────────────────────────────

type Props = { onIrAPropuesta?: (id: string) => void }

export default function AdminParticipantes({ onIrAPropuesta }: Props = {}) {
  const { invitados,  loading: loadInv  } = useInvitados()
  const { propuestas, loading: loadProp, cargar: cargarP } = usePropuestas()

  const [filtro,    setFiltro]    = useState<string>('todas')
  const [editando,  setEditando]  = useState<EditandoState | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modal,     setModal]     = useState<ModalState | null>(null)

  // ── Easter egg ────────────────────────────────────────────
  const [eggHover, setEggHover] = useState(false)
  const [eggOpen,  setEggOpen]  = useState(false)
  const [asciiArt, setAsciiArt] = useState<string>('')
  const EGG_CLAVE = 'luciano astor'

  // Precarga el ASCII al montar — sin async en el click
  useEffect(() => {
    fetch('/ascii-2.txt')
      .then(r => { if (!r.ok) throw new Error(); return r.text() })
      .then(setAsciiArt)
      .catch(() => setAsciiArt('[ ascii art no disponible ]'))
  }, [])

  // ── Listado unificado ──────────────────────────────────────

  const personas = useMemo(() => {
    const map = new Map<string, Persona>()

    const agregar = (
      nombre: string, categoria: string,
      email = '', dni = '', institucion = '', pertenencia = '', propuestaId = '',
      pago = false, acreditado = false,
    ) => {
      if (!nombre.trim()) return
      const k = clave(nombre)
      if (map.has(k)) {
        const p = map.get(k)!
        if (!p.categorias.includes(categoria)) p.categorias.push(categoria)
        if (!p.email       && email)       p.email       = email
        if (!p.dni         && dni)         p.dni         = dni
        if (!p.institucion && institucion) p.institucion = institucion
        if (!p.pertenencia && pertenencia) p.pertenencia = pertenencia
        if (!p.pago        && pago)        p.pago        = pago
        if (!p.acreditado  && acreditado)  p.acreditado  = acreditado
        if (propuestaId && !p.propuestaIds.includes(propuestaId)) p.propuestaIds.push(propuestaId)
      } else {
        map.set(k, {
          nombre: nombre.trim(), email, dni, institucion, pertenencia,
          pago, acreditado, categorias: [categoria],
          propuestaIds: propuestaId ? [propuestaId] : [],
        })
      }
    }

    COORDINADORES    .forEach(n => agregar(n, 'Coordinación'))
    COMITE_ORGANIZADOR.forEach(n => agregar(n, 'Comité Organizador'))
    COMITE_ACADEMICO  .forEach(n => agregar(n, 'Comité Académico'))

    invitados.forEach(inv =>
      agregar(inv.nombre, 'Invitado/a', inv.email ?? '', '', inv.institucion ?? '')
    )

    propuestas.forEach(prop => {
      agregar(prop.autor.nombre,  'Participante',
        prop.autor.email, prop.autor.documento, prop.autor.institucion, prop.autor.pertenencia,
        prop.id, prop.autor.pago ?? false, prop.autor.acreditado ?? false)

      ;(prop.coautores ?? []).forEach(c =>
        agregar(c.nombre, 'Participante',
          c.email, c.documento, c.institucion, c.pertenencia,
          prop.id, c.pago ?? false, c.acreditado ?? false)
      )

      ;(prop.participantes ?? []).forEach(pa =>
        agregar(pa.nombre, 'Participante',
          pa.email, pa.documento, pa.institucion, pa.pertenencia,
          prop.id, pa.pago ?? false, pa.acreditado ?? false)
      )
    })

    return [...map.values()].sort((a, b) =>
      apellidoDe(a.nombre).localeCompare(apellidoDe(b.nombre), 'es')
    )
  }, [invitados, propuestas])

  const filtradas = filtro === 'todas'
    ? personas
    : personas.filter(p => p.categorias.includes(filtro))

  const conteos = useMemo(() =>
    Object.fromEntries(CATEGORIAS_ORDEN.map(cat => [
      cat, personas.filter(p => p.categorias.includes(cat)).length,
    ]))
  , [personas])

  // ── Edición inline ─────────────────────────────────────────
  // Guarda directamente en propuesta:autor / propuesta:coautores[]

  const handleGuardar = useCallback(async () => {
    if (!editando) return
    setGuardando(true)
    try {
      // Propuestas donde aparece esta persona
      const persona = personas.find(p => clave(p.nombre) === editando.clave)
      const propAfectadas = propuestas.filter(pr => persona?.propuestaIds.includes(pr.id))

      const datos =
        editando.tipo === 'pertenencia'
          ? { pertenencia: (editando.valorTemp || undefined) as typeof PERTENENCIAS[number]['valor'] | undefined }
          : { pago: editando.valorTemp === 'true' }

      for (const prop of propAfectadas) {
        await actualizarParticipanteEnPropuesta(prop, editando.clave, datos)
      }

      await cargarP()
      setEditando(null)
    } finally {
      setGuardando(false)
    }
  }, [editando, personas, propuestas, cargarP])

  // ── PDF ────────────────────────────────────────────────────

  const descargarPDF = async () => {
    const { default: jsPDF }     = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    doc.setFontSize(14)
    doc.setTextColor(35, 22, 81)
    doc.text('Participantes · Jornadas La IA en debate', 10, 16)

    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(
      [filtro !== 'todas' ? filtro : 'Todos', `${filtradas.length} personas`, new Date().toLocaleDateString('es-AR')].join('  ·  '),
      10, 22,
    )

    const rows = filtradas.map((p, i) => {
      const flags = verFlags(p)
      const cats  = [...p.categorias]
        .sort((a, b) =>
          CATEGORIAS_ORDEN.indexOf(a as typeof CATEGORIAS_ORDEN[number]) -
          CATEGORIAS_ORDEN.indexOf(b as typeof CATEGORIAS_ORDEN[number])
        )
        .join(', ')
      return [
        String(i + 1),
        p.nombre,
        p.email,
        p.dni,
        p.institucion,
        p.pertenencia ? etiquetaP(p.pertenencia) : '',
        cats,
        flags ? (p.pago       ? 'Sí' : 'No') : '—',
        flags ? (p.acreditado ? 'Sí' : 'No') : '—',
      ]
    })

    autoTable(doc, {
      startY: 26,
      head: [['#', 'Apellido y nombre', 'Email', 'DNI', 'Institución', 'Pertenencia', 'Categorías', 'Pagó', 'Acreditado']],
      body: rows,
      styles:     { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [35, 22, 81], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 48, fontStyle: 'bold' },
        2: { cellWidth: 55 },
        3: { cellWidth: 20 },
        4: { cellWidth: 48 },
        5: { cellWidth: 26 },
        6: { cellWidth: 36 },
        7: { cellWidth: 11, halign: 'center' },
        8: { cellWidth: 16, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const v = data.cell.text[0]
        if (data.column.index === 7 && v !== '—') {
          data.cell.styles.fillColor = v === 'Sí' ? [228, 247, 245] : [251, 234, 232]
          data.cell.styles.textColor = v === 'Sí' ? [ 26, 140, 126] : [176,  48,  32]
        }
        if (data.column.index === 8 && v !== '—') {
          data.cell.styles.fillColor = v === 'Sí' ? [228, 247, 245] : [245, 245, 250]
          data.cell.styles.textColor = v === 'Sí' ? [ 26, 140, 126] : [100, 100, 140]
        }
      },
      alternateRowStyles: { fillColor: [248, 248, 252] },
    })

    doc.save(`participantes-${filtro === 'todas' ? 'todos' : filtro.replace(/\//g, '-').toLowerCase()}.pdf`)
  }

  // ── Loading ────────────────────────────────────────────────

  if (loadInv || loadProp) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Participantes</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="admin-module">

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
        <h2 className="admin-module__title" style={{ margin: 0 }}>
          Participantes ({filtradas.length}{filtro !== 'todas' ? ` de ${personas.length}` : ''})
        </h2>
        <button
          className="admin-btn admin-btn--ghost"
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.8rem' }}
          onClick={descargarPDF}
        >
          Descargar PDF
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          className={`admin-btn ${filtro === 'todas' ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
          onClick={() => setFiltro('todas')}
        >
          Todas ({personas.length})
        </button>
        {CATEGORIAS_ORDEN.map(cat => (
          <button
            key={cat}
            className={`admin-btn ${filtro === cat ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
            onClick={() => setFiltro(cat)}
          >
            {cat} ({conteos[cat]})
          </button>
        ))}
      </div>

      {/* Listado */}
      <div className="admin-list">
        {filtradas.length === 0 && (
          <p className="admin-list__empty">Sin personas en esta categoría.</p>
        )}

        {filtradas.map((p, i) => {
          const tieneFlags   = verFlags(p)
          const estaEditando = editando?.clave === clave(p.nombre)
          const esEgg        = clave(p.nombre) === EGG_CLAVE

          return (
            <div
              key={i}
              style={{ borderBottom: '1px solid rgba(35,22,81,0.06)' }}
              onMouseEnter={() => esEgg && setEggHover(true)}
              onMouseLeave={() => esEgg && setEggHover(false)}
            >

              {/* Fila principal */}
              <div className="admin-list__item" style={{ borderBottom: 'none', alignItems: 'flex-start', gap: '1rem' }}>

                {/* Datos */}
                <div className="admin-list__item-info" style={{ flex: 1 }}>
                  <p
                    className="admin-list__item-name"
                    style={esEgg && eggHover ? { color: '#2374AB', transition: 'color 0.2s' } : undefined}
                  >{p.nombre}</p>
                  {(p.email || p.dni) && (
                    <p className="admin-list__item-sub" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {[p.email, p.dni ? `DNI ${p.dni}` : ''].filter(Boolean).join('  ·  ')}
                    </p>
                  )}
                  {p.institucion && (
                    <p className="admin-list__item-sub" style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                      {p.institucion}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>

                  {/* Categorías */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {[...p.categorias]
                      .sort((a, b) =>
                        CATEGORIAS_ORDEN.indexOf(a as typeof CATEGORIAS_ORDEN[number]) -
                        CATEGORIAS_ORDEN.indexOf(b as typeof CATEGORIAS_ORDEN[number])
                      )
                      .map(cat => {
                        const s = CATEGORIA_STYLE[cat] ?? { bg: 'rgba(35,22,81,0.07)', color: 'rgba(35,22,81,0.6)' }
                        const eggBadge  = esEgg && cat === 'Coordinación'
                        const eggActivo = eggBadge && eggHover
                        return (
                          <span
                            key={cat}
                            style={{
                              ...badgeBase,
                              background: eggActivo ? 'rgba(35,116,171,0.18)' : s.bg,
                              color:      eggActivo ? '#2374AB'               : s.color,
                              cursor:     eggBadge  ? 'pointer'               : undefined,
                              transition: 'background 0.2s, color 0.2s',
                            }}
                            onClick={eggBadge ? () => setEggOpen(true) : undefined}
                          >{cat}</span>
                        )
                      })}
                  </div>

                  {/* Status badges + link */}
                  {(tieneFlags || p.propuestaIds.length > 0) && (
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>

                      {/* Pertenencia — doble clic para editar */}
                      {tieneFlags && (() => {
                        const s = PERTENENCIA_STYLE[p.pertenencia] ?? { bg: 'rgba(35,22,81,0.07)', color: 'rgba(35,22,81,0.5)' }
                        return (
                          <span
                            title="Doble clic para editar"
                            style={{ ...badgeBase, background: s.bg, color: s.color, cursor: 'pointer', userSelect: 'none' }}
                            onDoubleClick={() => setEditando({ clave: clave(p.nombre), tipo: 'pertenencia', valorTemp: p.pertenencia })}
                          >
                            {p.pertenencia ? etiquetaP(p.pertenencia) : 'Sin pertenencia'}
                          </span>
                        )
                      })()}

                      {/* Pagó — doble clic para editar */}
                      {tieneFlags && (
                        <span
                          title="Doble clic para editar"
                          style={{
                            ...badgeBase,
                            background: p.pago ? 'rgba(77,204,189,0.18)'  : 'rgba(251,234,232,0.9)',
                            color:      p.pago ? '#1a8c7e'                 : '#b03020',
                            cursor: 'pointer', userSelect: 'none',
                          }}
                          onDoubleClick={() => setEditando({ clave: clave(p.nombre), tipo: 'pago', valorTemp: String(p.pago) })}
                        >
                          {p.pago ? 'Pagó' : 'No pagó'}
                        </span>
                      )}

                      {/* Acreditado — lectura, se edita desde /acreditacion */}
                      {tieneFlags && (
                        <span style={{
                          ...badgeBase,
                          background: p.acreditado ? 'rgba(77,204,189,0.18)'  : 'rgba(35,22,81,0.06)',
                          color:      p.acreditado ? '#1a8c7e'                 : 'rgba(35,22,81,0.4)',
                        }}>
                          {p.acreditado ? 'Acreditado' : 'No acreditado'}
                        </span>
                      )}

                      {/* Link a propuesta — abre el card */}
                      {p.propuestaIds.length > 0 && (
                        <button
                          onClick={() => setModal({ ids: p.propuestaIds, idx: 0 })}
                          style={{
                            background: 'none', border: 'none', padding: '1px 4px',
                            fontSize: '0.72rem', color: 'var(--c-turq)',
                            cursor: 'pointer', fontWeight: 600, letterSpacing: '0.02em',
                          }}
                          title={p.propuestaIds.length > 1 ? `${p.propuestaIds.length} propuestas` : 'Ver propuesta'}
                        >
                          ver propuesta{p.propuestaIds.length > 1 ? ` (${p.propuestaIds.length})` : ''} →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de edición inline */}
              {estaEditando && (
                <div style={{
                  padding: '0.6rem 1rem 0.7rem',
                  background: 'rgba(35,22,81,0.03)',
                  borderTop: '1px solid rgba(35,22,81,0.07)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '0.79rem', color: 'rgba(35,22,81,0.5)', fontWeight: 600 }}>
                    {editando!.tipo === 'pertenencia' ? 'Pertenencia:' : 'Pago:'}
                  </span>

                  {editando!.tipo === 'pertenencia' ? (
                    <select
                      value={editando!.valorTemp}
                      onChange={e => setEditando({ ...editando!, valorTemp: e.target.value })}
                      style={{ fontSize: '0.82rem', padding: '0.2rem 0.5rem', borderRadius: 6, border: '1px solid rgba(35,22,81,0.2)', background: '#fff' }}
                    >
                      <option value="">Sin especificar</option>
                      {PERTENENCIAS.map(pp => (
                        <option key={pp.valor} value={pp.valor}>{pp.etiqueta}</option>
                      ))}
                    </select>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editando!.valorTemp === 'true'}
                        onChange={e => setEditando({ ...editando!, valorTemp: String(e.target.checked) })}
                      />
                      Realizó el pago
                    </label>
                  )}

                  <button
                    className="admin-btn admin-btn--primary"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.8rem' }}
                    onClick={handleGuardar}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    className="admin-btn admin-btn--ghost"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              )}

            </div>
          )
        })}
      </div>

      {/* Easter egg modal */}
      {eggOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEggOpen(false)}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setEggOpen(false)}
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', cursor: 'pointer' }}
            >✕</button>
            <pre style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.55rem', lineHeight: 1.15,
              color: '#4dccbd', margin: 0, padding: '1.5rem',
              whiteSpace: 'pre', overflowX: 'auto', userSelect: 'none',
            }}>
{asciiArt || 'Cargando...'}</pre>
          </div>
        </div>
      )}

      {/* Modal de propuesta */}
      {modal && (() => {
        const propuesta: Propuesta | undefined = propuestas.find(pr => pr.id === modal.ids[modal.idx])
        if (!propuesta) return null
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setModal(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 560, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(35,22,81,0.4)', marginBottom: '0.3rem' }}>
                    {propuesta.tipo} · Eje {propuesta.eje}
                    {modal.ids.length > 1 && <span style={{ marginLeft: '0.5rem' }}>· {modal.idx + 1} de {modal.ids.length}</span>}
                  </p>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#231651', lineHeight: 1.3, margin: 0 }}>
                    {propuesta.titulo}
                  </h3>
                </div>
                <button
                  onClick={() => setModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'rgba(35,22,81,0.35)', padding: '0 0.2rem', flexShrink: 0 }}
                >✕</button>
              </div>

              {/* Contenido */}
              <div style={{ fontSize: '0.82rem', color: 'rgba(35,22,81,0.75)', lineHeight: 1.6 }}>
                <p>
                  <strong>Autor:</strong> {propuesta.autor.nombre}
                  {propuesta.autor.email && <span style={{ opacity: 0.7 }}> — {propuesta.autor.email}</span>}
                </p>
                {(propuesta.coautores ?? []).length > 0 && (
                  <p><strong>Coautores:</strong> {propuesta.coautores!.map(c => c.nombre).join(', ')}</p>
                )}
                {(propuesta.participantes ?? []).length > 0 && (
                  <p><strong>Participantes:</strong> {propuesta.participantes!.map(pa => pa.nombre).join(', ')}</p>
                )}
                {propuesta.estado && (
                  <p><strong>Estado:</strong> {propuesta.estado}</p>
                )}
                {propuesta.resumen && (
                  <p style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(35,22,81,0.08)', paddingTop: '0.75rem' }}>
                    {propuesta.resumen}
                  </p>
                )}
                {propuesta.resumenLink && (
                  <a href={propuesta.resumenLink} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: '0.5rem', color: '#4dccbd', fontSize: '0.8rem' }}>
                    Ver resumen →
                  </a>
                )}
              </div>

              {/* Footer: nav + editar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Prev / Next */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {modal.ids.length > 1 && (
                    <>
                      <button className="admin-btn admin-btn--ghost" style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
                        disabled={modal.idx === 0}
                        onClick={() => setModal({ ...modal, idx: modal.idx - 1 })}
                      >← Anterior</button>
                      <button className="admin-btn admin-btn--ghost" style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
                        disabled={modal.idx === modal.ids.length - 1}
                        onClick={() => setModal({ ...modal, idx: modal.idx + 1 })}
                      >Siguiente →</button>
                    </>
                  )}
                </div>
                {/* Editar */}
                {onIrAPropuesta && (
                  <button
                    className="admin-btn admin-btn--primary"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.9rem' }}
                    onClick={() => { setModal(null); onIrAPropuesta(propuesta.id) }}
                  >
                    Editar propuesta →
                  </button>
                )}
              </div>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
