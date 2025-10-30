'use client';

// meta: feature=contract-redline owner=platform stage=alpha

import { useMemo, useState } from 'react';
import { CheckCircle, ExternalLink, FileSignature, FileText, MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { NegotiationSnapshot, ContractRevisionSnapshot } from '@/types/negotiations';
type RevisionStatus = 'DRAFT' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';

interface NegotiationContractCardProps {
  negotiation: NegotiationSnapshot | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
  onSignContract: (intent: 'BUYER' | 'SELLER' | 'ADMIN') => Promise<unknown>;
  currentUserId?: string | null;
  disabled?: boolean;
  onRefresh?: () => Promise<unknown> | void;
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PENDING_SIGNATURES: 'Wartet auf Signaturen',
  SIGNED: 'Unterzeichnet',
  REJECTED: 'Abgelehnt',
  VOID: 'Ungültig',
};

const REVISION_STATUS_VARIANTS: Record<RevisionStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  IN_REVIEW: 'outline',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
};

export function NegotiationContractCard({
  negotiation,
  role,
  onSignContract,
  currentUserId,
  disabled,
  onRefresh,
}: NegotiationContractCardProps) {
  const contract = negotiation?.contract;
  const [isSubmittingSignature, setSubmittingSignature] = useState(false);
  const [isSubmittingRevision, setSubmittingRevision] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionBody, setRevisionBody] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentMime, setAttachmentMime] = useState('application/pdf');
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [pendingRevisionId, setPendingRevisionId] = useState<string | null>(null);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);

  const revisions = negotiation?.contractRevisions ?? [];
  const isTerminal = negotiation ? ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(negotiation.status) : false;
  const canSign = !disabled && !isSubmittingSignature && !isTerminal && role && role !== 'ADMIN';
  const requiresSignature = useMemo(() => {
    if (!contract || !role) {
      return false;
    }

    const participantStates = contract.participantStates ?? {};
    const buyerSigned = participantStates.BUYER?.status === 'SIGNED' || Boolean(contract.buyerSignedAt);
    const sellerSigned = participantStates.SELLER?.status === 'SIGNED' || Boolean(contract.sellerSignedAt);

    return (role === 'BUYER' && !buyerSigned) || (role === 'SELLER' && !sellerSigned);
  }, [contract, role]);

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
  const badgeLabel = CONTRACT_STATUS_LABELS[contract.status] ?? contract.status;
  const documentUrl = contract.documentUrl ?? contract.documents?.[0]?.url ?? null;
  const envelopeStatus = contract.envelopeStatus ?? contract.status;
  const envelopeBadgeVariant = envelopeStatus === 'COMPLETED' ? 'default' : envelopeStatus === 'FAILED' ? 'destructive' : 'secondary';
  const latestRevision = revisions.at(0) ?? null;
  const canCollaborate = Boolean(role && role !== 'ADMIN' && !isTerminal);

  const handleSign = async () => {
    if (!role || !canSign || !currentUserId) {
      return;
    }

    setSubmittingSignature(true);
    try {
      await onSignContract(role);
      await onRefresh?.();
    } catch (error) {
      console.error('Failed to sign contract', error);
    } finally {
      setSubmittingSignature(false);
    }
  };

  const buildAttachmentPayload = () => {
    if (!attachmentUrl) {
      return undefined;
    }

    return [
      {
        id: undefined,
        name: attachmentName || 'Anhang',
        url: attachmentUrl,
        mimeType: attachmentMime,
      },
    ];
  };

  const handleCreateRevision = async () => {
    if (!negotiation?.id || !revisionBody.trim()) {
      setRevisionError('Bitte beschreiben Sie die gewünschten Änderungen.');
      return;
    }

    setRevisionError(null);
    setSubmittingRevision(true);
    try {
      const response = await fetch(`/api/marketplace/deals/${negotiation.id}/contracts/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          summary: revisionSummary || undefined,
          body: revisionBody,
          attachments: buildAttachmentPayload(),
          submit: true,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message ?? 'Revision konnte nicht gespeichert werden');
      }

      setRevisionSummary('');
      setRevisionBody('');
      setAttachmentName('');
      setAttachmentUrl('');
      setAttachmentMime('application/pdf');
      await onRefresh?.();
    } catch (error) {
      setRevisionError(error instanceof Error ? error.message : 'Revision konnte nicht gespeichert werden');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleRevisionStatus = async (revisionId: string, status: RevisionStatus) => {
    if (!negotiation?.id) {
      return;
    }

    setPendingRevisionId(revisionId);
    try {
      const response = await fetch(
        `/api/marketplace/deals/${negotiation.id}/contracts/revisions/${revisionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status }),
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message ?? 'Revision konnte nicht aktualisiert werden');
      }

      await onRefresh?.();
    } catch (error) {
      console.error('[contract-revision][status-failed]', error);
    } finally {
      setPendingRevisionId(null);
    }
  };

  const handleCommentSubmit = async (revisionId: string) => {
    if (!negotiation?.id) {
      return;
    }

    const comment = commentDrafts[revisionId]?.trim();
    if (!comment) {
      return;
    }

    setPendingCommentId(revisionId);
    try {
      const response = await fetch(
        `/api/marketplace/deals/${negotiation.id}/contracts/revisions/${revisionId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ body: comment }),
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message ?? 'Kommentar konnte nicht gespeichert werden');
      }

      setCommentDrafts((drafts) => ({ ...drafts, [revisionId]: '' }));
      await onRefresh?.();
    } catch (error) {
      console.error('[contract-revision][comment-failed]', error);
    } finally {
      setPendingCommentId(null);
    }
  };

  const handleResolveComment = async (revisionId: string, commentId: string, resolved: boolean) => {
    if (!negotiation?.id) {
      return;
    }

    setPendingCommentId(`${revisionId}:${commentId}`);
    try {
      const response = await fetch(
        `/api/marketplace/deals/${negotiation.id}/contracts/revisions/${revisionId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ resolved }),
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message ?? 'Kommentar konnte nicht aktualisiert werden');
      }

      await onRefresh?.();
    } catch (error) {
      console.error('[contract-revision][resolve-failed]', error);
    } finally {
      setPendingCommentId(null);
    }
  };

  const renderRevision = (revision: ContractRevisionSnapshot) => {
    const isPending = pendingRevisionId === revision.id;
    const commentPendingPrefix = `${revision.id}:`;
    const isCurrent = contract.currentRevisionId === revision.id || revision.isCurrent;
    return (
      <div key={revision.id} className="rounded-md border border-muted p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Badge variant={isCurrent ? 'default' : 'secondary'}>v{revision.version}</Badge>
            <div>
              <p className="text-sm font-medium">{revision.summary || 'Revision ohne Zusammenfassung'}</p>
              <p className="text-xs text-muted-foreground">
                Erstellt von {revision.createdBy.name ?? revision.createdBy.email ?? 'unbekannt'} ·
                {new Date(revision.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge variant={REVISION_STATUS_VARIANTS[revision.status as RevisionStatus] ?? 'secondary'}>
            {revision.status}
          </Badge>
        </div>
        <p className="whitespace-pre-wrap text-sm border border-dashed border-muted rounded-md p-2 bg-muted/40">
          {revision.body}
        </p>
        {revision.attachments?.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Anhänge</p>
            {revision.attachments.map((attachment) => (
              <a
                key={`${revision.id}-${attachment.url}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" /> {attachment.name}
              </a>
            ))}
          </div>
        ) : null}
        {canCollaborate ? (
          <div className="flex flex-wrap gap-2">
            {revision.status === 'IN_REVIEW' || revision.status === 'DRAFT' ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  disabled={isPending}
                  onClick={() => handleRevisionStatus(revision.id, 'ACCEPTED')}
                >
                  Revision akzeptieren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleRevisionStatus(revision.id, 'REJECTED')}
                >
                  Revision ablehnen
                </Button>
              </>
            ) : null}
            {revision.status === 'ACCEPTED' && !isCurrent ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleRevisionStatus(revision.id, 'ACCEPTED')}
              >
                Als aktiv markieren
              </Button>
            ) : null}
          </div>
        ) : null}
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Kommentare
          </p>
          <div className="space-y-2">
            {revision.comments.map((comment) => {
              const pendingKey = `${revision.id}:${comment.id}`;
              return (
                <div
                  key={comment.id}
                  className="rounded-md border border-border/60 bg-muted/30 p-2 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {comment.author.name ?? comment.author.email ?? 'Teilnehmer'} ·{' '}
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    <span>
                      {comment.status === 'RESOLVED' ? (
                        <Badge variant="secondary">Gelöst</Badge>
                      ) : (
                        <Badge variant="outline">Offen</Badge>
                      )}
                    </span>
                  </div>
                  <p>{comment.body}</p>
                  {canCollaborate ? (
                    <div className="flex gap-2 text-xs">
                      {comment.status === 'RESOLVED' ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={pendingCommentId === pendingKey}
                          onClick={() => handleResolveComment(revision.id, comment.id, false)}
                        >
                          Wieder öffnen
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={pendingCommentId === pendingKey}
                          onClick={() => handleResolveComment(revision.id, comment.id, true)}
                        >
                          Als gelöst markieren
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {canCollaborate ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Kommentar zur Revision hinzufügen..."
                value={commentDrafts[revision.id] ?? ''}
                onChange={(event) =>
                  setCommentDrafts((drafts) => ({ ...drafts, [revision.id]: event.target.value }))
                }
                rows={2}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingCommentId === revision.id}
                onClick={() => handleCommentSubmit(revision.id)}
              >
                Kommentar speichern
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Vertragsstatus</CardTitle>
          <CardDescription>Status der Unterzeichnungen, Revisionen und des Entwurfs.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={envelopeBadgeVariant}>{envelopeStatus}</Badge>
          <Badge variant={contract.status === 'SIGNED' ? 'default' : 'secondary'}>{badgeLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
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
              <ExternalLink className="h-4 w-4" /> Aktuelles Dokument öffnen
            </a>
          </Button>
        ) : null}
        {contract.draftTerms ? (
          <div>
            <p className="text-xs text-muted-foreground">Notizen zur aktiven Revision</p>
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
            {buyerSigned && sellerSigned
              ? 'Alle Signaturen liegen vor.'
              : 'Vertrag wartet auf Unterschriften der Parteien.'}
          </p>
        )}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Revisionen</p>
              <p className="text-xs text-muted-foreground">
                Nachverfolgung der Vertragsüberarbeitungen und Diskussionen.
              </p>
            </div>
            {latestRevision ? (
              <Badge variant={REVISION_STATUS_VARIANTS[latestRevision.status as RevisionStatus] ?? 'secondary'}>
                Letzte Revision: v{latestRevision.version}
              </Badge>
            ) : null}
          </div>
          {revisions.length ? (
            <div className="space-y-3">
              {revisions.map((revision) => renderRevision(revision))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Noch keine Revisionen dokumentiert.</p>
          )}
        </div>
        {canCollaborate ? (
          <div className="space-y-3 rounded-md border border-dashed border-primary/40 p-4">
            <p className="text-sm font-semibold">Neue Revision anfordern</p>
            <div className="space-y-2">
              <Input
                value={revisionSummary}
                onChange={(event) => setRevisionSummary(event.target.value)}
                placeholder="Kurze Zusammenfassung"
              />
              <Textarea
                value={revisionBody}
                onChange={(event) => setRevisionBody(event.target.value)}
                placeholder="Beschreiben Sie die gewünschten Änderungen oder fügen Sie hier die neue Vertragsfassung ein."
                rows={4}
              />
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  value={attachmentName}
                  onChange={(event) => setAttachmentName(event.target.value)}
                  placeholder="Dateiname (optional)"
                />
                <Input
                  value={attachmentUrl}
                  onChange={(event) => setAttachmentUrl(event.target.value)}
                  placeholder="Anhang-URL (z. B. PDF)"
                />
                <Input
                  value={attachmentMime}
                  onChange={(event) => setAttachmentMime(event.target.value)}
                  placeholder="MIME-Type"
                />
              </div>
              {revisionError ? <p className="text-xs text-destructive">{revisionError}</p> : null}
              <Button onClick={handleCreateRevision} disabled={isSubmittingRevision}>
                Revision einreichen
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
