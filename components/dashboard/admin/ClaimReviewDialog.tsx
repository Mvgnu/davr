'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClaimReviewDialogProps {
  claim: {
    id: string;
    name: string;
    email: string;
    message: string;
    recyclingCenter: {
      name: string;
    };
    user: {
      id: string;
    } | null;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewComplete: () => void;
}

export default function ClaimReviewDialog({
  claim,
  isOpen,
  onOpenChange,
  onReviewComplete,
}: ClaimReviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_more_info' | null>(null);
  const [accountDetails, setAccountDetails] = useState<{
    email: string;
    temporaryPassword: string;
    accountCreated: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (action: 'approve' | 'reject' | 'request_more_info') => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a response message');
      return;
    }

    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    setSelectedAction(action);

    try {
      const response = await fetch(`/api/admin/claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminResponse: adminResponse.trim(),
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to review claim');
      }

      if (result.accountDetails) {
        setAccountDetails(result.accountDetails);
      } else {
        toast.success(`Claim ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'} successfully`);
        onReviewComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to review claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleClose = () => {
    if (accountDetails) {
      onReviewComplete();
    }
    setAdminResponse('');
    setRejectionReason('');
    setAccountDetails(null);
    setSelectedAction(null);
    onOpenChange(false);
  };

  if (accountDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Claim Approved Successfully
            </DialogTitle>
            <DialogDescription>
              A new account has been created for the claimant. Please save these credentials securely.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These credentials will be sent to the user via email. Make sure to copy them now.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {accountDetails.email}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(accountDetails.email)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Temporary Password</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {accountDetails.temporaryPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(accountDetails.temporaryPassword)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The user should change this password after their first login
              </p>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                The center "{claim.recyclingCenter.name}" has been assigned to {claim.name} and verification status updated.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Claim</DialogTitle>
          <DialogDescription>
            Review the ownership claim for "{claim.recyclingCenter.name}" by {claim.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium mb-1">Claimant's Message:</p>
            <p className="text-sm text-muted-foreground">{claim.message}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminResponse">Your Response *</Label>
            <Textarea
              id="adminResponse"
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={4}
              placeholder="Provide feedback or explain your decision..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent to the claimant via email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Optional: Provide specific reasons for rejection..."
              disabled={isSubmitting}
            />
          </div>

          {!claim.user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This user does not have an account. If approved, a new account will be created automatically with role CENTER_OWNER.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('request_more_info')}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && selectedAction === 'request_more_info' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <AlertCircle className="mr-2 h-4 w-4" />
              Request More Info
            </Button>
          </div>
          <div className="flex gap-2 flex-1">
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleSubmit('reject')}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && selectedAction === 'reject' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('approve')}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && selectedAction === 'approve' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
