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
import { Loader2, UserMinus, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RemoveOwnerDialogProps {
  centerId: string;
  centerName: string;
  currentOwnerName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOwnerRemoved: () => void;
}

export default function RemoveOwnerDialog({ 
  centerId, 
  centerName, 
  currentOwnerName, 
  isOpen, 
  onOpenChange,
  onOwnerRemoved 
}: RemoveOwnerDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveOwner = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/dashboard/admin/centers/remove-owner?centerId=${centerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Owner removed successfully');
        onOwnerRemoved();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to remove owner');
      }
    } catch (error) {
      toast.error('Failed to remove owner');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-destructive" />
            Remove Center Owner
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              You are about to remove the owner from center <span className="font-semibold">{centerName}</span>.
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <UserCheck className="h-4 w-4" />
              <div>
                <div className="text-sm font-medium">
                  Current Owner: {currentOwnerName}
                </div>
              </div>
            </div>
            <p>
              Once removed, the previous owner will lose administrative privileges for this center.
              Are you sure you want to proceed?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleRemoveOwner} 
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Confirm Removal
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}