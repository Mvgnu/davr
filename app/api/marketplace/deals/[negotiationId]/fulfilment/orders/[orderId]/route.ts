import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
  reloadNegotiationSnapshot,
} from '@/lib/api/negotiations';
import { updateFulfilmentOrder } from '@/lib/fulfilment/service';
import {
  formatValidationErrors,
  updateFulfilmentOrderSchema,
  validateRequest,
} from '@/lib/api/validation';

// meta: route=marketplace-fulfilment-order version=0.1 owner=operations scope=logistics

export async function PATCH(
  request: NextRequest,
  { params }: { params: { negotiationId: string; orderId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(updateFulfilmentOrderSchema, payload);

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
          message: 'Nur teilnehmende Parteien können Fulfilment-Aufträge aktualisieren.',
        },
        { status: 403 }
      );
    }

    const updated = await updateFulfilmentOrder({
      orderId: params.orderId,
      status: validation.data.status,
      pickupWindowStart: validation.data.pickupWindowStart,
      pickupWindowEnd: validation.data.pickupWindowEnd,
      pickupLocation: validation.data.pickupLocation,
      deliveryLocation: validation.data.deliveryLocation,
      carrierName: validation.data.carrierName,
      carrierContact: validation.data.carrierContact,
      carrierServiceLevel: validation.data.carrierServiceLevel,
      trackingNumber: validation.data.trackingNumber,
      externalId: validation.data.externalId,
      specialInstructions: validation.data.specialInstructions,
      updatedById: session.user.id,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'FULFILMENT_NOT_FOUND', message: 'Fulfilment-Auftrag existiert nicht mehr' },
        { status: 404 }
      );
    }

    const negotiation = await reloadNegotiationSnapshot(access.negotiation.id);
    if (!negotiation) {
      throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
    }

    return NextResponse.json({
      negotiation,
      message: 'Fulfilment-Auftrag wurde aktualisiert.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[fulfilment][update-failed]', error);
    return NextResponse.json(
      { error: 'FULFILMENT_UPDATE_FAILED', message: 'Fulfilment-Auftrag konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}
