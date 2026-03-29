// congreso.config.ts
// Toda la configuración específica del congreso vive aquí.
// Para adaptar el sistema a un nuevo evento, solo se modifica este archivo.

import type { Eje, Noticia } from '@/types'

export const CONGRESO = {
  nombre:       'Jornadas: La Inteligencia Artificial en debate',
  nombreCorto:  'La IA en debate',
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
  plazoResumenes: '20 de abril de 2026',
} as const


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
    titulo: 'Problemas éticos del uso de la Inteligencia Artificial',
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

export const TIPOS_PROPUESTA = [
  { valor: 'ponencia', etiqueta: 'Ponencia' },
  { valor: 'relato',   etiqueta: 'Relato de experiencia' },
  { valor: 'poster',   etiqueta: 'Póster' },
  { valor: 'panel',    etiqueta: 'Panel' },
] as const

export const TIPOS_ACTIVIDAD = [
  { valor: 'conferencia', etiqueta: 'Conferencia' },
  { valor: 'panel',    etiqueta: 'Panel' },
  { valor: 'mesa',     etiqueta: 'Mesa de ponencias' },
  { valor: 'pósters',  etiqueta: 'Sesión de pósters' },
  { valor: 'otro',     etiqueta: 'Otro' },
] as const

export const PERTENENCIAS = [
  { valor: 'externo',    etiqueta: 'Externo' },
  { valor: 'comunidad',  etiqueta: 'Comunidad FHyA' },
  { valor: 'estudiante', etiqueta: 'Estudiante' },
] as const

export const ESTADOS_PROPUESTA = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'revisión',  etiqueta: 'En revisión' },
  { valor: 'aceptada',  etiqueta: 'Aceptada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
] as const

export const RESTRICCIONES_ACTIVIDAD = {
  conferencia: { minInvitados: 1, maxInvitados: 1 },
  mesa:        { minPropuestas: 2, maxPropuestas: 4 },
  pósters:     { minPropuestas: 4, maxPropuestas: 15 },
  panel:       { minParticipantes: 2, maxParticipantes: 7 },
  otro:        { minPropuestas: 1, maxPropuestas: 10 },
} as const

export const COORDINADORES: string[] = [
  'Tomás Giroud Guillet',
  'Magalí Gómez Castillo',
]

export const COMITE_ORGANIZADOR: string[] = [
  'Luciano Astor',
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
  /*'Fernando Avendaño',
  'Mariano Balla',
  'Alicia Caporossi',
  'María Laura Carrascal',
  'Gabriel Data',
  'Susana Daz',
  'Federico Donner',
  'María Victoria Gonzalez',
  'Melina Mailhou',
  'Erika Nawoczyk',
  'Carola Nin',
  'Lorena Pafumi',
  'Natalia Ricchiardi',
  'Andrea Rodrigo',
  'Liliana Sanjurjo',
  'Carolina Tramallino',
  'Marcela Valdata',
  'Gina Valenti',*/
]

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
    enlace: '/contacto',
  },
]
