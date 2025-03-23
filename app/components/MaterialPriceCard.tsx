'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMaterialPrices, MaterialPriceStats } from '@/lib/hooks/useMaterialPrices';
import { formatPrice, formatPriceRange, getPriceTrendText } from '@/lib/utils/price-formatters';

type MaterialPriceCardProps = {
  materialId?: string;
  category?: string;
  compact?: boolean;
  title?: string;
};

export function MaterialPriceCard({
  materialId,
  category,
  compact = false,
  title = 'Material Prices',
}: MaterialPriceCardProps) {
  const { loading, error, priceStats } = useMaterialPrices(materialId, category);

  // Filter to single material if materialId is provided
  const displayStats = materialId
    ? priceStats.filter(stat => stat.materialId === materialId)
    : priceStats;

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-red-700">Price Data Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : displayStats.length === 0 ? (
          <p className="text-sm text-gray-500">No price data available</p>
        ) : (
          <div className="space-y-4">
            {displayStats.map((stat) => (
              <MaterialPriceItem 
                key={stat.materialId} 
                stat={stat} 
                compact={compact} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type MaterialPriceItemProps = {
  stat: MaterialPriceStats;
  compact: boolean;
};

function MaterialPriceItem({ stat, compact }: MaterialPriceItemProps) {
  const { materialName, category, avgPrice, minPrice, maxPrice, offerCount } = stat;
  const trendText = getPriceTrendText(stat);
  
  return (
    <div className="border-b pb-3 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{materialName}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
        
        {trendText && (
          <Badge 
            variant={stat.priceTrend && stat.priceTrend > 0 ? "secondary" : "destructive"}
            className={`ml-2 ${stat.priceTrend && stat.priceTrend > 0 ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            {trendText}
          </Badge>
        )}
      </div>
      
      {!compact && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Average Price</p>
              <p className="font-medium">{formatPrice(avgPrice)}</p>
            </div>
            <div>
              <p className="text-gray-500">Price Range</p>
              <p className="font-medium">{formatPriceRange(minPrice, maxPrice)}</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Based on {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
          </p>
        </>
      )}
      
      {compact && (
        <div className="mt-1">
          <p className="font-medium">{formatPriceRange(minPrice, maxPrice)}</p>
          <p className="text-xs text-gray-400">
            {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
          </p>
        </div>
      )}
    </div>
  );
} 