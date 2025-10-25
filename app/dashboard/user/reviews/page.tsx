'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Star, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Center {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  image_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
  center: Center;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/dashboard/user/reviews');
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load reviews',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-1">
          Reviews you've written for recycling centers
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="You haven't written any reviews yet. Visit recycling centers and share your experience!"
          action={{
            label: 'Find Recycling Centers',
            href: '/recycling-centers',
          }}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {review.center.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={review.center.image_url}
                        alt={review.center.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          href={`/recycling-centers/${review.center.slug}`}
                          className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
                        >
                          {review.center.name}
                        </Link>
                        {review.center.city && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {review.center.city}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
