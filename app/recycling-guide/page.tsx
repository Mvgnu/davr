import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, Leaf, Hammer, FileCheck, ArrowRight, Info, Award, Recycle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: 'Recycling-Leitfaden | Wertstoffe richtig recyceln',
  description: 'Lernen Sie, wie Sie verschiedene Materialien richtig recyceln und den maximalen Wert aus Ihren Wertstoffen erzielen können mit unseren Recycling-Tipps und Praktiken.',
  keywords: 'Recycling-Guide, Recycling-Leitfaden, Wertstoffe recyceln, Recycling-Tipps, Materialrecycling, Mülltrennung',
};

export default function RecyclingGuidePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-green-50 dark:bg-green-950/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-background-abstract.jpg"
            alt="Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Recycling-Leitfaden</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Lernen Sie, wie Sie Ihre Wertstoffe optimal recyceln und zum Umweltschutz beitragen können.
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Die Grundlagen des Recyclings</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Recycling ist mehr als nur Müll zu trennen – es ist ein wichtiger Prozess, der dazu beiträgt, 
                wertvolle Ressourcen zu schonen, Energie zu sparen und Umweltverschmutzung zu reduzieren.
              </p>
              <p>
                In Deutschland haben wir ein fortschrittliches Recycling-System, das verschiedene 
                Materialien wie Papier, Glas, Kunststoffe, Metalle und Elektronik effizient verarbeiten kann.
              </p>
              <p>
                Dieser Leitfaden hilft Ihnen, die verschiedenen Recyclingprozesse zu verstehen und 
                gibt praktische Tipps, wie Sie Ihre Wertstoffe optimal vorbereiten können.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Material Specific Guides */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Materialspezifische Recycling-Guides</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Erfahren Sie, wie verschiedene Materialien richtig recyclebar sind und was Sie beachten sollten.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {/* Plastic Recycling */}
              <AccordionItem value="plastic" className="bg-card rounded-lg border border-border shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mr-3">
                      <Recycle className="h-5 w-5" />
                    </div>
                    Kunststoff recyceln
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
                  <div className="space-y-4">
                    <p>
                      Kunststoffe werden nach ihren Recyclingcodes (1-7) sortiert, die oft in einem Dreieck auf dem Produkt zu finden sind.
                    </p>

                    <h4 className="font-semibold text-foreground">Vorbereitung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Entfernen Sie alle Etiketten und Deckel (sofern aus anderem Material)</li>
                      <li>Spülen Sie Behälter aus, um Lebensmittelreste zu entfernen</li>
                      <li>Quetschen Sie Flaschen zusammen, um Platz zu sparen</li>
                    </ul>

                    <h4 className="font-semibold text-foreground">Häufige Fehler:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Spielzeug gehört nicht in den gelben Sack/die gelbe Tonne</li>
                      <li>Biokunststoffe gehören oft nicht ins Plastikrecycling</li>
                      <li>Stark verschmutzte Kunststoffe sollten im Restmüll entsorgt werden</li>
                    </ul>
                    
                    <div className="pt-2">
                      <Link href="/materials/plastic" className="text-primary hover:underline inline-flex items-center">
                        Mehr über Kunststoffrecycling erfahren
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Paper Recycling */}
              <AccordionItem value="paper" className="bg-card rounded-lg border border-border shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mr-3">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    Papier recyceln
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
                  <div className="space-y-4">
                    <p>
                      Papierrecycling spart erheblich Ressourcen und Energie. Papier kann bis zu 6-7 Mal recycelt werden.
                    </p>

                    <h4 className="font-semibold text-foreground">Vorbereitung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Entfernen Sie Heftklammern, Klebeband und andere Nicht-Papier-Teile</li>
                      <li>Zerkleinern Sie größere Kartons, um Platz zu sparen</li>
                      <li>Halten Sie Papier trocken und sauber</li>
                    </ul>

                    <h4 className="font-semibold text-foreground">Häufige Fehler:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Kassenbons (Thermopapier) gehören in den Restmüll</li>
                      <li>Backpapier ist nicht recyclebar</li>
                      <li>Tapeten gehören nicht ins Papierrecycling</li>
                    </ul>
                    
                    <div className="pt-2">
                      <Link href="/materials/paper" className="text-primary hover:underline inline-flex items-center">
                        Mehr über Papierrecycling erfahren
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Metal Recycling */}
              <AccordionItem value="metal" className="bg-card rounded-lg border border-border shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center mr-3">
                      <Hammer className="h-5 w-5" />
                    </div>
                    Metall recyceln
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
                  <div className="space-y-4">
                    <p>
                      Metalle sind besonders wertvoll für das Recycling, da sie ohne Qualitätsverlust 
                      unendlich oft wiederverwertet werden können.
                    </p>

                    <h4 className="font-semibold text-foreground">Vorbereitung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Spülen Sie Dosen und Behälter aus</li>
                      <li>Entfernen Sie wenn möglich nicht-metallische Teile</li>
                      <li>Trennen Sie verschiedene Metallarten (z.B. Aluminium von Stahl)</li>
                    </ul>

                    <h4 className="font-semibold text-foreground">Häufige Fehler:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Elektronische Geräte gehören zum Elektroschrott, nicht zum Metallrecycling</li>
                      <li>Spraydosen müssen vollständig entleert sein</li>
                      <li>Kochutensilien mit Kunststoffgriffen sollten getrennt werden</li>
                    </ul>
                    
                    <div className="pt-2">
                      <Link href="/materials/metal" className="text-primary hover:underline inline-flex items-center">
                        Mehr über Metallrecycling erfahren
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Glass Recycling */}
              <AccordionItem value="glass" className="bg-card rounded-lg border border-border shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 rounded-full flex items-center justify-center mr-3">
                      <Info className="h-5 w-5" />
                    </div>
                    Glas recyceln
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
                  <div className="space-y-4">
                    <p>
                      Glas kann ohne Qualitätsverlust unendlich oft recycelt werden und spart dabei 
                      erhebliche Mengen an Rohstoffen und Energie.
                    </p>

                    <h4 className="font-semibold text-foreground">Vorbereitung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Spülen Sie Glasflaschen und -behälter aus</li>
                      <li>Entfernen Sie Deckel und Verschlüsse (können separat recycelt werden)</li>
                      <li>Sortieren Sie nach Farben (weiß, grün, braun)</li>
                    </ul>

                    <h4 className="font-semibold text-foreground">Häufige Fehler:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Trinkgläser, Fensterglas und Keramik dürfen nicht in den Glascontainer</li>
                      <li>Glühbirnen gehören in den Restmüll (LED/Energiesparlampen zum Sondermüll)</li>
                      <li>Etiketten müssen nicht entfernt werden</li>
                    </ul>
                    
                    <div className="pt-2">
                      <Link href="/materials/glass" className="text-primary hover:underline inline-flex items-center">
                        Mehr über Glasrecycling erfahren
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Electronic Waste */}
              <AccordionItem value="electronics" className="bg-card rounded-lg border border-border shadow-sm">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-medium hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mr-3">
                      <Award className="h-5 w-5" />
                    </div>
                    Elektronik recyceln
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
                  <div className="space-y-4">
                    <p>
                      Elektronikschrott enthält wertvolle Rohstoffe wie Gold, Silber und Kupfer sowie 
                      schädliche Substanzen, die fachgerecht entsorgt werden müssen.
                    </p>

                    <h4 className="font-semibold text-foreground">Vorbereitung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Löschen Sie wenn möglich persönliche Daten von elektronischen Geräten</li>
                      <li>Entfernen Sie Batterien und Akkus (werden separat recycelt)</li>
                      <li>Verpacken Sie zerbrechliche Geräte sicher für den Transport</li>
                    </ul>

                    <h4 className="font-semibold text-foreground">Abgabemöglichkeiten:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Kommunale Wertstoffhöfe nehmen Elektroschrott kostenlos an</li>
                      <li>Große Elektrohändler müssen Altgeräte zurücknehmen</li>
                      <li>Sondersammelaktionen in vielen Städten und Gemeinden</li>
                    </ul>
                    
                    <div className="pt-2">
                      <Link href="/materials/electronics" className="text-primary hover:underline inline-flex items-center">
                        Mehr über Elektronikrecycling erfahren
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Recycling Process Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Der Recyclingprozess erklärt</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Das Recycling durchläuft mehrere Phasen, von der Sammlung über die Sortierung bis hin zur 
                Verarbeitung und Herstellung neuer Produkte. Hier ist ein Überblick:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-xl">1. Sammlung</h3>
                  <p>Wertstoffe werden durch verschiedene Systeme gesammelt: gelbe Säcke/Tonnen, Altpapiercontainer, Glascontainer, Wertstoffhöfe etc.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-xl">2. Sortierung</h3>
                  <p>Gesammelte Materialien werden manuell oder maschinell nach Materialtyp sortiert und von Verunreinigungen befreit.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-xl">3. Verarbeitung</h3>
                  <p>Materialien werden zerkleinert, gereinigt und zu Sekundärrohstoffen verarbeitet, z.B. Kunststoffgranulat oder Papierfasern.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-xl">4. Herstellung</h3>
                  <p>Aus den gewonnenen Sekundärrohstoffen werden neue Produkte hergestellt, die wieder in den Wirtschaftskreislauf gelangen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Tipps für besseres Recycling</h2>
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="font-semibold text-foreground text-xl mb-3">Richtig trennen</h3>
                <p className="text-muted-foreground">
                  Informieren Sie sich über die lokalen Recycling-Richtlinien, da diese von Gemeinde zu Gemeinde variieren können. 
                  Eine falsche Sortierung kann dazu führen, dass ganze Chargen von Recyclingmaterial unbrauchbar werden.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="font-semibold text-foreground text-xl mb-3">Sauber und trocken</h3>
                <p className="text-muted-foreground">
                  Spülen Sie Verpackungen leicht aus, bevor Sie sie recyceln. Verschmutzungen können den Recyclingprozess 
                  beeinträchtigen oder sogar verhindern.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                <h3 className="font-semibold text-foreground text-xl mb-3">Reduce, Reuse, Recycle</h3>
                <p className="text-muted-foreground">
                  Denken Sie daran, dass Recycling erst an dritter Stelle steht. Versuchen Sie zuerst, Abfall zu vermeiden 
                  und Produkte wiederzuverwenden, bevor Sie sie recyceln.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Finden Sie Recyclinghöfe in Ihrer Nähe</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Entdecken Sie lokale Recyclingmöglichkeiten und erfahren Sie, welche Materialien 
            Sie wo abgeben können.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/recycling-centers">
              <Button size="lg" variant="secondary">
                Recyclinghöfe finden
              </Button>
            </Link>
            <Link href="/materials">
              <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                Materialinfos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 