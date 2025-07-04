import React from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import ClientRecyclingCenterDetail from './ClientRecyclingCenterDetail';
import dynamic from 'next/dynamic';

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

async function fetchRecyclingCenter(slug: string): Promise<CenterDetail | null> {
  try {
    // Set up AbortController with timeout
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recycling-centers/${slug}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
      
      clearTimeout(timeout);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        console.error(`API Error fetching center ${slug}: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch center data: ${response.statusText}`);
      }

      const data: CenterDetail = await response.json();
      return data;
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error(`[Fetch API Error for ${slug}]`, fetchError);
      
      // If the fetch from API times out or fails, try direct DB query as fallback
      console.log(`Falling back to direct DB query for slug: ${slug}`);
      const { prisma } = await import('@/lib/db/prisma');
      
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
                },
              },
            },
          },
        },
      });
      
      return center as CenterDetail | null;
    }
  } catch (error) {
    console.error(`[Fetch Recycling Center Detail Error - Slug: ${slug}]`, error);
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