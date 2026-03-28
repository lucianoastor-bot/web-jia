'use client'

import { useNoticias } from '@/lib/hooks/useNoticias'

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatearFecha(iso: string): string {
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-')
  return `${parseInt(dia)} ${MESES[parseInt(mes) - 1]} ${anio}`
}

export default function Noticias() {
  const { noticias } = useNoticias()

  return (
    <section className="noticias" id="noticias">
      <div className="noticias__inner">

        <h2 className="section__title">Novedades</h2>

        <div className="noticias__grid">
          {noticias.map((n, i) => (
            <article key={n.id ?? i} className="noticia-card">
              <span className="noticia-card__fecha">{formatearFecha(n.fecha)}</span>
              <h3 className="noticia-card__titulo">{n.titulo}</h3>
              <p className="noticia-card__resumen">{n.resumen}</p>
              {n.enlace && (
                <a href={n.enlace} className="noticia-card__link">
                  Leer más →
                </a>
              )}
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
