// congreso.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuración central del sistema de gestión de jornadas/congresos.
// Para adaptar el sistema a un nuevo evento basta con modificar este archivo.
// Los componentes leen todo desde acá: formularios, filtros, listados y reglas.
// ─────────────────────────────────────────────────────────────────────────────

import type { Eje, Noticia } from '@/types'


// ─── Datos del evento ────────────────────────────────────────────────────────
// Información general que aparece en encabezados, metadatos y textos del sitio.

export const CONGRESO = {
  nombre:       'Jornadas: La Inteligencia Artificial en debate',
  nombreCorto:  'Jornadas: La IA en debate',
  institucion:  'Facultad de Humanidades y Artes',
  universidad:  'Universidad Nacional de Rosario',
  siglas:       'FHyA · UNR',
  anio:         '2026',
  ciudad:       'Rosario',
  pais:         'Argentina',
  fechaInicio:  new Date('2026-06-10T09:00:00-03:00'),
  fechaTexto:   '10 · 11 · 12 de junio de 2026',
  url:          'https://jornadas-ia.site',
  urlInstitucion: 'https://fhumyar.unr.edu.ar',
  logoPath:     '/logo-hya.png',
  instagram:           'https://www.instagram.com/jornadas.ia/',
  formularioResumenes: 'https://forms.gle/SKB7J1o7beuXAsGz5',
  plazoResumenes:     '3 de mayo de 2026',
  inicioResumenes:    new Date('2026-03-01T00:00:00-03:00'),
  finResumenes:       new Date('2026-05-03T23:59:59-03:00'),
} as const


// ─── Ejes temáticos ──────────────────────────────────────────────────────────
// Cada eje tiene un número de dos dígitos ('01'…'08'), un título y una
// descripción. Se usan en el formulario de propuestas y en los filtros del panel
// de administración.

export const EJES: Eje[] = [
  {
    num: '01',
    titulo: 'Inteligencia Artificial y educación',
    descripcion: 'Reflexiones sobre el impacto de la IA en los procesos de enseñanza y aprendizaje, la formación docente y las transformaciones en las instituciones educativas.',
  },
  {
    num: '02',
    titulo: 'Inteligencia Artificial y producción artística y cultural',
    descripcion: 'Análisis de las tensiones y posibilidades que la IA introduce en la creación artística, las industrias culturales y los procesos de producción simbólica.',
  },
  {
    num: '03',
    titulo: 'Inteligencia Artificial, escritura y traducción',
    descripcion: 'Exploración del impacto de la IA en la producción textual y académica, y en las prácticas de traducción: sus herramientas, sus límites y las preguntas que abre sobre autoría, estilo y fidelidad.',
  },
  {
    num: '04',
    titulo: 'Filosofía de la Inteligencia Artificial',
    descripcion: 'Abordajes filosóficos sobre la naturaleza de la IA, la conciencia, la agencia y los fundamentos epistemológicos de los sistemas inteligentes.',
  },
  {
    num: '05',
    titulo: 'Problemas éticos en el uso de la Inteligencia Artificial',
    descripcion: 'Discusión sobre los dilemas éticos que plantea el desarrollo y uso de la IA: sesgos, responsabilidad, transparencia y derechos digitales.',
  },
  {
    num: '06',
    titulo: 'Impacto en la sociedad, la economía y el trabajo',
    descripcion: 'Estudio de las transformaciones que la IA genera en el mercado laboral, las estructuras económicas y la organización social.',
  },
  {
    num: '07',
    titulo: 'Inteligencia Artificial, vínculos, salud mental y redes sociales',
    descripcion: 'Análisis de los efectos de la IA en las relaciones interpersonales, la salud mental, el bienestar y el uso de plataformas digitales.',
  },
  {
    num: '08',
    titulo: 'Inteligencia Artificial: utopía y distopía',
    descripcion: 'Reflexiones sobre los imaginarios sociales, narrativas culturales y representaciones del futuro que rodean al desarrollo de la IA.',
  },
]


// ─── Tipos de propuesta ──────────────────────────────────────────────────────
// Lo que puede enviar un participante a través del formulario de convocatoria.
// Cada tipo genera su propio flujo de evaluación y asignación a actividades.
// Para agregar un tipo nuevo también hay que agregarlo en TIPOS_ACTIVIDAD y
// PROPUESTAS_COMPATIBLES si va a tener una actividad que lo agrupe.

export const TIPOS_PROPUESTA = [
  { valor: 'ponencia', etiqueta: 'Ponencia' },
  { valor: 'relato',   etiqueta: 'Relato de experiencia' },
  { valor: 'poster',   etiqueta: 'Póster' },
  { valor: 'panel',    etiqueta: 'Panel' },
] as const


// ─── Tipos de actividad ──────────────────────────────────────────────────────
// Lo que aparece en el programa del evento.
// Tipos con modelo especial:
//   conferencia → se vincula a un Invitado (invitadoId)
//   panel       → tiene coordinador y lista de ParticipantePanel[]
// El resto agrupa propuestas según PROPUESTAS_COMPATIBLES.

