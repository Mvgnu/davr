'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Plus,
  ShoppingBag,
  Edit,
  Trash2,
  Eye,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Material {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  image_url: string | null;
  type: 'BUY' | 'SELL';
  status: string;
  created_at: Date;
  updated_at: Date;
  material: Material | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'FLAGGED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(
        `/api/dashboard/user/listings?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setListings(data.listings);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load listings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load listings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/dashboard/user/listings/${deleteId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Listing deleted successfully',
        });
        setListings(listings.filter((l) => l.id !== deleteId));
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete listing',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600 mt-1">
            Manage your marketplace listings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/user/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No listings found"
          description={
            statusFilter === 'all'
              ? 'Create your first marketplace listing to get started'
              : `No listings with status: ${statusFilter}`
          }
          action={{
            label: 'Create Listing',
            href: '/dashboard/user/listings/new',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={getStatusColor(listing.status)}>
                    {listing.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {listing.type.toLowerCase()}
                  </Badge>
                </div>

                {listing.image_url && (
                  <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {listing.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Package className="h-4 w-4 mr-1" />
                    {listing.material?.name || 'No material'}
                  </div>

                  {listing.quantity && (
                    <p className="text-sm text-gray-500">
                      Quantity: {listing.quantity} {listing.unit || 'units'}
                    </p>
                  )}

                  {listing.location && (
                    <p className="text-sm text-gray-500">📍 {listing.location}</p>
                  )}

                  <p className="text-xs text-gray-400">
                    Created {format(new Date(listing.created_at), 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/marketplace/${listing.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/dashboard/user/listings/${listing.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(listing.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
