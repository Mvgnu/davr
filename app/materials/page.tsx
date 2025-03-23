'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Recycle, Info, ArrowRight, Search, Filter, ChevronRight } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { generateMaterialsListSchema } from './schema';
import { MaterialPriceCard } from '@/app/components/MaterialPriceCard';
import { useMaterialPrices } from '@/lib/hooks/useMaterialPrices';

// Metadata is in a separate file: metadata.ts

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  subtype?: string;
  recyclable: boolean;
  marketValueLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  // We're no longer using these approximate prices as we'll fetch real-time prices
  // approximateMinPrice: number;
  // approximateMaxPrice: number;
  imageUrl?: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jsonLdData, setJsonLdData] = useState<any>(null);
  
  // Fetch all material price statistics once
  const { priceStats, getMaterialPrice } = useMaterialPrices();

  useEffect(() => {
    // Fetch materials from the API
    async function fetchMaterials() {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/materials`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }
        
        const data = await response.json();
        const materialsList = data.success ? data.data : [];
        setMaterials(materialsList);
        
        // Generate JSON-LD data after materials are fetched and we have access to window
        if (typeof window !== 'undefined' && materialsList.length > 0) {
          setJsonLdData(generateMaterialsListSchema(
            window.location.origin,
            materialsList.map((m: any) => ({
              id: m.id,
              name: m.name,
              description: m.description,
              category: m.category,
              recyclable: m.recyclable,
              marketValue: m.marketValueLevel === 'HIGH' ? 'Hoch' : m.marketValueLevel === 'MEDIUM' ? 'Mittel' : 'Niedrig'
            }))
          ));
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMaterials();
  }, []);

  // Filter materials based on search query and selected category
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === '' || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      material.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group materials by category
  const materialsByCategory: Record<string, Material[]> = {};
  filteredMaterials.forEach(material => {
    if (!materialsByCategory[material.category]) {
      materialsByCategory[material.category] = [];
    }
    materialsByCategory[material.category].push(material);
  });

  return (
    <div className="bg-white">
      {/* Add structured data only when it's available */}
      {jsonLdData && <JsonLd data={jsonLdData} />}

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recyclingfähige Materialien und Wertstoffe
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Erfahren Sie mehr über verschiedene recycelbare Materialien, ihre Recyclingfähigkeit und ihren Marktwert
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/recycling-centers">
                <Button className="w-full sm:w-auto">
                  Recyclinghof in der Nähe finden
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="w-full sm:w-auto">
                  Preise im Marktplatz vergleichen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Nach Material suchen..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto whitespace-nowrap"
                  onClick={() => setSelectedCategory(null)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedCategory || 'Alle Kategorien'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Listing */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="max-w-4xl mx-auto text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Keine Materialien gefunden</h2>
              <p className="text-gray-600 mb-6">
                Es wurden keine Materialien gefunden, die Ihren Suchkriterien entsprechen.
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}>
                Filter zurücksetzen
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                <div key={category} className="mb-12">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                    <Button variant="link" className="text-green-700 p-0" onClick={() => setSelectedCategory(category)}>
                      Alle {category}-Materialien
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryMaterials.map((material) => (
                      <div key={material.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{material.description}</p>
                        
                        <div className="mb-4">
                          {/* Display real-time price data using MaterialPriceCard */}
                          <MaterialPriceCard
                            materialId={material.id}
                            compact={true}
                            title=""
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              material.marketValueLevel === 'HIGH' ? 'bg-green-100 text-green-800' :
                              material.marketValueLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {material.marketValueLevel === 'HIGH' ? 'Hoher' : 
                               material.marketValueLevel === 'MEDIUM' ? 'Mittlerer' : 'Niedriger'} Wert
                            </span>
                          </div>
                          
                          <Link href={`/materials/${material.id}`}>
                            <Button variant="link" className="text-green-700 p-0">
                              Details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Information Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Wussten Sie schon?</h3>
                  <p className="text-gray-700 mb-4">
                    Viele Materialien lassen sich gut recyceln, wodurch wertvolle Ressourcen gespart werden. Beim Recycling von Metallen wie Aluminium werden 95% der Energie eingespart, die für die Neuproduktion benötigt wird.
                  </p>
                  <p className="text-gray-700">
                    Durch Ihr Engagement im Recycling tragen Sie aktiv zum Umweltschutz bei und helfen, wertvolle Rohstoffe zu schonen und die Kreislaufwirtschaft zu fördern.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 