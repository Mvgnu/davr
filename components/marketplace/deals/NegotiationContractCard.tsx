'use client';

import { useState } from 'react';
import { CheckCircle, ExternalLink, FileSignature } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  const participantStates = contract.participantStates ?? {};
  const buyerSignedAt = participantStates.BUYER?.signedAt ?? contract.buyerSignedAt ?? null;
  const sellerSignedAt = participantStates.SELLER?.signedAt ?? contract.sellerSignedAt ?? null;
  const buyerSigned = participantStates.BUYER?.status === 'SIGNED' || Boolean(contract.buyerSignedAt);
  const sellerSigned = participantStates.SELLER?.status === 'SIGNED' || Boolean(contract.sellerSignedAt);
  const waitingForBuyer = !buyerSigned;
  const waitingForSeller = !sellerSigned;

  const canSign = !disabled && !isSubmitting && !isTerminal && role && role !== 'ADMIN';
  const requiresSignature =
    (role === 'BUYER' && waitingForBuyer) || (role === 'SELLER' && waitingForSeller);

  const badgeLabel = CONTRACT_STATUS_LABELS[contract.status] ?? contract.status;
  const documentUrl = contract.documentUrl ?? contract.documents?.[0]?.url ?? null;
  const envelopeStatus = contract.envelopeStatus ?? contract.status;
  const envelopeBadgeVariant = envelopeStatus === 'COMPLETED' ? 'default' : envelopeStatus === 'FAILED' ? 'destructive' : 'secondary';

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
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Vertragsstatus</CardTitle>
          <CardDescription>Status der Unterzeichnungen und des Entwurfs.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={envelopeBadgeVariant}>{envelopeStatus}</Badge>
          <Badge variant={contract.status === 'SIGNED' ? 'default' : 'secondary'}>{badgeLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {contract.lastError ? (
          <Alert variant="destructive">
            <AlertTitle>Signaturdienst meldet Fehler</AlertTitle>
            <AlertDescription>{contract.lastError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center justify-between">
          <span>Käufer</span>
          <span className="flex items-center gap-2">
            {buyerSigned ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <FileSignature className="h-4 w-4 text-muted-foreground" />}
            {buyerSigned
              ? `Unterzeichnet${buyerSignedAt ? ` (${new Date(buyerSignedAt).toLocaleString()})` : ''}`
              : 'Ausstehend'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Verkäufer</span>
          <span className="flex items-center gap-2">
            {sellerSigned ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <FileSignature className="h-4 w-4 text-muted-foreground" />}
            {sellerSigned
              ? `Unterzeichnet${sellerSignedAt ? ` (${new Date(sellerSignedAt).toLocaleString()})` : ''}`
              : 'Ausstehend'}
          </span>
        </div>
        {documentUrl ? (
          <Button asChild variant="outline" className="w-full">
            <a href={documentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" /> Dokument öffnen
            </a>
          </Button>
        ) : null}
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
        {contract.documents && contract.documents.length ? (
          <div className="space-y-2 rounded-md border border-muted p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dokumentenverlauf</p>
            <ul className="space-y-1 text-xs">
              {contract.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between">
                  <span>
                    {doc.status} · {doc.provider ?? 'mock-esign'}
                  </span>
                  <span className="text-muted-foreground">
                    {doc.completedAt
                      ? new Date(doc.completedAt).toLocaleDateString()
                      : doc.issuedAt
                      ? new Date(doc.issuedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
