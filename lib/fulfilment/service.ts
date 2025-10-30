import {
  FulfilmentMilestoneType,
  FulfilmentOrderStatus,
  FulfilmentReminderType,
  FulfilmentCarrierSyncStatus,
  type Prisma,
} from '@prisma/client';
import { addHours, isAfter } from 'date-fns';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { getCarrierProvider } from '@/lib/fulfilment/providers';

import type { CarrierTrackingEvent } from '@/lib/fulfilment/providers';

// meta: module=fulfilment-service version=0.1 owner=operations scope=logistics

function toRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return { ...(value as Record<string, unknown>) };
}

function toJson(value: unknown): Prisma.JsonValue {
  if (value == null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
}

function normaliseCarrierCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed.toUpperCase();
}

export interface FulfilmentMilestoneDTO {
  id: string;
  type: FulfilmentMilestoneType;
  occurredAt: Date;
  notes: string | null;
  recordedBy: { id: string; name: string | null } | null;
  payload: Record<string, unknown> | null;
}

export interface FulfilmentReminderDTO {
  id: string;
  type: FulfilmentReminderType;
  scheduledFor: Date;
  sentAt: Date | null;
  metadata: Record<string, unknown> | null;
}

export interface FulfilmentTrackingEventDTO {
  id: string;
  status: string;
  description: string | null;
  eventTime: Date;
  location: string | null;
  rawPayload: Record<string, unknown> | null;
}

export interface FulfilmentCarrierManifestDTO {
  carrierCode: string;
  pollingStatus: FulfilmentCarrierSyncStatus;
  trackingReference: string | null;
  lastSyncedAt: Date | null;
  manifestPayload: Record<string, unknown> | null;
  trackingEvents: FulfilmentTrackingEventDTO[];
}

export interface FulfilmentOrderDTO {
  id: string;
  negotiationId: string;
  reference: string | null;
  status: FulfilmentOrderStatus;
  carrierCode: string | null;
  carrierSyncStatus: FulfilmentCarrierSyncStatus | null;
  lastCarrierSyncAt: Date | null;
  pickupWindowStart: Date | null;
  pickupWindowEnd: Date | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  carrierName: string | null;
  carrierContact: string | null;
  carrierServiceLevel: string | null;
  trackingNumber: string | null;
  externalId: string | null;
  specialInstructions: string | null;
  milestones: FulfilmentMilestoneDTO[];
  reminders: FulfilmentReminderDTO[];
  carrierManifest: FulfilmentCarrierManifestDTO | null;
}

function buildCarrierManifestPayload(order: {
  pickupWindowStart: Date | null;
  pickupWindowEnd: Date | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  carrierServiceLevel: string | null;
  trackingNumber: string | null;
}): Record<string, unknown> {
  return {
    pickupWindowStart: order.pickupWindowStart ? order.pickupWindowStart.toISOString() : null,
    pickupWindowEnd: order.pickupWindowEnd ? order.pickupWindowEnd.toISOString() : null,
    pickupLocation: order.pickupLocation,
    deliveryLocation: order.deliveryLocation,
    carrierServiceLevel: order.carrierServiceLevel,
    trackingNumber: order.trackingNumber,
  };
}

function resolveSyncStatusFromEvents(
  events: CarrierTrackingEvent[],
  fallback: FulfilmentCarrierSyncStatus
): FulfilmentCarrierSyncStatus {
  const statuses = events.map((event) => event.status.toUpperCase());
  if (statuses.includes('DELIVERED')) {
    return FulfilmentCarrierSyncStatus.DELIVERED;
  }

  if (statuses.includes('IN_TRANSIT')) {
    return FulfilmentCarrierSyncStatus.IN_TRANSIT;
  }

  return fallback;
}

