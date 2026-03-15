import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__main">
        
        <Link href="https://fhumyar.unr.edu.ar" target="_blank" rel="noopener noreferrer">
          <Image
            className="footer__logo"
            src="/logo-hya.png"
            alt="Facultad de Humanidades y Artes — UNR"
            width={200}
            height={48}
          />
        </Link>
      </div>
      <div className="footer__copy">
        © 2026 Facultad de Humanidades y Artes · Universidad Nacional de Rosario
      </div>
    </footer>
  )
}
