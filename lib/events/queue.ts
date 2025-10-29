import { EventEmitter } from 'events';
import { subHours } from 'date-fns';

import {
  NegotiationActivityAudience,
  NotificationDeliveryStatus,
  type Prisma,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

/**
 * meta: module=negotiation-events subsystem=queue-dispatcher version=0.3 owner=platform
 * Negotiation lifecycle messaging abstraction. Provides a minimal provider
 * contract so transports (Redis Streams, WebSockets, SSE relays) can be
 * swapped without code changes in publishers or subscribers. The in-memory
 * fallback keeps the historical buffer for admin inspection while powering
 * push notifications inside the development stack.
 */
export interface NegotiationQueueEnvelope {
  id?: string;
  type: string;
  negotiationId: string;
  triggeredBy: string | null;
  status?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  audience: string;
  channels?: string[];
}

export type NegotiationQueueSubscription = {
  unsubscribe: () => void;
};

export interface NegotiationQueueProvider {
  publish: (envelope: NegotiationQueueEnvelope) => Promise<void> | void;
  subscribe: (
    handler: (envelope: NegotiationQueueEnvelope) => void,
    options?: {
      channels?: string[];
    }
  ) => NegotiationQueueSubscription;
}

export interface NegotiationNotificationQuery {
  negotiationId?: string;
  audience?: string;
  userId?: string;
  since?: Date;
  limit?: number;
  deliveryStatus?: NotificationDeliveryStatus;
}

export interface NotificationAccessContext {
  userId: string;
  isAdmin: boolean;
}

const MAX_BUFFER_SIZE = 500;

type NotificationRecord = Prisma.NegotiationNotificationGetPayload<{
  select: {
    id: true;
    negotiationId: true;
    type: true;
    audience: true;
    status: true;
    triggeredById: true;
    occurredAt: true;
    payload: true;
    channels: true;
    deliveryStatus: true;
    deliveryAttempts: true;
    lastAttemptAt: true;
    deliveredAt: true;
    deliveryError: true;
    negotiation: {
      select: {
        buyerId: true;
        sellerId: true;
      };
    };
  };
}>;

export type StoredNegotiationNotification = NotificationRecord;

const queueBuffer: NegotiationQueueEnvelope[] = [];

class InMemoryNegotiationQueueProvider implements NegotiationQueueProvider {
  private readonly emitter = new EventEmitter();

  publish(envelope: NegotiationQueueEnvelope) {
    queueBuffer.push(envelope);
    if (queueBuffer.length > MAX_BUFFER_SIZE) {
      queueBuffer.splice(0, queueBuffer.length - MAX_BUFFER_SIZE);
    }

    const channels = this.resolveChannels(envelope.channels);
    for (const channel of channels) {
      this.emitter.emit(channel, envelope);
    }
    this.emitter.emit('*', envelope);
  }

  subscribe(
    handler: (envelope: NegotiationQueueEnvelope) => void,
    options?: { channels?: string[] }
  ): NegotiationQueueSubscription {
    const channels = this.resolveChannels(options?.channels);

    for (const channel of channels) {
      this.emitter.on(channel, handler);
    }

    return {
      unsubscribe: () => {
        for (const channel of channels) {
          this.emitter.off(channel, handler);
        }
      },
    };
  }

  private resolveChannels(channels?: string[]) {
    if (!channels || channels.length === 0) {
      return ['*'];
    }

    return Array.from(new Set(channels));
  }
}

class PersistentNegotiationQueueProvider implements NegotiationQueueProvider {
  constructor(private readonly delegate: NegotiationQueueProvider = new InMemoryNegotiationQueueProvider()) {}

  async publish(envelope: NegotiationQueueEnvelope) {
    const record = await prisma.negotiationNotification.create({
      data: {
        negotiationId: envelope.negotiationId,
        type: envelope.type,
        audience: envelope.audience as any,
        status: envelope.status as any,
        triggeredById: envelope.triggeredBy ?? undefined,
        occurredAt: new Date(envelope.occurredAt),
        payload: envelope.payload ?? undefined,
        channels: envelope.channels ?? [],
        deliveryStatus: NotificationDeliveryStatus.PENDING,
      },
    });

    const enriched: NegotiationQueueEnvelope = { ...envelope, id: record.id };

    await Promise.resolve(this.delegate.publish(enriched));
  }

  subscribe(
    handler: (envelope: NegotiationQueueEnvelope) => void,
    options?: { channels?: string[] }
  ): NegotiationQueueSubscription {
    return this.delegate.subscribe(handler, options);
  }
}

let activeProvider: NegotiationQueueProvider = new PersistentNegotiationQueueProvider();

function mapRecordToEnvelope(record: NotificationRecord): NegotiationQueueEnvelope {
  const payload =
    record.payload && typeof record.payload === 'object'
      ? (record.payload as Record<string, unknown>)
      : undefined;

  return {
    id: record.id,
    type: record.type,
    negotiationId: record.negotiationId,
    triggeredBy: record.triggeredById ?? null,
    status: record.status ?? undefined,
    payload,
    occurredAt: record.occurredAt.toISOString(),
    audience: record.audience,
    channels: record.channels,
  };
}

type NotificationAccessRecord = Prisma.NegotiationNotificationGetPayload<{
  select: {
    id: true;
    audience: true;
    channels: true;
    negotiation: {
      select: {
        buyerId: true;
        sellerId: true;
      };
    };
  };
}>;

function viewerCanAccessNotification(
  record: NotificationAccessRecord,
  viewer: NotificationAccessContext
) {
  if (viewer.isAdmin) {
    return true;
  }

  if (record.audience === NegotiationActivityAudience.ADMIN) {
    return false;
  }

  const channels = new Set(record.channels ?? []);
  if (channels.has(`user:${viewer.userId}`)) {
    return true;
  }

  const buyerId = record.negotiation?.buyerId ?? null;
  const sellerId = record.negotiation?.sellerId ?? null;

  return buyerId === viewer.userId || sellerId === viewer.userId;
}

async function resolveAccessibleNotificationIds(
  ids: string[],
  viewer: NotificationAccessContext
) {
  if (viewer.isAdmin) {
    return ids;
  }

  if (!ids.length) {
    return [] as string[];
  }

  const records = await prisma.negotiationNotification.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      audience: true,
      channels: true,
      negotiation: {
        select: {
          buyerId: true,
          sellerId: true,
        },
      },
    },
  });

  return records.filter((record) => viewerCanAccessNotification(record, viewer)).map((record) => record.id);
}

