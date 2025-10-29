'use client';

import { useState } from 'react';
import { CheckCircle, FileSignature } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NegotiationSnapshot } from '@/types/negotiations';

interface NegotiationContractCardProps {
  negotiation: NegotiationSnapshot | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
  onSignContract: (intent: 'BUYER' | 'SELLER' | 'ADMIN') => Promise<unknown>;
  currentUserId?: string | null;
  disabled?: boolean;
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PENDING_SIGNATURES: 'Wartet auf Signaturen',
  SIGNED: 'Unterzeichnet',
  REJECTED: 'Abgelehnt',
  VOID: 'Ungültig',
};

export function NegotiationContractCard({
  negotiation,
  role,
  onSignContract,
  currentUserId,
  disabled,
}: NegotiationContractCardProps) {
  const contract = negotiation?.contract;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTerminal = negotiation ? ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(negotiation.status) : false;

  if (!contract) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vertragsstatus</CardTitle>
          <CardDescription>Vertrag wird nach Annahme erzeugt.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const buyerSigned = Boolean(contract.buyerSignedAt);
  const sellerSigned = Boolean(contract.sellerSignedAt);
  const waitingForBuyer = !buyerSigned;
  const waitingForSeller = !sellerSigned;

  const canSign = !disabled && !isSubmitting && !isTerminal && role && role !== 'ADMIN';
  const requiresSignature =
    (role === 'BUYER' && waitingForBuyer) || (role === 'SELLER' && waitingForSeller);

  const badgeLabel = CONTRACT_STATUS_LABELS[contract.status] ?? contract.status;

  const handleSign = async () => {
    if (!role || !canSign || !currentUserId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSignContract(role);
    } catch (error) {
      console.error('Failed to sign contract', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Vertragsstatus</CardTitle>
          <CardDescription>Status der Unterzeichnungen und des Entwurfs.</CardDescription>
        </div>
        <Badge variant={contract.status === 'SIGNED' ? 'default' : 'secondary'}>{badgeLabel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span>Käufer</span>
          <span className="flex items-center gap-2">
            {buyerSigned ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <FileSignature className="h-4 w-4 text-muted-foreground" />}
            {buyerSigned ? 'Unterzeichnet' : 'Ausstehend'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Verkäufer</span>
          <span className="flex items-center gap-2">
            {sellerSigned ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <FileSignature className="h-4 w-4 text-muted-foreground" />}
            {sellerSigned ? 'Unterzeichnet' : 'Ausstehend'}
          </span>
        </div>
        {contract.draftTerms ? (
          <div>
            <p className="text-xs text-muted-foreground">Notizen zum Entwurf</p>
            <p className="text-sm whitespace-pre-wrap border border-muted rounded-md p-3 mt-1">
              {contract.draftTerms}
            </p>
          </div>
        ) : null}
        {requiresSignature ? (
          <Button className="w-full" onClick={handleSign} disabled={!canSign}>
            <FileSignature className="mr-2 h-4 w-4" />
            Vertrag unterschreiben
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {waitingForBuyer || waitingForSeller
              ? 'Vertrag wartet auf Unterschriften der Parteien.'
              : 'Alle Signaturen liegen vor.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
