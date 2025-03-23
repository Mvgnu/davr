'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Recycle, MapPin, Filter, Info, Search as SearchIcon, ChevronRight } from 'lucide-react';
import { MaterialSearch } from '@/components/MaterialSearch';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { slugify } from '@/lib/utils';
import { JsonLd } from '@/components/JsonLd';
import { generateSearchSchema, generateCentersSchema } from './schema';

// Metadata has been moved to metadata.ts

// Define types inline to avoid naming conflicts
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

interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

// Fetch materials by search query
async function fetchMaterials(query: string, city?: string): Promise<Material[]> {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/search?q=${encodeURIComponent(query)}`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await res.json();
    return data.success ? data.data.materials : [];
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
}

// Fetch centers by search query
async function fetchCenters(query: string, city?: string): Promise<Center[]> {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/search/centers?q=${encodeURIComponent(query)}`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error('Failed to fetch center results');
    }

    const data = await res.json();
    return data.success ? data.data.centers : [];
  } catch (error) {
    console.error('Error fetching center results:', error);
    return [];
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const city = searchParams?.get('city') || '';
  const filter = searchParams?.get('filter') || 'all';
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const [materialsData, centersData] = await Promise.all([
          fetchMaterials(query, city),
          fetchCenters(query, city)
        ]);
        setMaterials(materialsData);
        setCenters(centersData);
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, city]);
  
  // Skip the search if no query is provided
  if (!query) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Material- und Recyclinghofsuche
        </h1>
        
        <div className="mb-10 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Was möchten Sie recyceln?</h2>
          <MaterialSearch />
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Suchhilfe</h3>
              <p className="mt-1 text-gray-600">
                Geben Sie den Namen eines Materials ein, z.B. "Aluminium", "Kupfer" oder "Papier".
                Sie können auch spezifischere Begriffe wie "Aluminiumdosen" oder "Kupferkabel" suchen.
                Fügen Sie optional eine Stadt hinzu, um Recyclinghöfe in Ihrer Nähe zu finden.
              </p>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Beliebte Materialkategorien
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {['Aluminium', 'Kupfer', 'Papier', 'Kunststoff', 'Glas', 'Elektronik'].map((material) => (
            <Link 
              key={material}
              href={`/search?q=${encodeURIComponent(material)}`}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Recycle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{material}</h3>
                  <p className="text-sm text-gray-500">
                    Preise vergleichen
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Add structured data for search results */}
      {materials.length > 0 && (
        <JsonLd data={generateSearchSchema(query, materials, centers)} />
      )}
      {centers.length > 0 && (
        <JsonLd data={generateCentersSchema(centers, window.location.origin)} />
      )}
      
      <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Suchergebnisse für "{query}"
            {city && ` in ${city}`}
          </h1>
          
          <div className="mb-6">
            <MaterialSearch initialQuery={query} initialCity={city} />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {materials.length} Materialien und {centers.length} Recyclinghöfe gefunden
            </p>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <Link 
                href={`/search?q=${encodeURIComponent(query)}${city ? `&city=${encodeURIComponent(city)}` : ''}&filter=all`}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
                }`}
              >
                Alle
              </Link>
              <Link 
                href={`/search?q=${encodeURIComponent(query)}${city ? `&city=${encodeURIComponent(city)}` : ''}&filter=materials`}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'materials' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
                }`}
              >
                Materialien
              </Link>
              <Link 
                href={`/search?q=${encodeURIComponent(query)}${city ? `&city=${encodeURIComponent(city)}` : ''}&filter=centers`}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'centers' ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-100 text-gray-800'
                }`}
              >
                Recyclinghöfe
              </Link>
            </div>
          </div>
        </div>
        
        {/* Materials Section */}
        {(filter === 'all' || filter === 'materials') && materials.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Materialien</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.map(material => (
                <div key={material.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-semibold">{material.name}</h3>
                      <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                        material.marketValueLevel === 'HIGH' 
                          ? 'bg-green-100 text-green-800' 
                          : material.marketValueLevel === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {material.marketValueLevel === 'HIGH' 
                          ? 'Hoher Wert' 
                          : material.marketValueLevel === 'MEDIUM'
                            ? 'Mittlerer Wert'
                            : 'Niedriger Wert'
                        }
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-2 mb-4">
                      {material.description}
                    </p>
                    
                    <div className="flex flex-wrap text-sm mb-4">
                      <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
                        {material.category}
                      </div>
                      {material.subtype && (
                        <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
                          {material.subtype}
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded mr-2 mb-2 ${
                        material.recyclable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {material.recyclable ? 'Recycelbar' : 'Nicht recycelbar'}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-gray-700">
                        <span className="font-semibold">Preisspanne:</span> {material.approximateMinPrice.toFixed(2)} - {material.approximateMaxPrice.toFixed(2)} €/kg
                      </div>
                      <Link href={`/materials/${slugify(material.name)}`}>
                        <Button variant="link" className="text-green-700 p-0">
                          Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Recycling Centers Section */}
        {(filter === 'all' || filter === 'centers') && centers.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Recyclinghöfe in der Nähe</h2>
            <div className="space-y-4">
              {centers.map(center => (
                <div key={center.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{center.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 inline-block mr-1" />
                          {center.address}, {center.postalCode} {center.city}
                        </div>
                      </div>
                      {center.distance !== undefined && (
                        <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {center.distance.toFixed(1)} km entfernt
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Link href={`/recycling-centers/${center.id}`}>
                        <Button variant="link" className="text-green-700 p-0">
                          Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* No Results */}
        {materials.length === 0 && centers.length === 0 && (
          <div className="py-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-gray-600 mb-6">
              Leider konnten wir für Ihre Suche keine passenden Materialien oder Recyclinghöfe finden.
            </p>
            <div className="flex justify-center">
              <Link href="/search">
                <Button>
                  Neue Suche starten
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 