'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import RecyclingCenterCard from '@/components/recycling/RecyclingCenterCard';

type RecyclingCenter = {
  id: string;
  name: string;
  slug: string | null;
  address_street: string | null;
  city: string | null;
  postal_code: string | null;
  website: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | null;
  image_url: string | null;
  rating: number | null;
};

// Fallback example centers when the API doesn't return any
const exampleCenters: RecyclingCenter[] = [
  {
    id: 'example-1',
    name: 'Recyclinghof Berlin-Mitte',
    slug: 'recyclinghof-berlin-mitte',
    address_street: 'Recyclingstraße 123',
    city: 'Berlin',
    postal_code: '10115',
    website: 'https://example.com/recycling-berlin',
    verification_status: 'verified',
    image_url: '/images/placeholder/recycling-center.jpg',
    rating: 4.5
  },
  {
    id: 'example-2',
    name: 'Wertstoffhof München',
    slug: 'wertstoffhof-muenchen',
    address_street: 'Wertstoffweg 45',
    city: 'München',
    postal_code: '80331',
    website: 'https://example.com/recycling-muenchen',
    verification_status: 'verified',
    image_url: '/images/placeholder/recycling-center.jpg',
    rating: 4.2
  },
  {
    id: 'example-3',
    name: 'Recyclingzentrum Hamburg',
    slug: 'recyclingzentrum-hamburg',
    address_street: 'Recyclingallee 78',
    city: 'Hamburg',
    postal_code: '20095',
    website: 'https://example.com/recycling-hamburg',
    verification_status: 'verified',
    image_url: '/images/placeholder/recycling-center.jpg',
    rating: 4.7
  }
];

export default function TopRecyclingCenters() {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingExampleData, setUsingExampleData] = useState(false);

  useEffect(() => {
    const fetchTopCenters = async () => {
      try {
        setLoading(true);
        // Fetch top centers
        const response = await fetch('/api/recycling-centers?limit=3&sort=rating&verified=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recycling centers');
        }
        
        const data = await response.json();
        
        // If no centers returned, use example data
        if (data.length === 0) {
          setCenters(exampleCenters);
          setUsingExampleData(true);
        } else {
          setCenters(data);
          setUsingExampleData(false);
        }
      } catch (err) {
        console.error('Error fetching top recycling centers:', err);
        // Use example data on error
        setCenters(exampleCenters);
        setUsingExampleData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCenters();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton loading states
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col h-full">
              <Skeleton className="w-full aspect-[16/10] rounded-t-lg" />
              <div className="p-5 flex flex-col space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : centers.length > 0 ? (
          // Render recycling centers
          centers.map(center => (
            <RecyclingCenterCard key={center.id} center={center} />
          ))
        ) : (
          // No centers found - should never happen now with our fallback
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Keine Recyclinghöfe gefunden
          </div>
        )}
      </div>
      {usingExampleData && (
        <div className="text-center text-sm text-muted-foreground mt-3">
          <p>Diese Beispieldaten dienen zur Veranschaulichung. Registrieren Sie Ihren Recyclinghof, um hier zu erscheinen!</p>
        </div>
      )}
    </>
  );
} 