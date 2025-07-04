import { Suspense } from 'react';
import SearchPageContent from '@/components/search/SearchPageContent';
import LoadingSpinner from '@/components/LoadingSpinner'; // Assuming a spinner exists for fallback

export default function SearchPage() {
  return (
    <Suspense 
      fallback={
        <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
} 