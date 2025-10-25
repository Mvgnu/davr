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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VerifyCenterDialogProps {
  centerId: string;
  centerName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'VERIFIED' | 'REJECTED';
  onVerificationComplete: () => void;
}

export default function VerifyCenterDialog({ 
  centerId, 
  centerName, 
  isOpen, 
  onOpenChange,
  action,
  onVerificationComplete
}: VerifyCenterDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerify = async () => {
    if (action === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting this center');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/dashboard/admin/centers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centerId,
          action,
          reason: action === 'REJECTED' ? rejectionReason : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Center ${action === 'VERIFIED' ? 'verified' : 'rejected'} successfully`);
        onVerificationComplete();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update verification status');
      }
    } catch (error) {
      toast.error('Failed to update verification status');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setRejectionReason('');
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {action === 'VERIFIED' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Verify Recycling Center
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Reject Recycling Center
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'VERIFIED' ? (
              <div className="space-y-2">
                <p>
                  You are about to verify the recycling center <span className="font-semibold">{centerName}</span>.
                </p>
                <p>
                  Once verified, this center will be publicly visible and can receive claims from users.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  You are about to reject the recycling center <span className="font-semibold">{centerName}</span>.
                </p>
                <div>
                  <Label htmlFor="rejection-reason" className="text-left">
                    Reason for Rejection *
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Provide a reason for rejecting this recycling center..."
                    className="mt-1"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">
                    The center owner will be notified of this decision and can resubmit their application.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant={action === 'VERIFIED' ? 'default' : 'destructive'} 
              onClick={handleVerify}
              disabled={isProcessing || (action === 'REJECTED' && !rejectionReason.trim())}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : action === 'VERIFIED' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Center
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Center
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}