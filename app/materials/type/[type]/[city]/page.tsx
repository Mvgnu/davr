import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Navigation, Phone, ExternalLink, MapPin, Info, Building, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { formatCurrency, formatDistance, calculateDistance } from '@/lib/utils';

interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  latitude: number;
  longitude: number;
  description?: string;
  acceptedMaterials: string[];
}

interface MaterialPrice {
  centerId: string;
  materialId: string;
  pricePerKg: number;
  lastUpdated: string;
  minimumWeight?: number;
  conditions?: string;
}

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

// Fetch material by type
async function getMaterial(type: string): Promise<Material | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/materials/type/${type}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch material');
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching material:', error);
    return null;
  }
}

// Fetch recycling centers in a city for a material type
async function getRecyclingCenters(city: string, materialType: string): Promise<RecyclingCenter[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/centers?city=${city}&material=${materialType}`, 
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch recycling centers');
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return [];
  }
}

// Fetch material prices for centers
async function getMaterialPrices(materialType: string, centerIds: string[]): Promise<MaterialPrice[]> {
  try {
    const idsParam = centerIds.join(',');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/prices?material=${materialType}&centers=${idsParam}`, 
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch material prices');
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching material prices:', error);
    return [];
  }
}

// Get city coordinates
function getCityCoordinates(city: string): { lat: number; lng: number } {
  // This would ideally come from a geocoding API or database
  // For now, using a simple mapping for common German cities
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'berlin': { lat: 52.520008, lng: 13.404954 },
    'hamburg': { lat: 53.551086, lng: 9.993682 },
    'muenchen': { lat: 48.137154, lng: 11.576124 },
    'koeln': { lat: 50.937531, lng: 6.960279 },
    'frankfurt': { lat: 50.110924, lng: 8.682127 },
    'stuttgart': { lat: 48.775845, lng: 9.182932 },
    'duesseldorf': { lat: 51.227741, lng: 6.773456 },
    'leipzig': { lat: 51.339695, lng: 12.373075 },
    'dortmund': { lat: 51.513587, lng: 7.465298 },
    'essen': { lat: 51.455643, lng: 7.011555 },
    // Add more cities as needed
  };
  
  const normalizedCity = city.toLowerCase().replace(/[äöüß]/g, char => {
    return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[char] || char;
  });
  
  return cityCoordinates[normalizedCity] || { lat: 51.1657, lng: 10.4515 }; // Default to Germany's center
}

// Function to get localized material type name
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
  params: { type: string; city: string }
}): Promise<Metadata> {
  const decodedType = decodeURIComponent(params.type);
  const decodedCity = decodeURIComponent(params.city);
  const localizedType = getLocalizedType(decodedType);
  const cityName = decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1).toLowerCase();
  
  return {
    title: `${localizedType} Recycling in ${cityName} | Ankaufspreis & Recyclinghöfe`,
    description: `Aktuelle ${localizedType} Ankaufspreise in ${cityName}. Finden Sie die besten Recyclinghöfe und Sammelstellen für ${localizedType} in ${cityName} und Umgebung.`,
    keywords: `${localizedType}, Recycling, ${cityName}, Ankaufspreis, Wertstoff, Wertstoffe verkaufen, Recyclinghof, Schrottplatz`,
    openGraph: {
      title: `${localizedType} Recycling in ${cityName} | Ankaufspreis & Recyclinghöfe`,
      description: `Vergleichen Sie ${localizedType} Ankaufspreise in ${cityName} und finden Sie die besten Recyclinghöfe in Ihrer Nähe.`,
      type: 'website',
    },
  };
}

