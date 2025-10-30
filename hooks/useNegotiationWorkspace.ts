'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

import type { NegotiationApiResponse, NegotiationSnapshot } from '@/types/negotiations';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const REFRESH_INTERVAL_MS = 15000;
const STREAM_RECONNECT_DELAY_MS = 5000;
const ACK_FLUSH_DELAY_MS = 750;
const ACK_RETRY_DELAY_MS = 2000;

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

  const [unreadCount, setUnreadCount] = useState(0);
  const [streamConnected, setStreamConnected] = useState(false);
  const [slaStatus, setSlaStatus] = useState<'OK' | 'WARNING' | 'BREACHED'>('OK');
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ackQueueRef = useRef<Set<string>>(new Set());
  const ackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushAckQueue = useCallback(async () => {
    if (ackQueueRef.current.size === 0) {
      ackTimeoutRef.current = null;
      return;
    }

    const ids = Array.from(ackQueueRef.current);
    ackQueueRef.current.clear();
    ackTimeoutRef.current = null;

    try {
      await fetch('/api/notifications/ack', {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      const queue = ackQueueRef.current;
      ids.forEach((id) => queue.add(id));
      ackTimeoutRef.current = setTimeout(() => {
        void flushAckQueue();
      }, ACK_RETRY_DELAY_MS);
      console.error('[negotiation-stream][ack-failed]', error);
    }
  }, []);

  useEffect(() => {
    if (!negotiationId || typeof window === 'undefined') {
      return () => {};
    }

    let eventSource: EventSource | null = null;
    let closed = false;

    const scheduleAckFlush = () => {
      if (!ackTimeoutRef.current) {
        ackTimeoutRef.current = setTimeout(() => {
          void flushAckQueue();
        }, ACK_FLUSH_DELAY_MS);
      }
    };

    const connect = () => {
      if (!negotiationId || typeof window === 'undefined') {
        return;
      }

      const streamUrl = new URL('/api/notifications/stream', window.location.origin);
      streamUrl.searchParams.set('negotiationId', negotiationId);

      eventSource = new EventSource(streamUrl.toString());
      eventSource.onopen = () => {
        setStreamConnected(true);
      };
      eventSource.onmessage = (event) => {
        if (!event.data) {
          return;
        }

        try {
          const envelope = JSON.parse(event.data) as {
            id?: string;
            type?: string;
            negotiationId?: string;
          };

          if (!envelope?.negotiationId || envelope.negotiationId !== negotiationId) {
            return;
          }

          setUnreadCount((current) => current + 1);

          if (envelope.id) {
            ackQueueRef.current.add(envelope.id);
            scheduleAckFlush();
          }

          if (envelope.type === 'NEGOTIATION_SLA_WARNING') {
            setSlaStatus((current) => (current === 'BREACHED' ? current : 'WARNING'));
          } else if (envelope.type === 'NEGOTIATION_SLA_BREACHED') {
            setSlaStatus('BREACHED');
          }

          void mutate();
        } catch (streamError) {
          console.error('[negotiation-stream][parse-failed]', streamError);
        }
      };
      eventSource.onerror = () => {
        setStreamConnected(false);
        eventSource?.close();
        if (!closed) {
          reconnectTimeoutRef.current = setTimeout(connect, STREAM_RECONNECT_DELAY_MS);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      setStreamConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
        ackTimeoutRef.current = null;
      }
      if (ackQueueRef.current.size > 0) {
        void flushAckQueue();
      }
      eventSource?.close();
    };
  }, [flushAckQueue, mutate, negotiationId]);

  useEffect(() => {
    const latestActivity = data?.activities?.[0]?.occurredAt ?? null;
    if (latestActivity) {
      setUnreadCount(0);
    }

    const expiresAt = data?.expiresAt ? new Date(data.expiresAt).getTime() : null;
    if (!expiresAt) {
      setSlaStatus('OK');
      return;
    }

    const now = Date.now();
    if (expiresAt < now) {
      setSlaStatus('BREACHED');
    } else {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      setSlaStatus(expiresAt - now < twentyFourHours ? 'WARNING' : 'OK');
    }
  }, [data?.activities, data?.expiresAt]);

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
      raiseDispute: (body: Record<string, unknown>) => runAction(`${basePath}/disputes`, { body }),
      createFulfilmentOrder: (body: Record<string, unknown>) =>
        runAction(`${basePath}/fulfilment/orders`, { body }),
      updateFulfilmentOrder: (orderId: string, body: Record<string, unknown>) =>
        runAction(`${basePath}/fulfilment/orders/${orderId}`, { body }),
      recordFulfilmentMilestone: (orderId: string, body: Record<string, unknown>) =>
        runAction(`${basePath}/fulfilment/orders/${orderId}/milestones`, { body }),
      scheduleFulfilmentReminder: (orderId: string, body: Record<string, unknown>) =>
        runAction(`${basePath}/fulfilment/orders/${orderId}/reminders`, { body }),
    };
  }, [negotiationId, runAction]);

  return {
    negotiation: data ?? null,
    isLoading,
    isValidating,
    error: error as Error | undefined,
    actions,
    refresh: () => mutate(),
    realtime: {
      unreadCount,
      streamConnected,
      slaStatus,
    },
  };
}
