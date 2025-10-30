/**
 * meta: module=contract-collaboration version=0.1 owner=platform
 */
import type { Prisma } from '@prisma/client';
import {
  ContractRevisionCommentStatus,
  ContractRevisionStatus,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { syncContractRevisionAttachments } from '@/lib/integrations/storage';

type Attachment = {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
};

export interface CreateRevisionInput {
  negotiationId: string;
  contractId: string;
  authorId: string;
  body: string;
  summary?: string | null;
  attachments?: Attachment[];
  submit?: boolean;
}

export async function createContractRevision(input: CreateRevisionInput) {
  const status = input.submit ? ContractRevisionStatus.IN_REVIEW : ContractRevisionStatus.DRAFT;

  const revision = await prisma.$transaction(async (tx) => {
    const latest = await tx.dealContractRevision.aggregate({
      where: { contractId: input.contractId },
      _max: { version: true },
    });

    const nextVersion = (latest._max.version ?? 0) + 1;

    const created = await tx.dealContractRevision.create({
      data: {
        negotiationId: input.negotiationId,
        contractId: input.contractId,
        version: nextVersion,
        summary: input.summary ?? null,
        body: input.body,
        attachments: input.attachments
          ? (input.attachments as unknown as Prisma.InputJsonValue)
          : undefined,
        status,
        createdById: input.authorId,
      },
      include: { contract: true },
    });

    if (status === ContractRevisionStatus.IN_REVIEW) {
      await tx.dealContract.update({
        where: { id: input.contractId },
        data: { lastError: null },
      });
    }

    return created;
  });

  if (input.attachments?.length) {
    try {
      await syncContractRevisionAttachments({
        negotiationId: input.negotiationId,
        contractId: input.contractId,
        revisionId: revision.id,
        attachments: input.attachments.map((attachment) => ({
          name: attachment.name,
          url: attachment.url,
          mimeType: attachment.mimeType,
        })),
      });
    } catch (storageError) {
      console.error('[contract-revision][storage-sync-failed]', storageError);
    }
  }

  await publishNegotiationEvent({
    type: 'CONTRACT_REVISION_SUBMITTED',
    negotiationId: revision.negotiationId,
    triggeredBy: input.authorId,
    payload: {
      revisionId: revision.id,
      version: revision.version,
      status: revision.status,
    },
  });

  return revision;
}

export interface UpdateRevisionStatusInput {
  revisionId: string;
  actorId: string;
  status: ContractRevisionStatus;
}

export async function updateRevisionStatus({ revisionId, actorId, status }: UpdateRevisionStatusInput) {
  const revision = await prisma.$transaction(async (tx) => {
    const target = await tx.dealContractRevision.findUnique({
      where: { id: revisionId },
      include: { contract: true },
    });

    if (!target) {
      throw new Error('REVISION_NOT_FOUND');
    }

    const attachmentsRaw = target.attachments as unknown;
    const attachments = Array.isArray(attachmentsRaw)
      ? (attachmentsRaw.filter(
          (item): item is Attachment =>
            Boolean(item) && typeof item === 'object' && 'url' in (item as Record<string, unknown>)
        ) as Attachment[])
      : [];
    const preferredAttachment = attachments.find((item) => item.mimeType?.includes('pdf')) ?? attachments[0];

    const updated = await tx.dealContractRevision.update({
      where: { id: revisionId },
      data: {
        status,
        isCurrent: status === ContractRevisionStatus.ACCEPTED,
      },
    });

    if (status === ContractRevisionStatus.ACCEPTED) {
      await tx.dealContractRevision.updateMany({
        where: { contractId: target.contractId, id: { not: revisionId } },
        data: { isCurrent: false },
      });

      await tx.dealContract.update({
        where: { id: target.contractId },
        data: {
          currentRevisionId: revisionId,
          draftTerms: target.summary ?? target.body,
          documentUrl: preferredAttachment?.url ?? target.contract.documentUrl ?? null,
        },
      });
    }

    if (status === ContractRevisionStatus.REJECTED) {
      await tx.dealContract.update({
        where: { id: target.contractId },
        data: { currentRevisionId: target.contract.currentRevisionId },
      });
    }

    return { ...target, status: updated.status, isCurrent: updated.isCurrent };
  });

  const eventType =
    status === ContractRevisionStatus.ACCEPTED
      ? 'CONTRACT_REVISION_ACCEPTED'
      : status === ContractRevisionStatus.REJECTED
      ? 'CONTRACT_REVISION_REJECTED'
      : 'CONTRACT_REVISION_SUBMITTED';

  await publishNegotiationEvent({
    type: eventType,
    negotiationId: revision.negotiationId,
    triggeredBy: actorId,
    payload: {
      revisionId,
      status,
      version: revision.version,
    },
  });

  return revision;
}

export interface AddRevisionCommentInput {
  revisionId: string;
  authorId: string;
  body: string;
  anchor?: Record<string, unknown>;
}

export async function addRevisionComment({ revisionId, authorId, body, anchor }: AddRevisionCommentInput) {
  const revision = await prisma.dealContractRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, negotiationId: true, version: true },
  });

  if (!revision) {
    throw new Error('REVISION_NOT_FOUND');
  }

  const comment = await prisma.dealContractRevisionComment.create({
    data: {
      revisionId,
      authorId,
      body,
      anchor: (anchor ?? null) as unknown as Prisma.InputJsonValue,
    },
  });

  await publishNegotiationEvent({
    type: 'CONTRACT_REVISION_COMMENTED',
    negotiationId: revision.negotiationId,
    triggeredBy: authorId,
    payload: {
      revisionId,
      commentId: comment.id,
      version: revision.version,
    },
  });

  return comment;
}

export interface ResolveRevisionCommentInput {
  commentId: string;
  actorId: string;
  resolved: boolean;
}

export async function resolveRevisionComment({ commentId, actorId, resolved }: ResolveRevisionCommentInput) {
  const comment = await prisma.dealContractRevisionComment.update({
    where: { id: commentId },
    data: {
      status: resolved ? ContractRevisionCommentStatus.RESOLVED : ContractRevisionCommentStatus.OPEN,
      resolvedAt: resolved ? new Date() : null,
      resolvedById: resolved ? actorId : null,
    },
    include: { revision: { select: { negotiationId: true, version: true } } },
  });

  await publishNegotiationEvent({
    type: 'CONTRACT_REVISION_COMMENTED',
    negotiationId: comment.revision.negotiationId,
    triggeredBy: actorId,
    payload: {
      revisionId: comment.revisionId,
      commentId: comment.id,
      status: comment.status,
      version: comment.revision.version,
    },
  });

  return comment;
}

export async function listContractRevisions(negotiationId: string) {
  return prisma.dealContractRevision.findMany({
    where: { negotiationId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          resolvedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function getCurrentContractRevision(contractId: string) {
  return prisma.dealContractRevision.findFirst({
    where: { contractId, isCurrent: true },
    orderBy: { createdAt: 'desc' },
    include: {
      comments: {
        include: {
          author: { select: { id: true, name: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}
