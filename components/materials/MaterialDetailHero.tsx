import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Recycle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Star
} from 'lucide-react';

interface MaterialDetailHeroProps {
  name: string;
  description: string | null;
  imageUrl: string | null;
  recyclabilityPercentage: number | null;
  recyclingDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  categoryIcon: string | null;
  acceptanceRate: number | null;
  averagePrice: number | null;
  priceUnit: string | null;
}

export default function MaterialDetailHero({
  name,
  description,
  imageUrl,
  recyclabilityPercentage,
  recyclingDifficulty,
  categoryIcon,
  acceptanceRate,
  averagePrice,
  priceUnit,
}: MaterialDetailHeroProps) {
  const placeholderImage = '/images/placeholder-marketplace.svg';

  // Helper function to get difficulty configuration
  const getDifficultyConfig = (difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null) => {
    if (!difficulty) return null;

    const configs = {
      EASY: {
        label: 'Einfach zu recyceln',
        icon: CheckCircle2,
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-300 dark:border-green-700',
      },
      MEDIUM: {
        label: 'Mittlere Schwierigkeit',
        icon: AlertCircle,
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        textClass: 'text-yellow-700 dark:text-yellow-400',
        borderClass: 'border-yellow-300 dark:border-yellow-700',
      },
      HARD: {
        label: 'Aufwendig zu recyceln',
        icon: AlertTriangle,
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-700 dark:text-red-400',
        borderClass: 'border-red-300 dark:border-red-700',
      },
    };

    return configs[difficulty];
  };

  const difficultyConfig = getDifficultyConfig(recyclingDifficulty);
  const DifficultyIcon = difficultyConfig?.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Image
          src={imageUrl || placeholderImage}
          alt={name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {/* Recyclability Badge */}
          {recyclabilityPercentage !== null && recyclabilityPercentage !== undefined && (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
              <Recycle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {recyclabilityPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">recycelbar</span>
            </div>
          )}

          {/* Difficulty Badge */}
          {difficultyConfig && DifficultyIcon && (
            <Badge
              variant="outline"
              className={`${difficultyConfig.bgClass} ${difficultyConfig.textClass} ${difficultyConfig.borderClass} px-3 py-1.5 text-sm font-semibold backdrop-blur-sm`}
            >
              <DifficultyIcon className="w-4 h-4 mr-1.5" />
              {difficultyConfig.label}
            </Badge>
          )}
        </div>

        {/* Title Overlay at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-lg animate-fade-in-up opacity-0 [--animation-delay:100ms]" style={{ animationFillMode: 'forwards' }}>
            {name}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 animate-fade-in-up opacity-0 [--animation-delay:200ms]" style={{ animationFillMode: 'forwards' }}>
          {/* Recyclability */}
          {recyclabilityPercentage !== null && recyclabilityPercentage !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Recycle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {recyclabilityPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">Recycelbar</div>
              </div>
            </div>
          )}

          {/* Acceptance Rate */}
          {acceptanceRate !== null && acceptanceRate !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {acceptanceRate}%
                </div>
                <div className="text-xs text-muted-foreground">Akzeptanzrate</div>
              </div>
            </div>
          )}

          {/* Price */}
          {averagePrice !== null && averagePrice !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {averagePrice.toFixed(2)} €
                </div>
                <div className="text-xs text-muted-foreground">pro {priceUnit || 'kg'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed animate-fade-in-up opacity-0 [--animation-delay:300ms]" style={{ animationFillMode: 'forwards' }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
