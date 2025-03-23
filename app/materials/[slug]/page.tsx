'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Info, Recycle, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/JsonLd';
import { generateMaterialSchema } from '../schema';
import { MaterialPriceCard } from '@/app/components/MaterialPriceCard';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  subtype?: string;
  recyclable: boolean;
  marketValueLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  imageUrl?: string;
  properties?: {
    [key: string]: string;
  };
  recyclingTips?: string[];
}

interface RecyclingCenter {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  materialPrice?: number;
  distance?: number;
}

export default function MaterialPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  const [material, setMaterial] = useState<Material | null>(null);
  const [recyclingCenters, setRecyclingCenters] = useState<RecyclingCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchMaterialData() {
      setIsLoading(true);
      try {
        // Fetch material details using the slug
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/materials/${slug}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch material details');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setMaterial(data.data);
          
          // Fetch recycling centers that accept this material
          const centersResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || ''}/api/recycling-centers?material=${data.data.id}&limit=5`, 
            { cache: 'no-store' }
          );
          
          if (centersResponse.ok) {
            const centersData = await centersResponse.json();
            setRecyclingCenters(centersData.data.map((center: any) => ({
              id: center._id,
              name: center.name,
              city: center.city,
              postalCode: center.postalCode,
              materialPrice: center.materials?.find((m: any) => m.materialId === data.data.id)?.price,
              distance: center.distance
            })));
          }
        } else {
          setError('Material nicht gefunden');
        }
      } catch (error) {
        console.error('Error fetching material data:', error);
        setError('Es ist ein Fehler beim Laden der Materialdaten aufgetreten');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMaterialData();
  }, [slug]);
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !material) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Material nicht gefunden</h1>
          <p className="text-gray-600 mb-8">{error || 'Das gesuchte Material konnte nicht gefunden werden.'}</p>
          <Link href="/materials">
            <Button>
              Zurück zur Materialübersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Add structured data */}
      <JsonLd data={generateMaterialSchema({
        id: material.id,
        name: material.name,
        description: material.description,
        category: material.category,
        recyclable: material.recyclable,
        marketValue: material.marketValueLevel === 'HIGH' ? 'Hoch' : 
                     material.marketValueLevel === 'MEDIUM' ? 'Mittel' : 'Niedrig'
      }, window.location.origin)} />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 border-b border-gray-200">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/materials" className="hover:text-green-700">Materialien</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900 font-medium">{material.name}</span>
          </div>
        </div>
      </div>
      
      {/* Material Details */}
      <section className="py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                {material.imageUrl ? (
                  <Image
                    src={material.imageUrl}
                    alt={material.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Recycle className="h-16 w-16" />
                  </div>
                )}
              </div>
              
              {/* Material Properties */}
              {material.properties && Object.keys(material.properties).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Eigenschaften</h3>
                  <dl className="grid grid-cols-2 gap-y-3">
                    {Object.entries(material.properties).map(([key, value]) => (
                      <div key={key} className="col-span-2 sm:col-span-1">
                        <dt className="text-sm text-gray-600">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{material.name}</h1>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                  {material.category}
                </span>
                {material.subtype && (
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                    {material.subtype}
                  </span>
                )}
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  material.recyclable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {material.recyclable ? 'Recycelbar' : 'Nicht recycelbar'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-6">{material.description}</p>
              
              {/* Real-time price statistics */}
              <div className="mb-6">
                <MaterialPriceCard 
                  materialId={material.id} 
                  title="Aktuelle Marktpreise" 
                />
              </div>
              
              {/* Recycling Tips */}
              {material.recyclingTips && material.recyclingTips.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Recycling-Tipps</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {material.recyclingTips.map((tip, index) => (
                      <li key={index} className="text-gray-600">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Link href="/recycling-centers">
                  <Button>
                    Recyclinghof finden
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline">
                    Preise vergleichen
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recycling Centers Section */}
      {recyclingCenters && recyclingCenters.length > 0 ? (
        <section className="py-12 bg-gray-50">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Recyclinghöfe für {material.name}</h2>
            
            <div className="space-y-4">
              {recyclingCenters.map(center => (
                <div key={center.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{center.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 inline-block mr-1" />
                        {center.postalCode} {center.city}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {center.materialPrice ? (
                        <div className="text-lg font-bold text-green-700">
                          {center.materialPrice.toFixed(2)} €/kg
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">Preis auf Anfrage</div>
                      )}
                      
                      {center.distance && (
                        <div className="text-sm text-gray-600">
                          {center.distance.toFixed(1)} km entfernt
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <Link href={`/recycling-centers/${center.id}`}>
                      <Button variant="link" className="text-green-700 p-0">
                        Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link href={`/recycling-centers?material=${encodeURIComponent(material.name)}`}>
                <Button>
                  Alle Recyclinghöfe für {material.name} anzeigen
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
      
      {/* Information Section */}
      <section className="py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Nachhaltigkeit durch Recycling</h3>
                <p className="text-gray-700 mb-4">
                  Das Recycling von {material.name} ist ein wichtiger Beitrag zum Umweltschutz.
                  {material.recyclable 
                    ? ' Durch das Recyceln dieses Materials können wertvolle Ressourcen geschont und Energie eingespart werden.'
                    : ' Obwohl dieses Material nicht vollständig recycelbar ist, ist eine fachgerechte Entsorgung wichtig, um Umweltbelastungen zu minimieren.'}
                </p>
                <Link href="/materials">
                  <Button variant="outline">
                    Weitere Materialien entdecken
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 