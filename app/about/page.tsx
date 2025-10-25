import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Globe, Leaf, Activity, Target, Recycle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Über Uns | Recycling-Marktplatz Deutschland',
  description: 'Entdecken Sie, wer wir sind und warum wir uns für die Zukunft des Recyclings in Deutschland einsetzen. Unsere Vision, Mission und Werte für ein nachhaltiges Morgen.',
  keywords: 'Über Uns, Recycling Mission, Nachhaltigkeit, Recycling Deutschland, Wertstoffrecycling, Kreislaufwirtschaft',
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-green-50 dark:bg-green-950/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-illustration.svg"
            alt="Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Über den Recycling-Marktplatz</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Wir verbinden Wertstoffe, Menschen und Unternehmen auf dem Weg zu einer nachhaltigeren Zukunft.
            </p>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Unsere Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Der Recycling-Marktplatz wurde mit einem klaren Ziel gegründet: Den Prozess des Recyclings 
                in Deutschland transparenter, zugänglicher und effizienter zu gestalten.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Durch die Verbindung von Verbrauchern, Recyclinghöfen und Unternehmen schaffen wir einen 
                digitalen Ort, an dem Wertstoffe ihren Weg zurück in den Wirtschaftskreislauf finden.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <Recycle className="mr-2 h-5 w-5" />
                Recycling neu gedacht. Einfach. Digital. Wertvoll.
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/about/mission-image.jpg" 
                alt="Unsere Mission"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Unsere Werte</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Diese Grundprinzipien leiten uns bei allem, was wir tun, und sind die Grundlage unserer täglichen Arbeit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nachhaltigkeit</h3>
              <p className="text-muted-foreground">
                Wir fördern nachhaltige Praktiken und Entscheidungen, die positive Auswirkungen 
                auf unsere Umwelt haben und zur Ressourcenschonung beitragen.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <Activity className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Transparenz</h3>
              <p className="text-muted-foreground">
                Wir glauben an offene Kommunikation und ehrliche Informationen über Wertstoffe, 
                Preise und Recyclingprozesse für alle Beteiligten.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-card p-8 rounded-lg shadow-sm border border-border">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                Wir streben danach, neue Wege zu finden, um Recycling einfacher, effizienter 
                und wertvoller für alle Beteiligten zu machen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Unsere Geschichte</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Die Idee zum Recycling-Marktplatz entstand 2023, als eine Gruppe von Umweltbegeisterten und 
                Technologieexperten erkannte, dass es in Deutschland an einer zentralen digitalen Plattform 
                für Recycling mangelte.
              </p>
              <p>
                Obwohl Deutschland in Sachen Recycling weit fortgeschritten ist, fehlte es an Transparenz 
                und einfachem Zugang zu Informationen über Wertstoffpreise, Annahmebedingungen und 
                Recyclingmöglichkeiten.
              </p>
              <p>
                Unsere Plattform startete zunächst mit einigen wenigen Recyclinghöfen in Großstädten. 
                Dank des positiven Feedbacks von Nutzern und Partnern konnten wir schnell wachsen und 
                bieten heute eine umfassende Lösung für das Recycling-Ökosystem in ganz Deutschland.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Werden Sie Teil unserer Mission</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Ob als Verbraucher, Recyclinghof oder Unternehmen – gemeinsam können wir 
            die Zukunft des Recyclings in Deutschland gestalten.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                Jetzt registrieren
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                Kontakt aufnehmen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section - Optional, could be added in the future */}
    </div>
  );
} 