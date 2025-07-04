'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminRecyclingCenterActionsCellProps {
  centerId: string;
  centerName: string;
}

export default function AdminRecyclingCenterActionsCell({ centerId, centerName }: AdminRecyclingCenterActionsCellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog visibility

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/recycling-centers/${centerId}`, {
          method: 'DELETE',
        });

        if (response.status === 404) {
            throw new Error("Recycling Center not found. It might have already been deleted.");
        }
        if (!response.ok && response.status !== 204) { // 204 is success with no content
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete center (${response.status})`);
        }

        toast.success(`Recycling Center "${centerName}" deleted successfully.`);
        setIsDialogOpen(false); // Close dialog on success
        
        // Refresh server-side props to update the list
        router.refresh();

      } catch (error) {
        console.error("Error deleting recycling center:", error);
        toast.error(error instanceof Error ? error.message : 'Could not delete center.');
        // Keep dialog open on error for user to retry or cancel
      }
    });
  };

  return (
    <div className="flex space-x-2">
      {/* Edit Button */}
      <Button asChild variant="outline" size="sm" aria-label={`Edit recycling center ${centerName}`}>
        <Link href={`/admin/recycling-centers/${centerId}/edit`}>
          <Pencil className="w-4 h-4" />
        </Link>
      </Button>

      {/* Delete Button with Confirmation */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
              variant="destructive"
              size="sm"
              disabled={isPending}
              aria-label={`Delete recycling center ${centerName}`}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the Recycling Center 
              <span className="font-medium">"{centerName}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete Center'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 