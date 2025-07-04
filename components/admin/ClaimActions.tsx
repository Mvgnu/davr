'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface ClaimActionsProps {
  claimId: string;
  status: string;
}

export default function ClaimActions({ claimId, status }: ClaimActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (type: 'approve' | 'reject') => {
    setActionType(type);
    startTransition(async () => {
      const endpoint = `/api/admin/recycling-centers/claims/${claimId}/${type}`;
      try {
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to ${type} claim`);
        }

        toast.success(`Claim successfully ${type}d.`);
        router.refresh(); // Refresh the page data

      } catch (error) {
        console.error(`Error ${type}ing claim:`, error);
        toast.error(error instanceof Error ? error.message : `Could not ${type} claim.`);
      } finally {
          setActionType(null); // Reset action type after completion/error
      }
    });
  };

  if (status !== 'pending') {
    return null; // Only show actions for pending claims
  }

  return (
    <div className="flex space-x-2">
       {/* Approve Button */} 
       <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
                size="sm" 
                variant="ghost" 
                className="text-green-600 hover:bg-green-100" 
                disabled={isPending}
            >
                {isPending && actionType === 'approve' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Check className="h-4 w-4 mr-1" />
                 )}
                 Approve
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this recycling center claim ({claimId.substring(0,8)}...)?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleAction('approve')} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                 {isPending && actionType === 'approve' ? 'Processing...' : 'Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       {/* Reject Button */} 
       <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-600 hover:bg-red-100" 
                disabled={isPending}
            >
                {isPending && actionType === 'reject' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <X className="h-4 w-4 mr-1" />
                 )}
                 Reject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this recycling center claim ({claimId.substring(0,8)}...)? 
                You may need to provide a reason separately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleAction('reject')} disabled={isPending} className="bg-red-600 hover:bg-red-700">
                 {isPending && actionType === 'reject' ? 'Processing...' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
} 