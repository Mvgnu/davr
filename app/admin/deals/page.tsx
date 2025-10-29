import { addHours, differenceInHours, isAfter } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { getPremiumProfileForUser } from '@/lib/premium/entitlements';
import { EscrowTransactionType, type NegotiationStatus } from '@prisma/client';

interface AdminDealsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const TERMINAL_STATUSES: NegotiationStatus[] = ['CANCELLED', 'COMPLETED', 'EXPIRED'];

function parseStringParam(value: string | string[] | undefined) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDealsPage({ searchParams }: AdminDealsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin && session?.user?.role !== 'ADMIN') {
    return <p className="text-sm text-muted-foreground">Kein Zugriff auf das Deal-Backoffice.</p>;
  }

  const statusFilter = parseStringParam(searchParams?.status) ?? 'ALL';
  const slaFilter = parseStringParam(searchParams?.sla) ?? 'ALL';
  const premiumFilter = parseStringParam(searchParams?.premium) ?? 'ALL';

  const now = new Date();
  const slaWarningThreshold = addHours(now, 24);

  const premiumProfile = session?.user?.id ? await getPremiumProfileForUser(session.user.id) : null;

  const negotiations = await prisma.negotiation.findMany({
    where: {
      ...(statusFilter !== 'ALL' ? { status: statusFilter as NegotiationStatus } : {}),
      ...(premiumFilter === 'PREMIUM'
        ? { listing: { isPremiumWorkflow: true } }
        : premiumFilter === 'STANDARD'
          ? { listing: { isPremiumWorkflow: false } }
          : {}),
      ...(slaFilter === 'AT_RISK'
        ? {
            expiresAt: {
              not: null,
              gte: now,
              lte: slaWarningThreshold,
            },
          }
        : slaFilter === 'BREACHED'
          ? {
              expiresAt: {
                not: null,
                lt: now,
              },
              status: { notIn: TERMINAL_STATUSES },
            }
          : {}),
    },
    include: {
      listing: { select: { title: true, isPremiumWorkflow: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      escrowAccount: {
        select: {
          expectedAmount: true,
          fundedAmount: true,
          status: true,
          providerReference: true,
          transactions: {
            where: {
              type: { in: [EscrowTransactionType.ADJUSTMENT, EscrowTransactionType.FUND] },
            },
            select: {
              id: true,
              type: true,
              amount: true,
              occurredAt: true,
              metadata: true,
            },
            orderBy: { occurredAt: 'desc' },
            take: 10,
          },
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 1,
        select: { label: true, occurredAt: true, type: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  const totalEscrowVolume = negotiations.reduce((sum, negotiation) => sum + (negotiation.escrowAccount?.fundedAmount ?? 0), 0);
  const activeCount = negotiations.filter((negotiation) => !TERMINAL_STATUSES.includes(negotiation.status)).length;
  const slaRiskCount = negotiations.filter((negotiation) =>
    negotiation.expiresAt ? isAfter(slaWarningThreshold, negotiation.expiresAt) && isAfter(negotiation.expiresAt, now) : false
  ).length;
  const slaBreachedCount = negotiations.filter((negotiation) =>
    negotiation.expiresAt ? isAfter(now, negotiation.expiresAt) && !TERMINAL_STATUSES.includes(negotiation.status) : false
  ).length;
  const disputeCount = negotiations.filter((negotiation) => negotiation.escrowAccount?.status === 'DISPUTED').length;
  const reconciliationAlerts = negotiations.filter((negotiation) =>
    negotiation.escrowAccount?.transactions?.some((transaction) => {
      if (transaction.type !== 'ADJUSTMENT') {
        return false;
      }
      const metadata = (transaction.metadata ?? {}) as { reconciliation?: { status?: string } };
      return metadata.reconciliation?.status === 'MISMATCH';
    })
  ).length;
  const fundingLatencies = negotiations
    .map((negotiation) => {
      if (!negotiation.escrowAccount?.transactions) {
        return null;
      }
      const fundTransactions = negotiation.escrowAccount.transactions
        .filter((transaction) => transaction.type === 'FUND')
        .map((transaction) => new Date(transaction.occurredAt));
      if (fundTransactions.length === 0 || !negotiation.createdAt) {
        return null;
      }
      const earliestFund = fundTransactions.reduce((earliest, current) =>
        current < earliest ? current : earliest
      , fundTransactions[0]);
      const latency = differenceInHours(earliestFund, negotiation.createdAt);
      return Math.abs(latency);
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const averageFundingLatency = fundingLatencies.length
    ? fundingLatencies.reduce((sum, hours) => sum + hours, 0) / fundingLatencies.length
    : null;

  return (
    <div className="space-y-6">
      {premiumProfile && !premiumProfile.hasAdvancedAnalytics ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Premium-Metriken freischalten</CardTitle>
            <CardDescription>
              Aktivieren Sie Premium Analytics und Concierge-SLA, um Disputes schneller zu lösen und SLA-Backlogs
              transparent zu überwachen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/app/admin/deals/operations?upgrade=premium"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Upgrade jetzt starten
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {slaBreachedCount > 0 ? (
        <Card className="border-destructive/60 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">SLA Verletzungen aktiv</CardTitle>
            <CardDescription>
              {slaBreachedCount} Verhandlungen haben SLAs überschritten und benötigen sofortige Aufmerksamkeit.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Deal-Workspace Übersicht</CardTitle>
          <CardDescription>Lifecycle-Überblick über laufende Verhandlungen und Treuhandkonten.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <p className="text-muted-foreground">Aktive Verhandlungen</p>
            <p className="text-2xl font-semibold">{activeCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Treuhandvolumen</p>
            <p className="text-2xl font-semibold">
              {totalEscrowVolume.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">SLA Risiko (24h)</p>
            <p className="text-2xl font-semibold">{slaRiskCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Disputes offen</p>
            <p className="text-2xl font-semibold">{disputeCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reconciliation Warnungen</p>
            <p className="text-2xl font-semibold">{reconciliationAlerts}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ø Funding Latenz (h)</p>
            <p className="text-2xl font-semibold">
              {averageFundingLatency !== null ? averageFundingLatency.toFixed(1) : '–'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Status-, SLA- und Premium-Filter für gezielte Eskalationen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {['ALL', 'INITIATED', 'COUNTERING', 'AGREED', 'CONTRACT_DRAFTING', 'CONTRACT_SIGNED', 'ESCROW_FUNDED'].map((value) => (
              <Link
                key={value}
                href={{
                  pathname: '/admin/deals',
                  query: { ...searchParams, status: value },
                }}
                className={`rounded-full border px-3 py-1 ${statusFilter === value ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}
              >
                {value === 'ALL' ? 'Alle' : value.replace('_', ' ')}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span>SLA:</span>
            {[
              { value: 'ALL', label: 'Alle' },
              { value: 'AT_RISK', label: '24h Risiko' },
              { value: 'BREACHED', label: 'Verletzt' },
            ].map((option) => (
              <Link
                key={option.value}
                href={{ pathname: '/admin/deals', query: { ...searchParams, sla: option.value } }}
                className={`rounded-full border px-3 py-1 ${slaFilter === option.value ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span>Workflow:</span>
            {[
              { value: 'ALL', label: 'Alle' },
              { value: 'PREMIUM', label: 'Premium' },
              { value: 'STANDARD', label: 'Standard' },
            ].map((option) => (
              <Link
                key={option.value}
                href={{ pathname: '/admin/deals', query: { ...searchParams, premium: option.value } }}
                className={`rounded-full border px-3 py-1 ${premiumFilter === option.value ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verhandlungsdetails</CardTitle>
          <CardDescription>Letzte Aktivitäten, Escrow-Status und Premium-Kennzeichnung.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Buyer / Seller</TableHead>
                <TableHead>Letztes Ereignis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiations.map((negotiation) => {
                const activity = negotiation.activities[0];
                const isPremium = negotiation.listing.isPremiumWorkflow;
                const escrow = negotiation.escrowAccount;
                const hasReconciliationWarning = escrow?.transactions?.some((transaction) => {
                  if (transaction.type !== 'ADJUSTMENT') {
                    return false;
                  }
                  const metadata = (transaction.metadata ?? {}) as { reconciliation?: { status?: string } };
                  return metadata.reconciliation?.status === 'MISMATCH';
                });
                return (
                  <TableRow key={negotiation.id}>
                    <TableCell className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {negotiation.listing.title}
                        {isPremium ? <Badge variant="secondary">Premium</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">#{negotiation.id.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TERMINAL_STATUSES.includes(negotiation.status) ? 'outline' : 'default'}>
                        {negotiation.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {escrow ? (
                        <div className="space-y-1 text-xs">
                          <p>
                            {escrow.fundedAmount.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}{' '}
                            /{' '}
                            {(escrow.expectedAmount ?? 0).toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{escrow.status}</Badge>
                            {escrow.status === 'DISPUTED' ? (
                              <Badge variant="destructive">Disput</Badge>
                            ) : null}
                            {hasReconciliationWarning ? (
                              <Badge variant="secondary">Reconciliation Warnung</Badge>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kein Escrow</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p>Käufer: {negotiation.buyer?.name ?? 'Unbekannt'}</p>
                      <p>Verkäufer: {negotiation.seller?.name ?? 'Unbekannt'}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {activity ? (
                        <div>
                          <p className="font-medium">{activity.label}</p>
                          <p className="text-muted-foreground">
                            {new Date(activity.occurredAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Keine Aktivitäten</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
