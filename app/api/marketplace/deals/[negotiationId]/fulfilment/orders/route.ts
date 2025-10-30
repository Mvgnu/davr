import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
  reloadNegotiationSnapshot,
} from '@/lib/api/negotiations';
import {
  createFulfilmentOrder,
  getNegotiationFulfilmentSchedule,
} from '@/lib/fulfilment/service';
import {
  createFulfilmentOrderSchema,
  formatValidationErrors,
  validateRequest,
} from '@/lib/api/validation';

// meta: route=marketplace-fulfilment-orders version=0.1 owner=operations scope=logistics

export async function GET(
  _request: NextRequest,
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
    await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    const schedule = await getNegotiationFulfilmentSchedule(params.negotiationId);

    return NextResponse.json({ orders: schedule });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[fulfilment][list-failed]', error);
    return NextResponse.json(
      { error: 'FULFILMENT_NOT_AVAILABLE', message: 'Planung konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { negotiationId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(createFulfilmentOrderSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Fulfilment-Daten',
        details: formatValidationErrors(validation.error),
      },
      { status: 400 }
    );
  }

  try {
    const access = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    if (!access.isBuyer && !access.isSeller && !access.isAdmin) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_FORBIDDEN',
          message: 'Nur teilnehmende Parteien können Fulfilment-Aufträge erstellen.',
        },
        { status: 403 }
      );
    }

    await createFulfilmentOrder({
      negotiationId: access.negotiation.id,
      reference: validation.data.reference ?? undefined,
      status: validation.data.status ?? undefined,
      carrierCode: validation.data.carrierCode ?? undefined,
      pickupWindowStart: validation.data.pickupWindowStart ?? undefined,
      pickupWindowEnd: validation.data.pickupWindowEnd ?? undefined,
      pickupLocation: validation.data.pickupLocation ?? undefined,
      deliveryLocation: validation.data.deliveryLocation ?? undefined,
      carrierName: validation.data.carrierName ?? undefined,
      carrierContact: validation.data.carrierContact ?? undefined,
      carrierServiceLevel: validation.data.carrierServiceLevel ?? undefined,
      trackingNumber: validation.data.trackingNumber ?? undefined,
      externalId: validation.data.externalId ?? undefined,
      specialInstructions: validation.data.specialInstructions ?? undefined,
      createdById: session.user.id,
    });

    const negotiation = await reloadNegotiationSnapshot(access.negotiation.id);
    if (!negotiation) {
      throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
    }

    return NextResponse.json({
      negotiation,
      message: 'Fulfilment-Auftrag wurde erstellt.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[fulfilment][create-failed]', error);
    return NextResponse.json(
      { error: 'FULFILMENT_CREATE_FAILED', message: 'Fulfilment-Auftrag konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
