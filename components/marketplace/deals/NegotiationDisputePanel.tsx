'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, FileText, LinkIcon, Paperclip } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { NegotiationDispute } from '@/types/negotiations';

type SeverityValue = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type CategoryValue = 'ESCROW' | 'DELIVERY' | 'QUALITY' | 'OTHER';
type EvidenceTypeValue = 'LINK' | 'FILE' | 'NOTE';

interface EvidenceDraft {
  type: EvidenceTypeValue;
  url: string;
  label: string;
}

interface NegotiationDisputePanelProps {
  disputes: NegotiationDispute[];
  disabled?: boolean;
  onRaiseDispute: (input: {
    summary: string;
    description?: string;
    requestedOutcome?: string;
    severity: SeverityValue;
    category: CategoryValue;
    attachments: EvidenceDraft[];
  }) => Promise<void>;
}

const severityCopy: Record<SeverityValue, { label: string; tone: string }> = {
  LOW: { label: 'Niedrig', tone: 'bg-emerald-100 text-emerald-800' },
  MEDIUM: { label: 'Mittel', tone: 'bg-amber-100 text-amber-800' },
  HIGH: { label: 'Hoch', tone: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Kritisch', tone: 'bg-red-100 text-red-800' },
};

const categoryCopy: Record<CategoryValue, string> = {
  ESCROW: 'Treuhand',
  DELIVERY: 'Lieferung',
  QUALITY: 'Qualität',
  OTHER: 'Sonstiges',
};

const evidenceIcon: Record<EvidenceTypeValue, JSX.Element> = {
  LINK: <LinkIcon className="h-4 w-4" />,
  FILE: <Paperclip className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
};

const severityOptions: SeverityValue[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const categoryOptions: CategoryValue[] = ['ESCROW', 'DELIVERY', 'QUALITY', 'OTHER'];
const evidenceOptions: EvidenceTypeValue[] = ['LINK', 'FILE', 'NOTE'];

const euroFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function formatEuro(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '–';
  }

  return euroFormatter.format(value);
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return '–';
  }

  try {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    console.error('[dispute-panel][date-format-failed]', error);
    return value;
  }
}

