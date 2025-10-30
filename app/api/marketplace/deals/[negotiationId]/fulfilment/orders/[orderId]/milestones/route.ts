import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
  reloadNegotiationSnapshot,
} from '@/lib/api/negotiations';
import { recordFulfilmentMilestone } from '@/lib/fulfilment/service';
import {
  formatValidationErrors,
  recordFulfilmentMilestoneSchema,
  validateRequest,
} from '@/lib/api/validation';

// meta: route=marketplace-fulfilment-milestones version=0.1 owner=operations scope=logistics

export async function POST(
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
  const validation = validateRequest(recordFulfilmentMilestoneSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Meilenstein-Daten',
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
          message: 'Nur teilnehmende Parteien können Fulfilment-Meilensteine erfassen.',
        },
        { status: 403 }
      );
    }

    const milestone = await recordFulfilmentMilestone({
      orderId: params.orderId,
      type: validation.data.type,
      occurredAt: validation.data.occurredAt,
      notes: validation.data.notes,
      payload: validation.data.payload,
      recordedById: session.user.id,
    });

    if (!milestone) {
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
      milestone,
      message: 'Meilenstein wurde protokolliert.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[fulfilment][milestone-failed]', error);
    return NextResponse.json(
      { error: 'FULFILMENT_MILESTONE_FAILED', message: 'Meilenstein konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
