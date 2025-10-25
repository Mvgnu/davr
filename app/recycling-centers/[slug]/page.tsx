import React from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import ClientRecyclingCenterDetail from './ClientRecyclingCenterDetail';
import { prisma } from '@/lib/db/prisma';

type MaterialOffer = {
  price_per_unit: number | null;
  unit: string | null;
  notes: string | null;
  material: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
};

type CenterDetail = {
  id: string;
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_number?: string | null;
  website?: string | null;
  slug?: string | null;
  offers: MaterialOffer[];
  managedById?: string | null;
};

async function fetchRecyclingCenter(slug: string) {
  try {
    const center = await prisma.recyclingCenter.findUnique({
      where: { slug },
      include: {
        offers: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image_url: true,
                parent_id: true,
              },
            },
          },
          orderBy: {
            material: {
              name: 'asc',
            },
          },
        },
        working_hours: {
          orderBy: {
            day_of_week: 'asc',
          },
        },
      },
    });

    if (!center) return null;

    // Fetch nearby centers if coordinates exist
    let nearbyCenters: Array<{
      id: string;
      name: string;
      slug: string | null;
      city: string | null;
      latitude: number;
      longitude: number;
      image_url: string | null;
      distance: number;
      _count: { offers: number };
    }> = [];

    if (center.latitude && center.longitude) {
      // Simple distance calculation using Haversine formula approximation
      // For production, consider using PostGIS or a more robust solution
      const rawNearbyCenters = await prisma.recyclingCenter.findMany({
        where: {
          id: { not: center.id },
          verification_status: 'VERIFIED',
          latitude: { not: null },
          longitude: { not: null },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          latitude: true,
          longitude: true,
          image_url: true,
          _count: {
            select: {
              offers: true,
            },
          },
        },
      });

      // Calculate distances and sort
      const centersWithDistance = rawNearbyCenters
        .map((nearbyCenter) => {
          const lat1 = center.latitude!;
          const lon1 = center.longitude!;
          const lat2 = nearbyCenter.latitude!;
          const lon2 = nearbyCenter.longitude!;

          // Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            id: nearbyCenter.id,
            name: nearbyCenter.name,
            slug: nearbyCenter.slug,
            city: nearbyCenter.city,
            latitude: lat2,
            longitude: lon2,
            image_url: nearbyCenter.image_url,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            _count: nearbyCenter._count,
          };
        })
        .filter((c) => c.distance <= 30) // Within 30km
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      nearbyCenters = centersWithDistance;
    }

    return {
      ...center,
      nearbyCenters,
    };
  } catch (error) {
    console.error(`[Recycling Center DB Query Error - Slug: ${slug}]`, error);
    return null;
  }
}

// Server component to fetch data and pass to client component
export default async function RecyclingCenterDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const center = await fetchRecyclingCenter(slug);
  const session = await getServerSession(authOptions);

  // If center data couldn't be fetched (error or not found), render 404 page
  if (!center) {
    notFound();
  }

  return <ClientRecyclingCenterDetail params={params} centerData={center} initialSession={session} />;
}

// Optional: generateStaticParams for SSG if slugs are known at build time
// export async function generateStaticParams() {
//   // Fetch all slugs from the API or database
//   // const centers = await fetchAllCenterSlugs(); 
//   // return centers.map((center) => ({ slug: center.slug }));
//   return []; // Return empty array if not using SSG for this page
// } 