import Link from 'next/link'
import { Mail, ShieldCheck, Lock, Phone } from 'lucide-react'

export default function Topbar() {
  return (
    <div className="w-full bg-muted text-muted-foreground text-xs border-b border-border">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left: Contact */}
        <div className="flex items-center gap-4">
          <Link href="mailto:support@davr.de" className="inline-flex items-center hover:text-foreground transition-colors">
            <Mail className="h-3.5 w-3.5 mr-1.5" /> support@davr.de
          </Link>
          <Link href="tel:+49-30-000000" className="hidden sm:inline-flex items-center hover:text-foreground transition-colors">
            <Phone className="h-3.5 w-3.5 mr-1.5" /> +49 30 000000
          </Link>
        </div>

        {/* Right: Trust indicators */}
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center"><Lock className="h-3.5 w-3.5 mr-1.5" /> SSL-gesichert</span>
          <span className="hidden sm:inline-flex items-center"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Verifizierte Anbieter</span>
        </div>
      </div>
    </div>
  )
}