export default async function MaterialsTypeCityPage({ 
  params, 
  searchParams 
}: { 
  params: { type: string; city: string };
  searchParams: { [key: string]: string | undefined }; 
}) {
  const decodedType = decodeURIComponent(params.type);
  const decodedCity = decodeURIComponent(params.city);
  const localizedType = getLocalizedType(decodedType);
  const cityName = decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1).replace(/-/g, ' ');
  const sortBy = searchParams.sort || 'price'; // Default sort by price
  
  // Fetch material information
  const material = await getMaterial(decodedType);
  
  // Get city coordinates for distance calculation
  const cityCoords = getCityCoordinates(decodedCity);
  
  // Fetch recycling centers in the city
  const centers = await getRecyclingCenters(cityName, decodedType);
  
  if (centers.length === 0) {
    // If no centers found, show 404 page
    notFound();
  }
  
  // Fetch material prices from centers
  const centerIds = centers.map(center => center.id);
  const prices = await getMaterialPrices(decodedType, centerIds);
  
  // Combine center data with prices and calculate distances
  const centersWithPrices = centers.map(center => {
    const centerPrice = prices.find(price => price.centerId === center.id);
    const distance = calculateDistance(
      cityCoords.lat, 
      cityCoords.lng, 
      center.latitude, 
      center.longitude
    );
    
    return {
      ...center,
      price: centerPrice?.pricePerKg || 0,
      lastUpdated: centerPrice?.lastUpdated,
      minimumWeight: centerPrice?.minimumWeight,
      conditions: centerPrice?.conditions,
      distance
    };
  });
  
  // Sort centers by selected criteria
  const sortedCenters = [...centersWithPrices].sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'distance') return a.distance - b.distance;
    return a.name.localeCompare(b.name);
  });
  
  // Calculate average price
  const pricesArray = centersWithPrices.filter(c => c.price > 0).map(c => c.price);
  const averagePrice = pricesArray.length > 0 
    ? pricesArray.reduce((a, b) => a + b, 0) / pricesArray.length 
    : 0;
  
  // Structured data for SEO (LocalBusiness listings)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: sortedCenters.map((center, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: center.name,
        description: center.description || `Recyclinghof für ${localizedType} in ${cityName}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: center.address,
          addressLocality: center.city,
          postalCode: center.postalCode,
          addressCountry: 'DE'
        },
        telephone: center.phone,
        url: center.website,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: center.latitude,
          longitude: center.longitude
        },
        openingHours: center.openingHours,
        priceRange: center.price > 0 ? `€${center.price.toFixed(2)}/kg` : 'N/A'
      }
    }))
  };
  
  return (
    <>
      <JsonLd data={structuredData} />
      
      <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <div className="mb-6">
          <Link 
            href={`/materials/type/${params.type}`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu {localizedType} Recycling
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {localizedType} Recycling in {cityName}
          </h1>
          
          <p className="text-lg text-gray-700 mb-6">
            Vergleichen Sie Ankaufspreise für {localizedType.toLowerCase()} in {cityName} und Umgebung
          </p>
        </div>
        
        <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                <Euro className="w-4 h-4 mr-2 text-green-600" />
                Durchschnittspreis
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(averagePrice)}/kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Durchschnitt von {pricesArray.length} Ankaufstellen
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                <Building className="w-4 h-4 mr-2 text-green-600" />
                Ankaufstellen
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {centers.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                In {cityName} und Umgebung
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                <Info className="w-4 h-4 mr-2 text-green-600" />
                Bestpreis
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.max(...pricesArray, 0))}/kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Stand: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Recyclinghöfe in {cityName}
          </h2>
          
          <div className="mt-3 sm:mt-0 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sortieren nach:</span>
            <Link 
              href={`/materials/type/${params.type}/${params.city}?sort=price`}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'price' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Preis
            </Link>
            <Link 
              href={`/materials/type/${params.type}/${params.city}?sort=distance`}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'distance' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Entfernung
            </Link>
            <Link 
              href={`/materials/type/${params.type}/${params.city}?sort=name`}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'name' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Name
            </Link>
          </div>
        </div>
        
        <div className="space-y-4 mb-10">
          {sortedCenters.map((center) => (
            <div key={center.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold text-gray-900">{center.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{center.address}, {center.postalCode} {center.city}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      <span className="inline-flex items-center mr-4">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                        {formatDistance(center.distance)}
                      </span>
                      {center.phone && (
                        <span className="inline-flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {center.phone}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {center.price > 0 ? 
                        `${formatCurrency(center.price)}/kg` : 
                        <span className="text-gray-500 text-base">Preis auf Anfrage</span>
                      }
                    </div>
                    {center.minimumWeight && (
                      <p className="text-xs text-gray-500 mt-1">
                        Min. Menge: {center.minimumWeight} kg
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  {center.openingHours && (
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="font-medium">Öffnungszeiten:</span>
                      <span className="ml-1">{center.openingHours}</span>
                    </p>
                  )}
                  
                  {center.conditions && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Bedingungen:</span> {center.conditions}
                    </p>
                  )}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {center.website && (
                    <ButtonLink
                      href={center.website}
                      variant="outline"
                      size="sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Website
                    </ButtonLink>
                  )}
                  
                  <ButtonLink
                    href={`https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                    variant="outline"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Route
                  </ButtonLink>
                  
                  <ButtonLink
                    href={`tel:${center.phone?.replace(/\s/g, '')}`}
                    size="sm"
                    className={`${center.phone ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'}`}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Anrufen
                  </ButtonLink>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mb-10 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Hinweise zum {localizedType} Recycling in {cityName}</h2>
          
          <div className="prose max-w-none">
            <p>
              Das Recycling von {localizedType.toLowerCase()} in {cityName} ist ein einfacher Prozess. Die oben aufgeführten Recyclinghöfe und Ankaufstellen kaufen Ihr {localizedType.toLowerCase()} zu tagesaktuellen Preisen an. Die Preise können sich je nach Marktlage und Qualität des Materials täglich ändern.
            </p>
            
            <h3>Tipps für bessere Preise</h3>
            
            <ul>
              <li>
                <strong>Sortieren Sie Ihr Material:</strong> Reines, sortenreines {localizedType.toLowerCase()} erzielt höhere Preise als gemischtes Material.
              </li>
              <li>
                <strong>Reinigen Sie das Material:</strong> Entfernen Sie Verunreinigungen und Fremdstoffe, um bessere Preise zu erzielen.
              </li>
              <li>
                <strong>Vergleichen Sie die Preise:</strong> Die Preisunterschiede zwischen verschiedenen Ankaufstellen können erheblich sein. Ein Vergleich lohnt sich!
              </li>
              <li>
                <strong>Große Mengen:</strong> Bei größeren Mengen lohnt es sich, direkt mit den Ankaufstellen zu verhandeln oder einen Abholservice anzufragen.
              </li>
            </ul>
            
            <h3>Häufige Fragen</h3>
            
            <p>
              <strong>Brauche ich einen Ausweis?</strong><br />
              Bei größeren Mengen kann ein Personalausweis verlangt werden, da die Ankaufstellen verpflichtet sind, ihre Einkäufe zu dokumentieren.
            </p>
            
            <p>
              <strong>Gibt es eine Mindestmenge?</strong><br />
              Viele Recyclinghöfe haben Mindestmengen für die Annahme. Diese sind in der Regel bei den einzelnen Ankaufstellen angegeben.
            </p>
            
            <p>
              <strong>Werden die Preise garantiert?</strong><br />
              Die hier angegebenen Preise sind Richtwerte und können sich täglich ändern. Bitte kontaktieren Sie die Ankaufstellen direkt für tagesaktuelle Preise.
            </p>
          </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Karte der Ankaufstellen in {cityName}</h2>
          
          <div className="aspect-video bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Interaktive Karte wird geladen...</p>
            {/* This would be replaced with an actual map component */}
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            *Klicken Sie auf die Marker für Details zu den Ankaufstellen und Preisen
          </p>
        </div>
      </div>
    </>
  );
} 