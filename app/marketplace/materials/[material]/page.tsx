import React from 'react';
import { Metadata } from 'next';
import { getMaterialByValue, getMaterialsByCategory } from '@/lib/constants/materials';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail, ExternalLink, ChevronRight, Filter } from 'lucide-react';
import MaterialPriceDisplay from '@/components/MaterialPriceDisplay';
import { Separator } from '@/components/ui/separator';
import dbConnect from '@/lib/db/connection';
import RecyclingCenter from '@/lib/models/RecyclingCenter';

// This generates metadata for the page based on the material
export async function generateMetadata({ params }: { params: { material: string } }): Promise<Metadata> {
  const material = getMaterialByValue(params.material);
  
  return {
    title: material 
      ? `${material.label} Ankauf in Deutschland | Recycling Preisvergleich` 
      : 'Material Ankauf in Deutschland',
    description: material 
      ? `Vergleichen Sie Ankaufspreise für ${material.label} bei Recyclinghöfen in Deutschland. Finden Sie den besten Preis in Ihrer Nähe.`
      : 'Vergleichen Sie Ankaufspreise für Recyclingmaterialien bei Recyclinghöfen in Deutschland. Finden Sie den besten Preis in Ihrer Nähe.',
    keywords: material
      ? [`${material.label} ankauf`, `${material.label} recycling`, `${material.label} preis`, 'recyclinghof', 'wertstoffhof', 'deutschland']
      : ['recycling', 'ankauf', 'materialien', 'recyclinghof', 'wertstoffhof', 'deutschland'],
  };
}

// This generates all possible static paths for the page
export async function generateStaticParams() {
  return Array.from(new Set(
    getMaterialsByCategory('').map(material => ({
      material: material.value
    }))
  ));
}

async function MaterialMarketplacePage({ params }: { params: { material: string } }) {
  const materialId = params.material;
  const material = getMaterialByValue(materialId);
  
  if (!material) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Material nicht gefunden</h1>
        <p>Das angegebene Material konnte nicht gefunden werden.</p>
        <Link href="/marketplace">
          <Button className="mt-4">Zurück zum Marktplatz</Button>
        </Link>
      </div>
    );
  }
  
  // Connect to database and fetch recycling centers that buy this material
  await dbConnect();
  const centers = await RecyclingCenter.find({ 
    'buyMaterials.materialId': materialId,
    'buyMaterials.active': true 
  })
    .select('name city slug address postalCode location buyMaterials images description')
    .sort({ 'buyMaterials.pricePerKg': -1 }) // Sort by price, highest first
    .limit(20);
  
  // Transform data to only include the relevant material
  const transformedCenters = centers.map(center => {
    const centerObj = center.toObject();
    
    // Filter buyMaterials to only include the requested material
    const buyMaterial = centerObj.buyMaterials?.find(
      (m: any) => m.materialId === materialId && m.active
    );
    
    return {
      ...centerObj,
      buyMaterials: buyMaterial ? [buyMaterial] : []
    };
  });
  
  // Group centers by city for a better UX
  const centersByCity: Record<string, any[]> = {};
  transformedCenters.forEach(center => {
    if (!centersByCity[center.city]) {
      centersByCity[center.city] = [];
    }
    centersByCity[center.city].push(center);
  });
  
  // Sort cities alphabetically
  const sortedCities = Object.keys(centersByCity).sort();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{material.label} Ankauf</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Finden Sie die besten Ankaufspreise für {material.label} in Deutschland
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Alle Materialien
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Über {material.label}</h2>
        <p className="text-green-700 mb-4">{material.description}</p>
        <p className="text-sm text-green-600">
          Die Preise für {material.label} können je nach Recyclinghof, Qualität und Menge variieren. 
          Kontaktieren Sie den Recyclinghof direkt für die aktuellsten Preise und Bedingungen.
        </p>
      </div>
      
      {transformedCenters.length === 0 ? (
        <div className="bg-yellow-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Keine Ankaufsstellen gefunden</h2>
          <p className="text-yellow-700">
            Leider konnten wir keine Recyclinghöfe finden, die aktuell {material.label} ankaufen.
            Versuchen Sie es mit einem anderen Material oder zu einem späteren Zeitpunkt erneut.
          </p>
          <Link href="/marketplace">
            <Button variant="outline" className="mt-4">
              Andere Materialien erkunden
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-lg font-medium">
              {transformedCenters.length} Recyclinghöfe kaufen {material.label} an
            </p>
            <Separator className="my-4" />
          </div>
          
          {sortedCities.map(city => (
            <div key={city} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{material.label} Ankauf in {city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centersByCity[city].map((center, index) => (
                  <Card key={index} className="overflow-hidden h-full flex flex-col">
                    {center.images && center.images.length > 0 && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={center.images[0]} 
                          alt={center.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-4 flex-grow">
                      <h3 className="text-xl font-bold mb-2">{center.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-4 w-4" />
                        {center.address}, {center.postalCode} {center.city}
                      </p>
                      
                      {center.buyMaterials.length > 0 && (
                        <div className="my-4">
                          <MaterialPriceDisplay materials={center.buyMaterials} />
                        </div>
                      )}
                      
                      {center.description && (
                        <p className="text-sm mb-4 line-clamp-3">{center.description}</p>
                      )}
                    </div>
                    
                    <div className="p-4 pt-0 mt-auto">
                      <Link href={`/recycling-centers/${center.city.toLowerCase()}/${center.slug}`}>
                        <Button className="w-full">
                          Details ansehen
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      
      <div className="mt-12 bg-slate-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Warum {material.label} recyclen?</h2>
        <p className="mb-4">
          Recycling von {material.label} schont wertvolle Ressourcen und reduziert den Energieverbrauch 
          im Vergleich zur Neuproduktion. Durch das Recycling können wertvolle Rohstoffe 
          wiederverwendet werden, was sowohl wirtschaftliche als auch ökologische Vorteile bietet.
        </p>
        <p>
          Indem Sie Ihr {material.label} zum bestmöglichen Preis verkaufen, tragen Sie aktiv 
          zum Umweltschutz bei und können gleichzeitig einen finanziellen Vorteil erzielen.
        </p>
      </div>
    </div>
  );
}

export default MaterialMarketplacePage; 