import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number | null | undefined;
  totalStars?: number;
  size?: number; // Size of the stars in pixels
  className?: string;
  starClassName?: string; // Class for individual stars
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 16, // Default size 16px (h-4 w-4)
  className,
  starClassName
}) => {
  const fullStars = Math.floor(rating ?? 0);
  const hasHalfStar = (rating ?? 0) % 1 >= 0.5; // Simple half-star logic
  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

  // Ensure rating doesn't exceed totalStars
  const clampedRating = Math.min(Math.max(rating ?? 0, 0), totalStars);

  if (rating === null || rating === undefined) {
    return <span className={cn("text-xs text-muted-foreground italic", className)}>No rating</span>; 
  }

  return (
    <div className={cn("flex items-center space-x-0.5", className)} aria-label={`Rating: ${clampedRating.toFixed(1)} out of ${totalStars} stars`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star 
          key={`full-${i}`} 
          className={cn("text-yellow-400", starClassName)}
          fill="currentColor" 
          style={{ width: size, height: size }}
        />
      ))}
      {hasHalfStar && (
         // Basic half-star representation (could use a dedicated half-star icon)
         <Star 
            key="half" 
            className={cn("text-yellow-400 opacity-60", starClassName)} 
            fill="currentColor" 
            style={{ width: size, height: size }}
          />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          className={cn("text-muted-foreground opacity-50", starClassName)}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
};

export default StarRating;
