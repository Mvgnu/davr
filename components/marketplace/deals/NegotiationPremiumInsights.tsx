'use client';

/**
 * meta: component=NegotiationPremiumInsights version=0.1 owner=platform
 */
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
  const hoursOpen = resolveHoursOpen(negotiation);
  const offerCount = negotiation.offers.length;
  const slaStatus = negotiation.premium?.viewer.hasConciergeSla
    ? 'Concierge SLA aktiv – Reaktionszeit 4 Stunden'
    : 'Standard SLA – 24 Stunden Zielreaktion';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Insights</CardTitle>
        <CardDescription>
          Erweiterte Deal-Analytics für priorisierte Entscheidungen und SLA-Steuerung.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
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
        </div>
      </CardContent>
    </Card>
  );
}
