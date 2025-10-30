'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminPremiumUpgradeFlowProps {
  tier?: 'PREMIUM' | 'CONCIERGE';
}

type UpgradeAction = 'START_TRIAL' | 'UPGRADE_CONFIRMED';

type UpgradeStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * meta: component=AdminPremiumUpgradeFlow version=0.1 owner=platform
 */
export function AdminPremiumUpgradeFlow({ tier = 'PREMIUM' }: AdminPremiumUpgradeFlowProps) {
  const [status, setStatus] = useState<UpgradeStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const triggerUpgrade = async (action: UpgradeAction) => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/marketplace/premium/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, tier }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          payload?.message ?? payload?.error ??
          (response.status === 503
            ? 'Zahlungsanbieter steht derzeit nicht zur Verfügung.'
            : 'Upgrade fehlgeschlagen');
        throw new Error(errorMessage);
      }

      if (payload?.checkoutSession?.url) {
        setStatus('success');
        setMessage('Weiterleitung zum Stripe-Checkout …');
        window.location.assign(payload.checkoutSession.url);
        return;
      }

      setStatus('success');
      setMessage(action === 'START_TRIAL' ? 'Testphase wurde aktiviert.' : 'Concierge-Abonnement ist aktiv.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  };

  return (
    <div className="space-y-4">
      {(status === 'success' || status === 'error') && (
        <Alert variant={status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{status === 'success' ? 'Aktion erfolgreich' : 'Aktion fehlgeschlagen'}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => triggerUpgrade('START_TRIAL')}
          disabled={status === 'loading'}
          variant="secondary"
        >
          Testphase starten
        </Button>
        <Button onClick={() => triggerUpgrade('UPGRADE_CONFIRMED')} disabled={status === 'loading'}>
          Concierge aktivieren
        </Button>
      </div>
      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground">Upgrade wird verarbeitet …</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aktionen lösen automatisch die entsprechenden Premium-Entitlements und Tracking-Ereignisse aus.
        </p>
      )}
    </div>
  );
}
