import { Fragment } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { DealDisputeSeverity, DealDisputeStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdminMarketplaceIntelligence } from '@/components/marketplace/deals/AdminMarketplaceIntelligence';
import { SchedulerJobTriggerButton } from '@/components/marketplace/deals/SchedulerJobTriggerButton';
import { authOptions } from '@/lib/auth/options';
import { getNotificationDeliveryStats } from '@/lib/events/queue';
import {
  getEscrowDisputeQueue,
  getEscrowDisputeAnalytics,
  getEscrowFundingLatencyMetrics,
  getEscrowReconciliationAlerts,
} from '@/lib/escrow/metrics';
import { getJobHealth, type JobHealthEntry } from '@/lib/jobs/scheduler';
import { getMarketplaceIntelligenceOverview } from '@/lib/intelligence/hub';
import { getPremiumProfileForUser } from '@/lib/premium/entitlements';
import { getPremiumConversionMetrics } from '@/lib/premium/metrics';
import { parsePremiumTierParam, parsePremiumWindowParam } from '@/lib/premium/params';
import {
  applyDisputeHoldAction,
  assignDisputeAction,
  recordDisputeCounterProposalAction,
  settleDisputePayoutAction,
  triggerJobAction,
  updateDisputeStatusAction,
} from './actions';

interface AdminOperationsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const euroFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

interface ParsedJobMetadata {
  attempt: number;
  lastError: string | null;
  lastErrorAt: string | null;
  lastSuccessAt: string | null;
  disabledAt: string | null;
}

function formatEuro(value: number) {
  return euroFormatter.format(value);
}

function formatMinutes(value: number | null) {
  return value == null ? '–' : `${value.toFixed(1)} min`;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return '–';
  }

  return (value * 100).toLocaleString('de-DE', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

function formatDelta(value: number | null | undefined, { percent = false } = {}) {
  if (value == null) {
    return 'keine Daten';
  }

  if (value === 0) {
    return percent ? '±0,0 %' : '±0';
  }

  const absolute = Math.abs(value);
  const formatted = percent
    ? `${(absolute * 100).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`
    : absolute.toLocaleString('de-DE');
  const sign = value > 0 ? '+' : '−';
  return `${sign}${formatted}`;
}

function deltaTone(value: number | null | undefined) {
  if (value == null || value === 0) {
    return 'text-muted-foreground';
  }

  return value > 0 ? 'text-emerald-600' : 'text-destructive';
}

function shortenId(value: string) {
  return value.length > 8 ? `…${value.slice(-6)}` : value;
}

function formatDisputeStatus(status: DealDisputeStatus) {
  switch (status) {
    case DealDisputeStatus.OPEN:
      return 'Offen';
    case DealDisputeStatus.UNDER_REVIEW:
      return 'In Prüfung';
    case DealDisputeStatus.AWAITING_PARTIES:
      return 'Warten auf Parteien';
    case DealDisputeStatus.ESCALATED:
      return 'Eskalierte Betreuung';
    case DealDisputeStatus.RESOLVED:
      return 'Gelöst';
    case DealDisputeStatus.CLOSED:
      return 'Abgeschlossen';
    default:
      return status;
  }
}

function formatDisputeSeverity(severity: DealDisputeSeverity) {
  switch (severity) {
    case DealDisputeSeverity.CRITICAL:
      return 'Kritisch';
    case DealDisputeSeverity.HIGH:
      return 'Hoch';
    case DealDisputeSeverity.MEDIUM:
      return 'Mittel';
    case DealDisputeSeverity.LOW:
      return 'Niedrig';
    default:
      return severity;
  }
}

function statusBadgeVariant(status: DealDisputeStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case DealDisputeStatus.OPEN:
      return 'destructive';
    case DealDisputeStatus.ESCALATED:
      return 'destructive';
    case DealDisputeStatus.AWAITING_PARTIES:
      return 'outline';
    case DealDisputeStatus.UNDER_REVIEW:
      return 'secondary';
    default:
      return 'default';
  }
}

function severityTone(severity: DealDisputeSeverity) {
  switch (severity) {
    case DealDisputeSeverity.CRITICAL:
      return 'border-destructive text-destructive';
    case DealDisputeSeverity.HIGH:
      return 'border-amber-500 text-amber-700';
    case DealDisputeSeverity.MEDIUM:
      return 'border-slate-300 text-slate-700';
    case DealDisputeSeverity.LOW:
      return 'border-emerald-500 text-emerald-700';
    default:
      return 'border-secondary text-secondary-foreground';
  }
}

