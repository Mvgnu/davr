import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart, Users, Award, Search, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Für Recyclinghöfe | Ihr Recyclingcenter auf unserer Plattform',
  description: 'Steigern Sie die Sichtbarkeit Ihres Recyclinghofs, erreichen Sie mehr Kunden und optimieren Sie Ihre Abläufe mit unserer digitalen Recycling-Plattform.',
  keywords: 'Recyclinghof registrieren, Wertstoffhof anmelden, Recyclingcenter Marketing, Recycling Digitalisierung, Recyclingbetrieb',
};

export default function ForRecyclingCentersPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-green-50 dark:bg-green-950/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-illustration.svg"
            alt="Recyclinghof Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Für Recyclinghöfe und Wertstoffhändler</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Bringen Sie Ihr Recyclinggeschäft ins digitale Zeitalter und erschließen Sie 
              neue Kunden und Materialquellen
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Jetzt registrieren
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Mehr erfahren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Vorteile für Recyclinghöfe</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Unsere Plattform bietet Ihnen zahlreiche Möglichkeiten, Ihren Recyclinghof zu digitalisieren, 
              zu präsentieren und neue Kunden zu gewinnen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Erhöhte Sichtbarkeit</h3>
              <p className="text-muted-foreground">
                Werden Sie in unserer Recyclinghof-Suche gelistet und erhöhen Sie Ihre 
                Sichtbarkeit bei potenziellen Kunden in Ihrer Region.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Neue Kundschaft</h3>
              <p className="text-muted-foreground">
                Erreichen Sie eine wachsende Gemeinschaft umweltbewusster Verbraucher und 
                Unternehmen, die nach Recyclingmöglichkeiten suchen.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <BarChart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Optimierte Abläufe</h3>
              <p className="text-muted-foreground">
                Nutzen Sie digitale Tools zur Verwaltung Ihrer Angebote, Materialpreise, 
                Kundenkommunikation und betrieblichen Abläufe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Digitale Werkzeuge für Recyclinghöfe</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Detailliertes Betriebsprofil</h3>
                    <p className="text-muted-foreground">
                      Präsentieren Sie Ihre Dienstleistungen, Öffnungszeiten, Kontaktdaten und 
                      akzeptierte Materialien in einem ansprechenden Profil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Materialpreismanagement</h3>
                    <p className="text-muted-foreground">
                      Aktualisieren Sie Ihre Ankaufspreise in Echtzeit und kommunizieren Sie sie 
                      transparent an Ihre Kunden.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Kundenbewertungen</h3>
                    <p className="text-muted-foreground">
                      Sammeln Sie positive Bewertungen und Feedback von zufriedenen Kunden und 
                      verbessern Sie Ihre Reputation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Standortbasierte Suche</h3>
                    <p className="text-muted-foreground">
                      Werden Sie von Kunden in Ihrer Nähe gefunden, die nach bestimmten Recyclingdiensten 
                      oder Materialankaufsmöglichkeiten suchen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Verifizierter Status</h3>
                    <p className="text-muted-foreground">
                      Heben Sie sich von nicht verifizierten Betrieben ab und gewinnen Sie das 
                      Vertrauen potenzieller Kunden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/cta-illustration.svg"
                alt="Digitale Werkzeuge für Recyclinghöfe"
                width={600}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">So funktioniert's</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              In wenigen einfachen Schritten zu Ihrem digitalen Recyclinghof-Profil
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  1
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2">Registrieren</h3>
              <p className="text-muted-foreground">
                Erstellen Sie ein Konto und wählen Sie "Recyclinghof" als Kontotyp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  2
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2">Profil erstellen</h3>
              <p className="text-muted-foreground">
                Füllen Sie alle Details zu Ihrem Recyclinghof aus und laden Sie Bilder hoch.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  3
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2">Verifizierung</h3>
              <p className="text-muted-foreground">
                Durchlaufen Sie unseren Verifizierungsprozess für maximale Glaubwürdigkeit.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Kunden gewinnen</h3>
              <p className="text-muted-foreground">
                Empfangen Sie Anfragen, aktualisieren Sie Ihre Angebote und wachsen Sie digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Preismodelle</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Wählen Sie das passende Paket für Ihren Recyclinghof
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <p className="text-2xl font-bold">Kostenlos</p>
                <p className="text-sm text-muted-foreground mt-1">Grundlegende Präsenz</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Grundlegendes Recyclinghof-Profil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Anzeige in Suchergebnissen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Kundenbewertungen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Materialverwaltung (bis zu 10 Materialien)</span>
                  </li>
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button className="w-full" variant="outline">
                    Kostenlos starten
                  </Button>
                </Link>
              </div>
            </div>

            {/* Premium Package */}
            <div className="bg-card rounded-lg border border-primary shadow-md overflow-hidden transform scale-105">
              <div className="p-6 border-b border-border bg-primary/10">
                <h3 className="text-xl font-bold mb-2">Premium</h3>
                <p className="text-2xl font-bold">49,99 €<span className="text-base font-normal">/Monat</span></p>
                <p className="text-sm text-muted-foreground mt-1">Empfohlen für die meisten Recyclinghöfe</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Alle Basic-Funktionen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Hervorgehobene Platzierung in Suchergebnissen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Unbegrenzte Materialverwaltung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Detaillierte Statistiken und Berichte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Verifiziertes Profilabzeichen</span>
                  </li>
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button className="w-full">
                    Premium wählen
                  </Button>
                </Link>
              </div>
            </div>

            {/* Enterprise Package */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-2xl font-bold">Individuell</p>
                <p className="text-sm text-muted-foreground mt-1">Für große Recyclingbetriebe</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Alle Premium-Funktionen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>API-Zugang für Systemintegration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Mehrere Standorte verwalten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Dedizierter Account Manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Maßgeschneiderte Marketingoptionen</span>
                  </li>
                </ul>
                <Link href="/contact" className="block mt-6">
                  <Button className="w-full" variant="outline">
                    Kontakt aufnehmen
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit, Ihren Recyclinghof digital zu transformieren?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Registrieren Sie sich noch heute und erschließen Sie neue Möglichkeiten für Ihr Recyclinggeschäft.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                Jetzt registrieren
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                Fragen? Kontaktieren Sie uns
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Optional */}
      {/* FAQ Section - Optional */}
    </div>
  );
} 