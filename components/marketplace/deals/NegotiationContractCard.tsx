'use client';

// meta: feature=contract-redline owner=platform stage=alpha

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, FileSignature, FileText, GitCompare, MessageCircle, WifiOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { WorkspaceConnectivityState } from '@/hooks/useNegotiationWorkspace';
import type { ClauseDiffSegment } from '@/lib/contracts/diff';
import { computeClauseDiff, computeNegotiationContractFingerprint, summarizeClauseDiff } from '@/lib/contracts/diff';
import type { NegotiationSnapshot, ContractRevisionSnapshot } from '@/types/negotiations';
type RevisionStatus = 'DRAFT' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';

interface NegotiationContractCardProps {
  negotiation: NegotiationSnapshot | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
  onSignContract: (intent: 'BUYER' | 'SELLER' | 'ADMIN') => Promise<unknown>;
  currentUserId?: string | null;
  disabled?: boolean;
  onRefresh?: () => Promise<unknown> | void;
  connectivity?: WorkspaceConnectivityState;
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
  connectivity,
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
  const [expandedDiffRevisionId, setExpandedDiffRevisionId] = useState<string | null>(null);
  const [draftMetadata, setDraftMetadata] = useState<{ updatedAt: string | null; fingerprint: string | null }>({
    updatedAt: null,
    fingerprint: null,
  });
  const draftMetadataRef = useRef(draftMetadata);