function availableStatusTransitions(status: DealDisputeStatus): Array<{ status: DealDisputeStatus; label: string }> {
  switch (status) {
    case DealDisputeStatus.OPEN:
      return [
        { status: DealDisputeStatus.UNDER_REVIEW, label: 'In Prüfung' },
        { status: DealDisputeStatus.AWAITING_PARTIES, label: 'Rückfrage' },
        { status: DealDisputeStatus.ESCALATED, label: 'Eskalieren' },
        { status: DealDisputeStatus.RESOLVED, label: 'Lösen' },
      ];
    case DealDisputeStatus.UNDER_REVIEW:
      return [
        { status: DealDisputeStatus.AWAITING_PARTIES, label: 'Rückfrage' },
        { status: DealDisputeStatus.ESCALATED, label: 'Eskalieren' },
        { status: DealDisputeStatus.RESOLVED, label: 'Lösen' },
      ];
    case DealDisputeStatus.AWAITING_PARTIES:
      return [
        { status: DealDisputeStatus.UNDER_REVIEW, label: 'Prüfung fortsetzen' },
        { status: DealDisputeStatus.ESCALATED, label: 'Eskalieren' },
        { status: DealDisputeStatus.RESOLVED, label: 'Lösen' },
      ];
    case DealDisputeStatus.ESCALATED:
      return [
        { status: DealDisputeStatus.RESOLVED, label: 'Lösen' },
      ];
    default:
      return [];
  }
}

function formatHours(value: number | null) {
  if (value == null) {
    return '–';
  }

  return `${value.toFixed(1)} h`;
}

function recommendationPriorityTone(priority: 'low' | 'medium' | 'high') {
  switch (priority) {
    case 'high':
      return 'border border-destructive/60 bg-destructive/10 text-destructive';
    case 'medium':
      return 'border border-amber-400/60 bg-amber-100 text-amber-800';
    default:
      return 'border border-muted bg-muted text-muted-foreground';
  }
}

function formatBacklog(job: JobHealthEntry) {
  if (!job.backlogRunCount || job.backlogRunCount <= 0) {
    return '–';
  }

  const overdueMinutes = Math.max(1, Math.ceil(job.overdueByMs / 60_000));
  return `${job.backlogRunCount} Läufe (${overdueMinutes} min)`;
}

function readQueryParam(value: string | string[] | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function parseUpgradeParam(value: string | string[] | undefined) {
  return readQueryParam(value);
}

function parseInsightsWindowParam(value: string | string[] | undefined) {
  const raw = readQueryParam(value);
  if (!raw) {
    return 30;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.min(120, Math.max(7, parsed));
}

function parseInsightsScopeParam(value: string | string[] | undefined): 'premium' | 'all' {
  const raw = readQueryParam(value);
  return raw === 'all' ? 'all' : 'premium';
}

function parseJobMetadata(metadata: unknown): ParsedJobMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {
      attempt: 1,
      lastError: null,
      lastErrorAt: null,
      lastSuccessAt: null,
      disabledAt: null,
      pendingReminderCount: null,
      remindersProcessed: null,
      overdueOrdersEscalated: null,
    };
  }

  const raw = metadata as Record<string, unknown>;
  return {
    attempt: typeof raw.attempt === 'number' && Number.isFinite(raw.attempt) ? raw.attempt : 1,
    lastError: typeof raw.lastError === 'string' && raw.lastError.length > 0 ? raw.lastError : null,
    lastErrorAt: typeof raw.lastErrorAt === 'string' ? raw.lastErrorAt : null,
    lastSuccessAt: typeof raw.lastSuccessAt === 'string' ? raw.lastSuccessAt : null,
    disabledAt: typeof raw.disabledAt === 'string' ? raw.disabledAt : null,
    pendingReminderCount:
      typeof raw.pendingReminderCount === 'number' && Number.isFinite(raw.pendingReminderCount)
        ? (raw.pendingReminderCount as number)
        : null,
    remindersProcessed:
      typeof raw.remindersProcessed === 'number' && Number.isFinite(raw.remindersProcessed)
        ? (raw.remindersProcessed as number)
        : null,
    overdueOrdersEscalated:
      typeof raw.overdueOrdersEscalated === 'number' && Number.isFinite(raw.overdueOrdersEscalated)
        ? (raw.overdueOrdersEscalated as number)
        : null,
  };
}

function formatRelative(isoDate: string | null) {
  if (!isoDate) return '–';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '–';
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function formatTimeseriesDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return dateFormatter.format(date);
}

