/**
 * meta: module=contract-intent-analytics version=0.1 owner=platform
 */
import { ContractIntentEventType, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export interface ContractIntentEventInput {
  negotiationId: string;
  contractId: string;
  eventType: ContractIntentEventType;
  participantRole?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date | string;
}

export async function recordContractIntentEvent(
  input: ContractIntentEventInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  const payload = {
    negotiationId: input.negotiationId,
    contractId: input.contractId,
    eventType: input.eventType,
    participantRole: input.participantRole ?? null,
    metadata: (input.metadata ?? null) as Prisma.JsonValue,
    occurredAt:
      typeof input.occurredAt === 'string'
        ? new Date(input.occurredAt)
        : input.occurredAt ?? new Date(),
  };

  await client.contractIntentMetric.create({ data: payload });
}

export interface ParticipantSignatureEvent {
  negotiationId: string;
  contractId: string;
  participantRole: string;
  signedAt: Date | string;
  metadata?: Record<string, unknown> | null;
}

export async function recordParticipantSignatureEvent(
  event: ParticipantSignatureEvent,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  await recordContractIntentEvent(
    {
      negotiationId: event.negotiationId,
      contractId: event.contractId,
      eventType: ContractIntentEventType.PARTICIPANT_SIGNED,
      participantRole: event.participantRole,
      metadata: event.metadata ?? null,
      occurredAt: event.signedAt,
    },
    client
  );
}

export async function recordEnvelopeLifecycleEvent(
  input: ContractIntentEventInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  await recordContractIntentEvent(input, client);
}
