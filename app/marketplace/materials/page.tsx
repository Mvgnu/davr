import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Search, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { MATERIAL_CATEGORIES, MATERIALS, getMaterialsByCategory } from '@/lib/constants/materials';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = {
  title: 'Recycling Material Ankauf | Preisvergleich für Wertstoffe',
  description: 'Finden Sie die besten Ankaufspreise für verschiedene Recyclingmaterialien bei Recyclinghöfen in Deutschland. Vergleichen Sie Angebote in Ihrer Nähe.',
  keywords: ['recycling ankauf', 'materialrecycling', 'wertstoffe verkaufen', 'recyclingpreise', 'materialbörse', 'recyclinghof', 'deutschland'],
};

interface MaterialCountData {
  materialId: string;
  count: number;
  maxPrice: number;
}

async function MaterialsMarketplacePage() {
  // Aggregate using Prisma 
  const materialStats = await prisma.recyclingCenterOffer.groupBy({
    by: ['material_id'],
    where: {
      price_per_unit: { not: null },
    },
    _count: {
      material_id: true,
    },
    _max: {
      price_per_unit: true,
    },
  });
  
  // Convert to a map for easier access
  const materialStatsMap: Record<string, MaterialCountData> = {};
  materialStats.forEach(stat => {
    const maxPrice = stat._max?.price_per_unit;
    const count = stat._count?.material_id;
    if (stat.material_id && maxPrice !== null && maxPrice !== undefined && count !== null && count !== undefined) { 
      materialStatsMap[stat.material_id] = {
        materialId: stat.material_id,
        count: count,
        maxPrice: maxPrice, 
      };
    }
  });
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Recycling Material Ankauf</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Finden Sie die besten Ankaufspreise für Ihre Wertstoffe in Deutschland
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Material suchen..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-blue-800">Verkaufen Sie Ihre Wertstoffe zum besten Preis</h2>
            <p className="text-blue-700 mt-2">
              Recyclinghöfe und Wertstoffannahmestellen in ganz Deutschland kaufen verschiedene Materialien an. 
              Nutzen Sie unsere Übersicht, um die besten Ankaufspreise in Ihrer Nähe zu finden und Ihre 
              Wertstoffe optimal zu verkaufen.
            </p>
          </div>
        </div>
      </div>
      
      {MATERIAL_CATEGORIES.map(category => {
        const materialsInCategory = getMaterialsByCategory(category.value);
        
        if (materialsInCategory.length === 0) return null;
        
        const materialsWithBuyers = materialsInCategory.filter(
          material => materialStatsMap[material.value]
        );
        
        if (materialsWithBuyers.length === 0) return null;
        
        return (
          <div key={category.value} className="mb-12">
            <h2 className="text-2xl font-bold">{category.label}</h2>
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materialsInCategory.map(material => {
                const stats = materialStatsMap[material.value];
                const hasBuyers = !!stats;
                
                return (
                  <Card 
                    key={material.value} 
                    className={`p-6 transition-all duration-200 hover:shadow-md ${!hasBuyers ? 'opacity-70' : ''}`}
                  >
                    <h3 className="text-xl font-bold mb-2">{material.label}</h3>
                    
                    {material.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    
                    {hasBuyers ? (
                      <div className="mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Ankaufstellen:</span>
                          <span className="font-semibold">{stats.count}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Höchstpreis:</span>
                          <span className="font-semibold text-green-600">
                            {stats.maxPrice.toFixed(2)}€/kg
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">
                        Aktuell keine Ankaufstellen verfügbar
                      </p>
                    )}
                    
                    <Link href={`/marketplace/materials/${material.value}`}>
                      <Button 
                        variant={hasBuyers ? "default" : "outline"} 
                        className="w-full"
                        disabled={!hasBuyers}
                      >
                        {hasBuyers ? (
                          <>
                            Ankaufstellen anzeigen
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          'Keine Ankäufer verfügbar'
                        )}
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      
      <div className="mt-12 bg-slate-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Warum Recycling wichtig ist</h2>
        <p className="mb-4">
          Recycling hilft, natürliche Ressourcen zu schonen und Energie zu sparen. Durch das Recycling 
          von Materialien reduzieren wir den Bedarf an Rohstoffgewinnung und verringern die Umweltbelastung.
        </p>
        <p>
          Indem Sie Ihre Wertstoffe zum Recycling bringen und dafür auch noch einen fairen Preis erhalten, 
          tragen Sie aktiv zum Umweltschutz bei und profitieren gleichzeitig finanziell.
        </p>
      </div>
    </div>
  );
}

export default MaterialsMarketplacePage; 