export default async function AdminOperationsPage({ searchParams }: AdminOperationsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin && session?.user?.role !== 'ADMIN') {
    return <p className="text-sm text-muted-foreground">Kein Zugriff auf Operations-Metriken.</p>;
  }

  const [{ jobs, logs }, notificationStats, disputeQueue, disputeAnalytics, reconciliationAlerts, fundingMetrics] =
    await Promise.all([
      getJobHealth(),
      getNotificationDeliveryStats(),
      getEscrowDisputeQueue(),
      getEscrowDisputeAnalytics(),
      getEscrowReconciliationAlerts(),
      getEscrowFundingLatencyMetrics(),
    ]);

  const premiumProfile = session.user?.id ? await getPremiumProfileForUser(session.user.id) : null;
  const insightsWindowParam = parseInsightsWindowParam(searchParams?.insightsWindow);
  const insightsScopeParam = parseInsightsScopeParam(searchParams?.insightsScope);
  const intelligenceOverview = await getMarketplaceIntelligenceOverview({
    windowInDays: insightsWindowParam,
    premiumOnly: insightsScopeParam !== 'all',
  });
  const premiumWindowParam = parsePremiumWindowParam(readQueryParam(searchParams?.premiumWindow));
  const premiumTierParam = parsePremiumTierParam(readQueryParam(searchParams?.premiumTier));
  const premiumMetrics = await getPremiumConversionMetrics({
    windowInDays: premiumWindowParam,
    tier: premiumTierParam === 'ALL' ? undefined : premiumTierParam,
  });
  const upgradeParam = parseUpgradeParam(searchParams?.upgrade);
  const premiumComparisonLabel = `vorherige ${premiumMetrics.comparison.previousWindow.days} Tage`;
  const premiumTierLabel =
    premiumMetrics.filter.tier === 'ALL'
      ? 'alle Premium-Tiers'
      : premiumMetrics.filter.tier === 'PREMIUM'
      ? 'Premium-Tier'
      : 'Concierge-Tier';
  const premiumTimeseries = [...premiumMetrics.timeseries].reverse();
  const premiumTimeseriesHasSignals = premiumTimeseries.some((point) =>
    point.totals.ctaViews > 0 ||
    point.totals.trialStarts > 0 ||
    point.totals.upgrades > 0 ||
    point.totals.premiumCompletions > 0
  );
  const adminUserId = typeof session.user?.id === 'string' ? session.user.id : null;
  const fulfilmentJob = jobs.find((job) => job.name === 'fulfilment-logistics-sweep');
  const fulfilmentMetadata = fulfilmentJob ? parseJobMetadata(fulfilmentJob.metadata) : null;
  const fulfilmentLastRun = fulfilmentJob?.lastRunAt
    ? formatDistanceToNow(new Date(fulfilmentJob.lastRunAt), { addSuffix: true })
    : '–';

  return (
    <div className="space-y-6">
      {premiumProfile?.dunningState === 'PAYMENT_FAILED' ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle>Premium-Zahlung ausstehend</CardTitle>
            <CardDescription>
              {premiumProfile.gracePeriodEndsAt
                ? `Grace Period endet am ${new Date(premiumProfile.gracePeriodEndsAt).toLocaleDateString('de-DE')} – bitte Zahldaten aktualisieren.`
                : 'Zahlung fehlgeschlagen. Bitte die hinterlegte Zahlungsmethode aktualisieren, um Premium-Entitlements zu sichern.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
            <div className="text-destructive-foreground">
              Concierge- und Analytics-Funktionen werden nach Ablauf der Grace Period deaktiviert.
            </div>
            <Link
              href="/admin/deals/operations/upgrade"
              className="inline-flex items-center rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground"
            >
              {premiumProfile.upgradePrompt?.cta ?? 'Zahlung aktualisieren'}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {premiumProfile?.isSeatCapacityExceeded ? (
        <Card className="border-amber-400/60 bg-amber-50">
          <CardHeader>
            <CardTitle>Premium-Sitzplatzlimit erreicht</CardTitle>
            <CardDescription>
              Premium-Entitlements sind workspace-weit blockiert, bis Sitzplätze freigegeben oder erweitert werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
            <div className="text-amber-800">
              {premiumProfile.seatsInUse != null && premiumProfile.seatCapacity != null
                ? `${premiumProfile.seatsInUse} von ${premiumProfile.seatCapacity} Sitzplätzen belegt.`
                : 'Aktuelle Sitzplatzbelegung im Abrechnungsbereich prüfen.'}
            </div>
            <Link
              href="/admin/deals/operations/upgrade"
              className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 font-medium text-amber-50"
            >
              Sitzplätze verwalten
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <form
          method="get"
          className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 text-sm md:flex-row md:items-end md:justify-between"
        >
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[160px] flex-col gap-1">
              <Label htmlFor="insights-window">Zeitraum</Label>
              <select
                id="insights-window"
                name="insightsWindow"
                defaultValue={String(insightsWindowParam)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="7">7 Tage</option>
                <option value="14">14 Tage</option>
                <option value="30">30 Tage</option>
                <option value="60">60 Tage</option>
                <option value="90">90 Tage</option>
                <option value="120">120 Tage</option>
              </select>
            </div>
            <div className="flex min-w-[160px] flex-col gap-1">
              <Label htmlFor="insights-scope">Segment</Label>
              <select
                id="insights-scope"
                name="insightsScope"
                defaultValue={insightsScopeParam}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="premium">Premium Deals</option>
                <option value="all">Gesamter Markt</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="premiumWindow" value={String(premiumWindowParam)} />
            <input type="hidden" name="premiumTier" value={premiumTierParam} />
            {upgradeParam ? <input type="hidden" name="upgrade" value={upgradeParam} /> : null}
            <Button type="submit" size="sm" variant="secondary">
              Anwenden
            </Button>
          </div>
        </form>
        <AdminMarketplaceIntelligence overview={intelligenceOverview} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Scheduler Übersicht</CardTitle>
          <CardDescription>
            Status der SLA-, Escrow- und Notification-Jobs inklusive letzter Durchläufe und Fehlerprotokolle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Intervall</TableHead>
                <TableHead>Zuletzt ausgeführt</TableHead>
                <TableHead>Nächster Lauf</TableHead>
                <TableHead>Rückstand</TableHead>
                <TableHead>Versuche</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Letzter Fehler</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const lastRun = job.lastRunAt ? formatDistanceToNow(new Date(job.lastRunAt), { addSuffix: true }) : '–';
                const nextRun = job.nextRunAt ? formatDistanceToNow(new Date(job.nextRunAt), { addSuffix: true }) : 'In Kürze';
                const metadata = parseJobMetadata(job.metadata);
                const statusBadge = metadata.disabledAt ? (
                  <Badge variant="destructive">Deaktiviert</Badge>
                ) : metadata.lastError ? (
                  <Badge variant="destructive">Fehler</Badge>
                ) : job.backlogRunCount > 0 ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                    Verzögert
                  </Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                );

                return (
                  <TableRow key={job.name}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{Math.round(job.intervalMs / 60000)} min</TableCell>
                    <TableCell>{lastRun}</TableCell>
                    <TableCell>{nextRun}</TableCell>
                    <TableCell>{formatBacklog(job)}</TableCell>
                    <TableCell>{metadata.attempt}</TableCell>
                    <TableCell>{statusBadge}</TableCell>
                    <TableCell>
                      {metadata.lastError ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-destructive">{metadata.lastError}</p>
                          <p className="text-xs text-muted-foreground">{formatRelative(metadata.lastErrorAt)}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine Fehler</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <SchedulerJobTriggerButton jobName={job.name} action={triggerJobAction} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {fulfilmentMetadata ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Fulfilment &amp; Logistik</CardTitle>
              <CardDescription>
                Erinnerungsstatus und Eskalationen der Fulfilment-Aufträge. Zuletzt gelaufen {fulfilmentLastRun}.
              </CardDescription>
            </div>
            <SchedulerJobTriggerButton jobName="fulfilment-logistics-sweep" label="Logistiklauf starten" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Ausstehende Erinnerungen</p>
                <p className="text-2xl font-semibold">
                  {(fulfilmentMetadata.pendingReminderCount ?? 0).toLocaleString('de-DE')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Versendete Erinnerungen (letzter Lauf)</p>
                <p className="text-2xl font-semibold">
                  {(fulfilmentMetadata.remindersProcessed ?? 0).toLocaleString('de-DE')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eskalierte Abholfenster</p>
                <p className="text-2xl font-semibold">
                  {(fulfilmentMetadata.overdueOrdersEscalated ?? 0).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Letzte Ausführungen</CardTitle>
          <CardDescription>Prüfen Sie Fehlerdetails und Wiederholungsversuche.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versuch</TableHead>
                <TableHead>Gestartet</TableHead>
                <TableHead>Fehler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.jobName}</TableCell>
                  <TableCell>
                    {log.status === 'FAILED' ? (
                      <Badge variant="destructive">Fehler</Badge>
                    ) : (
                      <Badge variant="secondary">{log.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.attempt}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.error ?? '–'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Premium Conversion Funnel</CardTitle>
              <CardDescription>
                Ergebnisse der letzten {premiumMetrics.window.days} Tage für {premiumTierLabel} inklusive aktiver
                Abonnements.
              </CardDescription>
            </div>
            <form className="space-y-2 text-sm" method="get">
              {upgradeParam ? <input type="hidden" name="upgrade" value={upgradeParam} /> : null}
              <Label htmlFor="premium-window">Zeitraum auswählen</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <select
                  id="premium-window"
                  name="premiumWindow"
                  defaultValue={String(premiumWindowParam)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="7">7 Tage</option>
                  <option value="30">30 Tage</option>
                  <option value="60">60 Tage</option>
                  <option value="90">90 Tage</option>
                  <option value="120">120 Tage</option>
                </select>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="premium-tier">Tier</Label>
                    <select
                      id="premium-tier"
                      name="premiumTier"
                      defaultValue={premiumTierParam}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="ALL">Alle</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="CONCIERGE">Concierge</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" variant="secondary" className="sm:self-end">
                    Aktualisieren
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <p className="text-muted-foreground">CTA Aufrufe</p>
              <p className="text-2xl font-semibold">{premiumMetrics.totals.ctaViews}</p>
              <p className={`text-xs ${deltaTone(premiumMetrics.comparison.delta.totals.ctaViews)}`}>
                {(() => {
                  const label = formatDelta(premiumMetrics.comparison.delta.totals.ctaViews);
                  return label === 'keine Daten' ? 'Keine Vergleichsdaten' : `${label} vs. ${premiumComparisonLabel}`;
                })()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Trial-Starts</p>
              <p className="text-2xl font-semibold">{premiumMetrics.totals.trialStarts}</p>
              <p className="text-xs text-muted-foreground">
                {premiumMetrics.uniqueUsers.trialStarts} eindeutige Nutzer
              </p>
              <p className={`text-xs ${deltaTone(premiumMetrics.comparison.delta.totals.trialStarts)}`}>
                {(() => {
                  const label = formatDelta(premiumMetrics.comparison.delta.totals.trialStarts);
                  return label === 'keine Daten' ? 'Keine Vergleichsdaten' : `${label} vs. ${premiumComparisonLabel}`;
                })()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Upgrades bestätigt</p>
              <p className="text-2xl font-semibold">{premiumMetrics.totals.upgrades}</p>
              <p className="text-xs text-muted-foreground">
                {premiumMetrics.uniqueUsers.upgrades} eindeutige Nutzer
              </p>
              <p className={`text-xs ${deltaTone(premiumMetrics.comparison.delta.totals.upgrades)}`}>
                {(() => {
                  const label = formatDelta(premiumMetrics.comparison.delta.totals.upgrades);
                  return label === 'keine Daten' ? 'Keine Vergleichsdaten' : `${label} vs. ${premiumComparisonLabel}`;
                })()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Premium Deals abgeschlossen</p>
              <p className="text-2xl font-semibold">{premiumMetrics.totals.premiumCompletions}</p>
              <p className={`text-xs ${deltaTone(premiumMetrics.comparison.delta.totals.premiumCompletions)}`}>
                {(() => {
                  const label = formatDelta(premiumMetrics.comparison.delta.totals.premiumCompletions);
                  return label === 'keine Daten' ? 'Keine Vergleichsdaten' : `${label} vs. ${premiumComparisonLabel}`;
                })()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Aktive Premium-Abos</p>
              <p className="text-2xl font-semibold">{premiumMetrics.totals.activeSubscribers}</p>
              <p className={`text-xs ${deltaTone(premiumMetrics.comparison.delta.activeSubscribers)}`}>
                {(() => {
                  const label = formatDelta(premiumMetrics.comparison.delta.activeSubscribers);
                  return label === 'keine Daten' ? 'Keine Vergleichsdaten' : `${label} vs. ${premiumComparisonLabel}`;
                })()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Conversion Rates</p>
              <ul className="text-xs text-muted-foreground">
                <li>
                  CTA → Trial:{' '}
                  {premiumMetrics.conversionRates.ctaToTrial === null
                    ? '–'
                    : `${formatPercent(premiumMetrics.conversionRates.ctaToTrial)}%`}
                  {(() => {
                    const delta = premiumMetrics.comparison.delta.conversionRates.ctaToTrial;
                    const label = formatDelta(delta, { percent: true });
                    return label === 'keine Daten' ? null : (
                      <span className={`ml-1 ${deltaTone(delta)}`}>({label})</span>
                    );
                  })()}
                </li>
                <li>
                  Trial → Upgrade:{' '}
                  {premiumMetrics.conversionRates.trialToUpgrade === null
                    ? '–'
                    : `${formatPercent(premiumMetrics.conversionRates.trialToUpgrade)}%`}
                  {(() => {
                    const delta = premiumMetrics.comparison.delta.conversionRates.trialToUpgrade;
                    const label = formatDelta(delta, { percent: true });
                    return label === 'keine Daten' ? null : (
                      <span className={`ml-1 ${deltaTone(delta)}`}>({label})</span>
                    );
                  })()}
                </li>
                <li>
                  Upgrade → Abschluss:{' '}
                  {premiumMetrics.conversionRates.upgradeToCompletion === null
                    ? '–'
                    : `${formatPercent(premiumMetrics.conversionRates.upgradeToCompletion)}%`}
                  {(() => {
                    const delta = premiumMetrics.comparison.delta.conversionRates.upgradeToCompletion;
                    const label = formatDelta(delta, { percent: true });
                    return label === 'keine Daten' ? null : (
                      <span className={`ml-1 ${deltaTone(delta)}`}>({label})</span>
                    );
                  })()}
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Tageswerte im Zeitraum</p>
              <span className="text-xs text-muted-foreground">Jüngste Ereignisse werden zuerst angezeigt.</span>
            </div>
            {premiumTimeseriesHasSignals ? (
              <ScrollArea className="max-h-60 rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>CTA</TableHead>
                      <TableHead>Trials</TableHead>
                      <TableHead>Upgrades</TableHead>
                      <TableHead>Premium-Abschlüsse</TableHead>
                      <TableHead>CTA → Trial</TableHead>
                      <TableHead>Trial → Upgrade</TableHead>
                      <TableHead>Upgrade → Abschluss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premiumTimeseries.map((point) => (
                      <TableRow key={point.date}>
                        <TableCell>{formatTimeseriesDate(point.date)}</TableCell>
                        <TableCell>{point.totals.ctaViews}</TableCell>
                        <TableCell>{point.totals.trialStarts}</TableCell>
                        <TableCell>{point.totals.upgrades}</TableCell>
                        <TableCell>{point.totals.premiumCompletions}</TableCell>
                        <TableCell>
                          {point.conversionRates.ctaToTrial === null
                            ? '–'
                            : `${formatPercent(point.conversionRates.ctaToTrial)}%`}
                        </TableCell>
                        <TableCell>
                          {point.conversionRates.trialToUpgrade === null
                            ? '–'
                            : `${formatPercent(point.conversionRates.trialToUpgrade)}%`}
                        </TableCell>
                        <TableCell>
                          {point.conversionRates.upgradeToCompletion === null
                            ? '–'
                            : `${formatPercent(point.conversionRates.upgradeToCompletion)}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keine Conversion-Ereignisse im ausgewählten Zeitraum registriert.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Fan-out</CardTitle>
          <CardDescription>
            Dauerhafte Ablage und Transportstatus für Verhandlungsereignisse.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ausstehend</p>
            <p className="text-2xl font-semibold">
              {notificationStats.pendingCount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Fehlgeschlagen</p>
            <p className="text-2xl font-semibold text-destructive">
              {notificationStats.failedCount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Zugestellt (1h)</p>
            <p className="text-2xl font-semibold text-primary">
              {notificationStats.deliveredLastHourCount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Älteste offene Nachricht</p>
            <p className="text-sm">
              {notificationStats.oldestPendingAt
                ? formatDistanceToNow(new Date(notificationStats.oldestPendingAt), { addSuffix: true })
                : 'Keine offenen Nachrichten'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Insights</CardTitle>
          <CardDescription>Resolution-Metriken der letzten 30 Tage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Offene Disputes</p>
            <p className="text-2xl font-semibold">{disputeAnalytics.totalOpen}</p>
            <p className="text-xs text-muted-foreground">{disputeAnalytics.totalEscalated} eskaliert</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Abgeschlossen (30d)</p>
            <p className="text-2xl font-semibold">{disputeAnalytics.resolvedLast30d}</p>
            <p className="text-xs text-muted-foreground">
              Ø Abschlusszeit {formatHours(disputeAnalytics.averageResolutionHoursLast30d)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">SLA-Verletzungsrate</p>
            <p className="text-2xl font-semibold">
              {disputeAnalytics.slaBreachRateLast30d != null
                ? `${(disputeAnalytics.slaBreachRateLast30d * 100).toFixed(0)} %`
                : '–'}
            </p>
            <p className="text-xs text-muted-foreground">Berechnet auf Basis aller abgeschlossenen Fälle</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ausgang (30d)</p>
            <ul className="text-sm">
              <li>Buyer: {disputeAnalytics.winLossBreakdownLast30d.buyer}</li>
              <li>Seller: {disputeAnalytics.winLossBreakdownLast30d.seller}</li>
              <li>Neutral: {disputeAnalytics.winLossBreakdownLast30d.neutral}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute-Queue</CardTitle>
          <CardDescription>Aktuelle Eskalationen mit SLA-Fälligkeiten und Zuständigkeiten.</CardDescription>
        </CardHeader>
        <CardContent>
          {disputeQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Disputes vorhanden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schweregrad</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Zugewiesen</TableHead>
                  <TableHead>Letzte Aktivität</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputeQueue.map((item) => {
                  const holdDisplay = formatEuro(item.holdAmount ?? 0);
                  const counterDisplay =
                    typeof item.counterProposalAmount === 'number'
                      ? formatEuro(item.counterProposalAmount)
                      : null;
                  const payoutDisplay =
                    typeof item.resolutionPayoutAmount === 'number'
                      ? formatEuro(item.resolutionPayoutAmount)
                      : null;
                  const slaOverdueSince = item.slaBreachedAt
                    ? formatDistanceToNow(new Date(item.slaBreachedAt), { addSuffix: true })
                    : null;
                  const checklistAnchor = `dispute-${item.id}-checklist`;

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{item.summary}</span>
                          <span className="text-xs text-muted-foreground">
                            Deal {shortenId(item.negotiationId)} · Status {item.negotiationStatus ?? 'unbekannt'}
                          </span>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Gesperrt: {holdDisplay}</span>
                            {counterDisplay ? <span>Vorschlag: {counterDisplay}</span> : null}
                            {payoutDisplay ? <span>Ausgezahlt: {payoutDisplay}</span> : null}
                            {item.escrowStatus ? <span>Escrow: {item.escrowStatus}</span> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(item.status)}>{formatDisputeStatus(item.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severityTone(item.severity)}>
                          {formatDisputeSeverity(item.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {item.slaDueAt
                              ? formatDistanceToNow(new Date(item.slaDueAt), { addSuffix: true })
                              : '–'}
                          </span>
                          {item.slaBreachedAt ? (
                            <Badge variant="destructive" className="w-fit">
                              Überfällig {slaOverdueSince}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.assignedTo ? (
                          <div className="text-sm">
                            <p>{item.assignedTo.name ?? shortenId(item.assignedTo.id)}</p>
                            <p className="text-xs text-muted-foreground">{item.assignedTo.email ?? '—'}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unzugewiesen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.latestEvent
                        ? formatDistanceToNow(new Date(item.latestEvent.createdAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(item.raisedAt), { addSuffix: true })}
                    </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex flex-wrap justify-end gap-2">
                            {availableStatusTransitions(item.status).map((transition) => (
                              <form
                                key={`${item.id}-${transition.status}`}
                                action={updateDisputeStatusAction}
                              className="inline-flex"
                            >
                              <input type="hidden" name="disputeId" value={item.id} />
                              <input type="hidden" name="targetStatus" value={transition.status} />
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={item.status === transition.status}
                                type="submit"
                              >
                                {transition.label}
                              </Button>
                            </form>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <form action={assignDisputeAction} className="inline-flex">
                              <input type="hidden" name="disputeId" value={item.id} />
                            <input type="hidden" name="assigneeUserId" value={adminUserId ?? ''} />
                            <Button
                              size="sm"
                              variant="secondary"
                              type="submit"
                              disabled={!adminUserId || item.assignedTo?.id === adminUserId}
                            >
                              Mir zuweisen
                            </Button>
                          </form>
                          <form action={assignDisputeAction} className="inline-flex">
                            <input type="hidden" name="disputeId" value={item.id} />
                            <input type="hidden" name="assigneeUserId" value="" />
                              <Button
                                size="sm"
                                variant="ghost"
                                type="submit"
                                disabled={!item.assignedTo}
                              >
                                Freigeben
                              </Button>
                            </form>
                          </div>
                          <div className="mt-2 flex w-full flex-col gap-2">
                            <form action={applyDisputeHoldAction} className="flex flex-wrap justify-end gap-2">
                              <input type="hidden" name="disputeId" value={item.id} />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                name="amount"
                                placeholder="Betrag"
                                className="h-8 w-24"
                                required
                              />
                              <Input
                                type="text"
                                name="reason"
                                placeholder="Grund (optional)"
                                className="h-8 w-40"
                              />
                              <Button size="sm" variant="outline" type="submit">
                                Hold setzen
                              </Button>
                            </form>
                            <form
                              action={recordDisputeCounterProposalAction}
                              className="flex flex-wrap justify-end gap-2"
                            >
                              <input type="hidden" name="disputeId" value={item.id} />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                name="amount"
                                placeholder="Vorschlag"
                                className="h-8 w-24"
                                required
                              />
                              <Input
                                type="text"
                                name="note"
                                placeholder="Notiz (optional)"
                                className="h-8 w-40"
                              />
                              <Button size="sm" variant="outline" type="submit">
                                Vorschlag sichern
                              </Button>
                            </form>
                            <form action={settleDisputePayoutAction} className="flex flex-wrap justify-end gap-2">
                              <input type="hidden" name="disputeId" value={item.id} />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                name="amount"
                                placeholder="Auszahlung"
                                className="h-8 w-24"
                                required
                              />
                              <select
                                name="direction"
                                className="h-8 rounded-md border border-slate-200 bg-background px-2 text-sm"
                                defaultValue="RELEASE_TO_SELLER"
                              >
                                <option value="RELEASE_TO_SELLER">An Anbieter</option>
                                <option value="REFUND_TO_BUYER">An Käufer</option>
                              </select>
                              <Input
                                type="text"
                                name="note"
                                placeholder="Kommentar (optional)"
                                className="h-8 w-40"
                              />
                              <Button size="sm" variant="secondary" type="submit">
                                Auszahlung loggen
                              </Button>
                            </form>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={7}>
                        <div className="grid gap-4 md:grid-cols-3" id={`dispute-${item.id}-guidance`}>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Empfohlene Schritte</p>
                            {item.guidance.recommendations.length > 0 ? (
                              item.guidance.recommendations.map((recommendation) => (
                                <div key={recommendation.id} className="rounded-md border bg-background p-3 shadow-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-medium">{recommendation.title}</p>
                                      <p className="text-xs text-muted-foreground">{recommendation.rationale}</p>
                                    </div>
                                    <span
                                      className={`rounded px-2 py-0.5 text-[10px] uppercase ${recommendationPriorityTone(recommendation.priority)}`}
                                    >
                                      {recommendation.priority}
                                    </span>
                                  </div>
                                  {recommendation.actions.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {recommendation.actions.map((action) => {
                                        if (action.type === 'status' && action.targetStatus) {
                                          return (
                                            <form
                                              key={`${recommendation.id}-${action.targetStatus}`}
                                              action={updateDisputeStatusAction}
                                            >
                                              <input type="hidden" name="disputeId" value={item.id} />
                                              <input type="hidden" name="targetStatus" value={action.targetStatus} />
                                              <Button size="sm" variant="outline" type="submit">
                                                {action.label}
                                              </Button>
                                            </form>
                                          );
                                        }

                                        if (action.type === 'workflow' && action.href) {
                                          const href = action.href.startsWith('#') ? `#${checklistAnchor}` : action.href;
                                          return (
                                            <Button key={`${recommendation.id}-${action.label}`} size="sm" variant="secondary" asChild>
                                              <Link href={href}>{action.label}</Link>
                                            </Button>
                                          );
                                        }

                                        if (action.type === 'communication' && action.templateId) {
                                          const template = item.guidance.communications.find(
                                            (entry) => entry.id === action.templateId
                                          );
                                          if (!template) {
                                            return null;
                                          }

                                          return (
                                            <details
                                              key={`${recommendation.id}-${action.templateId}`}
                                              className="w-full rounded border border-dashed p-2 text-left"
                                            >
                                              <summary className="cursor-pointer text-xs font-medium">
                                                {action.label}
                                              </summary>
                                              <div className="mt-2 space-y-1 text-xs">
                                                <p className="font-semibold">Betreff: {template.subject}</p>
                                                <pre className="whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs">
                                                  {template.body}
                                                </pre>
                                                <p className="text-[10px] uppercase text-muted-foreground">
                                                  Ton: {template.tone} · Audience: {template.audience}
                                                </p>
                                              </div>
                                            </details>
                                          );
                                        }

                                        return null;
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Keine besonderen Empfehlungen – Standardprozess fortsetzen.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Kommunikationsvorlagen</p>
                            <ScrollArea className="max-h-52 rounded-md border">
                              <ul className="space-y-2 p-3 text-sm">
                                {item.guidance.communications.map((template) => (
                                  <li key={template.id} className="space-y-1">
                                    <p className="font-medium">{template.label}</p>
                                    <p className="text-xs text-muted-foreground">Betreff: {template.subject}</p>
                                    <pre className="whitespace-pre-wrap rounded bg-muted/60 p-2 text-xs">
                                      {template.body}
                                    </pre>
                                    <p className="text-[10px] uppercase text-muted-foreground">
                                      Audience: {template.audience} · Ton: {template.tone}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Compliance & Kennzahlen</p>
                            <ul className="space-y-2" id={checklistAnchor}>
                              {item.guidance.checklist.map((check) => (
                                <li key={check.id} className="flex items-start gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={check.completed}
                                    readOnly
                                    className="mt-1 h-4 w-4 rounded border border-slate-300 text-primary focus-visible:outline-none"
                                  />
                                  <div>
                                    <p>{check.label}</p>
                                    {check.hint ? <p className="text-xs text-muted-foreground">{check.hint}</p> : null}
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>Offen seit: {formatHours(item.analytics.openHours)}</p>
                              <p>
                                SLA in:
                                {item.analytics.hoursUntilBreach != null
                                  ? ` ${formatHours(item.analytics.hoursUntilBreach)}`
                                  : item.analytics.hoursSinceBreach != null
                                  ? ` überschritten (${formatHours(item.analytics.hoursSinceBreach)})`
                                  : ' –'}
                              </p>
                              <p>Abschlusszeit: {formatHours(item.analytics.hoursToResolution)}</p>
                              <p>Reopenings: {item.analytics.reopenedCount}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation-Warnungen</CardTitle>
          <CardDescription>Provider-Statements mit Ledger-Differenzen &gt; 0,01 EUR.</CardDescription>
        </CardHeader>
        <CardContent>
          {reconciliationAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Abweichungen registriert.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Ledger</TableHead>
                  <TableHead>Statement</TableHead>
                  <TableHead>Erfasst</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliationAlerts.map((alert) => (
                  <TableRow key={`${alert.negotiationId}-${alert.statementId ?? alert.occurredAt.toISOString()}`}>
                    <TableCell className="font-medium">{shortenId(alert.negotiationId)}</TableCell>
                    <TableCell className="text-destructive font-semibold">
                      {formatEuro(alert.delta)}
                    </TableCell>
                    <TableCell>{formatEuro(alert.providerBalance)}</TableCell>
                    <TableCell>{formatEuro(alert.ledgerBalance)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {alert.statementId ?? '–'}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(alert.occurredAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funding-Latenz</CardTitle>
          <CardDescription>Durchschnittliche Zeit bis zur Escrow-Finanzierung inklusive Überwachung offener Konten.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Durchschnitt</p>
              <p className="text-2xl font-semibold">{formatMinutes(fundingMetrics.averageMinutes)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Median</p>
              <p className="text-2xl font-semibold">{formatMinutes(fundingMetrics.medianMinutes)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">90. Perzentil</p>
              <p className="text-2xl font-semibold">{formatMinutes(fundingMetrics.percentile90Minutes)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Wartend (&gt; {fundingMetrics.overdueThresholdHours}h)</p>
              <p className="text-2xl font-semibold">
                {fundingMetrics.overdueAwaitingCount}/{fundingMetrics.awaitingFundingCount}
              </p>
            </div>
          </div>

          {fundingMetrics.sampleSize === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine abgeschlossenen Finanzierungsbestätigungen vorhanden.
            </p>
          ) : (
            <div>
              <p className="text-sm font-medium">Letzte Finanzierungen</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {fundingMetrics.recentSamples.map((sample) => (
                  <li key={`${sample.negotiationId}-${sample.occurredAt.toISOString()}`}>
                    <span className="font-medium text-foreground">{shortenId(sample.negotiationId)}</span>
                    {` · ${sample.minutes.toFixed(1)} min · ${formatDistanceToNow(new Date(sample.occurredAt), {
                      addSuffix: true,
                    })}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {premiumProfile && premiumProfile.hasConciergeSla ? null : (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Concierge SLA aktivieren</CardTitle>
            <CardDescription>
              {premiumProfile?.upgradePrompt?.description ??
                'Concierge-Abonnenten erhalten Priorität bei Eskalationen und können Dispute direkt im Backoffice fast-tracken.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {upgradeParam === 'premium'
                ? 'Upgrade ausgelöst – melden Sie sich im Workspace erneut an, um die Concierge-Entitlements zu laden.'
                : premiumProfile?.upgradePrompt?.headline ?? 'Upgrade erforderlich, um Concierge-SLA-Werkzeuge zu nutzen.'}
            </div>
            <Link
              href="/admin/deals/operations/upgrade"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {premiumProfile?.upgradePrompt?.cta ?? 'Upgrade-Flow öffnen'}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
