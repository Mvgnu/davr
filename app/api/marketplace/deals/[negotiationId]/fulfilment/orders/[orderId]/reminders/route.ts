import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
  reloadNegotiationSnapshot,
} from '@/lib/api/negotiations';
import { scheduleFulfilmentReminder } from '@/lib/fulfilment/service';
import {
  formatValidationErrors,
  scheduleFulfilmentReminderSchema,
  validateRequest,
} from '@/lib/api/validation';

// meta: route=marketplace-fulfilment-reminders version=0.1 owner=operations scope=logistics

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
  const validation = validateRequest(scheduleFulfilmentReminderSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Erinnerungskonfiguration',
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
          message: 'Nur teilnehmende Parteien können Erinnerungen planen.',
        },
        { status: 403 }
      );
    }

    const reminder = await scheduleFulfilmentReminder({
      orderId: params.orderId,
      type: validation.data.type,
      scheduledFor: validation.data.scheduledFor,
      metadata: validation.data.metadata,
    });

    if (!reminder) {
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
      reminder,
      message: 'Erinnerung wurde geplant.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[fulfilment][reminder-failed]', error);
    return NextResponse.json(
      { error: 'FULFILMENT_REMINDER_FAILED', message: 'Erinnerung konnte nicht geplant werden' },
      { status: 500 }
    );
  }
}