export async function listNegotiationNotifications(
  query: NegotiationNotificationQuery = {},
  viewer?: NotificationAccessContext
): Promise<NegotiationQueueEnvelope[]> {
  const { negotiationId, audience, userId, since, limit = 100, deliveryStatus } = query;

  const where: Prisma.NegotiationNotificationWhereInput = {};

  if (negotiationId) {
    where.negotiationId = negotiationId;
  }

  if (since) {
    where.occurredAt = { gt: since };
  }

  if (deliveryStatus) {
    where.deliveryStatus = deliveryStatus;
  }

  const channelFilters: string[] = [];
  if (negotiationId) {
    channelFilters.push(`negotiation:${negotiationId}`);
  }
  if (audience) {
    channelFilters.push(`audience:${audience}`);
  }
  if (userId) {
    channelFilters.push(`user:${userId}`);
  }

  if (channelFilters.length > 0) {
    where.OR = channelFilters.map((channel) => ({ channels: { has: channel } }));
  }

  const records = await prisma.negotiationNotification.findMany({
    where,
    orderBy: { occurredAt: 'desc' },
    take: Math.min(limit, 200),
    select: {
      id: true,
      negotiationId: true,
      type: true,
      audience: true,
      status: true,
      triggeredById: true,
      occurredAt: true,
      payload: true,
      channels: true,
      deliveryStatus: true,
      deliveryAttempts: true,
      lastAttemptAt: true,
      deliveredAt: true,
      deliveryError: true,
      negotiation: {
        select: {
          buyerId: true,
          sellerId: true,
        },
      },
    },
  });

  const filteredRecords = viewer
    ? records.filter((record) =>
        viewerCanAccessNotification(
          {
            id: record.id,
            audience: record.audience,
            channels: record.channels,
            negotiation: record.negotiation,
          },
          viewer
        )
      )
    : records;

  return filteredRecords.map(mapRecordToEnvelope);
}

