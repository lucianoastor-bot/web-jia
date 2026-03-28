import Image from 'next/image'
import Link from 'next/link'
import { CONGRESO } from '@/congreso.config'

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__main">
        <Link href={CONGRESO.urlInstitucion} target="_blank" rel="noopener noreferrer">
          <Image
            className="footer__logo"
            src={CONGRESO.logoPath}
            alt={`${CONGRESO.institucion} — ${CONGRESO.universidad}`}
            width={200}
            height={48}
          />
        </Link>
      </div>
      <div className="footer__copy">
        © {CONGRESO.anio} {CONGRESO.institucion} · {CONGRESO.universidad}
      </div>
    </footer>
  )
}
