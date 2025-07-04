import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Recycle, Search, MapPin, Info, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { slugify } from '@/lib/utils';
import { JsonLd } from '@/components/JsonLd';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  subtype?: string;
  recyclable: boolean;
  marketValueLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  approximateMinPrice: number;
  approximateMaxPrice: number;
  imageUrl?: string;
}

// Fetch materials by type
async function getMaterialsByType(type: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/materials?category=${type}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch materials');
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching materials by type:', error);
    return [];
  }
}

// Get popular German cities
function getPopularCities() {
  return [
    'Berlin',
    'Hamburg',
    'München',
    'Köln',
    'Frankfurt',
    'Stuttgart',
    'Düsseldorf',
    'Leipzig',
    'Dortmund',
    'Essen'
  ];
}

// Helper function to get color for material category
function getCategoryColor(category: string) {
  switch(category.toUpperCase()) {
    case 'PACKAGING': return 'bg-blue-100 text-blue-800';
    case 'HOUSEHOLD': return 'bg-green-100 text-green-800';
    case 'CONSTRUCTION': return 'bg-orange-100 text-orange-800';
    case 'INDUSTRY': return 'bg-purple-100 text-purple-800';
    case 'AUTOMOTIVE': return 'bg-red-100 text-red-800';
    case 'ELECTRONICS': return 'bg-yellow-100 text-yellow-800';
    case 'COMPOSITE': return 'bg-indigo-100 text-indigo-800';
    case 'METAL': return 'bg-gray-100 text-gray-800';
    case 'PAPER': return 'bg-emerald-100 text-emerald-800';
    case 'GLASS': return 'bg-cyan-100 text-cyan-800';
    case 'PLASTIC': return 'bg-violet-100 text-violet-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Function to get localized category name
function getLocalizedType(type: string): string {
  const typeUpper = type.toUpperCase();
  switch(typeUpper) {
    case 'PACKAGING': return 'Verpackungen';
    case 'HOUSEHOLD': return 'Haushalt';
    case 'CONSTRUCTION': return 'Baumaterial';
    case 'INDUSTRY': return 'Industrie';
    case 'AUTOMOTIVE': return 'Automobil';
    case 'ELECTRONICS': return 'Elektronik';
    case 'COMPOSITE': return 'Verbundstoffe';
    case 'METAL': return 'Metall';
    case 'ALUMINUM': case 'ALUMINIUM': return 'Aluminium';
    case 'PAPER': return 'Papier';
    case 'GLASS': return 'Glas';
    case 'PLASTIC': return 'Kunststoff';
    default: return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { type: string }
}): Promise<Metadata> {
  const decodedType = decodeURIComponent(params.type);
  const localizedType = getLocalizedType(decodedType);
  
  return {
    title: `${localizedType} Recycling | Wertstoffe & Ankaufspreise`,
    description: `Alles über ${localizedType} Recycling: Welche Materialien werden recycelt, aktuelle Ankaufspreise und wie Sie ${localizedType} richtig vorbereiten.`,
    keywords: `${localizedType}, Recycling, Ankaufspreis, Wertstoff, Wertstoffe verkaufen, Nachhaltigkeit`,
    openGraph: {
      title: `${localizedType} Recycling | Wertstoffe & Ankaufspreise`,
      description: `Vergleichen Sie Ankaufspreise für ${localizedType} und finden Sie Recyclinghöfe in Ihrer Nähe.`,
      type: 'website',
    },
  };
}

export default async function MaterialsTypePage({ 
  params, 
  searchParams 
}: { 
  params: { type: string };
  searchParams: { [key: string]: string | undefined }; 
}) {
  const decodedType = decodeURIComponent(params.type);
  const localizedType = getLocalizedType(decodedType);
  const subtypeFilter = searchParams.subtype;
  const popularCities = getPopularCities();
  
  // Fetch materials of specified type
  const materials = await getMaterialsByType(decodedType);
  
  if (materials.length === 0) {
    notFound();
  }

  // Get all unique subtypes, ensuring type safety
  const materialsWithSubtypes = materials
    .filter((m: Material): m is Material & { subtype: string } => !!m.subtype);
  const subtypeStrings = materialsWithSubtypes.map((m: Material & { subtype: string }) => m.subtype);
  const uniqueSubtypes = subtypeStrings.filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
  const subtypes = uniqueSubtypes.sort();
  
  // Filter materials by subtype if specified
  const filteredMaterials = subtypeFilter 
    ? materials.filter((m: Material) => m.subtype === subtypeFilter)
    : materials;
  
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredMaterials.map((material: Material, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: material.name,
        description: material.description,
        image: material.imageUrl || '/images/default-material.jpg',
        category: localizedType,
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: material.approximateMinPrice,
          highPrice: material.approximateMaxPrice,
          priceCurrency: 'EUR',
          offerCount: 'multiple'
        }
      }
    }))
  };
  
  return (
    <>
      <JsonLd data={structuredData} />
      
      <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6 text-foreground">
        <div className="mb-8 text-sm text-muted-foreground">
           <Link href="/materials" className="hover:text-foreground transition-colors inline-flex items-center group">
               <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform duration-200" />
               Alle Materialien
           </Link>
           <span className="mx-2">/</span>
           <span className="font-medium text-foreground">{localizedType}</span>
        </div>
          
        <h1 
          className="text-3xl md:text-4xl font-bold mb-3 text-foreground animate-fade-in-up opacity-0 [--animation-delay:100ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          {localizedType} Recycling
        </h1>
        <p 
          className="text-lg text-muted-foreground mb-8 animate-fade-in-up opacity-0 [--animation-delay:200ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          Alles über {localizedType.toLowerCase()}-Recycling: Materialtypen, Eigenschaften und lokale Ankaufspreise.
        </p>
        
        {subtypes.length > 0 && (
          <div 
             className="flex flex-wrap gap-2 my-6 animate-fade-in-up opacity-0 [--animation-delay:300ms]"
             style={{ animationFillMode: 'forwards' }}
          >
            <Link
              href={`/materials/type/${params.type}`}
              className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 border 
                ${!subtypeFilter 
                  ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm' 
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-border'
              }`}
            >
              Alle Untertypen
            </Link>
            
            {subtypes.map((subtype: string) => (
              <Link
                key={subtype}
                href={`/materials/type/${params.type}?subtype=${subtype}`}
                className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 border 
                  ${subtypeFilter === subtype 
                    ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm' 
                    : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground hover:border-border'
                }`}
              >
                {subtype}
              </Link>
            ))}
          </div>
        )}
        
        <div 
          className="mb-12 p-5 border border-border/80 rounded-lg bg-muted/50 animate-fade-in-up opacity-0 [--animation-delay:400ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            {localizedType} in Ihrer Nähe verkaufen
          </h2>
          <p className="text-muted-foreground mb-5">
            Wählen Sie Ihre Stadt, um lokale Recyclinghöfe und aktuelle Ankaufspreise für {localizedType.toLowerCase()} zu finden.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularCities.map(city => (
              <ButtonLink
                key={city}
                href={`/materials/type/${params.type}/${slugify(city)}`}
                variant="outline"
                className="text-center justify-center text-sm bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 h-10"
              >
                <MapPin className="w-4 h-4 mr-1.5" />
                {city}
              </ButtonLink>
            ))}
          </div>
        </div>

        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up opacity-0 [--animation-delay:500ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          {filteredMaterials.map((material: Material, index: number) => (
            <Link 
              key={material.id} 
              href={`/materials/${slugify(material.name)}`} 
              className="group block h-full"
            >
              <div className="p-5 border border-border/80 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out bg-card h-full flex flex-col justify-between hover:border-primary/30">
                <div>
                   <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">{material.name}</h3>
                   {material.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{material.description}</p>}
                </div>
                 <div className="flex flex-wrap gap-1 mt-2">
                    {material.recyclable && <Badge variant="secondary" className="text-xs"><Recycle size={12} className="mr-1" /> Recycelbar</Badge>}
                    <Badge variant="outline" className="text-xs">Wert: {material.marketValueLevel}</Badge>
                 </div>
                 <div className="flex justify-end items-center text-sm text-primary mt-3 pt-3 border-t border-border/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Mehr erfahren 
                    <ArrowRight className="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
} 