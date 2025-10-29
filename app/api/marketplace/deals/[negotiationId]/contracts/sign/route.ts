import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ContractEnvelopeStatus, ContractStatus, NegotiationStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  reloadNegotiationSnapshot,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { type ContractParticipant, getESignProvider } from '@/lib/integrations/esign';

interface SignContractPayload {
  intent?: 'BUYER' | 'SELLER' | 'ADMIN';
}

function resolveSignatureRole(options: {
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  intent?: 'BUYER' | 'SELLER' | 'ADMIN';
}) {
  if (options.intent === 'ADMIN' && options.isAdmin) {
    return 'ADMIN';
  }

  if (options.intent === 'BUYER' && options.isBuyer) {
    return 'BUYER';
  }

  if (options.intent === 'SELLER' && options.isSeller) {
    return 'SELLER';
  }

  if (options.isBuyer) {
    return 'BUYER';
  }

  if (options.isSeller) {
    return 'SELLER';
  }

  if (options.isAdmin) {
    return 'ADMIN';
  }

  throw new NegotiationAccessError('NEGOTIATION_FORBIDDEN', 403, 'Keine Signaturberechtigung');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { negotiationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  try {
    const access = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) },
      { include: { contract: true, escrowAccount: true, offers: true, statusHistory: true, listing: true } }
    );

    if (!access.negotiation.contract) {
      return NextResponse.json(
        { error: 'CONTRACT_MISSING', message: 'Vertragsunterlagen sind noch nicht verfügbar' },
        { status: 409 }
      );
    }

    if (access.negotiation.contract.status === ContractStatus.SIGNED) {
      return NextResponse.json(
        { error: 'CONTRACT_ALREADY_SIGNED', message: 'Vertrag wurde bereits vollständig unterzeichnet' },
        { status: 409 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as SignContractPayload;
    const role = resolveSignatureRole({
      isBuyer: access.isBuyer,
      isSeller: access.isSeller,
      isAdmin: access.isAdmin,
      intent: body.intent,
    });

    const participants = await resolveParticipants(access.negotiation.id, [
      { id: access.negotiation.buyerId, role: 'BUYER' as const },
      { id: access.negotiation.sellerId, role: 'SELLER' as const },
    ]);

    if (role === 'ADMIN') {
      participants.push({
        id: session.user.id,
        role: 'ADMIN',
        name: session.user.name ?? 'Admin',
        email: session.user.email ?? undefined,
      });
    }

    const provider = getESignProvider();

    if (!access.negotiation.contract.providerEnvelopeId) {
      await provider.issueEnvelope({
        negotiationId: access.negotiation.id,
        contractId: access.negotiation.contract.id,
        templateKey: access.negotiation.contract.templateKey,
        provider: access.negotiation.contract.provider,
        draftTerms: access.negotiation.contract.draftTerms,
        participants,
      });
    }

    const envelope = await provider.recordSignature({
      contractId: access.negotiation.contract.id,
      negotiationId: access.negotiation.id,
      participant: participants.find((p) => p.role === role)!,
    });

    const buyerSigned = envelope.participantStates.BUYER?.status === 'SIGNED';
    const sellerSigned = envelope.participantStates.SELLER?.status === 'SIGNED';
    const bothSigned = buyerSigned && sellerSigned;

    const negotiation = await prisma.$transaction(async (tx) => {
      if (bothSigned) {
        await tx.negotiation.update({
          where: { id: access.negotiation.id },
          data: { status: NegotiationStatus.CONTRACT_SIGNED },
        });

        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: NegotiationStatus.CONTRACT_SIGNED,
            note: 'Alle Signaturen wurden erfasst.',
            createdById: session.user.id,
          },
        });
      } else {
        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: NegotiationStatus.CONTRACT_DRAFTING,
            note: role === 'BUYER' ? 'Käufer hat unterschrieben.' : 'Verkäufer hat unterschrieben.',
            createdById: session.user.id,
          },
        });
      }

      const snapshot = await reloadNegotiationSnapshot(access.negotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return snapshot;
    });

    await publishNegotiationEvent({
      type: bothSigned ? 'CONTRACT_SIGNATURE_COMPLETED' : 'CONTRACT_SIGNATURE_REQUESTED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        envelopeStatus: envelope.status,
        buyerSigned,
        sellerSigned,
        provider: envelope.provider,
      },
    });

    return NextResponse.json({
      negotiation,
      message:
        envelope.status === ContractEnvelopeStatus.COMPLETED
          ? 'Vertrag vollständig unterzeichnet'
          : 'Signatur wurde erfasst und an den Signaturdienst übermittelt.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }

    console.error('Failed to sign negotiation contract', error);
    return NextResponse.json(
      { error: 'CONTRACT_SIGN_FAILED', message: 'Signatur konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}

async function resolveParticipants(
  negotiationId: string,
  actors: Array<{ id: string; role: ContractParticipant['role'] }>
): Promise<ContractParticipant[]> {
  const users = await prisma.user.findMany({
    where: { id: { in: actors.map((actor) => actor.id) } },
    select: { id: true, name: true, email: true },
  });

  return actors.map((actor) => {
    const match = users.find((user) => user.id === actor.id);
    return {
      id: actor.id,
      role: actor.role,
      name: match?.name ?? `${actor.role.toLowerCase()}@${negotiationId}`,
      email: match?.email ?? undefined,
    } satisfies ContractParticipant;
  });
}
