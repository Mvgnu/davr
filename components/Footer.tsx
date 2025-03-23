import React from 'react'
import Link from 'next/link'
import { Recycle, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-800 text-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Short Description */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Recycle className="h-6 w-6 mr-2 text-green-400" />
              <span className="font-bold text-lg text-white">Aluminium Recycling</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Wir verbinden Recyclinghöfe und Verbraucher in Deutschland für eine nachhaltigere Zukunft durch effizientes Aluminium-Recycling.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Schnellzugriff</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/recycling-centers" className="text-gray-400 hover:text-green-400 transition-colors">
                  Recyclinghöfe finden
                </Link>
              </li>
              <li>
                <Link href="/materials" className="text-gray-400 hover:text-green-400 transition-colors">
                  Materialien
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-400 hover:text-green-400 transition-colors">
                  Marktplatz
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-green-400 transition-colors">
                  Blog & Neuigkeiten
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-green-400 transition-colors">
                  Über uns
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ressourcen</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/recycling-guide" className="text-gray-400 hover:text-green-400 transition-colors">
                  Recycling-Leitfaden
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-green-400 transition-colors">
                  Häufige Fragen
                </Link>
              </li>
              <li>
                <Link href="/for-recycling-centers" className="text-gray-400 hover:text-green-400 transition-colors">
                  Für Recyclinghöfe
                </Link>
              </li>
              <li>
                <Link href="/for-businesses" className="text-gray-400 hover:text-green-400 transition-colors">
                  Für Unternehmen
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="text-gray-400 hover:text-green-400 transition-colors">
                  Nachhaltigkeit
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                <span className="text-gray-400">
                  Recyclingstraße 123<br />
                  10115 Berlin<br />
                  Deutschland
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-green-400 mr-2" />
                <a href="tel:+4930123456789" className="text-gray-400 hover:text-green-400 transition-colors">
                  +49 30 123 456 789
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-green-400 mr-2" />
                <a href="mailto:info@aluminium-recycling.de" className="text-gray-400 hover:text-green-400 transition-colors">
                  info@aluminium-recycling.de
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-700 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Aluminium Recycling Deutschland. Alle Rechte vorbehalten.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-400 hover:text-green-400 text-sm">
              Nutzungsbedingungen
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-green-400 text-sm">
              Datenschutz
            </Link>
            <Link href="/imprint" className="text-gray-400 hover:text-green-400 text-sm">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}