async function replaceTrackingEvents(manifestId: string, events: CarrierTrackingEvent[]): Promise<void> {
  await prisma.fulfilmentTrackingEvent.deleteMany({ where: { manifestId } });

  if (events.length === 0) {
    return;
  }

  await prisma.fulfilmentTrackingEvent.createMany({
    data: events.map((event) => ({
      manifestId,
      status: event.status,
      description: event.description ?? null,
      eventTime: event.eventTime,
      location: event.location ?? null,
      rawPayload: toJson(event.rawPayload ?? null),
    })),
  });
}

async function syncCarrierRegistration(orderId: string): Promise<void> {
  const order = await prisma.fulfilmentOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      reference: true,
      carrierCode: true,
      pickupWindowStart: true,
      pickupWindowEnd: true,
      pickupLocation: true,
      deliveryLocation: true,
      carrierServiceLevel: true,
      trackingNumber: true,
      carrierManifest: { select: { id: true } },
    },
  });

  if (!order?.carrierCode) {
    return;
  }

  const provider = getCarrierProvider(order.carrierCode);
  if (!provider) {
    return;
  }

  const manifestPayload = buildCarrierManifestPayload(order);
  const registration = await provider.registerShipment({
    orderId: order.id,
    carrierCode: provider.id,
    reference: order.reference ?? order.id,
    payload: manifestPayload,
  });

  const now = new Date();
  const manifest = await prisma.fulfilmentCarrierManifest.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      carrierCode: provider.id,
      trackingReference: registration.trackingReference,
      pollingStatus: registration.pollingStatus as FulfilmentCarrierSyncStatus,
      manifestPayload: toJson(registration.manifestEcho ?? manifestPayload),
      lastSyncedAt: now,
    },
    update: {
      carrierCode: provider.id,
      trackingReference: registration.trackingReference,
      pollingStatus: registration.pollingStatus as FulfilmentCarrierSyncStatus,
      manifestPayload: toJson(registration.manifestEcho ?? manifestPayload),
      lastSyncedAt: now,
    },
  });

  const events = registration.events ?? [];
  await replaceTrackingEvents(manifest.id, events);

  const syncStatus = resolveSyncStatusFromEvents(events, registration.pollingStatus as FulfilmentCarrierSyncStatus);

  await prisma.fulfilmentOrder.update({
    where: { id: order.id },
    data: {
      carrierSyncStatus: syncStatus,
      lastCarrierSyncAt: now,
      trackingNumber: order.trackingNumber ?? registration.trackingReference ?? null,
    },
  });
}

export async function pollCarrierTracking(orderId: string): Promise<void> {
  const order = await prisma.fulfilmentOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      carrierCode: true,
      carrierManifest: { select: { id: true, trackingReference: true, pollingStatus: true } },
    },
  });

  if (!order?.carrierCode || !order.carrierManifest?.trackingReference) {
    return;
  }

  const provider = getCarrierProvider(order.carrierCode);
  if (!provider?.pollTracking) {
    return;
  }

  const events = await provider.pollTracking(order.carrierManifest.trackingReference);
  await replaceTrackingEvents(order.carrierManifest.id, events);
  const syncStatus = resolveSyncStatusFromEvents(events, order.carrierManifest.pollingStatus);

  await prisma.fulfilmentCarrierManifest.update({
    where: { id: order.carrierManifest.id },
    data: { lastSyncedAt: new Date(), pollingStatus: syncStatus },
  });

  await prisma.fulfilmentOrder.update({
    where: { id: order.id },
    data: { carrierSyncStatus: syncStatus, lastCarrierSyncAt: new Date() },
  });
}

export async function ingestCarrierWebhook(
  carrierCode: string,
  payload: unknown
): Promise<void> {
  const provider = getCarrierProvider(carrierCode);
  if (!provider?.parseWebhook) {
    return;
  }

  const parsed = await provider.parseWebhook(payload);
  if (!parsed) {
    return;
  }

  const manifest = await prisma.fulfilmentCarrierManifest.findFirst({
    where: { trackingReference: parsed.trackingReference, carrierCode: provider.id },
    select: { id: true, orderId: true, pollingStatus: true },
  });

  if (!manifest) {
    return;
  }

  await replaceTrackingEvents(manifest.id, parsed.events);
  const syncStatus = resolveSyncStatusFromEvents(parsed.events, manifest.pollingStatus);

  await prisma.fulfilmentCarrierManifest.update({
    where: { id: manifest.id },
    data: { lastSyncedAt: new Date(), pollingStatus: syncStatus },
  });

  await prisma.fulfilmentOrder.update({
    where: { id: manifest.orderId },
    data: { carrierSyncStatus: syncStatus, lastCarrierSyncAt: new Date() },
  });
}

