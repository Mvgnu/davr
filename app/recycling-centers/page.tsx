// Server component for recycling centers page
import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Frown, Search } from 'lucide-react';
import React from 'react';
import RecyclingCenterCard from '@/components/recycling/RecyclingCenterCard';
import CenterFilters from '@/components/recycling/CenterFilters';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import PaginationControls from '@/components/ui/PaginationControls';
import RecyclingCentersClientContent from './RecyclingCentersClientContent'; // Import the client component

// Proper metadata configuration using Next.js metadata API
export const metadata: Metadata = {
  title: 'Recyclingcenter in Deutschland | Finden Sie lokale Recyclingstellen',
  description: 'Finden Sie Recyclingcenter in ganz Deutschland mit unserer umfassenden Datenbank. Suchen Sie nach Stadt, akzeptierten Materialien und mehr für nachhaltige Recyclinglösungen in Ihrer Nähe.',
  keywords: 'Recyclingcenter, Deutschland, Abfallwirtschaft, nachhaltiges Recycling, Umweltlösungen, Elektroschrott, Entsorgung von Sondermüll, Recyclinganlagen',
  openGraph: {
    title: 'Recyclingcenter in Deutschland | Finden Sie lokale Recyclingstellen',
    description: 'Finden Sie Recyclingcenter in ganz Deutschland mit unserer umfassenden Datenbank. Suchen Sie nach Stadt, akzeptierten Materialien und mehr.',
    type: 'website',
    images: ['/images/recycling-hero.jpg'],
  }
};

// Adjusted type to include fields needed by card
type Center = {
  id: string;
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  slug?: string | null;
  website?: string | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | null; // Need to include if used in Card
};

// Type for fetched center data
type CenterForClient = {
  id: string;
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  slug?: string | null;
  website?: string | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | null; // Keep if needed by card/schema exists
};

// Define type for searchParams prop
interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Use Client Component Wrapper for Filters to avoid hydration mismatches with Suspense
const FiltersWrapper = React.memo(() => {
  return <CenterFilters />;
});
FiltersWrapper.displayName = 'FiltersWrapper';

// Initial Data Fetching (Server-Side)
async function fetchInitialData(searchParams: PageProps['searchParams']) {
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const materialName = typeof searchParams.material === 'string' ? searchParams.material : undefined;
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 10;
  const skip = (page - 1) * limit;

  const whereClause: Prisma.RecyclingCenterWhereInput = {};
  const andConditions: Prisma.RecyclingCenterWhereInput[] = [];

  if (searchQuery) {
    andConditions.push({
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { city: { contains: searchQuery, mode: 'insensitive' } },
        { postal_code: { contains: searchQuery, mode: 'insensitive' } },
      ]
    });
  }
  if (city) {
    andConditions.push({ city: { contains: city, mode: 'insensitive' } });
  }
  if (materialName) {
    andConditions.push({
      offers: {
        some: {
          material: {
            name: { contains: materialName, mode: 'insensitive' },
          },
        },
      }
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  try {
    const [totalCenters, centers] = await Promise.all([
      prisma.recyclingCenter.count({ where: whereClause }),
      prisma.recyclingCenter.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          address_street: true,
          city: true,
          postal_code: true,
          slug: true,
          website: true,
          verification_status: true,
        },
        orderBy: { name: 'asc' },
        skip: skip,
        take: limit,
      })
    ]);

    const typedCenters: CenterForClient[] = centers.map(center => ({
        ...center,
        verification_status: center.verification_status as 'pending' | 'verified' | 'rejected' | null
    }));

    return {
        centers: typedCenters,
        totalCenters,
        currentPage: page,
        limit,
        error: null
    };
  } catch (error) {
    console.error('[DB Fetch Initial Recycling Centers Error]', error);
    return {
        centers: [],
        totalCenters: 0,
        currentPage: page,
        limit,
        error: 'Fehler beim Laden der Recyclinghöfe.'
    };
  }
}

// The Server Component Page
export default async function RecyclingCentersServerPage({ searchParams }: PageProps) {
  const initialData = await fetchInitialData(searchParams);

  return (
    <RecyclingCentersClientContent
      initialCenters={initialData.centers}
      initialTotalCenters={initialData.totalCenters}
      initialCurrentPage={initialData.currentPage}
      initialLimit={initialData.limit}
      initialError={initialData.error}
      searchParams={searchParams} // Re-added searchParams prop
    />
  );
} 