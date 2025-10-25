import React from 'react';
import { Leaf, Zap, Droplets, TrendingUp } from 'lucide-react';

interface EnvironmentalImpact {
  co2_saved_per_kg?: number;
  energy_saved_percentage?: number;
  water_saved_liters?: number;
}

interface EnvironmentalImpactCardProps {
  environmentalImpact: EnvironmentalImpact | null;
  annualRecyclingVolume: number | null;
  materialName: string;
}

export default function EnvironmentalImpactCard({
  environmentalImpact,
  annualRecyclingVolume,
  materialName,
}: EnvironmentalImpactCardProps) {
  if (!environmentalImpact || typeof environmentalImpact !== 'object') {
    return null;
  }

  const { co2_saved_per_kg, energy_saved_percentage, water_saved_liters } = environmentalImpact;

  // Calculate total annual savings if volume is available
  const totalCO2SavedTonnes = co2_saved_per_kg && annualRecyclingVolume
    ? Math.round((co2_saved_per_kg * annualRecyclingVolume) / 1000)
    : null;

  const totalWaterSavedMillionLiters = water_saved_liters && annualRecyclingVolume
    ? Math.round((water_saved_liters * annualRecyclingVolume) / 1000000)
    : null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-6 md:p-8 border border-green-200 dark:border-green-800 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-green-600 dark:bg-green-500 flex items-center justify-center">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Umweltauswirkungen
          </h2>
          <p className="text-sm text-muted-foreground">
            Positiver Beitrag durch {materialName}-Recycling
          </p>
        </div>
      </div>

      {/* Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CO2 Savings */}
        {co2_saved_per_kg !== null && co2_saved_per_kg !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">CO₂ Einsparung</div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {co2_saved_per_kg} kg
                </div>
                <div className="text-xs text-muted-foreground">pro kg Material</div>
              </div>
              {totalCO2SavedTonnes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatNumber(totalCO2SavedTonnes)} Tonnen
                  </div>
                  <div className="text-xs text-muted-foreground">jährlich eingespart</div>
                </div>
              )}
            </div>
            {/* Progress bar visualization */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-1000 animate-expand-width"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Energy Savings */}
        {energy_saved_percentage !== null && energy_saved_percentage !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Energieeinsparung</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {energy_saved_percentage}%
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                weniger Energie als Neuproduktion
              </div>
            </div>
            {/* Circular progress visualization */}
            <div className="relative w-24 h-24 mx-auto mt-4">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - energy_saved_percentage / 100)}`}
                  className="text-yellow-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* Water Savings */}
        {water_saved_liters !== null && water_saved_liters !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Wassereinsparung</div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(water_saved_liters)} L
                </div>
                <div className="text-xs text-muted-foreground">pro kg Material</div>
              </div>
              {totalWaterSavedMillionLiters && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatNumber(totalWaterSavedMillionLiters)} Mio. L
                  </div>
                  <div className="text-xs text-muted-foreground">jährlich eingespart</div>
                </div>
              )}
            </div>
            {/* Water drops visualization */}
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-bounce"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '2s'
                  }}
                >
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Annual Volume Info */}
      {annualRecyclingVolume && (
        <div className="mt-6 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Jährliches Recyclingvolumen:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(annualRecyclingVolume)} Tonnen
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
