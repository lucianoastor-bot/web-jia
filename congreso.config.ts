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
    titulo: 'IA y producción artística y cultural',
    descripcion: 'Análisis de las tensiones y posibilidades que la IA introduce en la creación artística, la industria cultural y los procesos de producción simbólica.',
  },
  {
    num: '03',
    titulo: 'IA, escritura y traducción',
    descripcion: 'Exploración del impacto de la IA en la producción textual y académica, y en las prácticas de traducción: sus herramientas, sus límites y las preguntas que abre sobre autoría, estilo y fidelidad.',
  },
  {
    num: '04',
    titulo: 'Filosofía de la Inteligencia Artificial',
    descripcion: 'Abordajes filosóficos sobre la naturaleza de la IA, la conciencia, la agencia y los fundamentos epistemológicos de los sistemas inteligentes.',
  },
  {
    num: '05',
    titulo: 'Problemas éticos del uso de la IA',
    descripcion: 'Discusión sobre los dilemas éticos que plantea el desarrollo y uso de la IA: sesgos, responsabilidad, transparencia y derechos digitales.',
  },
  {
    num: '06',
    titulo: 'Impacto en la sociedad, la economía y el trabajo',
    descripcion: 'Estudio de las transformaciones que la IA genera en el mercado laboral, las estructuras económicas y la organización social.',
  },
  {
    num: '07',
    titulo: 'IA, vínculos, salud mental y redes sociales',
    descripcion: 'Análisis de los efectos de la IA en las relaciones interpersonales, la salud mental, el bienestar y el uso de plataformas digitales.',
  },
  {
    num: '08',
    titulo: 'Inteligencia Artificial: utopía y distopía',
    descripcion: 'Reflexiones sobre los imaginarios sociales, narrativas culturales y representaciones del futuro que rodean al desarrollo de la IA.',
  },
]

export const NOTICIAS_DEFECTO: Noticia[] = [
  {
    fecha: '2026-03-10',
    titulo: 'Abrimos la convocatoria para el envío de resúmenes',
    resumen: 'Ya está disponible el formulario para presentar ponencias, paneles, relatos de experiencias y pósters. El plazo cierra el 20 de abril.',
    enlace: '/propuestas',
  },

  {
    fecha: '2026-03-01',
    titulo: 'Las jornadas se realizarán los días 10, 11 y 12 de junio',
    resumen: 'La Facultad de Humanidades y Artes de la UNR será sede de las primeras Jornadas La Inteligencia Artificial en Debate.',
    enlace: '/contacto',
  },
]
