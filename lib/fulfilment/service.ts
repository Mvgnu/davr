import {
  FulfilmentMilestoneType,
  FulfilmentOrderStatus,
  FulfilmentReminderType,
  type Prisma,
} from '@prisma/client';
import { addHours, isAfter } from 'date-fns';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

// meta: module=fulfilment-service version=0.1 owner=operations scope=logistics

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

export interface FulfilmentOrderDTO {
  id: string;
  negotiationId: string;
  reference: string | null;
  status: FulfilmentOrderStatus;
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
    },
  });

  return orders.map((order) => ({
    id: order.id,
    negotiationId: order.negotiationId,
    reference: order.reference,
    status: order.status,
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
  }));
}

interface CreateFulfilmentOrderInput {
  negotiationId: string;
  reference?: string | null;
  status?: FulfilmentOrderStatus;
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
  const order = await prisma.fulfilmentOrder.create({
    data: {
      negotiationId: input.negotiationId,
      reference: input.reference ?? null,
      status: input.status ?? FulfilmentOrderStatus.SCHEDULING,
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

  return getNegotiationFulfilmentSchedule(order.negotiationId).then((orders) =>
    orders.find((o) => o.id === order.id) as FulfilmentOrderDTO
  );
}

interface UpdateFulfilmentOrderInput {
  orderId: string;
  status?: FulfilmentOrderStatus;
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

  const order = await prisma.fulfilmentOrder.update({
    where: { id: input.orderId },
    data: {
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
    },
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
