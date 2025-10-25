import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Recycle, MapPin, Package, Search, ArrowRight, Award, Globe, Zap, ArrowDown, Euro, Info } from 'lucide-react';
import { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ButtonLink } from '@/components/ui/button-link';
import { MaterialSearch } from '@/components/MaterialSearch';
import React from 'react';
import { prisma } from '@/lib/db/prisma'; // Import Prisma client
import MaterialPreviewCard from '@/components/materials/MaterialPreviewCard'; // Import the new card component
import TopRecyclingCenters from '@/components/TopRecyclingCenters'; // Import the new component

export const metadata: Metadata = {
  title: 'Recycling-Marktplatz | Wertstoffpreise vergleichen & Recyclinghöfe finden',
  description: 'Vergleichen Sie aktuelle Wertstoffpreise in Deutschland und finden Sie Recyclinghöfe in Ihrer Nähe. Aluminium, Metall, Papier & mehr recyceln und verkaufen.',
  keywords: 'Recycling, Wertstoff, Ankaufspreis, Schrottpreis, Recyclinghof, Wertstoffe verkaufen, Nachhaltigkeit',
};

// Type for the fetched material data
type TopMaterial = {
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
};

export default async function HomePage() {
  // Structured data for the website
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.recycling-marktplatz.de/',
    name: 'Recycling-Marktplatz',
    description: 'Vergleichen Sie aktuelle Wertstoffpreise in Deutschland und finden Sie Recyclinghöfe in Ihrer Nähe.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.recycling-marktplatz.de/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  // Fetch top materials from the database
  let topMaterials: TopMaterial[] = [];
  try {
    topMaterials = await prisma.material.findMany({
      take: 6, // Fetch 6 materials
      select: {
        name: true,
        slug: true,
        image_url: true,
        description: true, // Select description for potential use
      },
      orderBy: {
        // Order by name for consistency, or potentially by usage/popularity later
        name: 'asc',
      },
      // Optional: Add a filter if needed, e.g., only top-level materials
      // where: { parent_id: null }
    });
  } catch (error) {
    console.error("Failed to fetch top materials:", error);
    // Handle error gracefully, maybe log it, don't block page render
  }

  return (
    <>
      <JsonLd data={structuredData} />
      
      <div className="bg-background text-foreground">
        {/* Hero Section - Enhanced */}
        <section className="relative bg-background py-24 md:py-32 overflow-hidden">
          {/* Abstract Background Image */}
          <div className="absolute inset-0 z-0 opacity-30">
             <Image
                src="/images/hero-illustration.svg"
                alt="Moderner Recycling Hintergrund"
                fill
                style={{ objectFit: 'cover' }}
                priority
             />
             {/* Optional: Add a gradient overlay */}
             <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-3xl">
                {/* Enhanced Typography & Animation */}
                <h1 
                  className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up opacity-0 [--animation-delay:200ms]"
                  style={{ animationFillMode: 'forwards' }}
                >
                  Recycling Neu Gedacht: Wertstoffe. Kreisläufe. Zukunft.
                </h1>
                <p 
                  className="text-xl text-muted-foreground mb-10 animate-fade-in-up opacity-0 [--animation-delay:400ms]"
                  style={{ animationFillMode: 'forwards' }}
                >
                  Entdecken Sie eine moderne Plattform, die Recyclinghöfe, Unternehmen und Materialströme intelligent verbindet. Mehr Wert, weniger Verschwendung.
                </p>
                {/* Enhanced CTA Buttons */}
                <div 
                  className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 [--animation-delay:600ms]"
                  style={{ animationFillMode: 'forwards' }}
                >
                  <Link href="/recycling-centers">
                    {/* Primary CTA - Reverted size to lg */}
                    <Button size="lg" className="w-full sm:w-auto shadow-lg">
                      <MapPin className="mr-2 h-5 w-5" />
                      Recyclinghof finden
                    </Button>
                  </Link>
                  <Link href="/marketplace"> 
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      <Search className="mr-2 h-5 w-5" />
                      Marktplatz entdecken
                    </Button>
                  </Link>
                  <Link href="/materials">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                       <Info className="mr-2 h-5 w-5" />
                       Material-Infos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section - Using MaterialSearch */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <MaterialSearch className="max-w-3xl mx-auto bg-card p-6 md:p-8 rounded-lg shadow-lg border border-border" />
          </div>
        </section>

        {/* Features Section - Enhanced Background & Cards */}
        <section className="py-16 bg-gradient-to-br from-secondary/50 to-secondary"> {/* Subtle Gradient BG */}
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Warum Recycling wichtig ist</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Recycling schont Ressourcen, spart Energie und reduziert CO₂-Emissionen. 
                Entdecken Sie die Vorteile des Recyclings und machen Sie mit!
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Enhanced Card 1 */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-primary/30">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Energieeinsparung</h3>
                <p className="text-muted-foreground">
                  Die Wiederverwertung von Materialien verbraucht oft deutlich weniger Energie als die Neuproduktion.
                </p>
              </div>
              
              {/* Enhanced Card 2 */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-primary/30">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
                  <Globe className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Umweltschutz</h3>
                <p className="text-muted-foreground">
                  Reduziert Abfall, schont natürliche Ressourcen und verringert die Umweltbelastung.
                </p>
              </div>
              
              {/* Enhanced Card 3 */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:border-primary/30">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
                  <Euro className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Wirtschaftlicher Wert</h3>
                <p className="text-muted-foreground">
                  Wertstoffe sind wertvolle Ressourcen. Verkaufen oder finden Sie Materialien auf unserem Marktplatz.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works - Enhanced Cards */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">So funktioniert es</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                In wenigen einfachen Schritten zum Recycling Ihrer Wertstoffe
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Enhanced Step Card 1 */}
              <div className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-muted/50">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-md">
                    1
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -z-10"></div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Finden & Vergleichen</h3>
                <p className="text-muted-foreground">
                  Suchen Sie Recyclinghöfe oder Marktplatz-Angebote und vergleichen Sie Konditionen.
                </p>
              </div>
              
              {/* Enhanced Step Card 2 */}
              <div className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-muted/50">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-md">
                    2
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -z-10"></div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Vorbereiten & Handeln</h3>
                <p className="text-muted-foreground">
                  Bereiten Sie Ihr Material vor oder kontaktieren Sie Anbieter direkt über die Plattform.
                </p>
              </div>
              
              {/* Enhanced Step Card 3 */}
              <div className="text-center p-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-muted/50">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-md">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Abgeben & Profitieren</h3>
                <p className="text-muted-foreground">
                  Bringen Sie Material zum Hof oder schließen Sie Geschäfte ab und tragen Sie zur Kreislaufwirtschaft bei.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Recycling Centers */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Beliebte Recyclinghöfe</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Entdecken Sie einige der beliebtesten und am besten bewerteten Recyclinghöfe
              </p>
            </div>
            
            <TopRecyclingCenters />
            
            <div className="text-center mt-10">
              <Link href="/recycling-centers">
                <Button variant="outline">
                  Alle Recyclinghöfe anzeigen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Bereit, mit dem Recycling zu beginnen?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Registrieren Sie sich jetzt kostenlos und entdecken Sie alle Vorteile unserer Plattform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Jetzt registrieren
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-white/50 hover:bg-white/10">
                  Mehr erfahren
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Materials Preview */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Materialien im Überblick</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Erfahren Sie mehr über verschiedene Wertstoffe und ihre Recyclingfähigkeit.
              </p>
            </div>
            {/* Grid for material cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {topMaterials.map((material) => (
                <MaterialPreviewCard key={material.slug} material={material} />
              ))}
              {topMaterials.length === 0 && (
                   <p className="col-span-full text-center text-muted-foreground">Materialien konnten nicht geladen werden.</p>
              )}
            </div>
            <div className="text-center mt-12">
              <Link href="/materials">
                <Button variant="outline">
                  Alle Materialien anzeigen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
} 