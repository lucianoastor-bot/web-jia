// components/admin/AdminPropuestas.tsx
'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { agregarPropuesta, actualizarPropuesta, actualizarEstado, eliminarPropuesta } from '@/lib/services/propuestas'
import { TIPOS_PROPUESTA, PERTENENCIAS, ESTADOS_PROPUESTA, EJES, EVALUADORES } from '@/congreso.config'
import { CODIGOS_PRIORITARIOS, CODIGOS_RESTO } from '@/lib/data/codigosPais'
import type { Propuesta, TipoPropuesta, EstadoPropuesta, Participante } from '@/types'

// ── Tipos locales ─────────────────────────────────────────────

type DatosAutor = {
  nombre:          string
  institucion:     string
  email:           string
  documento:       string
  celularCodigo:   string
  celular:         string
  pertenencia:     Participante['pertenencia']
  tituloPonencia?: string
}


type DatosPropuesta = {
  tipo:          TipoPropuesta
  titulo:        string
  resumen:       string
  resumenLink:   string
  eje:           string
  estado:        EstadoPropuesta
  evaluador:     string
  autor:         DatosAutor
  descriptor:    string        // solo para tipo 'otro'
  participantes: DatosAutor[]  // solo para tipo 'panel'
  coautores:     DatosAutor[]  // ponencia / relato / poster
}

// ── Tipos para importación desde Excel ────────────────────────

type FilaImport = {
  idx:          number
  datos:        DatosPropuesta
  advertencias: string[]
  duplicada:    boolean
  descartar:    boolean
}

// ── Constantes ────────────────────────────────────────────────

const VACIO_AUTOR: DatosAutor = {
  nombre: '', institucion: '', email: '', documento: '',
  celularCodigo: '+54', celular: '', pertenencia: 'externo', tituloPonencia: '',
}

const VACIO: DatosPropuesta = {
  tipo: 'ponencia', titulo: '', resumen: '', resumenLink: '',
  eje: '01', estado: 'pendiente', evaluador: '',
  autor: VACIO_AUTOR, descriptor: '', participantes: [], coautores: [],
}

// ── Helpers de normalización para importación ─────────────────

function normalizarTipo(val: unknown): TipoPropuesta {
  const v = String(val ?? '').toLowerCase().trim()
  // Coincidencia exacta por valor
  const exacto = TIPOS_PROPUESTA.find(t => t.valor === v)
  if (exacto) return exacto.valor
  // Coincidencia parcial por etiqueta (el valor del Excel contiene la etiqueta o viceversa)
  const parcial = TIPOS_PROPUESTA.find(t =>
    v.includes(t.etiqueta.toLowerCase()) || t.etiqueta.toLowerCase().includes(v)
  )
  if (parcial) return parcial.valor
  // Por defecto: primer tipo del config
  return TIPOS_PROPUESTA[0].valor
}

function normalizarEje(val: unknown): string {
  const v = String(val ?? '').trim()
  if (!v) return ''
  // Numérico: busca el eje cuyo num coincide
  const num = parseInt(v)
  if (!isNaN(num)) {
    const porNum = EJES.find(e => parseInt(e.num) === num)
    if (porNum) return porNum.num
  }
  // Coincidencia exacta con título (case-insensitive)
  const exacto = EJES.find(e => e.titulo.toLowerCase() === v.toLowerCase())
  if (exacto) return exacto.num
  // Coincidencia parcial
  const parcial = EJES.find(e => v.toLowerCase().includes(e.titulo.toLowerCase()) ||
                                 e.titulo.toLowerCase().includes(v.toLowerCase()))
  return parcial?.num ?? ''
}

// Columnas del formulario Google Forms exportado a Excel
const COL = {
  email:        'Dirección de correo electrónico',
  apellido:     'Apellido',
  nombres:      'Nombres',
  documento:    'DNI',
  institucion:  'Pertenencia institucional',
  celular:      'Teléfono celular',
  tipo:         'Tipo de presentación',
  titulo:       'Título',
  eje:          'Eje temático sugerido',
  resumenLink:  'Resumen',
} as const

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase())

