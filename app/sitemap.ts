import type { MetadataRoute } from 'next'
import { CONGRESO } from '@/congreso.config'

// ARCHIVO 2026: export estático.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = CONGRESO.url

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${base}/invitados`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.9,
    },
    {
      url: `${base}/programa`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.9,
    },
    {
      url: `${base}/organizacion`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${base}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
