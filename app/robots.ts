import type { MetadataRoute } from 'next'
import { CONGRESO } from '@/congreso.config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login', '/acreditacion'],
    },
    sitemap: `${CONGRESO.url}/sitemap.xml`,
  }
}