  const revisions = negotiation?.contractRevisions ?? [];
  const isTerminal = negotiation ? ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(negotiation.status) : false;
  const canSign = !disabled && !isSubmittingSignature && !isTerminal && role && role !== 'ADMIN';
  const draftStorageKey = negotiation?.id
    ? `negotiation:${negotiation.id}:contract-draft:${currentUserId ?? 'guest'}`
    : null;
  useEffect(() => {
    draftMetadataRef.current = draftMetadata;
  }, [draftMetadata]);
  useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) {
      setDraftMetadata({ updatedAt: null, fingerprint: null });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        summary?: string;
        body?: string;
        attachmentName?: string;
        attachmentUrl?: string;
        attachmentMime?: string;
        updatedAt?: string;
        fingerprint?: string;
      };

      setDraftMetadata({
        updatedAt: parsed.updatedAt ?? null,
        fingerprint: parsed.fingerprint ?? null,
      });

      if (!revisionSummary && parsed.summary) {
        setRevisionSummary(parsed.summary);
      }
      if (!revisionBody && parsed.body) {
        setRevisionBody(parsed.body);
      }
      if (!attachmentName && parsed.attachmentName) {
        setAttachmentName(parsed.attachmentName);
      }
      if (!attachmentUrl && parsed.attachmentUrl) {
        setAttachmentUrl(parsed.attachmentUrl);
      }
      if (parsed.attachmentMime) {
        setAttachmentMime(parsed.attachmentMime);
      }
    } catch (storageError) {
      console.error('[contract-revision][draft-parse-failed]', storageError);
      window.localStorage.removeItem(draftStorageKey);
      setDraftMetadata({ updatedAt: null, fingerprint: null });
    }
  }, [attachmentName, attachmentUrl, draftStorageKey, revisionBody, revisionSummary]);
  useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined') {
      return;
    }

    const hasContent = Boolean(
      revisionSummary.trim() ||
        revisionBody.trim() ||
        attachmentName.trim() ||
        attachmentUrl.trim()
    );

    if (!hasContent) {
      window.localStorage.removeItem(draftStorageKey);
      if (draftMetadataRef.current.fingerprint || draftMetadataRef.current.updatedAt) {
        setDraftMetadata({ updatedAt: null, fingerprint: null });
      }
      return;
    }

    const updatedAt = new Date().toISOString();
    const fingerprint = computeNegotiationContractFingerprint(revisionBody, revisionSummary);
    const payload = {
      summary: revisionSummary,
      body: revisionBody,
      attachmentName,
      attachmentUrl,
      attachmentMime,
      updatedAt,
      fingerprint,
    };

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      setDraftMetadata({ updatedAt, fingerprint });
    } catch (storageError) {
      console.error('[contract-revision][draft-write-failed]', storageError);
    }
  }, [attachmentMime, attachmentName, attachmentUrl, draftStorageKey, revisionBody, revisionSummary]);
  const requiresSignature = useMemo(() => {
    if (!contract || !role) {
      return false;
    }

    const participantStates = contract.participantStates ?? {};
    const buyerSigned = participantStates.BUYER?.status === 'SIGNED' || Boolean(contract.buyerSignedAt);
    const sellerSigned = participantStates.SELLER?.status === 'SIGNED' || Boolean(contract.sellerSignedAt);

    return (role === 'BUYER' && !buyerSigned) || (role === 'SELLER' && !sellerSigned);
  }, [contract, role]);
  const revisionDiffMap = useMemo(() => {
    const entries = new Map<
      string,
      {
        diff: ClauseDiffSegment[];
        summary: ReturnType<typeof summarizeClauseDiff>;
        summaryChanged: boolean;
        previousVersion: number | null;
      }
    >();

    revisions.forEach((revision, index) => {
      const previous = revisions[index + 1];
      if (!previous) {
        return;
      }

      const diff = computeClauseDiff(previous.body, revision.body);
      entries.set(revision.id, {
        diff,
        summary: summarizeClauseDiff(diff),
        summaryChanged: (previous.summary ?? '') !== (revision.summary ?? ''),
        previousVersion: previous.version ?? null,
      });
    });

    return entries;
  }, [revisions]);
  const latestRevisionFingerprint = useMemo(() => {
    if (!revisions.length) {
      return null;
    }

    const [latest] = revisions;
    return computeNegotiationContractFingerprint(latest.body, latest.summary ?? null);
  }, [revisions]);
  const hasDraftConflict = Boolean(
    draftMetadata.fingerprint && latestRevisionFingerprint && draftMetadata.fingerprint !== latestRevisionFingerprint
  );
  const showConflictAlert = hasDraftConflict || Boolean(connectivity?.conflict);
  const offline = connectivity?.offline ?? false;
  const lastSyncedLabel = connectivity?.lastSyncedAt ? new Date(connectivity.lastSyncedAt).toLocaleString() : null;
  const draftSavedLabel = draftMetadata.updatedAt ? new Date(draftMetadata.updatedAt).toLocaleString() : null;

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
      if (draftStorageKey && typeof window !== 'undefined') {
        window.localStorage.removeItem(draftStorageKey);
      }
      setDraftMetadata({ updatedAt: null, fingerprint: null });
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

  const renderClauseDiffSegment = (segment: ClauseDiffSegment, key: string | number) => {
    if (segment.type === 'unchanged') {
      return (
        <div key={key} className="rounded border border-muted/40 bg-background p-2">
          {segment.targetClause ?? segment.baseClause ?? ''}
        </div>
      );
    }

    if (segment.type === 'added') {
      return (
        <div key={key} className="rounded border border-emerald-200 bg-emerald-50 p-2 text-emerald-900">
          + {segment.targetClause ?? ''}
        </div>
      );
    }

    if (segment.type === 'removed') {
      return (
        <div key={key} className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-900 line-through">
          - {segment.baseClause ?? ''}
        </div>
      );
    }

    const inlineSegments = segment.inlineDiff?.length
      ? segment.inlineDiff.map((inline, index) => {
          const baseClass =
            inline.type === 'added'
              ? 'bg-emerald-200/80 text-emerald-900 rounded px-1'
              : inline.type === 'removed'
              ? 'bg-rose-200/80 text-rose-900 line-through rounded px-1'
              : undefined;
          return (
            <span key={`${segment.targetIndex ?? segment.baseIndex}-${index}`} className={baseClass}>
              {inline.text}
            </span>
          );
        })
      : segment.targetClause ?? segment.baseClause ?? '';

    return (
      <div key={key} className="rounded border border-blue-200 bg-blue-50 p-2 text-blue-900">
        {inlineSegments}
      </div>
    );
  };

  const renderRevision = (revision: ContractRevisionSnapshot) => {
    const isPending = pendingRevisionId === revision.id;
    const commentPendingPrefix = `${revision.id}:`;
    const isCurrent = contract.currentRevisionId === revision.id || revision.isCurrent;
    const diffData = revisionDiffMap.get(revision.id);
    const previousVersion = diffData?.previousVersion ?? null;
    const showDiff = expandedDiffRevisionId === revision.id;
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
        {diffData ? (
          <div className="space-y-2 rounded-md border border-dashed border-primary/30 bg-muted/30 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-muted-foreground">
                <GitCompare className="h-3 w-3" /> Vergleich zu v{previousVersion ?? revision.version - 1}
              </span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  +{diffData.summary.added} / -{diffData.summary.removed} / Δ{diffData.summary.modified}
                </span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="gap-1"
                  onClick={() =>
                    setExpandedDiffRevisionId((current) => (current === revision.id ? null : revision.id))
                  }
                >
                  {showDiff ? 'Diff verbergen' : 'Diff anzeigen'}
                </Button>
              </div>
            </div>
            {diffData.summaryChanged ? (
              <p className="text-muted-foreground">
                Zusammenfassung aktualisiert: <span className="font-medium">{revision.summary || '—'}</span>
              </p>
            ) : null}
            {showDiff ? (
              <div className="space-y-2">
                {diffData.diff.length ? (
                  diffData.diff.map((segment, segmentIndex) => renderClauseDiffSegment(segment, `${revision.id}-${segmentIndex}`))
                ) : (
                  <p className="text-muted-foreground">Keine inhaltlichen Änderungen erkannt.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
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
    {offline ? (
      <Alert variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
        <AlertTitle className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" /> Offline-Modus aktiv
        </AlertTitle>
        <AlertDescription>
          Änderungen werden lokal zwischengespeichert.
          {draftSavedLabel ? ` Letzter Entwurf gespeichert ${draftSavedLabel}.` : ''}
          {lastSyncedLabel ? ` Letzte Synchronisierung ${lastSyncedLabel}.` : ''}
        </AlertDescription>
      </Alert>
    ) : null}
    {showConflictAlert ? (
      <Alert variant="destructive">
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Entwurf weicht von Serverversion ab
        </AlertTitle>
        <AlertDescription>
          Prüfen Sie die Änderungsansicht, bevor Sie eine neue Revision einreichen, um Konflikte zu vermeiden.
        </AlertDescription>
      </Alert>
    ) : null}
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
