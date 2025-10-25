'use client';

import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeleteCenterDialogProps {
  centerId: string;
  centerName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (centerId: string) => void;
}

export default function DeleteCenterDialog({ 
  centerId, 
  centerName, 
  isOpen, 
  onOpenChange,
  onDelete 
}: DeleteCenterDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/admin/recycling-centers?id=${centerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Recycling center deleted successfully');
        onDelete(centerId);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete recycling center');
      }
    } catch (error) {
      toast.error('Failed to delete recycling center');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Recycling Center
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              Are you sure you want to delete the recycling center{' '}
              <span className="font-semibold">{centerName}</span>? This action cannot be undone.
            </div>
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm text-destructive">
                  All associated data including offers, claims, and reviews will be permanently deleted.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Center
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}