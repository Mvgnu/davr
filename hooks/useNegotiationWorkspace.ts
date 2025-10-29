'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import type { NegotiationApiResponse, NegotiationSnapshot } from '@/types/negotiations';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const REFRESH_INTERVAL_MS = 15000;

async function fetchNegotiation(key: string): Promise<NegotiationSnapshot> {
  const response = await fetch(key, { credentials: 'include' });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message ?? 'Negotiation konnte nicht geladen werden');
  }

  const payload = (await response.json()) as NegotiationApiResponse;
  return payload.negotiation;
}

interface NegotiationActionOptions {
  body?: Record<string, unknown>;
  optimisticUpdate?: (current: NegotiationSnapshot) => NegotiationSnapshot;
}

export function useNegotiationWorkspace(negotiationId?: string | null) {
  const key = negotiationId ? `/api/marketplace/deals/${negotiationId}` : null;

  const { data, error, isLoading, mutate, isValidating } = useSWR<NegotiationSnapshot>(key, fetchNegotiation, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const runAction = useCallback(
    async (endpoint: string, options: NegotiationActionOptions = {}) => {
      if (!key) {
        throw new Error('Negotiation context missing');
      }

      const previous = data;
      const hasOptimistic = Boolean(previous && options.optimisticUpdate);

      if (previous && options.optimisticUpdate) {
        const optimistic = options.optimisticUpdate(previous);
        await mutate(optimistic, { revalidate: false, populateCache: true });
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: JSON_HEADERS,
          credentials: 'include',
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        const payload = (await response.json().catch(() => ({}))) as Partial<NegotiationApiResponse>;

        if (!response.ok || !payload.negotiation) {
          throw new Error(payload.message ?? 'Aktion konnte nicht ausgeführt werden');
        }

        await mutate(payload.negotiation, { revalidate: false, populateCache: true });
        await mutate();
        return payload;
      } catch (actionError) {
        if (hasOptimistic && previous) {
          await mutate(previous, { revalidate: false, populateCache: true });
        }
        throw actionError;
      }
    },
    [data, key, mutate]
  );

  const actions = useMemo(() => {
    if (!negotiationId) {
      return null;
    }

    const basePath = `/api/marketplace/deals/${negotiationId}`;

    return {
      submitCounter: (body: Record<string, unknown>) =>
        runAction(`${basePath}/offers`, {
          body,
          optimisticUpdate: (current) => ({
            ...current,
            offers: [
              {
                id: `optimistic-${Date.now()}`,
                senderId: body.senderId as string,
                price: (body.price as number | undefined) ?? null,
                quantity: (body.quantity as number | undefined) ?? null,
                message: (body.message as string | undefined) ?? null,
                type: (body.type as string | undefined) ?? 'COUNTER',
                createdAt: new Date().toISOString(),
              },
              ...current.offers,
            ],
          }),
        }),
      acceptOffer: (body: Record<string, unknown>) =>
        runAction(`${basePath}/accept`, {
          body,
          optimisticUpdate: (current) => ({
            ...current,
            status: 'CONTRACT_DRAFTING',
            agreedPrice: (body.agreedPrice as number | undefined) ?? current.agreedPrice ?? null,
            agreedQuantity: (body.agreedQuantity as number | undefined) ?? current.agreedQuantity ?? null,
          }),
        }),
      cancelNegotiation: (body: Record<string, unknown>) => runAction(`${basePath}/cancel`, { body }),
      fundEscrow: (body: Record<string, unknown>) => runAction(`${basePath}/escrow/fund`, { body }),
      releaseEscrow: (body: Record<string, unknown>) => runAction(`${basePath}/escrow/release`, { body }),
      refundEscrow: (body: Record<string, unknown>) => runAction(`${basePath}/escrow/refund`, { body }),
      signContract: (body: Record<string, unknown>) =>
        runAction(`${basePath}/contracts/sign`, {
          body,
          optimisticUpdate: (current) => ({
            ...current,
            contract: current.contract
              ? {
                  ...current.contract,
                  status: 'PENDING_SIGNATURES',
                  buyerSignedAt:
                    (body.intent === 'BUYER' || (!body.intent && current.buyerId === (body.userId as string)))
                      ? new Date().toISOString()
                      : current.contract.buyerSignedAt ?? null,
                  sellerSignedAt:
                    (body.intent === 'SELLER' || (!body.intent && current.sellerId === (body.userId as string)))
                      ? new Date().toISOString()
                      : current.contract.sellerSignedAt ?? null,
                }
              : current.contract,
          }),
        }),
    };
  }, [negotiationId, runAction]);

  return {
    negotiation: data ?? null,
    isLoading,
    isValidating,
    error: error as Error | undefined,
    actions,
  };
}