function parsearFilas(rows: Record<string, unknown>[], existentes: Propuesta[]): FilaImport[] {
  return rows.map((row, idx) => {
    const nombres  = titleCase(String(row[COL.nombres]  ?? '').trim())
    const apellido = titleCase(String(row[COL.apellido] ?? '').trim())
    const nombre   = [nombres, apellido].filter(Boolean).join(' ')
    const email    = String(row[COL.email]    ?? '').trim().toLowerCase()
    const tipo     = normalizarTipo(row[COL.tipo])
    const ejeRaw   = normalizarEje(row[COL.eje])
    const tituloRaw = String(row[COL.titulo] ?? '').trim()
    const titulo    = tituloRaw.charAt(0).toUpperCase() + tituloRaw.slice(1).toLowerCase()

    const advertencias: string[] = []
    if (!nombre)  advertencias.push('Sin nombre')
    if (!titulo)  advertencias.push('Sin título')
    if (!ejeRaw)  advertencias.push('Eje no reconocido')
    if (!email)   advertencias.push('Sin email')

    const datos: DatosPropuesta = {
      tipo,
      titulo,
      resumen:     '',
      resumenLink: String(row[COL.resumenLink] ?? '').trim(),
      eje:         ejeRaw || '01',
      estado:      'pendiente',
      evaluador:   '',
      descriptor:  '',
      participantes: [],
      coautores:   [],
      autor: {
        nombre,
        email,
        documento:     String(row[COL.documento]   ?? '').trim(),
        institucion:   titleCase(String(row[COL.institucion]  ?? '').trim()),
        celularCodigo: '+54',
        celular:       String(row[COL.celular]       ?? '').trim(),
        pertenencia:   'externo',
      },
    }

    const duplicada = existentes.some(p =>
      p.titulo.trim().toLowerCase() === titulo.toLowerCase() ||
      (email  && p.autor.email   && p.autor.email.trim().toLowerCase()   === email) ||
      (nombre && p.autor.nombre  && p.autor.nombre.trim().toLowerCase()  === nombre.toLowerCase())
    )

    return { idx, datos, advertencias, duplicada, descartar: duplicada }
  })
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

  // Importación Excel
  const fileRef                             = useRef<HTMLInputElement>(null)
  const [filasImport, setFilasImport]       = useState<FilaImport[]>([])
  const [importando,  setImportando]        = useState(false)
  const [importLog,   setImportLog]         = useState<string | null>(null)

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

  const handleCoautorChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => {
      const coautores = [...f.coautores]
      coautores[idx] = { ...coautores[idx], [e.target.name]: e.target.value }
      return { ...f, coautores }
    })
  }

  const agregarCoautor = () => {
    setForm(f => ({ ...f, coautores: [...f.coautores, { ...VACIO_AUTOR }] }))
  }

  const quitarCoautor = (idx: number) => {
    setForm(f => ({ ...f, coautores: f.coautores.filter((_, i) => i !== idx) }))
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
      tipo:        p.tipo,
      titulo:      p.titulo,
      resumen:     p.resumen,
      resumenLink: p.resumenLink ?? '',
      eje:         p.eje,
      estado:      p.estado,
      evaluador:   p.evaluador ?? '',
      descriptor:    p.descriptor ?? '',
      participantes: (p.participantes ?? []).map(pa => ({
        nombre:          pa.nombre,
        institucion:     pa.institucion,
        email:           pa.email,
        documento:       pa.documento ?? '',
        celularCodigo:   pa.celularCodigo ?? '+54',
        celular:         pa.celular ?? '',
        pertenencia:     pa.pertenencia,
        tituloPonencia:  pa.tituloPonencia ?? '',
      })),
      coautores: (p.coautores ?? []).map(ca => ({
        nombre:        ca.nombre,
        institucion:   ca.institucion,
        email:         ca.email,
        documento:     ca.documento ?? '',
        celularCodigo: ca.celularCodigo ?? '+54',
        celular:       ca.celular ?? '',
        pertenencia:   ca.pertenencia,
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

  // ── Importación Excel ──────────────────────────────────────

  const handleArchivoExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLog(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data     = new Uint8Array(ev.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet    = workbook.Sheets[workbook.SheetNames[0]]
      const rows     = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      setFilasImport(parsearFilas(rows, propuestas))
    }
    reader.readAsArrayBuffer(file)
  }

  const toggleDescartar = (idx: number) => {
    setFilasImport(fs => fs.map(f => f.idx === idx ? { ...f, descartar: !f.descartar } : f))
  }

  const handleImportar = async () => {
    const aGuardar = filasImport.filter(f => !f.descartar)
    if (aGuardar.length === 0) { setImportLog('Nada para importar.'); return }
    setImportando(true)
    setImportLog(null)
    let ok = 0; let err = 0
    for (const fila of aGuardar) {
      try {
        await agregarPropuesta(fila.datos)
        ok++
        setImportLog(`Guardando... ${ok} de ${aGuardar.length}`)
      } catch { err++ }
    }
    await cargar()
    setFilasImport([])
    if (fileRef.current) fileRef.current.value = ''
    setImportLog(`Importación finalizada: ${ok} guardadas${err ? `, ${err} con error` : ''}.`)
    setImportando(false)
  }

  // ── Helpers lista ──────────────────────────────────────────

  const tipoEtiqueta = (tipo: TipoPropuesta) =>
    TIPOS_PROPUESTA.find(t => t.valor === tipo)?.etiqueta ?? tipo

  const ejeEtiqueta = (num: string) =>
    EJES.find(e => e.num === num)?.titulo ?? num

  const apellidoDeNombre = (nombre: string) => nombre.trim().split(' ').slice(-1)[0]

  const descargarPDF = (lista: Propuesta[]) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const ordenadas = [...lista].sort((a, b) => {
      // 1° tipo (según orden en TIPOS_PROPUESTA), 2° eje, 3° apellido
      const tipoOrden = TIPOS_PROPUESTA.map(t => t.valor)
      const tipoDiff  = tipoOrden.indexOf(a.tipo) - tipoOrden.indexOf(b.tipo)
      if (tipoDiff !== 0) return tipoDiff
      const ejeDiff = a.eje.localeCompare(b.eje, 'es')
      if (ejeDiff !== 0) return ejeDiff
      return apellidoDeNombre(a.autor.nombre).localeCompare(apellidoDeNombre(b.autor.nombre), 'es')
    })

    // Colores de estado (coinciden con los badges del CSS)
    // rgba(r,g,b,α) sobre blanco → r' = 255 + α*(r-255)
    const ESTADO_ESTILO: Record<string, { fill: [number,number,number]; text: [number,number,number] }> = {
      pendiente: { fill: [248, 242, 230], text: [140, 101,  32] },  // amber
      revisión:  { fill: [236, 236, 251], text: [ 58,  58, 176] },  // violeta
      aceptada:  { fill: [228, 247, 245], text: [ 26, 140, 126] },  // turquesa
      rechazada: { fill: [251, 234, 232], text: [176,  48,  32] },  // coral
    }

    const estadoEtq = (e: string) => ESTADOS_PROPUESTA.find(s => s.valor === e)?.etiqueta ?? e

    autoTable(doc, {
      head: [['Apellido y nombre', 'Mail', 'Coautores / Participantes', 'Institución', 'Eje', 'Tipo', 'Título', 'Evaluador', 'Estado']],
      body: ordenadas.map(p => {
        // Para panel: participantes en la columna de coautores
        const coautoresCell = p.tipo === 'panel'
          ? (p.participantes ?? []).map(pa => pa.nombre).join(', ')
          : (p.coautores    ?? []).map(c  => c.nombre).join(', ')

        const estiloEstado = ESTADO_ESTILO[p.estado]
        const estadoCell = {
          content: estadoEtq(p.estado),
          styles: {
            fillColor: estiloEstado?.fill ?? [255, 255, 255] as [number,number,number],
            textColor: estiloEstado?.text ?? [  0,   0,   0] as [number,number,number],
            fontStyle: 'bold' as const,
            halign:    'center' as const,
          },
        }

        return [
          p.autor.nombre,
          p.autor.email,
          coautoresCell,
          p.autor.institucion,
          p.eje,
          tipoEtiqueta(p.tipo),
          p.titulo,
          p.evaluador ?? '',
          estadoCell,
        ]
      }),
      styles:     { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [35, 22, 81] },
      columnStyles: {
        0: { cellWidth: 32 },  // nombre
        1: { cellWidth: 34 },  // email
        2: { cellWidth: 28 },  // coautores / participantes
        3: { cellWidth: 27 },  // institución
        4: { cellWidth: 8  },  // eje
        5: { cellWidth: 18 },  // tipo
        6: { cellWidth: 55 },  // título
        7: { cellWidth: 24 },  // evaluador
        8: { cellWidth: 20 },  // estado
      },
    })

    const fecha = new Date().toISOString().slice(0, 10)
    doc.save(`propuestas-${fecha}.pdf`)
  }

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

          {/* Evaluador */}
          <div className="admin-form__field">
            <label className="admin-form__label">Evaluador/a</label>
            <select className="admin-form__input" name="evaluador" value={form.evaluador} onChange={handleChange}>
              <option value="">— Sin asignar —</option>
              {EVALUADORES.map(ev => (
                <option key={ev} value={ev}>{ev}</option>
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
                    <label className="admin-form__label">Título de ponencia</label>
                    <input className="admin-form__input" type="text" name="tituloPonencia" value={p.tituloPonencia ?? ''} onChange={e => handleParticipanteChange(idx, e)} />
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

        {/* Co-autores (ponencia / relato / poster) */}
        {form.tipo !== 'panel' && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.75rem' }}>
              <p className="admin-form__label" style={{ opacity: 0.5, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                Co-autores/as
              </p>
              <button type="button" className="admin-btn admin-btn--small" onClick={agregarCoautor}>
                + Agregar
              </button>
            </div>
            {form.coautores.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: '0.75rem' }}>
                Sin co-autores. Hacé clic en "+ Agregar" para sumar uno.
              </p>
            )}
            {form.coautores.map((ca, idx) => (
              <div key={idx} style={{ border: '1px solid rgba(35,22,81,0.1)', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.68rem', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Co-autor/a {idx + 1}
                </p>
                <div className="admin-form__grid">
                  <div className="admin-form__field">
                    <label className="admin-form__label">Nombre</label>
                    <input className="admin-form__input" type="text" name="nombre" value={ca.nombre} onChange={e => handleCoautorChange(idx, e)} required />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Institución</label>
                    <input className="admin-form__input" type="text" name="institucion" value={ca.institucion} onChange={e => handleCoautorChange(idx, e)} />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Email</label>
                    <input className="admin-form__input" type="email" name="email" value={ca.email} onChange={e => handleCoautorChange(idx, e)} />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Celular</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        className="admin-form__input"
                        style={{ width: '130px', flexShrink: 0 }}
                        name="celularCodigo"
                        value={ca.celularCodigo}
                        onChange={e => handleCoautorChange(idx, e)}
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
                        value={ca.celular}
                        onChange={e => handleCoautorChange(idx, e)}
                        placeholder="341 5551234"
                      />
                    </div>
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">DNI / Pasaporte</label>
                    <input className="admin-form__input" type="text" name="documento" value={ca.documento} onChange={e => handleCoautorChange(idx, e)} />
                  </div>
                  <div className="admin-form__field">
                    <label className="admin-form__label">Pertenencia</label>
                    <select className="admin-form__input" name="pertenencia" value={ca.pertenencia} onChange={e => handleCoautorChange(idx, e)}>
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
                  onClick={() => quitarCoautor(idx)}
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
          />
        </div>

        {/* Link al resumen */}
        <div className="admin-form__field admin-form__field--full">
          <label className="admin-form__label">Link al resumen (URL)</label>
          <input
            className="admin-form__input"
            type="url"
            name="resumenLink"
            value={form.resumenLink}
            onChange={handleChange}
            placeholder="https://docs.google.com/..."
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

          <button
            className="admin-btn"
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.9rem', marginLeft: 'auto' }}
            onClick={() => descargarPDF(propuestasFiltradas)}
          >
            ↓ PDF
          </button>
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
                {p.resumenLink && (
                  <p style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}>
                    <a href={p.resumenLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-turq)' }}>
                      Ver resumen →
                    </a>
                  </p>
                )}
                {p.evaluador && (
                  <p style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#888' }}>
                    Evaluador/a: <strong>{p.evaluador}</strong>
                  </p>
                )}
                {p.coautores && p.coautores.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(35,22,81,0.07)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
                      Co-autores/as
                    </p>
                    {p.coautores.map((ca, i) => (
                      <p key={i} style={{ fontSize: '0.82rem', color: '#555' }}>
                        {ca.nombre}{ca.institucion ? ` · ${ca.institucion}` : ''}{ca.email ? ` · ${ca.email}` : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* ── Importar desde Excel ── */}
      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(35,22,81,0.08)' }}>
        <h2 className="admin-module__title">Importar desde Excel</h2>
        <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '1rem' }}>
          Aceptá archivos .xlsx o .xls con las columnas: Mail, Apellido, Nombres, Documento, Institución, Celular, Tipo, Título, Eje, Link al resumen.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivoExcel}
          style={{ marginBottom: '1rem' }}
        />

        {filasImport.length > 0 && (
          <>
            <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem' }}>
              {filasImport.length} filas encontradas ·{' '}
              <strong style={{ color: 'var(--c-coral)' }}>
                {filasImport.filter(f => f.duplicada).length} posibles duplicadas
              </strong>
              {' '}(marcadas para descartar por defecto) ·{' '}
              <strong>{filasImport.filter(f => !f.descartar).length} se importarán</strong>
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(35,22,81,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem 0.5rem 0', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Descartar</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Eje</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Título</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: 'var(--c-mid)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filasImport.map(fila => (
                    <tr
                      key={fila.idx}
                      style={{
                        borderBottom: '1px solid rgba(35,22,81,0.06)',
                        background: fila.descartar
                          ? 'rgba(200,50,50,0.04)'
                          : fila.duplicada
                            ? 'rgba(255,160,0,0.05)'
                            : 'transparent',
                        opacity: fila.descartar ? 0.5 : 1,
                      }}
                    >
                      <td style={{ padding: '0.5rem 0.75rem 0.5rem 0', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={fila.descartar}
                          onChange={() => toggleDescartar(fila.idx)}
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>{fila.datos.autor.nombre}</td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                        {TIPOS_PROPUESTA.find(t => t.valor === fila.datos.tipo)?.etiqueta}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{fila.datos.eje}</td>
                      <td style={{ padding: '0.5rem 0.75rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fila.datos.titulo}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                        {fila.duplicada && (
                          <span style={{ color: 'var(--c-coral)', marginRight: '0.4rem' }}>⚠ duplicada</span>
                        )}
                        {fila.advertencias.map(a => (
                          <span key={a} style={{ color: '#999', marginRight: '0.3rem' }}>{a}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importLog && (
              <p style={{ fontSize: '0.82rem', color: 'var(--c-mid)', marginBottom: '0.75rem' }}>{importLog}</p>
            )}

            <button
              className="admin-btn admin-btn--primary"
              onClick={handleImportar}
              disabled={importando || filasImport.filter(f => !f.descartar).length === 0}
            >
              {importando ? importLog ?? 'Importando...' : `Importar ${filasImport.filter(f => !f.descartar).length} propuestas`}
            </button>
          </>
        )}

        {filasImport.length === 0 && importLog && (
          <p style={{ fontSize: '0.82rem', color: 'var(--c-mid)', marginTop: '0.5rem' }}>{importLog}</p>
        )}
      </div>

    </div>
  )
}
