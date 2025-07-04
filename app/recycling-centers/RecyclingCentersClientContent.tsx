'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Frown, Search } from 'lucide-react';
import RecyclingCenterCard from '@/components/recycling/RecyclingCenterCard';
import CenterFilters from '@/components/recycling/CenterFilters';
import PaginationControls from '@/components/ui/PaginationControls';

// Type for center data received as props
// Should match CenterForClient type in page.tsx
type Center = {
  id: string;
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  slug?: string | null;
  website?: string | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | null;
};

// Props for the client component
interface ClientContentProps {
  initialCenters: Center[];
  initialTotalCenters: number;
  initialCurrentPage: number;
  initialLimit: number;
  initialError: string | null;
  searchParams: { [key: string]: string | string[] | undefined }; // Needed by PaginationControls (internally)
}

// Wrapper for filters remains the same conceptually
const FiltersWrapper = React.memo(() => {
  return <CenterFilters />;
});
FiltersWrapper.displayName = 'FiltersWrapper';

// The Main Client Component
export default function RecyclingCentersClientContent({
  initialCenters,
  initialTotalCenters,
  initialCurrentPage,
  initialLimit,
  initialError,
  searchParams // Receive searchParams
}: ClientContentProps) {

  // State initialized from props
  // Note: We might not need state for centers/total if page reloads handle updates
  // But keeping it allows for potential future client-side updates without full reload.
  const [centers, setCenters] = React.useState<Center[]>(initialCenters);
  const [totalCenters, setTotalCenters] = React.useState(initialTotalCenters);
  const [currentPage, setCurrentPage] = React.useState(initialCurrentPage);
  const [limit, setLimit] = React.useState(initialLimit);
  const [fetchError, setFetchError] = React.useState<string | null>(initialError);
  // We might not need a separate loading state if initial load is handled by Server Component
  // const [isLoading, setIsLoading] = React.useState(false); 

  // Update state if initial props change (e.g., due to navigation)
  // This might be redundant if Next.js re-renders the component fully on searchParam change
  React.useEffect(() => {
    setCenters(initialCenters);
    setTotalCenters(initialTotalCenters);
    setCurrentPage(initialCurrentPage);
    setLimit(initialLimit);
    setFetchError(initialError);
  }, [initialCenters, initialTotalCenters, initialCurrentPage, initialLimit, initialError]);

  const totalPages = Math.ceil(totalCenters / limit);

  // No loading state needed here as Server Component handles initial load
  const isLoading = false; 

  return (
    <div className="container mx-auto px-4 py-12 text-foreground">
       <h1 
         className="text-3xl md:text-4xl font-bold mb-8 pb-4 border-b border-border/60 animate-fade-in-up opacity-0 [--animation-delay:100ms]"
         style={{ animationFillMode: 'forwards' }}
       >
         Recyclinghöfe finden
       </h1>

      <FiltersWrapper />

      <div className="mt-10">
        {isLoading ? ( // Keep structure, but isLoading is currently false
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Array.from({ length: limit }).map((_, index) => (
                     <div key={index} className="bg-card border border-border/60 rounded-lg shadow-sm h-64 animate-pulse"></div>
                 ))}
            </div>
        ) : fetchError ? (
          <div className="text-center py-16 text-destructive">
            <Frown className="w-16 h-16 mx-auto mb-4" />
            <h2 className="mb-2 text-xl font-semibold">Fehler beim Laden</h2>
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
        ) : centers.length === 0 ? (
          <div 
            className="text-center py-20 animate-fade-in-up opacity-0"
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <Search className="mx-auto h-16 w-16 text-muted-foreground/40 mb-5" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Keine Recyclinghöfe gefunden</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Ihre Suche oder Filterkriterien ergaben keine Treffer. Bitte passen Sie Ihre Filter an.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centers.map((center, index) => (
               <div 
                key={center.id} 
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${100 + index * 50}ms`, animationFillMode: 'forwards' }}
              >
                 <RecyclingCenterCard center={center} /> 
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination - Now receives searchParams */} 
      {!isLoading && !fetchError && totalPages > 1 && (
        <div className="mt-10">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/recycling-centers"
            // No longer need to pass searchParams here, assuming internal hook usage
          />
        </div>
      )}
    </div>
  );
} 