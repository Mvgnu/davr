import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Recycle, Search, MapPin, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { slugify } from '@/lib/utils';
import { JsonLd } from '@/components/JsonLd';
import { notFound } from 'next/navigation';

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

  // Get all unique subtypes
  const subtypes = Array.from(
    new Set(materials.filter((m: Material) => m.subtype).map((m: Material) => m.subtype))
  ).sort();
  
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
      
      <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <div className="mb-6">
          <Link 
            href="/materials" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Alle Materialien
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {localizedType} Recycling
          </h1>
          
          <p className="text-lg text-gray-700 mb-6">
            Informationen über {localizedType.toLowerCase()} Recycling, Materialtypen und aktuelle Ankaufspreise
          </p>
          
          {subtypes.length > 0 && (
            <div className="flex flex-wrap gap-2 my-4">
              <Link
                href={`/materials/type/${params.type}`}
                className={`px-3 py-1 rounded-md text-sm ${
                  !subtypeFilter ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
                }`}
              >
                Alle
              </Link>
              
              {subtypes.map(subtype => (
                <Link
                  key={subtype}
                  href={`/materials/type/${params.type}?subtype=${subtype}`}
                  className={`px-3 py-1 rounded-md text-sm ${
                    subtypeFilter === subtype ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subtype}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-10 p-4 border rounded-lg bg-green-50 border-green-100">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            {localizedType} in Ihrer Stadt verkaufen
          </h2>
          
          <p className="text-green-700 mb-4">
            Wählen Sie Ihre Stadt, um Recyclinghöfe und aktuelle Ankaufspreise für {localizedType.toLowerCase()} zu finden.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {popularCities.map(city => (
              <ButtonLink
                key={city}
                href={`/materials/type/${params.type}/${slugify(city)}`}
                variant="outline"
                className="text-center justify-center text-sm"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </ButtonLink>
            ))}
          </div>
          
          <div className="mt-3 flex justify-center">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Oder geben Sie Ihre Stadt/PLZ ein..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {filteredMaterials.length} {localizedType} Materialien
            {subtypeFilter && ` (${subtypeFilter})`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMaterials.map((material: Material) => (
              <div 
                key={material.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {material.imageUrl ? (
                      <img 
                        src={material.imageUrl} 
                        alt={material.name}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center mr-4">
                        <Recycle className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-semibold">{material.name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        {material.subtype && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                            {material.subtype}
                          </span>
                        )}
                        
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          material.marketValueLevel === 'HIGH' ? 'bg-green-100 text-green-800' :
                          material.marketValueLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {material.marketValueLevel === 'HIGH' ? 'Hoher Wert' :
                           material.marketValueLevel === 'MEDIUM' ? 'Mittlerer Wert' :
                           'Niedriger Wert'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {material.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink
                      href={`/materials/${material.id}`}
                      variant="outline"
                      size="sm"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      Details
                    </ButtonLink>
                    
                    <ButtonLink
                      href={`/materials/type/${params.type}/${popularCities[0].toLowerCase()}`}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Preise vergleichen
                    </ButtonLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <h2 className="text-xl font-bold mb-4">Häufig gestellte Fragen zum {localizedType} Recycling</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Wie funktioniert das Recycling von {localizedType}?</h3>
              <p className="text-gray-700 text-sm mt-1">
                {localizedType} wird gesammelt, sortiert und zu speziellen Recyclinganlagen transportiert. 
                Dort wird es je nach Material aufbereitet, geschmolzen oder anderweitig verarbeitet, um 
                neue Rohstoffe zu gewinnen, die wieder in der Produktion eingesetzt werden können.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">Wo kann ich {localizedType} verkaufen?</h3>
              <p className="text-gray-700 text-sm mt-1">
                Sie können {localizedType} bei Recyclinghöfen, Schrottplätzen und speziellen Ankaufstellen verkaufen. 
                Die Preise variieren je nach Standort, Material und aktueller Marktlage. Vergleichen Sie die Preise 
                in Ihrer Umgebung für den besten Erlös.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold">Welche {localizedType}-Materialien haben den höchsten Wert?</h3>
              <p className="text-gray-700 text-sm mt-1">
                Generell erzielen reinere und sortenreine Materialien höhere Preise. 
                {filteredMaterials.some((m: Material) => m.marketValueLevel === 'HIGH') &&
                  ' In dieser Kategorie haben besonders ' +
                  filteredMaterials
                    .filter((m: Material) => m.marketValueLevel === 'HIGH')
                    .map((m: Material) => m.name)
                    .join(', ') +
                  ' einen hohen Marktwert.'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none">
          <h2>Alles Wissenswerte über {localizedType} Recycling</h2>
          
          <p>
            Das Recycling von {localizedType.toLowerCase()} ist ein wichtiger Beitrag zum Umweltschutz und zur Ressourcenschonung. 
            Durch die Wiederverwertung können wertvolle Rohstoffe eingespart und die Umweltbelastung 
            durch Neuproduktion reduziert werden.
          </p>
          
          <h3>Die Bedeutung des {localizedType} Recyclings</h3>
          
          <p>
            {localizedType} Recycling trägt wesentlich zur Reduktion von Abfall und zur Schonung natürlicher 
            Ressourcen bei. Durch die Wiederverwertung werden nicht nur wertvolle Rohstoffe zurückgewonnen, 
            sondern auch Energie eingespart, die sonst für die Neuproduktion aufgewendet werden müsste.
          </p>
          
          <h3>Der Recyclingprozess</h3>
          
          <p>
            Der Recyclingprozess für {localizedType.toLowerCase()} umfasst mehrere Schritte: Sammlung, Sortierung, 
            Aufbereitung und Wiederverwendung. Moderne Recyclingtechnologien ermöglichen eine 
            immer effizientere Rückgewinnung von Rohstoffen.
          </p>
          
          <h3>Wirtschaftliche Aspekte</h3>
          
          <p>
            Neben dem ökologischen Nutzen hat das Recycling von {localizedType.toLowerCase()} auch eine 
            wirtschaftliche Dimension. Der Handel mit Sekundärrohstoffen schafft Arbeitsplätze und 
            generiert Wertschöpfung. Für Verbraucher bietet der Verkauf von {localizedType.toLowerCase()} 
            eine Möglichkeit, nicht mehr benötigte Materialien zu Geld zu machen.
          </p>
          
          <h3>{localizedType} richtig entsorgen</h3>
          
          <p>
            Um den maximalen Wert aus {localizedType.toLowerCase()} zu erzielen, sollte es richtig vorbereitet werden. 
            Verunreinigungen sollten entfernt, verschiedene Materialien getrennt und gegebenenfalls 
            nach Sorten sortiert werden. Dies erleichtert den Recyclingprozess und führt in der Regel 
            zu höheren Ankaufspreisen.
          </p>
        </div>
      </div>
    </>
  );
} 