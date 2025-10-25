import React from 'react';
import MaterialsStatsHero from '@/components/materials/MaterialsStatsHero';
import EnhancedMaterialCard from '@/components/materials/EnhancedMaterialCard';
import WhereToBringPanel from '@/components/materials/WhereToBringPanel';
import PaginationControls from '@/components/ui/PaginationControls';
import MaterialsClientFilters from '@/components/materials/MaterialsClientFilters';
import { AlertTriangle, Package } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

// Type for enhanced material data
type EnhancedMaterialSummary = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  recyclability_percentage: number | null;
  recycling_difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  category_icon: string | null;
  environmental_impact: any;
  acceptance_rate: number | null;
  average_price_per_unit: number | null;
  price_unit: string | null;
  _count: {
    offers: number;
    listings: number;
  };
};

interface MaterialsListPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const MaterialsListPage = async ({ searchParams }: MaterialsListPageProps) => {
  let materials: EnhancedMaterialSummary[] = [];
  let fetchError: string | null = null;

  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10) || 1) : 1;
  const limit = typeof searchParams.limit === 'string' ? Math.max(1, parseInt(searchParams.limit, 10) || 12) : 12;
  const skip = (page - 1) * limit;

  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const difficulty = typeof searchParams.difficulty === 'string' ? searchParams.difficulty : null;
  const minRecyclability = typeof searchParams.min_recyclability === 'string' ? searchParams.min_recyclability : null;

  // Build where clause with all filters
  const whereClause: Prisma.MaterialWhereInput = {};
  const andConditions: Prisma.MaterialWhereInput[] = [];

  // Search filter
  if (q) {
    andConditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  // Difficulty filter
  if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    andConditions.push({
      recycling_difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD',
    });
  }

  // Recyclability filter
  if (minRecyclability) {
    const minValue = parseInt(minRecyclability, 10);
    if (!isNaN(minValue)) {
      andConditions.push({
        recyclability_percentage: { gte: minValue },
      });
    }
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  let totalCount = 0;

  try {
    totalCount = await prisma.material.count({ where: whereClause });
    materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        image_url: true,
        description: true,
        recyclability_percentage: true,
        recycling_difficulty: true,
        category_icon: true,
        environmental_impact: true,
        acceptance_rate: true,
        average_price_per_unit: true,
        price_unit: true,
        _count: {
          select: {
            offers: true,
            listings: true,
          },
        },
      },
      where: whereClause,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });
  } catch (error) {
    console.error('[DB Fetch Materials Error]', error);
    fetchError = 'Fehler beim Laden der Materialdaten.';
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 text-foreground">
      {/* Hero Section with Stats */}
      <MaterialsStatsHero />

      {fetchError && (
        <div className="text-center py-16 text-destructive">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="mb-2 text-xl font-semibold">Fehler beim Laden</h2>
          <p className="text-muted-foreground">{fetchError}</p>
        </div>
      )}

      {!fetchError && (
        <>
          {/* Client-side Filters */}
          <MaterialsClientFilters
            initialQuery={q}
            initialDifficulty={difficulty}
            initialRecyclability={minRecyclability}
          />

          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount === 0 ? (
                'Keine Materialien gefunden'
              ) : totalCount === 1 ? (
                '1 Material gefunden'
              ) : (
                `${totalCount} Materialien gefunden`
              )}
            </p>
          </div>

          {/* Materials Grid */}
          {materials.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <Package className="mx-auto h-16 w-16 text-muted-foreground/40 mb-5" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Keine Materialien gefunden
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {q || difficulty || minRecyclability
                  ? 'Versuchen Sie, Ihre Filter anzupassen, um mehr Ergebnisse zu sehen.'
                  : 'Es sind derzeit keine Materialien in der Datenbank vorhanden.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {materials.map((material) => (
                <EnhancedMaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10">
              <PaginationControls currentPage={page} totalPages={totalPages} baseUrl="/materials" />
            </div>
          )}

          {/* Where to Bring Section */}
          <WhereToBringPanel />
        </>
      )}
    </div>
  );
};

export default MaterialsListPage;
