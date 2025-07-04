import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface ServerPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // Base URL for the links (e.g., '/admin/blog')
}

// --- Pagination Generation Logic --- 
const DOTS = '...';

/**
 * Generates an array of page numbers and ellipsis for pagination display.
 * @param currentPage The current active page (1-based).
 * @param totalPages The total number of pages.
 * @param siblingCount Number of page buttons to show on each side of the current page.
 * @returns Array of page numbers and DOTS string.
 */
const generatePaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1 // Show 1 page number before and after current
): (number | string)[] => {
  // Calculate total number of buttons to display
  // (first + last + current + 2*siblings + 2*DOTS)
  const totalNumbers = siblingCount * 2 + 3; 
  const totalSlots = totalNumbers + 2; // Add slots for potential DOTS

  // Case 1: If total pages are less than the numbers we want to show
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  // Determine if left/right DOTS should be shown
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  // Case 2: No left dots, but right dots needed
  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, lastPageIndex];
  }

  // Case 3: No right dots, but left dots needed
  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from({ length: rightItemCount }, (_, i) => lastPageIndex - rightItemCount + i + 1);
    return [firstPageIndex, DOTS, ...rightRange];
  }

  // Case 4: Both left and right dots needed
  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  // Default case (should not happen if logic is correct, but good fallback)
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// --- Component --- 

export function ServerPaginationControls({
  currentPage,
  totalPages,
  baseUrl,
}: ServerPaginationControlsProps) {
  if (totalPages <= 1) {
    return null; // Don't render controls if only one page
  }

  const createPageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  const paginationItems = generatePaginationItems(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon" // Changed size to icon for smaller screens
        disabled={currentPage === 1}
        asChild
      >
        <Link 
          href={createPageUrl(currentPage - 1)} 
          aria-label="Go to previous page"
          aria-disabled={currentPage === 1} 
          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          scroll={false}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Page Number Buttons and Ellipsis */}
      {paginationItems.map((item, index) => {
        if (typeof item === 'string' && item === DOTS) {
          return (
            <span key={`${item}-${index}`} className="flex h-9 w-9 items-center justify-center px-0 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </span>
          );
        }

        if (typeof item === 'number') {
          return (
            <Button
              key={item}
              variant={item === currentPage ? 'default' : 'outline'}
              size="icon" // Changed size to icon
              asChild
            >
              <Link 
                href={createPageUrl(item)}
                aria-label={`Go to page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                scroll={false}
              >
                {item}
              </Link>
            </Button>
          );
        }
        return null; // Should not happen
      })}

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon" // Changed size to icon
        disabled={currentPage === totalPages}
        asChild
      >
        <Link 
          href={createPageUrl(currentPage + 1)} 
          aria-label="Go to next page"
          aria-disabled={currentPage === totalPages} 
          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          scroll={false}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
} 