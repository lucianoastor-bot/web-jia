import type { MetadataRoute } from 'next'
import { CONGRESO } from '@/congreso.config'

// ARCHIVO 2026: export estático.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${CONGRESO.url}/sitemap.xml`,
  }
}
