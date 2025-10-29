import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ContractStatus, NegotiationStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  reloadNegotiationSnapshot,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

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

    const negotiation = await prisma.$transaction(async (tx) => {
      const contract = await tx.dealContract.update({
        where: { negotiationId: access.negotiation.id },
        data: {
          status: ContractStatus.PENDING_SIGNATURES,
          buyerSignedAt:
            role === 'BUYER' || (role === 'ADMIN' && !access.negotiation.contract.buyerSignedAt)
              ? new Date()
              : access.negotiation.contract.buyerSignedAt ?? undefined,
          sellerSignedAt:
            role === 'SELLER' || (role === 'ADMIN' && !access.negotiation.contract.sellerSignedAt)
              ? new Date()
              : access.negotiation.contract.sellerSignedAt ?? undefined,
        },
      });

      const bothSigned = Boolean(contract.buyerSignedAt && contract.sellerSignedAt);

      if (bothSigned) {
        await tx.dealContract.update({
          where: { negotiationId: access.negotiation.id },
          data: {
            status: ContractStatus.SIGNED,
            finalizedAt: new Date(),
          },
        });

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

    const currentContract = negotiation.contract;
    const bothSigned = Boolean(currentContract?.buyerSignedAt && currentContract?.sellerSignedAt);

    if (bothSigned && currentContract?.status === ContractStatus.SIGNED) {
      await publishNegotiationEvent({
        type: 'CONTRACT_SIGNATURE_COMPLETED',
        negotiationId: negotiation.id,
        triggeredBy: session.user.id,
        status: negotiation.status,
        payload: {
          buyerSignedAt: currentContract.buyerSignedAt?.toISOString(),
          sellerSignedAt: currentContract.sellerSignedAt?.toISOString(),
        },
      });
    } else {
      await publishNegotiationEvent({
        type: 'CONTRACT_SIGNATURE_REQUESTED',
        negotiationId: negotiation.id,
        triggeredBy: session.user.id,
        status: negotiation.status,
        payload: {
          buyerSigned: Boolean(currentContract?.buyerSignedAt),
          sellerSigned: Boolean(currentContract?.sellerSignedAt),
        },
      });
    }

    return NextResponse.json({
      negotiation,
      message: bothSigned
        ? 'Vertrag vollständig unterzeichnet'
        : 'Signatur wurde erfasst. Vertrag wartet auf weitere Unterschriften.',
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
