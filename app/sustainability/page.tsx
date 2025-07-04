import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Recycle, Leaf, Globe, Scale, TrendingUp, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nachhaltigkeit & Umweltschutz | Recycling-Marktplatz',
  description: 'Erfahren Sie mehr über unseren Beitrag zur Kreislaufwirtschaft und wie wir uns für Umweltschutz durch Recycling und nachhaltige Praktiken einsetzen.',
  keywords: 'Nachhaltigkeit, Kreislaufwirtschaft, Umweltschutz durch Recycling, CO2-Reduktion, Ressourcenschonung, ökologischer Fußabdruck',
};

export default function SustainabilityPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-green-50 dark:bg-green-950/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-background-abstract.jpg"
            alt="Nachhaltigkeit Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Nachhaltigkeit & Umweltschutz</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Wie der Recycling-Marktplatz zur Kreislaufwirtschaft beiträgt und den ökologischen Fußabdruck reduziert
            </p>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Unser Engagement für Nachhaltigkeit</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Der Recycling-Marktplatz wurde mit einer klaren Vision gegründet: Die Kreislaufwirtschaft 
                  in Deutschland zu fördern und den Umgang mit wertvollen Ressourcen zu revolutionieren.
                </p>
                <p>
                  Wir glauben fest daran, dass der Übergang zu einer nachhaltigen Wirtschaft nicht nur 
                  möglich, sondern auch wirtschaftlich sinnvoll ist. Durch die Verbindung von Menschen, 
                  Recyclinghöfen und Unternehmen schaffen wir ein Ökosystem, das Wertstoffe im Kreislauf hält 
                  und die Umweltbelastung reduziert.
                </p>
                <p>
                  Unser Ziel ist es, Recycling zugänglicher, effizienter und lohnender für alle Beteiligten 
                  zu machen – und damit einen messbaren Beitrag zum Umweltschutz zu leisten.
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/sustainability/circular-economy.jpg"
                alt="Kreislaufwirtschaft Illustration"
                width={600}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Umweltauswirkungen des Recyclings</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Die Wiederverwertung von Materialien hat weitreichende positive Auswirkungen auf unsere Umwelt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Impact 1 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">CO₂-Emissionen senken</h3>
              <p className="text-muted-foreground">
                Das Recycling von Materialien verbraucht deutlich weniger Energie als die Neuproduktion. 
                Zum Beispiel spart das Recycling von Aluminium bis zu 95% der Energie, die für die 
                Primärproduktion benötigt wird.
              </p>
            </div>

            {/* Impact 2 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ressourcen schonen</h3>
              <p className="text-muted-foreground">
                Recycling reduziert den Bedarf an Rohstoffabbau und schützt dadurch natürliche 
                Lebensräume. Jede Tonne recyceltes Papier rettet etwa 17 Bäume und spart rund 
                26.000 Liter Wasser.
              </p>
            </div>

            {/* Impact 3 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Scale className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mülldeponien entlasten</h3>
              <p className="text-muted-foreground">
                Durch Recycling wird der Abfall, der auf Deponien landet, drastisch reduziert. 
                Dies verringert Verschmutzung, Methanemissionen und den Bedarf an neuen Deponien, 
                die wertvolles Land beanspruchen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Unser Beitrag zur Nachhaltigkeit</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              So trägt der Recycling-Marktplatz konkret zur Verbesserung der Umweltbilanz bei
            </p>
          </div>

          <div className="space-y-12">
            {/* Contribution 1 */}
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Recycle className="h-10 w-10" />
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-3">Förderung der Kreislaufwirtschaft</h3>
                <p className="text-muted-foreground">
                  Unsere Plattform schafft Verbindungen zwischen Materialquellen, Recyclinghöfen und 
                  Abnehmern, wodurch geschlossene Stoffkreisläufe entstehen. Durch die Vereinfachung 
                  dieser Prozesse helfen wir dabei, mehr Materialien im Kreislauf zu halten und deren 
                  Lebenszyklus zu verlängern.
                </p>
              </div>
            </div>

            {/* Contribution 2 */}
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-10 w-10" />
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-3">Transparenz und Effizienz</h3>
                <p className="text-muted-foreground">
                  Durch transparente Informationen über Materialpreise, Recyclingmöglichkeiten und 
                  -prozesse schaffen wir mehr Markteffizienz. Dies führt zu optimierten Logistikwegen, 
                  weniger Transportemissionen und einer insgesamt effizienteren Ressourcennutzung.
                </p>
              </div>
            </div>

            {/* Contribution 3 */}
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-10 w-10" />
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-3">Bildung und Bewusstsein</h3>
                <p className="text-muted-foreground">
                  Mit unserem umfangreichen Informationsangebot zu Recyclingpraktiken und der 
                  Umweltauswirkung verschiedener Materialien fördern wir das Bewusstsein für 
                  nachhaltigen Konsum und richtiges Recycling in der breiten Bevölkerung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Recycling in Zahlen</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Der messbaren Umweltnutzen durch effizientes Recycling
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">94%</p>
              <p className="text-muted-foreground">
                Energieeinsparung beim Aluminium-Recycling im Vergleich zur Neuproduktion
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">75%</p>
              <p className="text-muted-foreground">
                Weniger CO₂-Emissionen durch die Verwendung von recyceltem Stahl
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">1 Tonne</p>
              <p className="text-muted-foreground">
                Recyceltes Papier spart 26.000 Liter Wasser
              </p>
            </div>

            {/* Stat 4 */}
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">1 kg</p>
              <p className="text-muted-foreground">
                Recyceltes Elektroschrott spart bis zu 700 kg Rohstoffe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Goals Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg overflow-hidden shadow-xl order-2 md:order-1">
              <Image
                src="/images/sustainability/future-goals.jpg"
                alt="Zukunftsziele für Nachhaltigkeit"
                width={600}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6">Unsere Nachhaltigkeitsziele</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Wir haben uns ambitionierte Ziele gesetzt, um unseren Beitrag zur Nachhaltigkeit 
                  kontinuierlich zu erweitern:
                </p>
                <ul className="space-y-2 pl-5 list-disc">
                  <li>Jährliche Steigerung der über unsere Plattform recycelten Materialmengen um 25%</li>
                  <li>Erweiterung unseres Bildungsangebots und der Reichweite unserer Umweltinitiativen</li>
                  <li>Reduktion der CO₂-Emissionen in der Recycling-Logistik durch optimierte Routenplanung</li>
                  <li>Förderung von Innovationen im Bereich Recyclingtechnologien und Kreislaufwirtschaft</li>
                  <li>Etablierung von Partnerschaften mit Umweltschutzorganisationen und Forschungseinrichtungen</li>
                </ul>
                <p>
                  Mit diesen Zielen möchten wir nicht nur zu einer nachhaltigeren Welt beitragen, 
                  sondern auch Maßstäbe für verantwortungsvolles Handeln in der digitalen Recyclingwirtschaft setzen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Gemeinsam für eine nachhaltigere Zukunft</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Werden Sie Teil unserer Mission und tragen Sie aktiv zur Kreislaufwirtschaft bei
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/recycling-centers">
              <Button size="lg" variant="secondary">
                Recyclinghof finden
              </Button>
            </Link>
            <Link href="/recycling-guide">
              <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                Recycling-Leitfaden
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 