export function NegotiationDisputePanel({ disputes, disabled = false, onRaiseDispute }: NegotiationDisputePanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [requestedOutcome, setRequestedOutcome] = useState('');
  const [severity, setSeverity] = useState<SeverityValue>('MEDIUM');
  const [category, setCategory] = useState<CategoryValue>('ESCROW');
  const [evidenceDrafts, setEvidenceDrafts] = useState<EvidenceDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveDispute = useMemo(() => disputes.some((dispute) => dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED'), [
    disputes,
  ]);

  const resetForm = () => {
    setSummary('');
    setDescription('');
    setRequestedOutcome('');
    setSeverity('MEDIUM');
    setCategory('ESCROW');
    setEvidenceDrafts([]);
    setFormError(null);
  };

  const handleAddEvidence = () => {
    setEvidenceDrafts((current) => [...current, { type: 'LINK', url: '', label: '' }]);
  };

  const handleEvidenceChange = (index: number, patch: Partial<EvidenceDraft>) => {
    setEvidenceDrafts((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry))
    );
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceDrafts((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleSubmit = async () => {
    setFormError(null);

    const trimmedSummary = summary.trim();
    if (trimmedSummary.length < 10) {
      setFormError('Bitte beschreiben Sie den Vorfall aussagekräftig (mindestens 10 Zeichen).');
      return;
    }

    const sanitizedEvidence = evidenceDrafts
      .map((draft) => ({
        ...draft,
        url: draft.url.trim(),
        label: draft.label.trim(),
      }))
      .filter((draft) => draft.url.length > 0)
      .slice(0, 5);

    try {
      setIsSubmitting(true);
      await onRaiseDispute({
        summary: trimmedSummary,
        description: description.trim() || undefined,
        requestedOutcome: requestedOutcome.trim() || undefined,
        severity,
        category,
        attachments: sanitizedEvidence,
      });
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Disput konnte nicht eingereicht werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-slate-500" /> Eskalationen &amp; Disputs
        </CardTitle>
        <CardDescription>
          Dokumentieren Sie Probleme mit Lieferung, Qualität oder Treuhandzahlungen und informieren Sie das Operationsteam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Es liegt kein aktiver Disput vor. Reichen Sie bei Bedarf einen neuen Vorgang ein, um unser Team zu informieren.
          </p>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => {
              const severityKey = (dispute.severity as SeverityValue) ?? 'MEDIUM';
              const severityMeta = severityCopy[severityKey];
              const categoryKey = (dispute.category as CategoryValue) ?? 'ESCROW';
              const holdAmountLabel = formatEuro(dispute.holdAmount ?? 0);
              const counterProposalLabel =
                typeof dispute.counterProposalAmount === 'number'
                  ? formatEuro(dispute.counterProposalAmount)
                  : null;
              const payoutLabel =
                typeof dispute.resolutionPayoutAmount === 'number'
                  ? formatEuro(dispute.resolutionPayoutAmount)
                  : null;
              const slaBreachedSince = dispute.slaBreachedAt
                ? formatTimestamp(dispute.slaBreachedAt)
                : null;
              return (
                <div key={dispute.id} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={severityMeta.tone}>{severityMeta.label}</Badge>
                        <Badge variant="secondary">{categoryCopy[categoryKey]}</Badge>
                        <Badge variant="outline">Status: {dispute.status}</Badge>
                      </div>
                      <p className="font-medium text-slate-900">{dispute.summary}</p>
                      {dispute.description ? (
                        <p className="text-muted-foreground">{dispute.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Gesperrt: {holdAmountLabel}</span>
                        {counterProposalLabel ? <span>Vorschlag: {counterProposalLabel}</span> : null}
                        {payoutLabel ? <span>Ausgezahlt: {payoutLabel}</span> : null}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div>Gemeldet: {formatTimestamp(dispute.raisedAt)}</div>
                      <div>SLA Fällig: {formatTimestamp(dispute.slaDueAt ?? null)}</div>
                      {slaBreachedSince ? (
                        <div className="mt-1">
                          <Badge variant="destructive">SLA verletzt seit {slaBreachedSince}</Badge>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {dispute.evidence.length > 0 ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold uppercase text-slate-500">Nachweise</p>
                      <ul className="space-y-1">
                        {dispute.evidence.map((item) => {
                          const typeKey = (item.type as EvidenceTypeValue) ?? 'LINK';
                          return (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">{evidenceIcon[typeKey]}</span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-primary underline"
                            >
                              {item.label || item.url}
                            </a>
                            <span className="text-xs text-muted-foreground">{formatTimestamp(item.uploadedAt)}</span>
                          </li>
                        );
                        })}
                      </ul>
                    </div>
                  ) : null}
                  {dispute.latestEvent ? (
                    <div className="mt-3 rounded-md bg-white/80 p-2 text-xs text-muted-foreground">
                      Letzte Aktivität ({formatTimestamp(dispute.latestEvent.createdAt)}): {dispute.latestEvent.message ?? dispute.latestEvent.type}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-xs text-muted-foreground">
          Aktive Disputs werden automatisch an das Admin-Team übermittelt. Unser SLA richtet sich nach der gewählten Priorität.
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => (!isSubmitting ? setIsDialogOpen(open) : null)}>
          <DialogTrigger asChild>
            <Button disabled={disabled || isSubmitting || hasActiveDispute} variant="secondary">
              {hasActiveDispute ? 'Disput aktiv' : 'Disput melden'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disput einreichen</DialogTitle>
              <DialogDescription>
                Beschreiben Sie das Problem möglichst konkret. Unser Operationsteam meldet sich nach Prüfung bei Ihnen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dispute-summary">Zusammenfassung</Label>
                <Input
                  id="dispute-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="z. B. Lieferung blieb aus trotz Zahlungsbestätigung"
                  maxLength={240}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispute-description">Details</Label>
                <Textarea
                  id="dispute-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Fügen Sie zusätzliche Kontextinformationen, Zeitlinien oder Ansprechpartner hinzu."
                  rows={4}
                  maxLength={2000}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispute-outcome">Erwartetes Ergebnis (optional)</Label>
                <Input
                  id="dispute-outcome"
                  value={requestedOutcome}
                  onChange={(event) => setRequestedOutcome(event.target.value)}
                  placeholder="z. B. sofortige Freigabe der Treuhandmittel"
                  maxLength={500}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priorität</Label>
                  <Select value={severity} onValueChange={(value) => setSeverity(value as SeverityValue)}>
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue placeholder="Priorität wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {severityCopy[option]?.label ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as CategoryValue)}>
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {categoryCopy[option] ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Nachweise</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddEvidence} disabled={isSubmitting || evidenceDrafts.length >= 5}>
                    Nachweis hinzufügen
                  </Button>
                </div>
                {evidenceDrafts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Fügen Sie Links zu Dokumenten, Tracking-Seiten oder Uploads hinzu, um die Prüfung zu beschleunigen.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {evidenceDrafts.map((draft, index) => (
                      <div key={`evidence-${index}`} className="space-y-2 rounded-md border border-dashed border-slate-300 p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Typ</Label>
                            <Select value={draft.type} onValueChange={(value) => handleEvidenceChange(index, { type: value as EvidenceTypeValue })}>
                              <SelectTrigger disabled={isSubmitting}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {evidenceOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option === 'LINK' ? 'Link' : option === 'FILE' ? 'Upload' : 'Notiz'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Bezeichnung</Label>
                            <Input
                              value={draft.label}
                              onChange={(event) => handleEvidenceChange(index, { label: event.target.value })}
                              placeholder="z. B. Lieferbeleg"
                              maxLength={120}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>URL / Referenz</Label>
                          <Input
                            value={draft.url}
                            onChange={(event) => handleEvidenceChange(index, { url: event.target.value })}
                            placeholder="https://"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEvidence(index)}
                            disabled={isSubmitting}
                          >
                            Entfernen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (!isSubmitting ? setIsDialogOpen(false) : null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Übermittle…' : 'Disput einreichen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
