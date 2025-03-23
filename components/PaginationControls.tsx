'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange?: (page: number) => void;
}

export default function PaginationControls({
  totalPages,
  currentPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a new URLSearchParams object to manipulate
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    
    // Convert the ReadonlyURLSearchParams to regular URLSearchParams
    searchParams?.forEach((value, key) => {
      params.set(key, value);
    });
    
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Function to handle page changes
  const handlePageChange = (pageNumber: number) => {
    // Call the onPageChange prop if provided
    if (onPageChange) {
      onPageChange(pageNumber);
    } else {
      // Otherwise, use the router to navigate
      router.push(createPageUrl(pageNumber));
    }
  };

  // Generate the page numbers to display
  const pageNumbers = () => {
    // Always show first and last page
    const numbers: number[] = [1, totalPages];
    
    // Add current page and one page before and after
    const current = currentPage;
    for (let i = current - 1; i <= current + 1; i++) {
      if (i > 1 && i < totalPages) {
        numbers.push(i);
      }
    }
    
    // Sort and remove duplicates
    return Array.from(new Set(numbers)).sort((a, b) => a - b);
  };

  // Helper to check if we need to add ellipsis
  const needsEllipsisBefore = (pageNumbers: number[]) => {
    return pageNumbers.includes(1) && pageNumbers.includes(3) && !pageNumbers.includes(2);
  };

  const needsEllipsisAfter = (pageNumbers: number[]) => {
    return pageNumbers.includes(totalPages) && 
           pageNumbers.includes(totalPages - 2) && 
           !pageNumbers.includes(totalPages - 1);
  };

  const pages = pageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevPage}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </Button>
      
      <div className="flex items-center space-x-1">
        {pages.map((page, index) => {
          // Check if we need to add ellipsis
          if (index > 0 && pages[index] - pages[index - 1] > 1) {
            return (
              <div key={`${page}-group`} className="flex items-center space-x-1">
                <span className="px-1">...</span>
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[2rem]"
                >
                  {page}
                </Button>
              </div>
            );
          }
          
          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className="min-w-[2rem]"
            >
              {page}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
} 