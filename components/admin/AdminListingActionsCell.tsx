'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Pencil, Check, X, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminListingActionsCellProps {
  listingId: string;
  listingTitle: string;
  status?: string;
}

export default function AdminListingActionsCell({ listingId, listingTitle }: AdminListingActionsCellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog visibility
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false); // Control block dialog visibility

  const handleUpdateStatus = async (newStatus: string) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/marketplace/listings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            status: newStatus
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update listing status (${response.status})`);
        }

        const result = await response.json();
        toast.success(`Listing "${listingTitle}" status updated to ${newStatus}.`);
        
        // Refresh server-side props to update the list
        router.refresh();

      } catch (error) {
        console.error("Error updating listing status:", error);
        toast.error(error instanceof Error ? error.message : 'Could not update listing status.');
      }
    });
  };

  const handleDelete = async (blockUser: boolean = false) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/marketplace/listings/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blockUser
          }),
        });

        if (response.status === 404) {
            throw new Error("Listing not found. It might have already been deleted.");
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete listing (${response.status})`);
        }

        const result = await response.json();
        toast.success(result.message);
        setIsDialogOpen(false); // Close dialog on success
        setIsBlockDialogOpen(false); // Close block dialog on success
        
        // Refresh server-side props to update the list
        router.refresh();

      } catch (error) {
        console.error("Error deleting listing:", error);
        toast.error(error instanceof Error ? error.message : 'Could not delete listing.');
        // Keep dialog open on error for user to retry or cancel
      }
    });
  };

  return (
    <div className="flex space-x-2">
      {/* Edit Button */}
      <Button asChild variant="outline" size="sm" aria-label={`Edit listing ${listingTitle}`}>
        <Link href={`/admin/listings/${listingId}/edit`}>
          <Pencil className="w-4 h-4" />
        </Link>
      </Button>

      {/* Approve Button for Pending Listings */}
      {status === 'PENDING' && (
        <Button 
          variant="default" 
          size="sm" 
          disabled={isPending}
          onClick={() => handleUpdateStatus('ACTIVE')}
          aria-label={`Approve listing ${listingTitle}`}
        >
          <Check className="w-4 h-4" />
        </Button>
      )}

      {/* Reject Button for Pending Listings */}
      {status === 'PENDING' && (
        <Button 
          variant="destructive" 
          size="sm" 
          disabled={isPending}
          onClick={() => handleUpdateStatus('REJECTED')}
          aria-label={`Reject listing ${listingTitle}`}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Delete Button with Confirmation */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
              variant="destructive"
              size="sm"
              disabled={isPending}
              aria-label={`Delete listing ${listingTitle}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the listing 
              <span className="font-medium">"{listingTitle}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete(false)} 
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete Listing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete + Block User Button with Confirmation */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
              variant="outline"
              size="sm"
              disabled={isPending}
              aria-label={`Delete listing ${listingTitle} and block user`}
          >
            <Ban className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion and Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the listing 
              <span className="font-medium">"{listingTitle}"</span> and block the user? 
              This will prevent the user from creating new listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete(true)} 
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Processing...' : 'Delete & Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 