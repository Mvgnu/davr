'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ListingForm } from '@/components/dashboard/user/ListingForm';
import { LoadingState } from '@/components/shared/LoadingState';
import { useToast } from '@/components/ui/use-toast';

export default function EditListingPage() {
  const params = useParams();
  const { toast } = useToast();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, []);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/dashboard/user/listings/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setListing(data.listing);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load listing',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load listing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Listing not found</p>
      </div>
    );
  }

  return (
    <ListingForm
      listingId={listing.id}
      initialData={{
        title: listing.title,
        description: listing.description,
        material_id: listing.material_id,
        quantity: listing.quantity,
        unit: listing.unit,
        location: listing.location,
        image_url: listing.image_url,
        type: listing.type,
      }}
    />
  );
}