export const TIPOS_ACTIVIDAD = [
  { valor: 'conferencia', etiqueta: 'Conferencia' },
  { valor: 'panel',       etiqueta: 'Panel' },
  { valor: 'mesa',        etiqueta: 'Mesa de ponencias' },
  { valor: 'pósters',     etiqueta: 'Sesión de pósters' },
  { valor: 'otro',        etiqueta: 'Otro' },
] as const


// ─── Pertenencias institucionales ────────────────────────────────────────────
// Clasificación del vínculo del participante con la institución organizadora.
// Se usa en el formulario de propuestas y en los datos de invitados.

export const PERTENENCIAS = [
  { valor: 'externo',    etiqueta: 'Externo' },
  { valor: 'comunidad',  etiqueta: 'Comunidad FHyA' },
  { valor: 'estudiante', etiqueta: 'Estudiante' },
] as const


// ─── Estados de propuesta ────────────────────────────────────────────────────
// Ciclo de vida de una propuesta desde que se recibe hasta que se resuelve.

export const ESTADOS_PROPUESTA = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'revisión',  etiqueta: 'En revisión' },
  { valor: 'aceptada',  etiqueta: 'Aceptada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
] as const


// ─── Compatibilidad propuesta ↔ actividad ────────────────────────────────────
// Define qué tipos de propuesta puede recibir cada tipo de actividad, y cómo
// mostrar el conteo en el listado del panel de administración.
//
//   tipos:      propuestas que se pueden asignar a esta actividad
//   etiqueta:   nombre singular para el conteo (ej. "ponencia" → "3 ponencias")
//               si está ausente, la actividad no muestra conteo de propuestas
//               (caso panel: usa su propio modelo de participantes)
//   mostrarEje: si true, el conteo incluye los ejes (ej. "3 ponencias · Eje 03, 05")
//
// Para agregar un nuevo tipo de actividad que agrupe propuestas, alcanza con
// agregar una entrada acá (más el tipo en TIPOS_ACTIVIDAD y TIPOS_PROPUESTA).

export const PROPUESTAS_COMPATIBLES: Record<string, {
  tipos:       string[]
  etiqueta?:   string
  mostrarEje?: boolean
}> = {
  mesa:    { tipos: ['ponencia', 'relato'], etiqueta: 'ponencia', mostrarEje: true  },
  pósters: { tipos: ['poster'],            etiqueta: 'póster',   mostrarEje: false },
  panel:   { tipos: ['panel'] },
}


// ─── Restricciones por tipo de actividad ────────────────────────────────────
// Límites mínimos y máximos según el modelo de cada tipo:
//   conferencia → invitados (siempre exactamente 1)
//   panel       → participantes (ParticipantePanel[])
//   resto       → propuestas asignadas
// Estas restricciones se usan para validar y orientar al organizador en el
// panel de administración; no bloquean el guardado a nivel de base de datos.

export const RESTRICCIONES_ACTIVIDAD = {
  conferencia: { minInvitados:     1, maxInvitados:     1 },
  mesa:        { minPropuestas:    2, maxPropuestas:    4 },
  pósters:     { minPropuestas:    4, maxPropuestas:   15 },
  panel:       { minParticipantes: 2, maxParticipantes: 7 },
  otro:        { minPropuestas:    1, maxPropuestas:   10 },
} as const


// ─── Autoridades ─────────────────────────────────────────────────────────────

export const COORDINADORES: string[] = [
  'Tomás Giroud Guillet',
  'Magalí Gómez Castillo',
  'Luciano Astor',
]

export const COMITE_ORGANIZADOR: string[] = [
  'Lucio Braida',
  'Carlos Galassi',
  'Luz Jovine',
  'Lucas Martino',
  'Lorena Pafumi',
  'Adelina Pasalagua',
  'Luis Rodríguez',
  'Víctor Sánchez',
  'Gina Valenti',
  'Manuel Videguren',
]

export const COMITE_ACADEMICO: string[] = [
  'Fernando Avendaño',
  'Mariano Balla',
  'Alicia Caporossi',
  'María Laura Carrascal',
  'Gabriel Data',
  'Susana Daz',
  'Federico Donner',
  'María Victoria Gonzalez',
  'Melina Mailhou',
  'Erika Nawoczyk',
  /*'Carola Nin',*/
  'Lorena Pafumi',
  'Natalia Ricchiardi',
  'Andrea Rodrigo',
  /*'Liliana Sanjurjo',*/
  'Carolina Tramallino',
  'Marcela Valdata',
  'Gina Valenti',
]


// ─── Noticias por defecto ────────────────────────────────────────────────────
// Se muestran si no hay noticias cargadas en Firestore.
// Útil para tener contenido visible desde el primer deploy.

export const NOTICIAS_DEFECTO: Noticia[] = [
  {
    fecha: '2026-03-25',
    titulo: 'Se encuentra abierta la convocatoria para el envío de resúmenes',
    resumen: 'Ya está disponible el formulario para presentar ponencias, paneles, relatos de experiencias y pósters. El plazo es hasta el 20 de abril.',
    enlace: '/propuestas',
  },
  {
    fecha: '2026-03-25',
    titulo: 'Las jornadas se realizarán los días 10, 11 y 12 de junio de 2026',
    resumen: 'La Facultad de Humanidades y Artes de la UNR será sede de las Jornadas: La Inteligencia Artificial en debate.',
    enlace: '#contacto',
  },
]