function firstMatchingMilestone(
  order: FulfilmentOrderDTO,
  candidates: FulfilmentMilestoneType[]
): Date | null {
  const match = order.milestones
    .filter((milestone) => candidates.includes(milestone.type))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())[0];
  return match ? match.occurredAt : null;
}

function firstMatchingTrackingEvent(
  manifest: FulfilmentCarrierManifestDTO | null,
  statuses: string[]
): Date | null {
  if (!manifest) {
    return null;
  }

  const upperStatuses = statuses.map((status) => status.toUpperCase());
  const event = manifest.trackingEvents
    .filter((entry) => upperStatuses.includes(entry.status.toUpperCase()))
    .sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime())[0];
  return event ? event.eventTime : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export interface FulfilmentSlaAnalytics {
  negotiationId: string;
  evaluatedOrders: number;
  pickup: {
    evaluated: number;
    averageDelayMinutes: number | null;
    breaches: number;
  };
  delivery: {
    evaluated: number;
    averageDelayMinutes: number | null;
    breaches: number;
  };
}

export async function getFulfilmentSlaAnalytics(
  negotiationId: string
): Promise<FulfilmentSlaAnalytics> {
  const schedule = await getNegotiationFulfilmentSchedule(negotiationId);
  const pickupDelays: number[] = [];
  let pickupBreaches = 0;
  let pickupEvaluated = 0;
  const deliveryDelays: number[] = [];
  let deliveryBreaches = 0;
  let deliveryEvaluated = 0;

  for (const order of schedule) {
    const pickupActual =
      firstMatchingMilestone(order, [FulfilmentMilestoneType.PICKUP_CONFIRMED, FulfilmentMilestoneType.PICKED_UP]) ??
      firstMatchingTrackingEvent(order.carrierManifest, ['MANIFEST_RECEIVED', 'IN_TRANSIT']);

    if (order.pickupWindowStart && pickupActual) {
      const diffMinutes = (pickupActual.getTime() - order.pickupWindowStart.getTime()) / 60_000;
      pickupDelays.push(diffMinutes);
      pickupEvaluated += 1;

      const breachBoundary = order.pickupWindowEnd ?? order.pickupWindowStart;
      if (breachBoundary && pickupActual.getTime() > breachBoundary.getTime()) {
        pickupBreaches += 1;
      }
    }

    const deliveryActual =
      firstMatchingMilestone(order, [FulfilmentMilestoneType.DELIVERED]) ??
      firstMatchingTrackingEvent(order.carrierManifest, ['DELIVERED']);

    if (order.pickupWindowEnd && deliveryActual) {
      const diffMinutes = (deliveryActual.getTime() - order.pickupWindowEnd.getTime()) / 60_000;
      deliveryDelays.push(diffMinutes);
      deliveryEvaluated += 1;

      if (deliveryActual.getTime() > order.pickupWindowEnd.getTime()) {
        deliveryBreaches += 1;
      }
    }
  }

  return {
    negotiationId,
    evaluatedOrders: schedule.length,
    pickup: {
      evaluated: pickupEvaluated,
      averageDelayMinutes: average(pickupDelays),
      breaches: pickupBreaches,
    },
    delivery: {
      evaluated: deliveryEvaluated,
      averageDelayMinutes: average(deliveryDelays),
      breaches: deliveryBreaches,
    },
  };
}

