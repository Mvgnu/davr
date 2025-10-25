'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ListingCard from '@/components/marketplace/ListingCard';
import PaginationControls from '@/components/ui/PaginationControls'; // Ensure this path is correct
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'; // Import Filters
import { useSession } from "next-auth/react"; // Import useSession

// Import the actual type used by ListingCard if available, or redefine it
// Assuming ListingCardProps uses this structure internally:
interface ListingCardData {
  id: string;
  slug?: string; 
  title: string;
  description?: string | null;
  approximate_min_price?: number | null;
  approximate_max_price?: number | null;
  image_url?: string | null;
  status?: string; 
  category?: string;
  location?: string | null;
  created_at: string;
  user?: { 
    name?: string | undefined;
    id?: string;
  }; 
  seller?: {
    id: string;
    name: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    joinedSince?: Date;
    totalListings?: number | null;
  };
}

// Define types based on API response
type MarketplaceListingWithRelations = {
  id: string;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  location?: string | null;
  created_at: string; 
  image_url?: string | null;
  material?: { name: string } | null;
  seller: { 
    id: string; 
    name: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    memberSince?: number | null;
    totalActiveListings?: number | null;
  };
  // We need status and type from API as well for mapping
  status?: string;
  type?: string;
};

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalListings: number;
  limit: number;
}

// --- Loading Skeleton --- 
function ListingGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[192px] w-full rounded-lg" /> 
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[100px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Main Client Component --- 
function MarketplaceClientContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession(); // Get session data
    const [listings, setListings] = useState<MarketplaceListingWithRelations[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // Debounced search handler
    const debouncedSearch = useDebouncedCallback((term: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (term) {
            current.set('search', term);
        } else {
            current.delete('search');
        }
        current.set('page', '1'); // Reset to page 1 on new search
        router.push(`/marketplace?${current.toString()}`);
    }, 500);

    // Fetch data effect
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            console.log('[Marketplace Fetch] Fetching data for params:', searchParams.toString()); // Log params
            try {
                const params = new URLSearchParams(Array.from(searchParams.entries()));
                const response = await fetch(`/api/marketplace/listings?${params.toString()}`);
                console.log('[Marketplace Fetch] Response status:', response.status); // Log status
                if (!response.ok) {
                    throw new Error(`Failed to fetch listings (status: ${response.status})`);
                }
                const data = await response.json();
                console.log('[Marketplace Fetch] Raw data received:', data); // Log raw data
                setListings(data.listings || []);
                console.log('[Marketplace Fetch] Listings state set with:', data.listings || []); // Log what was set
                setPagination(data.pagination || null);
            } catch (err: any) {
                console.error('[Marketplace Fetch] Error:', err); // Log error
                setError(err.message || 'An unknown error occurred');
                setListings([]);
                setPagination(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [searchParams]); // Re-run effect when searchParams change

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchTerm(term);
        debouncedSearch(term);
    };

    // --- Data Mapping --- 
    const mappedListings: ListingCardData[] = listings.map(apiListing => ({
      id: apiListing.id,
      title: apiListing.title,
      description: apiListing.description,
      approximate_min_price: null,
      approximate_max_price: null,
      image_url: apiListing.image_url,
      status: apiListing.status,
      category: apiListing.material?.name,
      location: apiListing.location,
      created_at: apiListing.created_at,
      user: { 
        name: apiListing.seller.name ?? undefined,
        id: apiListing.seller.id
      },
      // Add enhanced seller fields
      seller: {
        id: apiListing.seller.id,
        name: apiListing.seller.name,
        rating: apiListing.seller.rating,
        reviewCount: apiListing.seller.reviewCount,
        joinedSince: apiListing.seller.memberSince ? new Date(apiListing.seller.memberSince, 0, 1) : undefined,
        totalListings: apiListing.seller.totalActiveListings
      }
    }));

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"> {/* Reduced bottom margin */}
                <h1 className="text-3xl font-bold tracking-tight">Marktplatz</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Suche nach Titel..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            className="pl-10"
                        />
                    </div>
                     {/* New Listing Button */}
                    <Link href="/marketplace/new">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Neues Angebot
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter Controls */}
            <MarketplaceFilters /> 

            {/* Listings Grid & Error/Loading States */} 
            {error && <p className="text-center text-destructive">Fehler: {error}</p>}
            {isLoading ? (
                <ListingGridSkeleton />
            ) : mappedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {mappedListings.map((listing) => (
                        <ListingCard 
                            key={listing.id} 
                            listing={listing} 
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-10">Keine Angebote gefunden{searchParams.toString() ? ' für die aktuellen Filter.' : '.'}</p>
            )}

            {/* Pagination */} 
            <div className="mt-12 flex justify-center">
                {pagination && pagination.totalPages > 1 && (
                    <PaginationControls 
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        baseUrl="/marketplace" // Base path for pagination links
                    />
                )}
            </div>
        </div>
    );
}

// --- Main Page Component (uses Suspense) --- 
export default function MarketplacePage() {
    return (
        <Suspense fallback={<ListingGridSkeleton />}>
            <MarketplaceClientContent />
        </Suspense>
    );
} 