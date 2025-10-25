import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import MaterialDetailHero from '@/components/materials/MaterialDetailHero';
import EnvironmentalImpactCard from '@/components/materials/EnvironmentalImpactCard';
import PreparationTipsSection from '@/components/materials/PreparationTipsSection';
import FunFactCard from '@/components/materials/FunFactCard';
import NearbyCentersSection from '@/components/materials/NearbyCentersSection';
import MaterialJourney, { JourneyStep, DetailedJourneyStep } from '@/components/materials/MaterialJourney';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

// Enhanced type for material detail with all new fields
type MaterialDetail = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  journeyStepsJson?: Prisma.JsonValue | null;
  recyclability_percentage: number | null;
  recycling_difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  category_icon: string | null;
  environmental_impact: Prisma.JsonValue | null;
  preparation_tips: Prisma.JsonValue | null;
  acceptance_rate: number | null;
  average_price_per_unit: number | null;
  price_unit: string | null;
  fun_fact: string | null;
  annual_recycling_volume: number | null;
  parent?: { name: string; slug: string } | null;
  children?: { name: string; slug: string }[];
};

interface MaterialPageParams {
  params: { slug: string };
}

// Fetch material with all enhanced fields
async function getMaterialDetails(slug: string): Promise<MaterialDetail | null> {
  try {
    const material = await prisma.material.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        parent_id: true,
        image_url: true,
        journeyStepsJson: true,
        // Enhanced fields
        recyclability_percentage: true,
        recycling_difficulty: true,
        category_icon: true,
        environmental_impact: true,
        preparation_tips: true,
        acceptance_rate: true,
        average_price_per_unit: true,
        price_unit: true,
        fun_fact: true,
        annual_recycling_volume: true,
        // Relations
        parent: {
          select: { name: true, slug: true },
        },
        children: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!material) {
      return null;
    }

    return material as unknown as MaterialDetail;
  } catch (error) {
    console.error('[getMaterialDetails Error]', error);
    return null;
  }
}

const MaterialDetailPage = async ({ params }: MaterialPageParams) => {
  const { slug } = params;
  let material: MaterialDetail | null = null;
  let fetchError: string | null = null;

  try {
    material = await getMaterialDetails(slug);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'An unknown error occurred';
  }

  if (!material && !fetchError) {
    notFound();
  }

  // Error State
  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Fehler beim Laden</h1>
        <p className="text-muted-foreground mb-6">{fetchError}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/materials">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Materialübersicht
          </Link>
        </Button>
      </div>
    );
  }

  // Render page with enhanced components
  if (material) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-foreground">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-muted-foreground flex items-center space-x-2">
          <Link href="/materials" className="hover:text-foreground transition-colors">
            Materialien
          </Link>
          <span>/</span>
          {material.parent && (
            <>
              <Link
                href={`/materials/${material.parent.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {material.parent.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-medium text-foreground">{material.name}</span>
        </div>

        {/* Hero Section */}
        <div className="mb-8 animate-fade-in-up opacity-0 [--animation-delay:100ms]" style={{ animationFillMode: 'forwards' }}>
          <MaterialDetailHero
            name={material.name}
            description={material.description}
            imageUrl={material.image_url}
            recyclabilityPercentage={material.recyclability_percentage}
            recyclingDifficulty={material.recycling_difficulty}
            categoryIcon={material.category_icon}
            acceptanceRate={material.acceptance_rate}
            averagePrice={material.average_price_per_unit}
            priceUnit={material.price_unit}
          />
        </div>

        {/* Two-Column Layout for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Environmental Impact */}
            <div className="animate-fade-in-up opacity-0 [--animation-delay:200ms]" style={{ animationFillMode: 'forwards' }}>
              <EnvironmentalImpactCard
                environmentalImpact={material.environmental_impact as any}
                annualRecyclingVolume={material.annual_recycling_volume}
                materialName={material.name}
              />
            </div>

            {/* Preparation Tips */}
            <div className="animate-fade-in-up opacity-0 [--animation-delay:300ms]" style={{ animationFillMode: 'forwards' }}>
              <PreparationTipsSection
                preparationTips={material.preparation_tips as any}
                materialName={material.name}
              />
            </div>

            {/* Material Journey (if available) */}
            {material.journeyStepsJson && (
              <div className="animate-fade-in-up opacity-0 [--animation-delay:400ms]" style={{ animationFillMode: 'forwards' }}>
                <MaterialJourney
                  materialName={material.name}
                  materialType={material.parent?.name || 'Wertstoff'}
                  journeySteps={material.journeyStepsJson as any}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-8">
            {/* Fun Fact */}
            {material.fun_fact && (
              <div className="animate-fade-in-up opacity-0 [--animation-delay:250ms]" style={{ animationFillMode: 'forwards' }}>
                <FunFactCard funFact={material.fun_fact} materialName={material.name} />
              </div>
            )}

            {/* Hierarchy Info */}
            {(material.parent || (Array.isArray(material.children) && material.children.length > 0)) && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up opacity-0 [--animation-delay:350ms]" style={{ animationFillMode: 'forwards' }}>
                <h3 className="font-semibold text-lg mb-4 text-foreground">Materialhierarchie</h3>

                {/* Parent Material */}
                {material.parent && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                      Übergeordnete Kategorie
                    </p>
                    <Link
                      href={`/materials/${material.parent.slug}`}
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      <ArrowUp className="mr-1.5 h-4 w-4" />
                      {material.parent.name}
                    </Link>
                  </div>
                )}

                {/* Child Materials */}
                {Array.isArray(material.children) && material.children.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                      Untergeordnete Materialien
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {material.children.map((child) => (
                        <Link
                          key={child.slug}
                          href={`/materials/${child.slug}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <ArrowDown className="mr-1 h-3.5 w-3.5" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nearby Centers Section - Full Width */}
        <div className="mt-8 animate-fade-in-up opacity-0 [--animation-delay:500ms]" style={{ animationFillMode: 'forwards' }}>
          <NearbyCentersSection materialSlug={material.slug} materialName={material.name} />
        </div>

        {/* Back to Materials Button */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/materials">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Materialübersicht
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default MaterialDetailPage;
