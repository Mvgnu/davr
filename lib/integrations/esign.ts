/**
 * meta: module=contract-integration version=0.1 owner=platform
 */
import { randomUUID } from 'crypto';
import {
  ContractEnvelopeStatus,
  ContractIntentEventType,
  ContractStatus,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import {
  recordEnvelopeLifecycleEvent,
  recordParticipantSignatureEvent,
} from '@/lib/contracts/analytics';
import { getCurrentContractRevision } from '@/lib/contracts/revisions';

export interface ContractParticipant {
  id: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  name: string;
  email?: string;
}

export interface IssueEnvelopeInput {
  negotiationId: string;
  contractId: string;
  templateKey?: string | null;
  provider?: string | null;
  draftTerms?: string | null;
  participants: ContractParticipant[];
}

export interface EnvelopeState {
  provider: string;
  envelopeId: string;
  documentId?: string;
  status: ContractEnvelopeStatus;
  documentUrl?: string | null;
  participantStates: Record<string, { status: string; signedAt?: string | null }>;
}

export interface RecordSignatureInput {
  contractId: string;
  negotiationId: string;
  participant: ContractParticipant;
}

export interface SyncEnvelopeInput {
  contractId: string;
  negotiationId: string;
}

export interface VoidEnvelopeInput {
  contractId: string;
  negotiationId: string;
  reason?: string;
}

export interface ESignProvider {
  issueEnvelope(input: IssueEnvelopeInput): Promise<EnvelopeState>;
  recordSignature(input: RecordSignatureInput): Promise<EnvelopeState>;
  syncEnvelope(input: SyncEnvelopeInput): Promise<EnvelopeState>;
  voidEnvelope(input: VoidEnvelopeInput): Promise<EnvelopeState>;
}

class MockESignProvider implements ESignProvider {
  constructor(private readonly providerId = 'mock-esign') {}

  async issueEnvelope(input: IssueEnvelopeInput): Promise<EnvelopeState> {
    const envelopeId = randomUUID();
    const documentId = randomUUID();

    const activeRevision = await getCurrentContractRevision(input.contractId);
    const attachmentsRaw = activeRevision?.attachments as unknown;
    const attachments = Array.isArray(attachmentsRaw)
      ? (attachmentsRaw.filter(
          (item): item is { url?: string | null; mimeType?: string | null } =>
            Boolean(item) && typeof item === 'object' && 'url' in (item as Record<string, unknown>)
        ) as { url?: string | null; mimeType?: string | null }[])
      : [];
    const preferredAttachment = attachments.find((item) => item.mimeType?.includes('pdf')) ?? attachments[0];
    const revisionBody = activeRevision?.body ?? input.draftTerms ?? null;

    const participantStates = Object.fromEntries(
      input.participants.map((participant) => [participant.role, { status: 'PENDING', signedAt: null }])
    );

    await prisma.dealContract.update({
      where: { id: input.contractId },
      data: {
        provider: this.providerId,
        templateKey: input.templateKey ?? null,
        providerEnvelopeId: envelopeId,
        providerDocumentId: documentId,
        envelopeStatus: ContractEnvelopeStatus.ISSUED,
        participantStates,
        lastProviderSyncAt: new Date(),
        lastError: null,
        draftTerms: revisionBody ?? undefined,
        documentUrl: preferredAttachment?.url ?? null,
        documents: {
          create: {
            provider: this.providerId,
            providerDocumentId: documentId,
            providerEnvelopeId: envelopeId,
            status: ContractEnvelopeStatus.ISSUED,
            metadata: {
              draftTerms: revisionBody,
              revisionId: activeRevision?.id ?? null,
            },
            issuedAt: new Date(),
          },
        },
      },
    });

    await recordEnvelopeLifecycleEvent({
      negotiationId: input.negotiationId,
      contractId: input.contractId,
      eventType: ContractIntentEventType.ENVELOPE_ISSUED,
      metadata: {
        provider: this.providerId,
        templateKey: input.templateKey ?? null,
      },
    });

    return {
      provider: this.providerId,
      envelopeId,
      documentId,
      status: ContractEnvelopeStatus.ISSUED,
      documentUrl: input.draftTerms ?? null,
      participantStates,
    };
  }

  async recordSignature(input: RecordSignatureInput): Promise<EnvelopeState> {
    const contract = await prisma.dealContract.findUnique({ where: { id: input.contractId } });
    if (!contract) {
      throw new Error('CONTRACT_NOT_FOUND');
    }

    const participantStates = (contract.participantStates as EnvelopeState['participantStates']) ?? {};
    const nextState = { status: 'SIGNED', signedAt: new Date().toISOString() };
    participantStates[input.participant.role] = nextState;

    const buyerSigned = participantStates.BUYER?.status === 'SIGNED';
    const sellerSigned = participantStates.SELLER?.status === 'SIGNED';
    const envelopeStatus = buyerSigned && sellerSigned ? ContractEnvelopeStatus.COMPLETED : ContractEnvelopeStatus.PARTIALLY_SIGNED;

    const updatedContract = await prisma.dealContract.update({
      where: { id: input.contractId },
      data: {
        participantStates,
        envelopeStatus,
        buyerSignedAt: buyerSigned ? new Date(participantStates.BUYER?.signedAt ?? Date.now()) : contract.buyerSignedAt,
        sellerSignedAt: sellerSigned ? new Date(participantStates.SELLER?.signedAt ?? Date.now()) : contract.sellerSignedAt,
        status: buyerSigned && sellerSigned ? ContractStatus.SIGNED : ContractStatus.PENDING_SIGNATURES,
        finalizedAt: buyerSigned && sellerSigned ? new Date() : contract.finalizedAt,
        lastProviderSyncAt: new Date(),
        lastError: null,
        documents: buyerSigned && sellerSigned
          ? {
              updateMany: {
                where: { contractId: input.contractId, status: { not: ContractEnvelopeStatus.COMPLETED } },
                data: { status: ContractEnvelopeStatus.COMPLETED, completedAt: new Date() },
              },
            }
          : undefined,
      },
    });

    await recordParticipantSignatureEvent({
      negotiationId: input.negotiationId,
      contractId: input.contractId,
      participantRole: input.participant.role,
      signedAt: nextState.signedAt ?? new Date().toISOString(),
      metadata: {
        provider: updatedContract.provider ?? this.providerId,
        envelopeId: updatedContract.providerEnvelopeId,
      },
    });

    if (buyerSigned && sellerSigned) {
      await recordEnvelopeLifecycleEvent({
        negotiationId: input.negotiationId,
        contractId: input.contractId,
        eventType: ContractIntentEventType.ENVELOPE_COMPLETED,
        metadata: {
          provider: updatedContract.provider,
          envelopeId: updatedContract.providerEnvelopeId,
        },
      });

      await publishNegotiationEvent({
        type: 'CONTRACT_SIGNATURE_COMPLETED',
        negotiationId: input.negotiationId,
        triggeredBy: input.participant.id,
        payload: {
          provider: updatedContract.provider,
          envelopeId: updatedContract.providerEnvelopeId,
        },
      });
    }

    return {
      provider: updatedContract.provider ?? this.providerId,
      envelopeId: updatedContract.providerEnvelopeId ?? 'pending',
      documentId: updatedContract.providerDocumentId ?? undefined,
      status: updatedContract.envelopeStatus,
      documentUrl: updatedContract.documentUrl,
      participantStates,
    };
  }

  async syncEnvelope(input: SyncEnvelopeInput): Promise<EnvelopeState> {
    const contract = await prisma.dealContract.findUnique({ where: { id: input.contractId } });
    if (!contract) {
      throw new Error('CONTRACT_NOT_FOUND');
    }

    return {
      provider: contract.provider ?? this.providerId,
      envelopeId: contract.providerEnvelopeId ?? 'pending',
      documentId: contract.providerDocumentId ?? undefined,
      status: contract.envelopeStatus,
      documentUrl: contract.documentUrl,
      participantStates: (contract.participantStates as EnvelopeState['participantStates']) ?? {},
    };
  }

  async voidEnvelope(input: VoidEnvelopeInput): Promise<EnvelopeState> {
    const contract = await prisma.dealContract.update({
      where: { id: input.contractId },
      data: {
        envelopeStatus: ContractEnvelopeStatus.VOID,
        status: ContractStatus.VOID,
        lastProviderSyncAt: new Date(),
        lastError: input.reason ?? null,
      },
    });

    return {
      provider: contract.provider ?? this.providerId,
      envelopeId: contract.providerEnvelopeId ?? 'void',
      documentId: contract.providerDocumentId ?? undefined,
      status: contract.envelopeStatus,
      documentUrl: contract.documentUrl,
      participantStates: (contract.participantStates as EnvelopeState['participantStates']) ?? {},
    };
  }
}

let activeProvider: ESignProvider = new MockESignProvider();

export function getESignProvider(): ESignProvider {
  return activeProvider;
}

export function registerESignProvider(provider: ESignProvider) {
  activeProvider = provider;
}

export interface WebhookSignatureEvent {
  negotiationId: string;
  contractId: string;
  participant: ContractParticipant;
  status: 'SIGNED' | 'DECLINED';
}

export async function handleESignatureWebhook(event: WebhookSignatureEvent) {
  const provider = getESignProvider();
  if (event.status === 'SIGNED') {
    await provider.recordSignature({
      contractId: event.contractId,
      negotiationId: event.negotiationId,
      participant: event.participant,
    });
  } else {
    await prisma.dealContract.update({
      where: { id: event.contractId },
      data: {
        status: ContractStatus.REJECTED,
        envelopeStatus: ContractEnvelopeStatus.FAILED,
        lastError: `Signature declined by ${event.participant.role}`,
      },
    });

    await recordEnvelopeLifecycleEvent({
      negotiationId: event.negotiationId,
      contractId: event.contractId,
      eventType: ContractIntentEventType.ENVELOPE_DECLINED,
      participantRole: event.participant.role,
      metadata: {
        provider: provider instanceof MockESignProvider ? 'mock-esign' : 'external',
      },
    });
  }
}