export async function getNegotiationFulfilmentSchedule(
  negotiationId: string
): Promise<FulfilmentOrderDTO[]> {
  const orders = await prisma.fulfilmentOrder.findMany({
    where: { negotiationId },
    orderBy: [{ pickupWindowStart: 'asc' }, { createdAt: 'asc' }],
    include: {
      milestones: {
        orderBy: { occurredAt: 'asc' },
        include: { recordedBy: { select: { id: true, name: true } } },
      },
      reminders: { orderBy: { scheduledFor: 'asc' } },
      carrierManifest: {
        include: { trackingEvents: { orderBy: { eventTime: 'asc' } } },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    negotiationId: order.negotiationId,
    reference: order.reference,
    status: order.status,
    carrierCode: order.carrierCode ?? null,
    carrierSyncStatus: order.carrierSyncStatus ?? null,
    lastCarrierSyncAt: order.lastCarrierSyncAt ?? null,
    pickupWindowStart: order.pickupWindowStart,
    pickupWindowEnd: order.pickupWindowEnd,
    pickupLocation: order.pickupLocation,
    deliveryLocation: order.deliveryLocation,
    carrierName: order.carrierName,
    carrierContact: order.carrierContact,
    carrierServiceLevel: order.carrierServiceLevel,
    trackingNumber: order.trackingNumber,
    externalId: order.externalId,
    specialInstructions: order.specialInstructions,
    milestones: order.milestones.map((milestone) => ({
      id: milestone.id,
      type: milestone.type,
      occurredAt: milestone.occurredAt,
      notes: milestone.notes,
      recordedBy:
        milestone.recordedById && milestone.recordedBy
          ? { id: milestone.recordedById, name: milestone.recordedBy.name }
          : null,
      payload: milestone.payload as Record<string, unknown> | null,
    })),
    reminders: order.reminders.map((reminder) => ({
      id: reminder.id,
      type: reminder.type,
      scheduledFor: reminder.scheduledFor,
      sentAt: reminder.sentAt,
      metadata: reminder.metadata as Record<string, unknown> | null,
    })),
    carrierManifest: order.carrierManifest
      ? {
          carrierCode: order.carrierManifest.carrierCode,
          pollingStatus: order.carrierManifest.pollingStatus,
          trackingReference: order.carrierManifest.trackingReference,
          lastSyncedAt: order.carrierManifest.lastSyncedAt,
          manifestPayload: toRecord(order.carrierManifest.manifestPayload),
          trackingEvents: order.carrierManifest.trackingEvents.map((event) => ({
            id: event.id,
            status: event.status,
            description: event.description,
            eventTime: event.eventTime,
            location: event.location,
            rawPayload: toRecord(event.rawPayload),
          })),
        }
      : null,
  }));
}

interface CreateFulfilmentOrderInput {
  negotiationId: string;
  reference?: string | null;
  status?: FulfilmentOrderStatus;
  carrierCode?: string | null;
  pickupWindowStart?: Date | null;
  pickupWindowEnd?: Date | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  carrierName?: string | null;
  carrierContact?: string | null;
  carrierServiceLevel?: string | null;
  trackingNumber?: string | null;
  externalId?: string | null;
  specialInstructions?: string | null;
  createdById?: string | null;
}

export async function createFulfilmentOrder(
  input: CreateFulfilmentOrderInput
): Promise<FulfilmentOrderDTO> {
  const carrierCode = normaliseCarrierCode(input.carrierCode ?? null);
  const order = await prisma.fulfilmentOrder.create({
    data: {
      negotiationId: input.negotiationId,
      reference: input.reference ?? null,
      status: input.status ?? FulfilmentOrderStatus.SCHEDULING,
      carrierCode,
      pickupWindowStart: input.pickupWindowStart ?? null,
      pickupWindowEnd: input.pickupWindowEnd ?? null,
      pickupLocation: input.pickupLocation ?? null,
      deliveryLocation: input.deliveryLocation ?? null,
      carrierName: input.carrierName ?? null,
      carrierContact: input.carrierContact ?? null,
      carrierServiceLevel: input.carrierServiceLevel ?? null,
      trackingNumber: input.trackingNumber ?? null,
      externalId: input.externalId ?? null,
      specialInstructions: input.specialInstructions ?? null,
      createdById: input.createdById ?? null,
      updatedById: input.createdById ?? null,
      milestones: {
        create: {
          type: FulfilmentMilestoneType.CREATED,
          occurredAt: new Date(),
          recordedById: input.createdById ?? null,
          notes: 'Fulfilmentauftrag angelegt.',
        },
      },
    },
    include: {
      milestones: {
        orderBy: { occurredAt: 'asc' },
        include: { recordedBy: { select: { id: true, name: true } } },
      },
      reminders: true,
    },
  });

  await publishNegotiationEvent({
    type: 'FULFILMENT_ORDER_CREATED',
    negotiationId: order.negotiationId,
    triggeredBy: input.createdById ?? null,
    payload: { orderId: order.id, status: order.status },
  });

  if (carrierCode) {
    await syncCarrierRegistration(order.id);
  }

  return getNegotiationFulfilmentSchedule(order.negotiationId).then((orders) =>
    orders.find((o) => o.id === order.id) as FulfilmentOrderDTO
  );
}

interface UpdateFulfilmentOrderInput {
  orderId: string;
  status?: FulfilmentOrderStatus;
  carrierCode?: string | null;
  pickupWindowStart?: Date | null;
  pickupWindowEnd?: Date | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  carrierName?: string | null;
  carrierContact?: string | null;
  carrierServiceLevel?: string | null;
  trackingNumber?: string | null;
  externalId?: string | null;
  specialInstructions?: string | null;
  updatedById?: string | null;
}

export async function updateFulfilmentOrder(
  input: UpdateFulfilmentOrderInput
): Promise<FulfilmentOrderDTO | null> {
  const existing = await prisma.fulfilmentOrder.findUnique({
    where: { id: input.orderId },
    select: { negotiationId: true },
  });

  if (!existing) {
    return null;
  }

  const updateData: Prisma.FulfilmentOrderUpdateArgs['data'] = {
    status: input.status,
    pickupWindowStart: input.pickupWindowStart,
    pickupWindowEnd: input.pickupWindowEnd,
    pickupLocation: input.pickupLocation,
    deliveryLocation: input.deliveryLocation,
    carrierName: input.carrierName,
    carrierContact: input.carrierContact,
    carrierServiceLevel: input.carrierServiceLevel,
    trackingNumber: input.trackingNumber,
    externalId: input.externalId,
    specialInstructions: input.specialInstructions,
    updatedById: input.updatedById ?? null,
  };

  if ('carrierCode' in input) {
    updateData.carrierCode = normaliseCarrierCode(input.carrierCode ?? null);
  }

  const order = await prisma.fulfilmentOrder.update({
    where: { id: input.orderId },
    data: updateData,
  });

  await publishNegotiationEvent({
    type:
      input.status && input.status === FulfilmentOrderStatus.SCHEDULED
        ? 'FULFILMENT_ORDER_SCHEDULED'
        : 'FULFILMENT_ORDER_UPDATED',
    negotiationId: order.negotiationId,
    triggeredBy: input.updatedById ?? null,
    payload: { orderId: order.id, status: order.status },
  });

  const requiresResync =
    ('carrierCode' in input && updateData.carrierCode != null) ||
    'pickupWindowStart' in input ||
    'pickupWindowEnd' in input ||
    'pickupLocation' in input ||
    'deliveryLocation' in input;

  if (requiresResync) {
    await syncCarrierRegistration(order.id);
  }

  return getNegotiationFulfilmentSchedule(order.negotiationId).then((orders) =>
    orders.find((o) => o.id === order.id) as FulfilmentOrderDTO
  );
}

interface RecordMilestoneInput {
  orderId: string;
  type: FulfilmentMilestoneType;
  occurredAt?: Date;
  notes?: string | null;
  payload?: Prisma.JsonValue;
  recordedById?: string | null;
}

export async function recordFulfilmentMilestone(
  input: RecordMilestoneInput
): Promise<FulfilmentMilestoneDTO | null> {
  const order = await prisma.fulfilmentOrder.findUnique({
    where: { id: input.orderId },
    select: { negotiationId: true },
  });

  if (!order) {
    return null;
  }

  const milestone = await prisma.fulfilmentMilestone.create({
    data: {
      orderId: input.orderId,
      type: input.type,
      occurredAt: input.occurredAt ?? new Date(),
      notes: input.notes ?? null,
      payload: input.payload ?? null,
      recordedById: input.recordedById ?? null,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
  });

  await publishNegotiationEvent({
    type: 'FULFILMENT_MILESTONE_RECORDED',
    negotiationId: order.negotiationId,
    triggeredBy: input.recordedById ?? null,
    payload: { orderId: input.orderId, milestoneType: input.type },
  });

  return {
    id: milestone.id,
    type: milestone.type,
    occurredAt: milestone.occurredAt,
    notes: milestone.notes,
    recordedBy: milestone.recordedById
      ? { id: milestone.recordedById, name: milestone.recordedBy?.name ?? null }
      : null,
    payload: milestone.payload as Record<string, unknown> | null,
  };
}

interface ScheduleReminderInput {
  orderId: string;
  type: FulfilmentReminderType;
  scheduledFor: Date;
  metadata?: Prisma.JsonValue;
}

export async function scheduleFulfilmentReminder(
  input: ScheduleReminderInput
): Promise<FulfilmentReminderDTO | null> {
  const order = await prisma.fulfilmentOrder.findUnique({
    where: { id: input.orderId },
    select: { negotiationId: true },
  });

  if (!order) {
    return null;
  }

  const reminder = await prisma.fulfilmentReminder.create({
    data: {
      orderId: input.orderId,
      type: input.type,
      scheduledFor: input.scheduledFor,
      metadata: input.metadata ?? null,
    },
  });

  await publishNegotiationEvent({
    type: 'FULFILMENT_REMINDER_SCHEDULED',
    negotiationId: order.negotiationId,
    triggeredBy: null,
    payload: { orderId: input.orderId, reminderId: reminder.id, scheduledFor: reminder.scheduledFor },
  });

  return {
    id: reminder.id,
    type: reminder.type,
    scheduledFor: reminder.scheduledFor,
    sentAt: reminder.sentAt,
    metadata: reminder.metadata as Record<string, unknown> | null,
  };
}

export async function markReminderSent(reminderId: string): Promise<void> {
  const reminder = await prisma.fulfilmentReminder.update({
    where: { id: reminderId },
    data: { sentAt: new Date() },
    select: { orderId: true, order: { select: { negotiationId: true } } },
  });

  if (!reminder.order) {
    return;
  }

  await publishNegotiationEvent({
    type: 'FULFILMENT_REMINDER_SENT',
    negotiationId: reminder.order.negotiationId,
    triggeredBy: null,
    payload: { orderId: reminder.orderId, reminderId },
  });
}

export function deriveReminderWindow(
  order: Pick<
    FulfilmentOrderDTO,
    'pickupWindowStart' | 'pickupWindowEnd' | 'status'
  >
): { pickupReminderAt: Date | null; deliveryReminderAt: Date | null } {
  const pickupReminderAt = order.pickupWindowStart
    ? addHours(order.pickupWindowStart, -2)
    : null;
  const deliveryReminderAt = order.pickupWindowEnd
    ? addHours(order.pickupWindowEnd, -1)
    : null;

  return {
    pickupReminderAt: pickupReminderAt && isAfter(pickupReminderAt, new Date()) ? pickupReminderAt : null,
    deliveryReminderAt:
      deliveryReminderAt && isAfter(deliveryReminderAt, new Date()) ? deliveryReminderAt : null,
  };
}
