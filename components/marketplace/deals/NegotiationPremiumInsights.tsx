'use client';

/**
 * meta: component=NegotiationPremiumInsights version=0.1 owner=platform
 */
import Link from 'next/link';
import { differenceInHours, parseISO } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NegotiationSnapshot } from '@/types/negotiations';

interface NegotiationPremiumInsightsProps {
  negotiation: NegotiationSnapshot;
}

function resolveHoursOpen(negotiation: NegotiationSnapshot) {
  const startedAt = parseISO(negotiation.initiatedAt);
  const reference = negotiation.contract?.finalizedAt ? new Date(negotiation.contract.finalizedAt) : new Date();
  return Math.max(differenceInHours(reference, startedAt), 0);
}

export function NegotiationPremiumInsights({ negotiation }: NegotiationPremiumInsightsProps) {
  const viewer = negotiation.premium?.viewer;
  const upgradePrompt = viewer?.upgradePrompt ?? negotiation.premium?.upgradePrompt ?? null;
  const seatCapacityExceeded = viewer?.isSeatCapacityExceeded ?? false;
  const dunningState = viewer?.dunningState ?? 'NONE';
  const gracePeriodEndsAt = viewer?.gracePeriodEndsAt ? new Date(viewer.gracePeriodEndsAt) : null;

  if (viewer && dunningState === 'PAYMENT_FAILED') {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardHeader>
          <CardTitle>Zahlung ausstehend</CardTitle>
          <CardDescription>
            {gracePeriodEndsAt
              ? `Zahlung fehlgeschlagen. Grace Period endet am ${gracePeriodEndsAt.toLocaleDateString('de-DE')}.`
              : 'Zahlung fehlgeschlagen. Bitte Methode aktualisieren, um Premium-Insights zu behalten.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-destructive-foreground">
            Premium-Analytics und Concierge-SLAs werden nach Ablauf der Grace Period pausiert.
          </div>
          <Link
            href="/admin/deals/operations/upgrade"
            className="inline-flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
          >
            {upgradePrompt?.cta ?? 'Zahlungsdaten aktualisieren'}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (viewer && seatCapacityExceeded) {
    return (
      <Card className="border-amber-400/60 bg-amber-50">
        <CardHeader>
          <CardTitle>Sitzplatzlimit erreicht</CardTitle>
          <CardDescription>
            Alle verfügbaren Premium-Sitzplätze sind belegt. Entfernen Sie inaktive Nutzer:innen oder erhöhen Sie das Kontingent.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-amber-800">
            {viewer.seatCapacity != null && viewer.seatsInUse != null
              ? `${viewer.seatsInUse} von ${viewer.seatCapacity} Sitzplätzen belegt.`
              : 'Sitzplatzkontingent bitte im Admin-Center prüfen.'}
          </div>
          <Link
            href="/admin/deals/operations/upgrade"
            className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-amber-50"
          >
            Sitzplätze verwalten
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!viewer || !viewer.hasAdvancedAnalytics) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle>Premium Insights freischalten</CardTitle>
          <CardDescription>
            {upgradePrompt?.description ??
              'Premium Analytics liefert SLA-Signale, Deal-Durchlaufzeiten und Fast-Track-Funktionen für kritische Verhandlungen.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {upgradePrompt?.headline ?? 'Jetzt Concierge- und Analytics-Entitlements aktivieren.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Für bestehende Trials bitte Checkout abschließen, damit Webhooks Entitlements aktivieren.
            </p>
          </div>
          <Link
            href="/admin/deals/operations/upgrade"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {upgradePrompt?.cta ?? 'Upgrade starten'}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hoursOpen = resolveHoursOpen(negotiation);
  const offerCount = negotiation.offers.length;
  const slaStatus = negotiation.premium?.viewer.hasConciergeSla
    ? 'Concierge SLA aktiv – Reaktionszeit 4 Stunden'
    : 'Standard SLA – 24 Stunden Zielreaktion';
  const seatSummary = (() => {
    if (viewer?.seatCapacity == null) {
      return null;
    }
    if (viewer.seatsInUse == null) {
      return `${viewer.seatCapacity} Sitzplätze`;
    }
    return `${viewer.seatsInUse}/${viewer.seatCapacity} Sitze`;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Insights</CardTitle>
        <CardDescription>
          Erweiterte Deal-Analytics für priorisierte Entscheidungen und SLA-Steuerung.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Angebotsiterationen</p>
            <p className="text-2xl font-semibold">{offerCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Verhandlungsdauer (h)</p>
            <p className="text-2xl font-semibold">{hoursOpen}</p>
          </div>
          <div>
            <p className="text-muted-foreground">SLA Plan</p>
            <p className="text-base font-medium">{slaStatus}</p>
            {viewer.segment ? (
              <p className="text-xs text-muted-foreground">Segment: {viewer.segment}</p>
            ) : null}
          </div>
        </div>
        {seatSummary ? (
          <div className="text-xs text-muted-foreground">
            {viewer?.isInGracePeriod && gracePeriodEndsAt
              ? `Grace Period aktiv bis ${gracePeriodEndsAt.toLocaleDateString('de-DE')} · ${seatSummary}`
              : `Premium-Sitzplätze: ${seatSummary}`}
          </div>
        ) : null}
        {viewer.recommendations && viewer.recommendations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Empfohlene nächste Schritte
            </p>
            <ul className="space-y-2">
              {viewer.recommendations.map((rec, index) => (
                <li key={`${rec.targetTier}-${index}`} className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-medium">{rec.headline}</p>
                  <p className="text-xs text-muted-foreground">{rec.action}</p>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {rec.rationale ? `Begründung: ${rec.rationale}` : null} ({rec.confidence} · {rec.targetTier})
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
