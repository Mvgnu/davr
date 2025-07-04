import React from 'react'
import Link from 'next/link'
import { Recycle, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-muted text-muted-foreground border-t border-border/60">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Short Description */}
          <div>
            <Link href="/" className="flex items-center mb-4 group">
              <Recycle className="h-6 w-6 mr-2 text-accent group-hover:animate-spin-slow transition-transform duration-500 ease-in-out" />
              <span className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">Aluminium Recycling</span>
            </Link>
            <p className="text-sm mb-4">
              Wir verbinden Recyclinghöfe und Verbraucher in Deutschland für eine nachhaltigere Zukunft durch effizientes Aluminium-Recycling.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent hover:scale-110 transform transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent hover:scale-110 transform transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent hover:scale-110 transform transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent hover:scale-110 transform transition-all duration-200"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Schnellzugriff</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/recycling-centers" className="text-sm hover:text-accent transition-colors duration-200">
                  Recyclinghöfe finden
                </Link>
              </li>
              <li>
                <Link href="/materials" className="text-sm hover:text-accent transition-colors duration-200">
                  Materialien
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-sm hover:text-accent transition-colors duration-200">
                  Marktplatz
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm hover:text-accent transition-colors duration-200">
                  Blog & Neuigkeiten
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-accent transition-colors duration-200">
                  Über uns
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Ressourcen</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/recycling-guide" className="text-sm hover:text-accent transition-colors duration-200">
                  Recycling-Leitfaden
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-accent transition-colors duration-200">
                  Häufige Fragen
                </Link>
              </li>
              <li>
                <Link href="/for-recycling-centers" className="text-sm hover:text-accent transition-colors duration-200">
                  Für Recyclinghöfe
                </Link>
              </li>
              <li>
                <Link href="/for-businesses" className="text-sm hover:text-accent transition-colors duration-200">
                  Für Unternehmen
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="text-sm hover:text-accent transition-colors duration-200">
                  Nachhaltigkeit
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Recyclingstraße 123<br />
                  10115 Berlin<br />
                  Deutschland
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
                <a href="tel:+4930123456789" className="text-sm hover:text-accent transition-colors duration-200">
                  +49 30 123 456 789
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
                <a href="mailto:info@aluminium-recycling.de" className="text-sm hover:text-accent transition-colors duration-200 break-all">
                  info@aluminium-recycling.de
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-border/60 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            &copy; {currentYear} Aluminium Recycling Deutschland. Alle Rechte vorbehalten.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm hover:text-accent transition-colors duration-200">
              Nutzungsbedingungen
            </Link>
            <Link href="/privacy" className="text-sm hover:text-accent transition-colors duration-200">
              Datenschutz
            </Link>
            <Link href="/imprint" className="text-sm hover:text-accent transition-colors duration-200">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}