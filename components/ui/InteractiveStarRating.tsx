'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveStarRatingProps {
  totalStars?: number;
  currentRating?: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  className?: string;
  starClassName?: string;
  disabled?: boolean;
}

const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({
  totalStars = 5,
  currentRating = 0,
  onRatingChange,
  size = 24, // Default larger size for interaction
  className,
  starClassName,
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleMouseOver = (index: number) => {
    if (!disabled) {
        setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
     if (!disabled) {
        setHoverRating(0);
     }
  };

  const handleClick = (index: number) => {
     if (!disabled) {
        onRatingChange(index + 1);
     }
  };

  return (
    <div className={cn("flex items-center space-x-1", disabled && "cursor-not-allowed opacity-70", className)}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || currentRating);
        
        return (
          <button
            type="button"
            key={starValue}
            onClick={() => handleClick(index)}
            onMouseOver={() => handleMouseOver(index)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
                "p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-ring ring-offset-1", 
                !disabled && "hover:scale-110 transition-transform duration-150",
                starClassName
             )}
             aria-label={`Rate ${starValue} out of ${totalStars} stars`}
          >
            <Star 
              className={cn(
                isFilled ? "text-yellow-400" : "text-muted-foreground opacity-50",
                !disabled && isFilled && "hover:text-yellow-500", 
                !disabled && !isFilled && "hover:text-muted-foreground hover:opacity-70"
              )}
              fill={isFilled ? "currentColor" : "none"} 
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default InteractiveStarRating; 