import type { MetadataRoute } from 'next'
import { CONGRESO } from '@/congreso.config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = CONGRESO.url

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${base}/archivo/2026/`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ]
}
