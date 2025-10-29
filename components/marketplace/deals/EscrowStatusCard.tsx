'use client';

import { ArrowDownToLine, ArrowUpFromLine, Banknote, CreditCard, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EscrowAccountSnapshot } from '@/types/negotiations';

interface EscrowStatusCardProps {
  escrow?: EscrowAccountSnapshot | null;
  currency: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_SETUP: 'Wird eingerichtet',
  AWAITING_FUNDS: 'Wartet auf Einzahlung',
  FUNDED: 'Vollständig befüllt',
  RELEASED: 'Ausgezahlt',
  REFUNDED: 'Rückerstattet',
  DISPUTED: 'In Prüfung',
  CLOSED: 'Geschlossen',
};

const TRANSACTION_ICONS: Record<string, JSX.Element> = {
  FUND: <Banknote className="h-4 w-4 text-emerald-500" />,
  RELEASE: <ArrowUpFromLine className="h-4 w-4 text-blue-500" />,
  REFUND: <RotateCcw className="h-4 w-4 text-amber-500" />,
  ADJUSTMENT: <CreditCard className="h-4 w-4 text-muted-foreground" />,
};

export function EscrowStatusCard({ escrow, currency }: EscrowStatusCardProps) {
  if (!escrow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Treuhandkonto</CardTitle>
          <CardDescription>Noch kein Treuhandkonto eingerichtet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const expected = escrow.expectedAmount ?? 0;
  const outstanding = Math.max(expected - escrow.fundedAmount, 0);
  const availableBalance = Math.max(escrow.fundedAmount - escrow.releasedAmount - escrow.refundedAmount, 0);

  const latestReconciliation = escrow.transactions.find((transaction) => {
    if (transaction.type !== 'ADJUSTMENT') {
      return false;
    }

    const metadata = (transaction.metadata ?? {}) as { reconciliation?: { status?: string; delta?: number } };
    return Boolean(metadata.reconciliation);
  });

  const reconciliationMeta = latestReconciliation?.metadata as
    | { reconciliation?: { status?: string; delta?: number } }
    | undefined;

  const warnings: string[] = [];

  if (escrow.status === 'DISPUTED') {
    warnings.push('Escrow befindet sich in einem Disput beim Provider. Bitte Vorgang prüfen.');
  }

  if (reconciliationMeta?.reconciliation?.status === 'MISMATCH') {
    const delta = reconciliationMeta.reconciliation.delta ?? 0;
    warnings.push(
      `Abgleich meldet Differenz von ${delta.toLocaleString('de-DE', {
        style: 'currency',
        currency,
      })}. Bitte Kontobewegungen verifizieren.`
    );
  }

  if (escrow.releasedAmount > 0 && availableBalance > 0) {
    warnings.push('Teilfreigabe erfolgt – Restbetrag verbleibt im Escrow. SLA beachten.');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Treuhandkonto</CardTitle>
          <CardDescription>Überblick über Einzahlungen und Auszahlungen.</CardDescription>
        </div>
        <Badge variant="outline">{STATUS_LABELS[escrow.status] ?? escrow.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {warnings.length > 0 ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Warnungen</p>
            <ul className="list-disc space-y-1 pl-4">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Erwarteter Betrag</p>
            <p className="font-semibold">
              {expected.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Eingezahlt</p>
            <p className="font-semibold">
              {escrow.fundedAmount.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Freigegeben</p>
            <p className="font-semibold">
              {escrow.releasedAmount.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Rückerstattet</p>
            <p className="font-semibold">
              {escrow.refundedAmount.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Verfügbar</p>
            <p className="font-semibold">
              {availableBalance.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Offene Einzahlung</p>
            <p className="font-semibold">
              {outstanding.toLocaleString('de-DE', { style: 'currency', currency })}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Kontoaktivität</p>
          <ul className="space-y-3">
            {escrow.transactions.length === 0 ? (
              <li className="text-sm text-muted-foreground">Noch keine Transaktionen erfasst.</li>
            ) : (
              escrow.transactions
                .slice()
                .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                .map((transaction) => {
                  const metadata = (transaction.metadata ?? {}) as {
                    reconciliation?: { status?: string; delta?: number };
                    dispute?: { state?: string };
                  };
                  const details: string[] = [];

                  if (metadata.reconciliation?.status) {
                    const delta = metadata.reconciliation.delta;
                    if (typeof delta === 'number') {
                      details.push(
                        `Reconciliation: ${metadata.reconciliation.status} (${delta.toLocaleString('de-DE', {
                          style: 'currency',
                          currency,
                        })})`
                      );
                    } else {
                      details.push(`Reconciliation: ${metadata.reconciliation.status}`);
                    }
                  }

                  if (metadata.dispute?.state) {
                    details.push(`Disput-Status: ${metadata.dispute.state}`);
                  }

                  return (
                    <li key={transaction.id} className="space-y-1 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {TRANSACTION_ICONS[transaction.type] ?? <ArrowDownToLine className="h-4 w-4" />}
                          <span className="font-medium">{transaction.type}</span>
                        </div>
                        <span>{transaction.amount.toLocaleString('de-DE', { style: 'currency', currency })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(transaction.occurredAt).toLocaleString('de-DE')}</span>
                        {details.length > 0 ? <span>{details.join(' • ')}</span> : null}
                      </div>
                    </li>
                  );
                })
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
