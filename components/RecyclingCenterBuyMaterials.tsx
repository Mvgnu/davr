import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import MaterialPriceDisplay from './MaterialPriceDisplay';
import { Button } from './ui/button';
import { useMaterialPrices } from '@/lib/hooks/useMaterialPrices';
import { formatPrice } from '@/lib/utils/price-formatters';

interface BuyMaterial {
  materialId: string;
  pricePerKg: number;
  minWeight?: number;
  maxWeight?: number;
  active: boolean;
}

interface RecyclingCenterBuyMaterialsProps {
  buyMaterials: BuyMaterial[];
  title?: string;
  showHeading?: boolean;
  showMarketComparison?: boolean;
}

/**
 * Component to display materials that a recycling center buys
 * with their prices and conditions
 */
const RecyclingCenterBuyMaterials: React.FC<RecyclingCenterBuyMaterialsProps> = ({
  buyMaterials,
  title = "Wir kaufen diese Materialien an",
  showHeading = true,
  showMarketComparison = true
}) => {
  // Filter only active materials
  const activeMaterials = buyMaterials?.filter(m => m.active) || [];
  
  // Get market price statistics for comparison
  const { priceStats, getMaterialPrice } = useMaterialPrices();
  
  if (activeMaterials.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mb-6">
      {showHeading && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-4">
          {/* Material Price Display with Market Comparison */}
          <div className="space-y-3">
            {activeMaterials.map((material, index) => {
              const materialInfo = getMaterialByValue(material.materialId);
              const marketStats = getMaterialPrice(material.materialId);
              
              // Calculate how this center's price compares to market average
              const marketAvg = marketStats?.avgPrice || null;
              const priceDiff = marketAvg ? ((material.pricePerKg - marketAvg) / marketAvg) * 100 : null;
              
              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border-b pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{materialInfo?.label || material.materialId}</span>
                    {materialInfo?.description && (
                      <p className="text-sm text-muted-foreground">{materialInfo.description}</p>
                    )}
                    
                    {showMarketComparison && marketStats && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span>Marktdurchschnitt: {formatPrice(marketStats.avgPrice)}/kg</span>
                        {priceDiff !== null && (
                          <span className={`ml-2 flex items-center ${
                            priceDiff > 0 ? 'text-green-600' : 
                            priceDiff < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {priceDiff > 0 ? (
                              <><TrendingUp className="h-3 w-3 mr-1" />{priceDiff.toFixed(1)}% über Durchschnitt</>
                            ) : priceDiff < 0 ? (
                              <><TrendingDown className="h-3 w-3 mr-1" />{Math.abs(priceDiff).toFixed(1)}% unter Durchschnitt</>
                            ) : (
                              <><Minus className="h-3 w-3 mr-1" />Entspricht dem Durchschnitt</>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-green-600">{material.pricePerKg.toFixed(2)}€<span className="text-sm font-normal">/kg</span></span>
                    {(material.minWeight || material.maxWeight) && (
                      <div className="text-xs text-muted-foreground">
                        {material.minWeight && <span>Min: {material.minWeight}kg</span>}
                        {material.minWeight && material.maxWeight && <span> • </span>}
                        {material.maxWeight && <span>Max: {material.maxWeight}kg</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-4 text-sm text-muted-foreground">
            <p>
              Die angegebenen Preise können je nach Qualität, Menge und aktueller Marktlage variieren. 
              Bitte kontaktieren Sie den Recyclinghof direkt für die aktuellsten Preise und Bedingungen.
            </p>
            
            <div className="mt-4">
              <Link href="/marketplace/materials">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Preise vergleichen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Import this function from here since we still need it
const getMaterialByValue = (value: string) => {
  // This would normally come from a database or constants file
  // For now, just return a simple object with the material ID as the label
  return { label: value, description: '' };
};

export default RecyclingCenterBuyMaterials; 