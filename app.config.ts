// app.config.ts
// Configuración de la aplicación: rutas, navegación, idioma.
// Separado de congreso.config.ts para que pueda adaptarse
// a distintos idiomas sin tocar los datos del evento.

export const IDIOMA = 'es' as const

// Para agregar un idioma: duplicar el array con las etiquetas traducidas
// y seleccionarlo con IDIOMA. Las rutas (href) no cambian.
export const NAVEGACION = [
  { href: '/invitados',    etiqueta: 'Invitados' },
  /*{ href: '/programa',    etiqueta: 'Programa' },*/
  { href: '/propuestas',   etiqueta: 'Envío de resúmenes' },
  { href: '/organizacion', etiqueta: 'Organización' },
  { href: '/contacto',     etiqueta: 'Contacto' },
]
