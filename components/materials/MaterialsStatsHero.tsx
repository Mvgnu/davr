'use client';

import React, { useEffect, useState } from 'react';
import { Recycle, Building2, Leaf, TrendingUp } from 'lucide-react';

interface MaterialsStats {
  total_materials: number;
  total_centers_accepting: number;
  total_co2_saved_tonnes: number;
  most_recycled_material: {
    name: string;
    slug: string;
    annual_volume_tonnes: number;
  } | null;
  featured_materials: Array<{
    id: string;
    name: string;
    recyclability_percentage: number | null;
    category_icon: string | null;
    fun_fact: string | null;
  }>;
}

export default function MaterialsStatsHero() {
  const [stats, setStats] = useState<MaterialsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/materials/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch material stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  return (
    <section className="relative mb-12 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 -z-10 rounded-2xl" />

      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-5 -z-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="px-6 py-10 md:px-8 md:py-12">
        {/* Headline */}
        <div className="max-w-3xl mb-8 animate-fade-in-up opacity-0 [--animation-delay:60ms]" style={{ animationFillMode: 'forwards' }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Verstehen Sie, was recycelbar ist
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Entdecken Sie {stats ? formatNumber(stats.total_materials) : '...'} Materialien mit detaillierten Recycling-Informationen,
            Umweltauswirkungen und passenden Recyclinghöfen in Ihrer Nähe.
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Total Materials Card */}
            <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in-up opacity-0 [--animation-delay:120ms]" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Recycle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatNumber(stats.total_materials)}
              </div>
              <div className="text-sm text-muted-foreground">
                Recycelbare Materialien
              </div>
            </div>

            {/* Total Centers Card */}
            <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in-up opacity-0 [--animation-delay:180ms]" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatNumber(stats.total_centers_accepting)}
              </div>
              <div className="text-sm text-muted-foreground">
                Verifizierte Recyclinghöfe
              </div>
            </div>

            {/* CO2 Saved Card */}
            <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in-up opacity-0 [--animation-delay:240ms]" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {formatNumber(stats.total_co2_saved_tonnes)}
              </div>
              <div className="text-sm text-muted-foreground">
                Tonnen CO₂ eingespart/Jahr
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Statistiken konnten nicht geladen werden
          </div>
        )}

        {/* Most Recycled Material Highlight */}
        {stats?.most_recycled_material && (
          <div className="mt-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-fade-in-up opacity-0 [--animation-delay:300ms]" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Meist recyceltes Material:</span>
              <span className="font-semibold text-green-700 dark:text-green-400">
                {stats.most_recycled_material.name}
              </span>
              <span className="text-muted-foreground">
                ({formatNumber(stats.most_recycled_material.annual_volume_tonnes)} Tonnen/Jahr)
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
