'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import RecyclingCenterCard from '@/components/recycling/RecyclingCenterCard';
import { AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export default function TopRecyclingCenters() {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCenters = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/recycling-centers?limit=3&sortBy=rating&verified=true');

        if (!response.ok) {
          throw new Error('Failed to fetch recycling centers');
        }

        const data = await response.json();

        // Handle API response structure (centers array in response)
        if (data.centers && Array.isArray(data.centers)) {
          setCenters(data.centers);
        } else if (Array.isArray(data)) {
          setCenters(data);
        } else {
          setCenters([]);
        }
      } catch (err) {
        console.error('Error fetching top recycling centers:', err);
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        setCenters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCenters();
  }, []);

  // Error state
  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-destructive/10 text-destructive rounded-full p-3 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          Die Recyclinghöfe konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
        <Link href="/recycling-centers">
          <Button variant="outline">
            <MapPin className="mr-2 h-4 w-4" />
            Alle Recyclinghöfe anzeigen
          </Button>
        </Link>
      </div>
    );
  }

  // Empty state
  if (!loading && centers.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-muted rounded-full p-3 mb-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Noch keine Recyclinghöfe</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          Derzeit sind noch keine verifizierten Recyclinghöfe verfügbar. Seien Sie der Erste!
        </p>
        <Link href="/recycling-centers">
          <Button variant="outline">
            Recyclinghof registrieren
          </Button>
        </Link>
      </div>
    );
  }

  return (
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
      ) : (
        // Render recycling centers
        centers.map(center => (
          <RecyclingCenterCard key={center.id} center={center} />
        ))
      )}
    </div>
  );
} 