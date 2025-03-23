import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { getMaterialByValue } from '@/lib/constants/materials';

interface MaterialPrice {
  materialId: string;
  pricePerKg: number;
  minWeight?: number;
  maxWeight?: number;
  active: boolean;
}

interface MaterialPriceDisplayProps {
  materials: MaterialPrice[];
  className?: string;
  compact?: boolean;
}

/**
 * Component to display material prices in a clear, visually appealing way
 */
const MaterialPriceDisplay: React.FC<MaterialPriceDisplayProps> = ({ 
  materials,
  className = '',
  compact = false
}) => {
  // Filter only active materials
  const activeMaterials = materials.filter(m => m.active);
  
  if (activeMaterials.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {activeMaterials.map((material, index) => {
          const materialInfo = getMaterialByValue(material.materialId);
          return (
            <Badge 
              key={index} 
              variant="outline"
              className="flex items-center gap-1 border-green-500 text-green-700 bg-green-50"
            >
              <span className="font-medium">{materialInfo?.label || material.materialId}:</span>
              <span>{material.pricePerKg.toFixed(2)}€/kg</span>
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Ankaufspreise</h3>
      <div className="space-y-3">
        {activeMaterials.map((material, index) => {
          const materialInfo = getMaterialByValue(material.materialId);
          return (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border-b pb-2 last:border-0">
              <div>
                <span className="font-medium">{materialInfo?.label || material.materialId}</span>
                {materialInfo?.description && (
                  <p className="text-sm text-muted-foreground">{materialInfo.description}</p>
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
    </Card>
  );
};

export default MaterialPriceDisplay; 