'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Recycle,
  TrendingUp,
  Leaf,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface EnhancedMaterialCardProps {
  material: {
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    recyclability_percentage?: number | null;
    recycling_difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null;
    category_icon?: string | null;
    environmental_impact?: {
      co2_saved_per_kg?: number;
      energy_saved_percentage?: number;
      water_saved_liters?: number;
    } | null;
    acceptance_rate?: number | null;
    average_price_per_unit?: number | null;
    price_unit?: string | null;
    _count?: {
      offers: number;
      listings: number;
    };
  };
}

export default function EnhancedMaterialCard({ material }: EnhancedMaterialCardProps) {
  const placeholderImage = '/images/placeholder-marketplace.svg';

  // Helper function to get difficulty badge styling
  const getDifficultyBadge = (difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null | undefined) => {
    if (!difficulty) return null;

    const configs = {
      EASY: {
        label: 'Einfach',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
      },
      MEDIUM: {
        label: 'Mittel',
        icon: AlertCircle,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
      },
      HARD: {
        label: 'Schwierig',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      },
    };

    const config = configs[difficulty];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1 px-2 py-0.5 text-xs font-medium`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Helper to format price
  const formatPrice = (price: number | null | undefined, unit: string | null | undefined) => {
    if (price === null || price === undefined) return null;
    return `${price.toFixed(2)} €/${unit || 'kg'}`;
  };

  return (
    <Link href={`/materials/${material.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border/70 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
        {/* Image Section */}
        <div className="aspect-[4/3] relative bg-muted">
          <Image
            src={material.image_url || placeholderImage}
            alt={material.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Recyclability Badge Overlay */}
          {material.recyclability_percentage !== null && material.recyclability_percentage !== undefined && (
            <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {material.recyclability_percentage}%
              </span>
            </div>
          )}

          {/* Difficulty Badge Overlay */}
          {material.recycling_difficulty && (
            <div className="absolute top-3 left-3">
              {getDifficultyBadge(material.recycling_difficulty)}
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {material.name}
            </h3>
            {material.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {material.description}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            {/* CO2 Savings */}
            {material.environmental_impact &&
             typeof material.environmental_impact === 'object' &&
             'co2_saved_per_kg' in material.environmental_impact &&
             material.environmental_impact.co2_saved_per_kg !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {material.environmental_impact.co2_saved_per_kg} kg CO₂
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    pro kg gespart
                  </div>
                </div>
              </div>
            )}

            {/* Acceptance Rate */}
            {material.acceptance_rate !== null && material.acceptance_rate !== undefined && (
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {material.acceptance_rate}%
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Akzeptanzrate
                  </div>
                </div>
              </div>
            )}

            {/* Price */}
            {material.average_price_per_unit !== null &&
             material.average_price_per_unit !== undefined && (
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="text-xs text-muted-foreground">
                  Durchschnittspreis:
                </div>
                <div className="text-xs font-semibold text-green-700 dark:text-green-400">
                  {formatPrice(material.average_price_per_unit, material.price_unit)}
                </div>
              </div>
            )}

            {/* Offers Count */}
            {material._count && material._count.offers > 0 && (
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="text-xs text-muted-foreground">
                  Verfügbar bei {material._count.offers} {material._count.offers === 1 ? 'Recyclinghof' : 'Recyclinghöfen'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
