import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NegotiationStatus, OfferType, EscrowStatus, ListingStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import {
  createNegotiationSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';
import { reloadNegotiationSnapshot } from '@/lib/api/negotiations';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { getEscrowProvider } from '@/lib/integrations/escrow';
import { deriveNegotiationPremiumTier, getPremiumProfileForUser } from '@/lib/premium/entitlements';

const ACTIVE_NEGOTIATION_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.INITIATED,
  NegotiationStatus.COUNTERING,
  NegotiationStatus.AGREED,
  NegotiationStatus.CONTRACT_DRAFTING,
  NegotiationStatus.CONTRACT_SIGNED,
  NegotiationStatus.ESCROW_FUNDED,
];

/**
 * POST handler: initiate a negotiation between buyer and seller
 * meta: feature=marketplace-deals action=initiate-negotiation version=0.1
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json();
  const validation = validateRequest(createNegotiationSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Anfrageparameter',
        details: formatValidationErrors(validation.error),
      },
      { status: 400 }
    );
  }

  const { listingId, initialOfferPrice, initialOfferQuantity, message, expiresAt, currency } =
    validation.data;
  const expectedEscrowAmount =
    typeof initialOfferQuantity === 'number'
      ? initialOfferPrice * initialOfferQuantity
      : initialOfferPrice;

  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        seller_id: true,
        status: true,
        isPremiumWorkflow: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Listing wurde nicht gefunden' },
        { status: 404 }
      );
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'LISTING_INACTIVE', message: 'Nur aktive Listings können verhandelt werden' },
        { status: 400 }
      );
    }

    if (listing.seller_id === session.user.id) {
      return NextResponse.json(
        { error: 'SELF_NEGOTIATION_NOT_ALLOWED', message: 'Eigene Listings können nicht verhandelt werden' },
        { status: 400 }
      );
    }

    const existingNegotiation = await prisma.negotiation.findFirst({
      where: {
        listingId,
        buyerId: session.user.id,
        status: { in: ACTIVE_NEGOTIATION_STATUSES },
      },
      select: { id: true },
    });

    if (existingNegotiation) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_EXISTS',
          message: 'Es läuft bereits eine aktive Verhandlung für dieses Listing',
        },
        { status: 409 }
      );
    }

    const buyerProfile = await getPremiumProfileForUser(session.user.id);
    const buyerPaymentLocked = buyerProfile.dunningState === 'PAYMENT_FAILED' && !buyerProfile.isInGracePeriod;
    const buyerSeatLocked = buyerProfile.isSeatCapacityExceeded;
    if (listing.isPremiumWorkflow && buyerPaymentLocked) {
      return NextResponse.json(
        {
          error: 'PREMIUM_PAYMENT_FAILED',
          message:
            'Premium-Workflows sind aufgrund eines Zahlungsfehlers vorübergehend gesperrt. Bitte Zahlungsdaten aktualisieren.',
        },
        { status: 403 }
      );
    }

    if (listing.isPremiumWorkflow && buyerSeatLocked) {
      return NextResponse.json(
        {
          error: 'PREMIUM_SEAT_LIMIT',
          message: 'Premium-Sitzplatzlimit erreicht. Bitte Plätze freigeben oder Kontingent erhöhen.',
        },
        { status: 403 }
      );
    }

    const negotiationPremiumTier = deriveNegotiationPremiumTier({
      listingIsPremium: Boolean(listing.isPremiumWorkflow),
      buyerTier: buyerProfile.tier,
    });

    const negotiation = await prisma.$transaction(async (tx) => {
      const createdNegotiation = await tx.negotiation.create({
        data: {
          listingId,
          buyerId: session.user.id,
          sellerId: listing.seller_id,
          status: NegotiationStatus.INITIATED,
          expiresAt: expiresAt ?? null,
          currency,
          notes: message,
          premiumTier: negotiationPremiumTier ?? undefined,
          offers: {
            create: {
              senderId: session.user.id,
              price: initialOfferPrice,
              quantity: initialOfferQuantity ?? null,
              message,
              type: OfferType.INITIAL,
            },
          },
          statusHistory: {
            create: {
              status: NegotiationStatus.INITIATED,
              note: 'Negotiation initiated by buyer',
              createdById: session.user.id,
            },
          },
          escrowAccount: {
            create: {
              status: EscrowStatus.PENDING_SETUP,
              currency,
              expectedAmount: expectedEscrowAmount,
            },
          },
        },
        include: { escrowAccount: true },
      });

      if (createdNegotiation.escrowAccount) {
        const provider = getEscrowProvider();
        const providerAccount = await provider.createAccount({
          negotiationId: createdNegotiation.id,
          expectedAmount: expectedEscrowAmount,
          currency,
        });

        await tx.escrowAccount.update({
          where: { id: createdNegotiation.escrowAccount.id },
          data: {
            providerReference: providerAccount.providerReference,
            status: providerAccount.status,
          },
        });
      }

      const snapshot = await reloadNegotiationSnapshot(createdNegotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return snapshot;
    });

    await publishNegotiationEvent({
      type: 'NEGOTIATION_CREATED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        listingId,
        expectedEscrowAmount,
      },
    });

    return NextResponse.json(
      {
        negotiation,
        message: 'Verhandlung wurde erfolgreich gestartet',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to initiate negotiation', error);
    return NextResponse.json(
      { error: 'NEGOTIATION_INIT_FAILED', message: 'Verhandlung konnte nicht gestartet werden' },
      { status: 500 }
    );
  }
}
