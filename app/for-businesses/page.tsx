import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart, Users, Award, Search, Globe, Building, TrendingUp, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Für Unternehmen | Nachhaltige Materialwirtschaft',
  description: 'Entdecken Sie, wie Ihr Unternehmen von unserer Recycling-Plattform profitieren kann: Materialien kaufen und verkaufen, Recyclingkosten optimieren und Nachhaltigkeitsziele erreichen.',
  keywords: 'B2B Recycling, Unternehmen Wertstoffe, Nachhaltigkeitsmanagement, Recycling Großmengen, Kreislaufwirtschaft Betriebe',
};

export default function ForBusinessesPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-blue-50 dark:bg-blue-950/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-background-abstract.jpg"
            alt="Unternehmens-Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Recycling-Lösungen für Unternehmen</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Optimieren Sie Ihre Materialwirtschaft, senken Sie Kosten und erreichen Sie Ihre Nachhaltigkeitsziele
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Unternehmenskonto erstellen
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Beratungstermin vereinbaren
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
            <h2 className="text-3xl font-bold mb-4">Vorteile für Ihr Unternehmen</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Unsere Plattform bietet maßgeschneiderte Lösungen für Unternehmen jeder Größe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Kostenoptimierung</h3>
              <p className="text-muted-foreground">
                Reduzieren Sie Entsorgungskosten durch optimale Verwertung Ihrer Materialien und 
                entdecken Sie neue Einnahmequellen durch den Verkauf recycelbarer Wertstoffe.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nachhaltigkeitsziele</h3>
              <p className="text-muted-foreground">
                Unterstützen Sie Ihre ESG-Bemühungen und Nachhaltigkeitsziele mit transparenten, 
                nachweisbaren Recycling-Maßnahmen und reduzierten CO₂-Emissionen.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Building className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ressourcensicherheit</h3>
              <p className="text-muted-foreground">
                Sichern Sie sich den Zugang zu hochwertigen Sekundärrohstoffen zu wettbewerbsfähigen 
                Preisen und reduzieren Sie Ihre Abhängigkeit von volatilen Primärrohstoffmärkten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Unsere Unternehmenslösungen</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Maßgeschneiderte Angebote für verschiedene Unternehmensanforderungen
            </p>
          </div>

          <div className="space-y-12">
            {/* Solution 1 */}
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-3 order-2 md:order-1">
                <h3 className="text-2xl font-bold mb-4">B2B-Materialmarktplatz</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Zugang zu einem spezialisierten Marktplatz für Unternehmen, auf dem große Mengen 
                  recycelbarer Materialien gehandelt werden können. Ideal für produzierende Betriebe, 
                  die ihre Produktionsabfälle verwerten oder Sekundärrohstoffe beziehen möchten.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Direkter Kontakt zu verifizierten Handelspartnern</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Transparente Preisgestaltung und Markttrends</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sichere Abwicklung von Großtransaktionen</span>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-2 order-1 md:order-2">
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/images/business/b2b-marketplace.jpg"
                    alt="B2B Materialmarktplatz"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Solution 2 */}
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-2">
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/images/business/recycling-management.jpg"
                    alt="Recyclingmanagement"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-2xl font-bold mb-4">Recyclingmanagement</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Umfassende Lösungen für das Recyclingmanagement Ihres Unternehmens. Wir helfen 
                  Ihnen, Ihre Materialströme zu optimieren, die richtigen Recyclingpartner zu finden 
                  und Ihre Recyclingprozesse zu digitalisieren.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Analyse und Optimierung Ihrer Materialströme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Zugang zu einem Netzwerk verifizierter Recyclinghöfe</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dokumentation und Reporting für Nachhaltigkeitsberichte</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Solution 3 */}
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-3 order-2 md:order-1">
                <h3 className="text-2xl font-bold mb-4">Kreislaufwirtschafts-Beratung</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Strategische Beratung zur Integration von Kreislaufwirtschaftsprinzipien in Ihr 
                  Geschäftsmodell. Unsere Experten unterstützen Sie bei der Entwicklung nachhaltiger 
                  Produktdesigns und der Implementierung ressourcenschonender Prozesse.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Identifikation von Kreislaufpotentialen in Ihrer Wertschöpfungskette</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Entwicklung nachhaltiger Produkt- und Verpackungskonzepte</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Schulungen und Workshops für Ihre Mitarbeiter</span>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-2 order-1 md:order-2">
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/images/business/circular-economy-consulting.jpg"
                    alt="Kreislaufwirtschafts-Beratung"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Erfolgsgeschichten</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Erfahren Sie, wie andere Unternehmen von unseren Lösungen profitieren
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Case Study 1 */}
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="relative h-60">
                <Image
                  src="/images/business/case-study-manufacturing.jpg"
                  alt="Fallstudie Produktion"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Metallverarbeitender Betrieb</h3>
                <p className="text-muted-foreground mb-4">
                  Ein mittelständischer Metallverarbeiter konnte seine Entsorgungskosten um 35% senken 
                  und zusätzliche Einnahmen durch den Verkauf von Metallabfällen generieren.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 py-1 px-2 rounded-full">Kostenreduktion</span>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-2 rounded-full ml-2">Materialverwertung</span>
                  </div>
                  <Link href="/success-stories/metal-processing" className="text-primary hover:underline flex items-center">
                    Mehr erfahren <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="relative h-60">
                <Image
                  src="/images/business/case-study-retail.jpg"
                  alt="Fallstudie Einzelhandel"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Einzelhandelskette</h3>
                <p className="text-muted-foreground mb-4">
                  Eine führende Einzelhandelskette optimierte ihre Verpackungsrücknahme und 
                  erzielte signifikante Fortschritte bei ihren Nachhaltigkeitszielen.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 py-1 px-2 rounded-full">ESG-Erfolg</span>
                    <span className="text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 py-1 px-2 rounded-full ml-2">Prozessoptimierung</span>
                  </div>
                  <Link href="/success-stories/retail-chain" className="text-primary hover:underline flex items-center">
                    Mehr erfahren <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Geschäftspläne</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Maßgeschneiderte Pakete für Unternehmen unterschiedlicher Größe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Small Business Plan */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Small Business</h3>
                <p className="text-2xl font-bold">99 €<span className="text-base font-normal">/Monat</span></p>
                <p className="text-sm text-muted-foreground mt-1">Für kleine Unternehmen</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Zugang zum B2B-Marktplatz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Bis zu 5 Benutzerkonten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Unbegrenzte Materialangebote</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Grundlegende Recyclingberichte</span>
                  </li>
                </ul>
                <Link href="/auth/register?plan=small_business" className="block mt-6">
                  <Button className="w-full" variant="outline">
                    Jetzt starten
                  </Button>
                </Link>
              </div>
            </div>

            {/* Corporate Plan */}
            <div className="bg-card rounded-lg border border-primary shadow-md overflow-hidden transform scale-105">
              <div className="p-6 border-b border-border bg-primary/10">
                <h3 className="text-xl font-bold mb-2">Corporate</h3>
                <p className="text-2xl font-bold">299 €<span className="text-base font-normal">/Monat</span></p>
                <p className="text-sm text-muted-foreground mt-1">Für mittelständische Unternehmen</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Alle Small Business-Funktionen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Bis zu 20 Benutzerkonten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Premium-Platzierung für Angebote</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Erweiterte Recycling-Analytik</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Persönlicher Account Manager</span>
                  </li>
                </ul>
                <Link href="/auth/register?plan=corporate" className="block mt-6">
                  <Button className="w-full">
                    Corporate wählen
                  </Button>
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/50">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-2xl font-bold">Individuell</p>
                <p className="text-sm text-muted-foreground mt-1">Für Großunternehmen</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Alle Corporate-Funktionen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Unbegrenzte Benutzerkonten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>API-Integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Spezifische Nachhaltigkeitsberichte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Beratung zur Kreislaufwirtschaft</span>
                  </li>
                </ul>
                <Link href="/contact?plan=enterprise" className="block mt-6">
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
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit, Ihr Recyclingmanagement zu transformieren?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Kontaktieren Sie unser Unternehmensteam für eine individuelle Beratung und entdecken Sie 
            das volle Potenzial der Kreislaufwirtschaft für Ihr Unternehmen.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact?department=business">
              <Button size="lg" variant="secondary">
                Beratungsgespräch vereinbaren
              </Button>
            </Link>
            <Link href="/auth/register?type=business">
              <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                Firmenkonto erstellen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section - Optional */}
    </div>
  );
} 