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
import { calculateDistance } from '@/lib/utils/distance';

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
  distance?: number | null;
  offers?: { price_per_unit: number | null; unit: string | null; material: { name: string } }[];
  is_open_now?: boolean;
  today_hours?: string | null;
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
  const materialsParam = typeof searchParams.materials === 'string' ? searchParams.materials : undefined;
  const selectedMaterials = materialsParam ? materialsParam.split(',').filter(Boolean) : [];
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 10;
  const skip = (page - 1) * limit;
  const openNow = searchParams.openNow === 'true';
  const lat = searchParams.lat ? parseFloat(String(searchParams.lat)) : undefined;
  const lng = searchParams.lng ? parseFloat(String(searchParams.lng)) : undefined;
  const maxDistance = searchParams.maxDistance ? parseFloat(String(searchParams.maxDistance)) : undefined;

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
  if (selectedMaterials.length > 0) {
    // Require center to accept ALL selected materials
    selectedMaterials.forEach((m) => {
      andConditions.push({
        offers: {
          some: { material: { name: { contains: m, mode: 'insensitive' } } },
        },
      });
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
          latitude: true,
          longitude: true,
          working_hours: true,
          offers: {
            select: {
              price_per_unit: true,
              unit: true,
              material: { select: { name: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: skip,
        take: limit,
      })
    ]);

    const now = new Date();
    const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const today = dayNames[now.getDay()];
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    let processed: CenterForClient[] = centers.map((c) => {
      let distance: number | null = null;
      if (typeof lat === 'number' && typeof lng === 'number' && c.latitude && c.longitude) {
        distance = calculateDistance(lat, lng, c.latitude, c.longitude);
      }
      const todays = (c.working_hours || []).filter((w: any) => w.day_of_week === today);
      const openEntry = todays.find((w: any) => !w.is_closed && w.open_time <= timeStr && timeStr <= w.close_time);
      const todayHours = todays.length > 0 ? (todays[0].is_closed ? 'Geschlossen' : `${todays[0].open_time}–${todays[0].close_time}`) : null;

      // Filter offers to selected materials or single material if provided
      let offers = c.offers || [];
      if (selectedMaterials.length > 0) {
        offers = offers.filter((o) => selectedMaterials.some((m) => o.material.name.toLowerCase().includes(m.toLowerCase())));
      } else if (materialName) {
        offers = offers.filter((o) => o.material.name.toLowerCase().includes(materialName.toLowerCase()));
      }

      return {
        id: c.id,
        name: c.name,
        address_street: c.address_street,
        city: c.city,
        postal_code: c.postal_code,
        slug: c.slug,
        website: c.website,
        verification_status: c.verification_status as 'pending' | 'verified' | 'rejected' | null,
        distance,
        offers,
        is_open_now: Boolean(openEntry),
        today_hours: todayHours,
      };
    });

    if (typeof maxDistance === 'number' && typeof lat === 'number' && typeof lng === 'number') {
      processed = processed.filter((c) => typeof c.distance === 'number' && (c.distance as number) <= maxDistance);
      processed.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    if (openNow) {
      processed = processed.filter((c) => c.is_open_now);
    }

    return {
        centers: processed,
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