export async function getPendingNegotiationNotifications(limit = 100): Promise<NotificationRecord[]> {
  const records = await prisma.negotiationNotification.findMany({
    where: {
      deliveryAttempts: { lt: 5 },
      OR: [
        { deliveryStatus: NotificationDeliveryStatus.PENDING },
        {
          deliveryStatus: NotificationDeliveryStatus.FAILED,
          deliveryError: 'NO_TRANSPORT_REGISTERED',
        },
      ],
    },
    orderBy: { occurredAt: 'asc' },
    take: limit,
    select: {
      id: true,
      negotiationId: true,
      type: true,
      audience: true,
      status: true,
      triggeredById: true,
      occurredAt: true,
      payload: true,
      channels: true,
      deliveryStatus: true,
      deliveryAttempts: true,
      lastAttemptAt: true,
      deliveredAt: true,
      deliveryError: true,
      negotiation: {
        select: {
          buyerId: true,
          sellerId: true,
        },
      },
    },
  });

  return records;
}

export async function recordNotificationAttempt(
  notificationId: string,
  status: NotificationDeliveryStatus,
  error?: string | null
) {
  const now = new Date();

  await prisma.negotiationNotification.update({
    where: { id: notificationId },
    data: {
      deliveryStatus: status,
      deliveryAttempts: { increment: 1 },
      lastAttemptAt: now,
      deliveredAt: status === NotificationDeliveryStatus.DELIVERED ? now : undefined,
      deliveryError: error ?? null,
    },
  });
}

export async function getNotificationDeliveryStats() {
  const now = new Date();
  const oneHourAgo = subHours(now, 1);

  const [pendingCount, failedCount, deliveredLastHourCount, oldestPending] = await Promise.all([
    prisma.negotiationNotification.count({
      where: { deliveryStatus: NotificationDeliveryStatus.PENDING },
    }),
    prisma.negotiationNotification.count({
      where: { deliveryStatus: NotificationDeliveryStatus.FAILED },
    }),
    prisma.negotiationNotification.count({
      where: {
        deliveryStatus: NotificationDeliveryStatus.DELIVERED,
        deliveredAt: { gte: oneHourAgo },
      },
    }),
    prisma.negotiationNotification.findFirst({
      where: { deliveryStatus: NotificationDeliveryStatus.PENDING },
      orderBy: { occurredAt: 'asc' },
      select: { occurredAt: true },
    }),
  ]);

  return {
    pendingCount,
    failedCount,
    deliveredLastHourCount,
    oldestPendingAt: oldestPending?.occurredAt ?? null,
  };
}

export async function acknowledgeNegotiationNotifications(
  ids: string[],
  viewer: NotificationAccessContext
) {
  if (!ids.length) {
    return { updated: 0 };
  }

  const permittedIds = await resolveAccessibleNotificationIds(ids, viewer);
  if (!permittedIds.length) {
    return { updated: 0 };
  }

  const now = new Date();

  const result = await prisma.negotiationNotification.updateMany({
    where: { id: { in: permittedIds } },
    data: {
      deliveryStatus: NotificationDeliveryStatus.DELIVERED,
      deliveredAt: now,
      lastAttemptAt: now,
      deliveryError: null,
    },
  });

  return { updated: result.count };
}

export function setNegotiationQueueProvider(provider: NegotiationQueueProvider) {
  activeProvider = provider;
}

export function getNegotiationQueueProvider(): NegotiationQueueProvider {
  return activeProvider;
}

export function getNegotiationQueueBuffer() {
  return queueBuffer;
}

export async function enqueueNegotiationLifecycleEvent(envelope: NegotiationQueueEnvelope) {
  await activeProvider.publish(envelope);
}

export function subscribeToNegotiationLifecycleEvents(
  handler: (envelope: NegotiationQueueEnvelope) => void,
  options?: { channels?: string[] }
) {
  return activeProvider.subscribe(handler, options);
}
