'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NegotiationContractCard } from '@/components/marketplace/deals/NegotiationContractCard';
import { NegotiationOfferComposer } from '@/components/marketplace/deals/NegotiationOfferComposer';
import { NegotiationTimeline } from '@/components/marketplace/deals/NegotiationTimeline';
import { EscrowStatusCard } from '@/components/marketplace/deals/EscrowStatusCard';
import { NegotiationPremiumInsights } from '@/components/marketplace/deals/NegotiationPremiumInsights';
import { useNegotiationWorkspace } from '@/hooks/useNegotiationWorkspace';
import type { NegotiationSnapshot } from '@/types/negotiations';

interface NegotiationWorkspaceProps {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  initialNegotiationId?: string | null;
  currency?: string;
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'EXPIRED']);

export function NegotiationWorkspace({
  listingId,
  listingTitle,
  sellerId,
  initialNegotiationId,
  currency = 'EUR',
}: NegotiationWorkspaceProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');

  const [activeNegotiationId, setActiveNegotiationId] = useState<string | null>(initialNegotiationId ?? null);
  const [creationPrice, setCreationPrice] = useState<string>('');
  const [creationQuantity, setCreationQuantity] = useState<string>('');
  const [creationMessage, setCreationMessage] = useState<string>('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { negotiation, actions, isLoading, error, realtime, refresh } = useNegotiationWorkspace(activeNegotiationId);
  const upgradeTrackedRef = useRef<string | null>(null);

  const role: 'BUYER' | 'SELLER' | 'ADMIN' | null = useMemo(() => {
    if (!userId) {
      return null;
    }

    if (isAdmin) {
      return 'ADMIN';
    }

    if (negotiation?.buyerId === userId) {
      return 'BUYER';
    }

    if (negotiation?.sellerId === userId) {
      return 'SELLER';
    }

    if (sellerId === userId) {
      return 'SELLER';
    }

    return null;
  }, [isAdmin, negotiation?.buyerId, negotiation?.sellerId, sellerId, userId]);

  const canCreateNegotiation = Boolean(
    !activeNegotiationId && userId && sellerId !== userId && !isLoading && !negotiation
  );

  const handleCreateNegotiation = async () => {
    if (!userId) {
      setCreationError('Bitte melden Sie sich an, um eine Verhandlung zu starten.');
      return;
    }

    const priceValueRaw = creationPrice ? Number.parseFloat(creationPrice) : NaN;
    if (!Number.isFinite(priceValueRaw)) {
      setCreationError('Bitte geben Sie einen gültigen Preis an.');
      return;
    }

    const quantityValueRaw = creationQuantity ? Number.parseFloat(creationQuantity) : undefined;
    const payload = {
      listingId,
      initialOfferPrice: priceValueRaw,
      initialOfferQuantity: Number.isFinite(quantityValueRaw ?? NaN) ? quantityValueRaw : undefined,
      message: creationMessage || undefined,
      currency,
    };

    setIsCreating(true);
    setCreationError(null);

    try {
      const response = await fetch('/api/marketplace/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.negotiation) {
        throw new Error(result.message ?? 'Verhandlung konnte nicht gestartet werden');
      }

      setActiveNegotiationId(result.negotiation.id as string);
      setCreationPrice('');
      setCreationQuantity('');
      setCreationMessage('');
    } catch (creationException) {
      setCreationError(
        creationException instanceof Error ? creationException.message : 'Verhandlung konnte nicht gestartet werden'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const safeAction = async (
    handler: ((payload: Record<string, unknown>) => Promise<unknown>) | null | undefined,
    payload: Record<string, unknown>
  ) => {
    if (!handler) {
      return;
    }

    try {
      setActionError(null);
      await handler(payload);
    } catch (actionException) {
      setActionError(actionException instanceof Error ? actionException.message : 'Aktion fehlgeschlagen');
    }
  };

  useEffect(() => {
    if (!negotiation?.id || !negotiation.premium?.upgradePrompt) {
      return;
    }

    if (upgradeTrackedRef.current === negotiation.id) {
      return;
    }

    upgradeTrackedRef.current = negotiation.id;
    void fetch('/api/marketplace/premium/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'UPGRADE_CTA_VIEWED',
        negotiationId: negotiation.id,
        tier: negotiation.premiumTier ?? 'PREMIUM',
      }),
    }).catch((trackError) => {
      console.error('[premium][cta-view-failed]', trackError);
    });
  }, [negotiation?.id, negotiation?.premium?.upgradePrompt]);

  const handleUpgradeClick = async (currentNegotiation: NegotiationSnapshot) => {
    try {
      setIsUpgrading(true);
      setActionError(null);
      await fetch('/api/marketplace/premium/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'START_TRIAL',
          tier: currentNegotiation.premiumTier ?? 'PREMIUM',
          negotiationId: currentNegotiation.id,
        }),
      });
      upgradeTrackedRef.current = null;
      await refresh();
    } catch (upgradeError) {
      setActionError(upgradeError instanceof Error ? upgradeError.message : 'Upgrade konnte nicht gestartet werden');
    } finally {
      setIsUpgrading(false);
    }
  };

  const renderCreationCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Verhandlung starten</CardTitle>
        <CardDescription>
          Senden Sie dem Anbieter ein erstes Angebot für „{listingTitle}“. Sie können den Vorschlag später anpassen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="create-price">Startpreis (EUR)</Label>
            <Input
              id="create-price"
              type="number"
              min="0"
              step="0.01"
              value={creationPrice}
              onChange={(event) => setCreationPrice(event.target.value)}
              disabled={isCreating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-quantity">Menge</Label>
            <Input
              id="create-quantity"
              type="number"
              min="0"
              step="0.01"
              value={creationQuantity}
              onChange={(event) => setCreationQuantity(event.target.value)}
              disabled={isCreating}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-message">Nachricht (optional)</Label>
          <Textarea
            id="create-message"
            placeholder="Beschreiben Sie Anforderungen oder Lieferbedingungen..."
            value={creationMessage}
            onChange={(event) => setCreationMessage(event.target.value)}
            disabled={isCreating}
            rows={3}
          />
        </div>
        {creationError ? <p className="text-sm text-destructive">{creationError}</p> : null}
        <Button onClick={handleCreateNegotiation} className="w-full" disabled={isCreating || !userId}>
          Verhandlung starten
        </Button>
      </CardContent>
    </Card>
  );

  const renderWorkspace = (snapshot: NegotiationSnapshot | null) => {
    if (!snapshot) {
      return (
        <Alert>
          <AlertDescription>
            Für dieses Listing liegt aktuell keine aktive Verhandlung vor. Starten Sie eine neue Anfrage oder warten Sie auf
            eine Antwort des Gegenübers.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {snapshot.premium?.upgradePrompt ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle>{snapshot.premium.upgradePrompt.headline}</CardTitle>
              <CardDescription>{snapshot.premium.upgradePrompt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleUpgradeClick(snapshot)} disabled={isUpgrading}>
                {isUpgrading ? 'Aktualisiere…' : snapshot.premium.upgradePrompt.cta}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {actionError ? (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}
        {realtime?.slaStatus === 'WARNING' ? (
          <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertDescription>
              SLA läuft bald ab. Bitte handeln Sie zeitnah, um Verzögerungen zu vermeiden.
            </AlertDescription>
          </Alert>
        ) : null}
        {realtime?.slaStatus === 'BREACHED' ? (
          <Alert variant="destructive">
            <AlertDescription>
              SLA verletzt – prüfen Sie unverzüglich die nächsten Schritte oder eskalieren Sie an das Team.
            </AlertDescription>
          </Alert>
        ) : null}
        {snapshot.premium?.viewer.hasAdvancedAnalytics ? (
          <NegotiationPremiumInsights negotiation={snapshot} />
        ) : null}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <NegotiationTimeline
              activities={snapshot.activities ?? []}
              statusHistory={snapshot.statusHistory ?? []}
              expiresAt={snapshot.expiresAt}
              unreadCount={realtime?.unreadCount ?? 0}
            />
            <NegotiationContractCard
              negotiation={snapshot}
              role={role}
              currentUserId={userId}
              disabled={TERMINAL_STATUSES.has(snapshot.status ?? '')}
              onSignContract={(intent) =>
                safeAction(actions?.signContract ?? null, {
                  intent,
                  userId,
                })
              }
            />
          </div>
          <div className="space-y-6">
            <NegotiationOfferComposer
              negotiation={snapshot}
              role={role}
              currentUserId={userId}
              disabled={TERMINAL_STATUSES.has(snapshot.status ?? '')}
              onSubmitOffer={(payload) => safeAction(actions?.submitCounter ?? null, payload)}
              onAcceptOffer={(payload) => safeAction(actions?.acceptOffer ?? null, payload)}
            />
            <EscrowStatusCard escrow={snapshot.escrowAccount ?? null} currency={snapshot.currency ?? currency} />
          </div>
        </div>
      </div>
    );
  };

  if (!userId) {
    return (
      <Alert>
        <AlertDescription>Bitte melden Sie sich an, um die Verhandlungsfunktionen zu nutzen.</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (canCreateNegotiation) {
    return renderCreationCard();
  }

  return renderWorkspace(negotiation);
}
