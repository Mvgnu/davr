import React from 'react';
import { Metadata } from 'next';
import { getMaterialByValue, getMaterialsByCategory } from '@/lib/constants/materials';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail, ExternalLink, ChevronRight, Filter } from 'lucide-react';
import MaterialPriceDisplay from '@/components/MaterialPriceDisplay';
import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

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

// Fetch function using Prisma, with corrected field names
async function getCentersBuyingMaterial(materialValue: string) {
  let materialDbId: string | null = null;
  let centers: any[] = []; 
  const materialInfo = getMaterialByValue(materialValue);

  try {
    // 1. Find Material ID
    const materialResult = await prisma.material.findUnique({
      where: { slug: materialValue }, 
      select: { id: true }
    });

    if (!materialResult) {
      console.warn(`Material with slug '${materialValue}' not found in DB.`);
      return { centers, materialInfo };
    }
    materialDbId = materialResult.id;

    // 2. Fetch Centers buying this material (using Prisma)
    const whereClause: Prisma.RecyclingCenterWhereInput = {
      offers: {
        some: {
          material_id: materialDbId,
          // Removed active filter as field doesn't exist
          price_per_unit: { not: null }
        }
      }
    };
    
    const centersResult = await prisma.recyclingCenter.findMany({
      where: whereClause,
      select: { // Select only available fields
        id: true,
        name: true,
        slug: true,
        address_street: true,
        city: true,
        postal_code: true,
        // description: false, // Does not exist
        // images: false, // Does not exist
        offers: { // Include offers with specific where clause and selections
          where: {
            material_id: materialDbId,
            // Removed active filter
            price_per_unit: { not: null }
          },
          select: { // Select only available offer fields + material name
            material_id: true,
            price_per_unit: true,
            notes: true,
            // min_quantity: false, // Does not exist
            // max_quantity: false, // Does not exist
            // active: false, // Does not exist
            material: { select: { name: true } } 
          },
          orderBy: {
            price_per_unit: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
    });

    // 3. Format the response using available fields
    centers = centersResult.map(center => ({
      id: center.id,
      name: center.name,
      slug: center.slug,
      address: center.address_street, // Use correct field
      city: center.city,
      postalCode: center.postal_code,
      description: null, // Field does not exist
      images: null, // Field does not exist
      buyMaterials: center.offers.map(offer => ({
        materialId: offer.material_id,
        materialName: offer.material.name,
        price: offer.price_per_unit,
        minQuantity: null, // Field does not exist
        maxQuantity: null, // Field does not exist
        notes: offer.notes,
        active: null // Field does not exist
      }))
    }));

  } catch (error) {
    console.error(`Error fetching data for material ${materialValue} [Prisma]:`, error);
    return { centers: [], materialInfo };
  }

  return { centers, materialInfo };
}

// Page component using the direct Prisma fetch
async function MaterialMarketplacePage({ params }: { params: { material: string } }) {
  const materialValue = params.material;
  const { centers, materialInfo } = await getCentersBuyingMaterial(materialValue);
  
  if (!materialInfo) {
    // This case should ideally be handled by notFound() if materialValue itself is invalid
    // But constants lookup might fail even if value exists. Display a generic message.
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Material Informationen nicht gefunden</h1>
        <p>Die Informationen für das Material "{materialValue}" konnten nicht geladen werden.</p>
        <Link href="/marketplace/materials">
          <Button className="mt-4">Zurück zum Marktplatz</Button>
        </Link>
      </div>
    );
  }
  
  // Group centers by city
  const centersByCity: Record<string, any[]> = {};
  centers.forEach(center => {
    // Ensure city is not null before using it as a key
    const cityKey = center.city || 'Unbekannte Stadt'; 
    if (!centersByCity[cityKey]) {
      centersByCity[cityKey] = [];
    }
    centersByCity[cityKey].push(center);
  });
  const sortedCities = Object.keys(centersByCity).sort();
  
  const displayLabel = materialInfo?.label || materialValue;
  const displayDescription = materialInfo?.description || `Ankaufspreise für ${displayLabel}`;

  // Render UI (adjusting for missing fields)
  return (
    <div className="container mx-auto py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{displayLabel} Ankauf</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Finden Sie die besten Ankaufspreise für {displayLabel} in Deutschland
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Link href="/marketplace/materials">
            <Button variant="ghost" size="sm">
              Alle Materialien
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Material Info Box */}
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Über {displayLabel}</h2>
        <p className="text-green-700 mb-4">{displayDescription}</p>
        <p className="text-sm text-green-600">
          Die Preise für {displayLabel} können je nach Recyclinghof, Qualität und Menge variieren. 
          Kontaktieren Sie den Recyclinghof direkt für die aktuellsten Preise und Bedingungen.
        </p>
      </div>
      
      {/* Results Section */}
      {centers.length === 0 ? (
        <div className="bg-yellow-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Keine Ankaufsstellen gefunden</h2>
          <p className="text-yellow-700">
            Leider konnten wir keine Recyclinghöfe finden, die aktuell {displayLabel} ankaufen.
            Versuchen Sie es mit einem anderen Material oder zu einem späteren Zeitpunkt erneut.
          </p>
          <Link href="/marketplace/materials">
            <Button variant="outline" className="mt-4">
              Andere Materialien erkunden
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-lg font-medium">
              {centers.length} Recyclinghöfe kaufen {displayLabel} an
            </p>
            <Separator className="my-4" />
          </div>
          
          {sortedCities.map(city => (
            <div key={city} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{displayLabel} Ankauf in {city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centersByCity[city].map((center) => (
                  <Card key={center.id} className="overflow-hidden h-full flex flex-col">
                    {/* Remove image display as field doesn't exist */}
                    {/* {center.images && center.images.length > 0 && (...) } */}
                    <div className="p-4 flex-grow">
                      <h3 className="text-xl font-bold mb-2">{center.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{center.address || 'Adresse unbekannt'}, {center.postalCode || 'PLZ'} {center.city || 'Stadt'}</span>
                      </p>
                      {center.buyMaterials && center.buyMaterials.length > 0 && (
                        <div className="my-4">
                          {/* MaterialPriceDisplay might need update if it expects fields that no longer exist */}
                          <MaterialPriceDisplay materials={center.buyMaterials} />
                        </div>
                      )}
                      {/* Remove description display as field doesn't exist */}
                      {/* {center.description && (...) } */}
                    </div>
                    <div className="p-4 pt-0 mt-auto">
                      <Link href={`/recycling-centers/${center.slug || center.id}`}>
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
      
      {/* Recycling Info Box */}
      <div className="mt-12 bg-slate-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Warum {displayLabel} recyclen?</h2>
        <p className="mb-4">
          Recycling von {displayLabel} schont wertvolle Ressourcen und reduziert den Energieverbrauch 
          im Vergleich zur Neuproduktion. Durch das Recycling können wertvolle Rohstoffe 
          wiederverwendet werden, was sowohl wirtschaftliche als auch ökologische Vorteile bietet.
        </p>
        <p>
          Indem Sie Ihr {displayLabel} zum bestmöglichen Preis verkaufen, tragen Sie aktiv 
          zum Umweltschutz bei und können gleichzeitig einen finanziellen Vorteil erzielen.
        </p>
      </div>
    </div>
  );
}

export default MaterialMarketplacePage; 