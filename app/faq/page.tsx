import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: 'Häufig gestellte Fragen | Recycling-Marktplatz',
  description: 'Antworten auf häufig gestellte Fragen zu Recycling, Wertstoffen, unserer Plattform und wie Sie Materialien verkaufen oder recyceln können.',
  keywords: 'FAQ, Recycling Fragen, Wertstoffe FAQ, Recyclinghof Fragen, Materialien recyceln, Hilfe Recycling',
};

export default function FAQPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 bg-muted/50 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/images/hero-illustration.svg"
            alt="FAQ Hintergrund"
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Häufig gestellte Fragen</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Antworten auf die häufigsten Fragen zu Recycling und unserem Marktplatz
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Main Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category Navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <a href="#platform" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium">
                Plattform & Konten
              </a>
              <a href="#materials" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium">
                Materialien & Recycling
              </a>
              <a href="#centers" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium">
                Recyclinghöfe
              </a>
              <a href="#marketplace" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium">
                Marktplatz
              </a>
              <a href="#business" className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium">
                Für Unternehmen
              </a>
            </div>

            {/* Platform & Account FAQs */}
            <div id="platform" className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-primary" />
                Plattform & Konten
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="account-creation" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie erstelle ich ein Konto auf dem Recycling-Marktplatz?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Die Kontoerstellung ist einfach und kostenlos. Klicken Sie auf den Button &quot;Registrieren&quot; in der oberen Navigationsleiste. 
                      Geben Sie Ihre E-Mail-Adresse ein, erstellen Sie ein sicheres Passwort und folgen Sie den Anweisungen zur 
                      Kontoaktivierung. Wir bieten auch die Möglichkeit, sich mit Google oder Facebook anzumelden, um den Prozess zu vereinfachen.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-types" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Welche verschiedenen Kontotypen gibt es?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Wir bieten drei Hauptkontotypen:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li><span className="font-medium text-foreground">Privatkonto:</span> Für Einzelpersonen, die Materialien verkaufen oder Recyclinginformationen suchen.</li>
                      <li><span className="font-medium text-foreground">Recyclinghof-Konto:</span> Für Betreiber von Recyclinghöfen, die ihre Dienste auflisten möchten.</li>
                      <li><span className="font-medium text-foreground">Unternehmenskonto:</span> Für Unternehmen, die größere Materialmengen kaufen oder verkaufen möchten.</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Sie können Ihren Kontotyp jederzeit in den Einstellungen ändern oder aktualisieren.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-free" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Ist die Nutzung des Recycling-Marktplatzes kostenlos?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Ja, die Grundfunktionen des Recycling-Marktplatzes sind für alle Nutzer kostenlos. 
                      Sie können kostenlos nach Recyclinghöfen suchen, Materialinformationen einsehen und 
                      mit anderen Nutzern in Kontakt treten. Für Recyclinghöfe und Unternehmen bieten wir 
                      Premium-Funktionen an, die mit zusätzlichen Kosten verbunden sein können.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-privacy" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie werden meine Daten geschützt?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Wir nehmen den Schutz Ihrer Daten sehr ernst. Alle persönlichen Informationen werden gemäß der 
                      DSGVO behandelt und sind durch moderne Verschlüsselungstechnologien geschützt. Ihre Daten werden 
                      niemals ohne Ihre ausdrückliche Zustimmung an Dritte weitergegeben. 
                      Detaillierte Informationen finden Sie in unserer <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Materials & Recycling FAQs */}
            <div id="materials" className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-primary" />
                Materialien & Recycling
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="materials-info" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Welche Informationen finde ich zu den verschiedenen Materialien?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Auf unseren Materialseiten finden Sie detaillierte Informationen zu:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Recyclingprozessen für verschiedene Materialtypen</li>
                      <li>Aktuellen Marktpreisen und Preistrends</li>
                      <li>Vorbereitungstipps für ein optimales Recycling</li>
                      <li>Umweltauswirkungen und Vorteile des Recyclings</li>
                      <li>Wo und wie Sie bestimmte Materialien recyceln können</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="material-prices" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie aktuell sind die Materialpreise auf der Plattform?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Wir aktualisieren die Referenzpreise für Materialien regelmäßig basierend auf Marktdaten, 
                      branchenweiten Informationen und Rückmeldungen von unseren Partnern. Die Preise dienen als 
                      Richtwerte und können je nach Region, Qualität und Menge variieren. Die tatsächlichen Ankaufspreise 
                      werden von den einzelnen Recyclinghöfen und Käufern festgelegt.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="preparation" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie bereite ich meine Materialien optimal vor?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Die optimale Vorbereitung variiert je nach Material. Allgemeine Tipps sind:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Materialien nach Typ trennen (z.B. verschiedene Metalle getrennt halten)</li>
                      <li>Verunreinigungen entfernen und Materialien säubern</li>
                      <li>Größere Mengen kompakt lagern (z.B. Dosen zerdrücken)</li>
                      <li>Bei wertvolleren Materialien wie Elektronikschrott keine Teile entfernen</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Detaillierte materialspezifische Anleitungen finden Sie in unserem <Link href="/recycling-guide" className="text-primary hover:underline">Recycling-Leitfaden</Link>.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Recycling Centers FAQs */}
            <div id="centers" className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-primary" />
                Recyclinghöfe
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="find-centers" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie finde ich Recyclinghöfe in meiner Nähe?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Sie können Recyclinghöfe in Ihrer Nähe ganz einfach über unsere Suchfunktion finden:
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Navigieren Sie zur <Link href="/recycling-centers" className="text-primary hover:underline">Recyclinghof-Seite</Link></li>
                      <li>Geben Sie Ihre Stadt oder Postleitzahl ein und optional das Material, das Sie recyceln möchten</li>
                      <li>Nutzen Sie die Filter, um nach bestimmten Kriterien zu suchen (z.B. Öffnungszeiten, akzeptierte Materialien)</li>
                      <li>Die Ergebnisse werden nach Entfernung zu Ihrem Standort sortiert</li>
                    </ol>
                    <p className="mt-2 text-muted-foreground">
                      Sie können auch die Kartenansicht nutzen, um Recyclinghöfe visuell zu lokalisieren.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="center-verification" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Was bedeutet ein &quot;verifizierter Recyclinghof&quot;?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Ein verifizierter Recyclinghof hat einen Überprüfungsprozess durchlaufen, der die Echtheit und 
                      Seriosität des Betriebs bestätigt. Dies umfasst:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Überprüfung der Geschäftsdokumente und Lizenzen</li>
                      <li>Bestätigung der angegebenen Adresse und Kontaktdaten</li>
                      <li>Nachweis der Einhaltung von Umwelt- und Recyclingstandards</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Die Verifizierung bietet Nutzern zusätzliche Sicherheit bei der Auswahl von Recyclinghöfen.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="center-listing" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie kann ich meinen Recyclinghof auf der Plattform eintragen?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Um Ihren Recyclinghof einzutragen:
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Erstellen Sie ein Recyclinghof-Konto oder wechseln Sie zu diesem Kontotyp</li>
                      <li>Klicken Sie auf &quot;Recyclinghof hinzufügen&quot; in Ihrem Dashboard</li>
                      <li>Füllen Sie alle erforderlichen Informationen aus (Name, Adresse, Kontaktdaten, Öffnungszeiten, akzeptierte Materialien etc.)</li>
                      <li>Laden Sie relevante Bilder und Dokumente hoch</li>
                      <li>Reichen Sie den Eintrag zur Prüfung ein</li>
                    </ol>
                    <p className="mt-2 text-muted-foreground">
                      Nach einer kurzen Überprüfung wird Ihr Recyclinghof auf unserer Plattform gelistet. 
                      Für detaillierte Informationen besuchen Sie unsere <Link href="/for-recycling-centers" className="text-primary hover:underline">Seite für Recyclinghofbetreiber</Link>.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Marketplace FAQs */}
            <div id="marketplace" className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-primary" />
                Marktplatz
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="marketplace-use" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie funktioniert der Marktplatz?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Unser Marktplatz verbindet Verkäufer und Käufer von recycelbaren Materialien:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Verkäufer können Materialien mit Beschreibungen, Bildern und gewünschtem Preis einstellen</li>
                      <li>Käufer können nach Materialien suchen, filtern und Kontakt mit Verkäufern aufnehmen</li>
                      <li>Die Plattform dient als Vermittler, während die Transaktion direkt zwischen den Parteien stattfindet</li>
                      <li>Nach Abschluss können beide Seiten Bewertungen abgeben</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Die Plattform erleichtert die Kommunikation und bietet einen sicheren Rahmen für den Handel mit recycelbaren Materialien.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="listing-create" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie erstelle ich ein Angebot auf dem Marktplatz?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      So erstellen Sie ein Angebot:
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Loggen Sie sich in Ihr Konto ein</li>
                      <li>Navigieren Sie zum Marktplatz und klicken Sie auf &quot;Neues Angebot erstellen&quot;</li>
                      <li>Wählen Sie die Materialart und geben Sie Details wie Menge, Qualität und Zustand an</li>
                      <li>Laden Sie aussagekräftige Bilder hoch (sehr wichtig für potenzielle Käufer)</li>
                      <li>Legen Sie einen Preis fest oder markieren Sie es als &quot;Verhandelbar&quot;</li>
                      <li>Geben Sie Ihren Standort und Kontaktpräferenzen an</li>
                      <li>Überprüfen und veröffentlichen Sie Ihr Angebot</li>
                    </ol>
                    <p className="mt-2 text-muted-foreground">
                      Ihr Angebot wird nach einer kurzen Prüfung für alle Nutzer sichtbar sein.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transaction-safety" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie sicher sind Transaktionen auf dem Marktplatz?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Obwohl wir keine direkte Zahlungsabwicklung anbieten, haben wir mehrere Sicherheitsmaßnahmen implementiert:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Verifizierungssystem für Benutzerkonten mit Bewertungen und Vertrauensmetriken</li>
                      <li>Sichere In-App-Kommunikation ohne Preisgabe persönlicher Kontaktdaten</li>
                      <li>Benutzerberichte und aktive Moderation zur Entfernung verdächtiger Angebote</li>
                      <li>Tipps für sichere Transaktionen und persönliche Treffen</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Wir empfehlen immer, zuerst über die Plattform zu kommunizieren und bei größeren Transaktionen sichere Zahlungsmethoden zu verwenden.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Business FAQs */}
            <div id="business" className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-primary" />
                Für Unternehmen
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="business-account" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Welche Vorteile bietet ein Unternehmenskonto?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Ein Unternehmenskonto bietet zahlreiche Vorteile:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Zugang zu Großhandelsangeboten und B2B-Materialströmen</li>
                      <li>Erweiterte Suchfilter und Analytik zu Materialpreisen und -trends</li>
                      <li>Möglichkeit, mehrere Mitarbeiter mit unterschiedlichen Rollen hinzuzufügen</li>
                      <li>Priorisierte Anzeige Ihrer Angebote/Gesuche</li>
                      <li>Detaillierte Berichte und Exportfunktionen für Ihre Aktivitäten</li>
                      <li>Dedizierter Support für Unternehmenskunden</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Für weitere Informationen besuchen Sie unsere <Link href="/for-businesses" className="text-primary hover:underline">Unternehmensseite</Link>.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bulk-materials" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Wie kann mein Unternehmen größere Materialmengen kaufen oder verkaufen?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Für größere Materialmengen bieten wir spezielle B2B-Funktionen:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Erstellen Sie ein Unternehmenskonto und verifizieren Sie es</li>
                      <li>Nutzen Sie die B2B-Sektion des Marktplatzes für Großhandelsangebote</li>
                      <li>Stellen Sie detaillierte Gesuche mit spezifischen Materialanforderungen ein</li>
                      <li>Nutzen Sie die Ausschreibungsfunktion für größere Mengen oder regelmäßige Lieferungen</li>
                      <li>Kontaktieren Sie unser Geschäftsteam für maßgeschneiderte Lösungen bei besonders großen Mengen</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Unser Ziel ist, Unternehmen dabei zu helfen, nachhaltige Materialkreisläufe zu etablieren und von der Kreislaufwirtschaft zu profitieren.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="corporate-solutions" className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline bg-card">
                    <span className="text-left">Gibt es maßgeschneiderte Lösungen für Unternehmen?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-card border-t border-border">
                    <p className="text-muted-foreground">
                      Ja, wir bieten verschiedene maßgeschneiderte Lösungen für Unternehmensanforderungen:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>API-Integrationen für die Verbindung mit Ihren eigenen Systemen</li>
                      <li>Individuelle Recycling- und Materialmanagementstrategien</li>
                      <li>Langfristige Lieferverträge und Partnerschaften</li>
                      <li>Schulungen und Workshops zu optimalen Recyclingpraktiken</li>
                      <li>Nachhaltigkeitsberichte und Zertifikate für Ihre CSR-Aktivitäten</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Kontaktieren Sie unser Unternehmensteam unter <a href="mailto:business@recycling-marktplatz.de" className="text-primary hover:underline">business@recycling-marktplatz.de</a> für individuelle Beratung.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Haben Sie weitere Fragen?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Wir helfen Ihnen gerne weiter. Kontaktieren Sie unser Support-Team oder durchsuchen Sie unsere ausführlichen Hilferessourcen.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" variant="default">
                  Kontakt aufnehmen
                </Button>
              </Link>
              <Link href="/help">
                <Button size="lg" variant="outline">
                  Hilfebereich
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 