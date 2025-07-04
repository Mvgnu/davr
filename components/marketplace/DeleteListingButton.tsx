'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteListingButtonProps {
  listingId: string;
}

export default function DeleteListingButton({ listingId }: DeleteListingButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to delete listing.';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      // Deletion successful
      toast({
        title: "Success",
        description: "Listing successfully deleted.",
      });
      setIsOpen(false);
      // Redirect to marketplace or refresh the current page if applicable
      router.push('/marketplace');
      router.refresh(); // Refresh server components data

    } catch (error: any) {
      console.error("Delete listing error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not delete the listing.",
      });
    } finally {
      setIsDeleting(false);
      // Keep dialog open on error? Or close? Closing for now.
      // setIsOpen(false); 
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
           {isDeleting ? (
               <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
           ) : (
               <Trash2 className="mr-1.5 h-4 w-4" />
           )}
           Löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Das Angebot wird dauerhaft gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isDeleting ? 'Löschen...' : 'Endgültig löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 