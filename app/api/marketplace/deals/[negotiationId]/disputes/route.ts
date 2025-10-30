import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { DealDisputeEvidenceType, NegotiationStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import {
  createDealDispute,
  DealDisputeCreationError,
} from '@/lib/disputes/service';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
  reloadNegotiationSnapshot,
} from '@/lib/api/negotiations';
import {
  createDealDisputeSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';

export async function POST(request: NextRequest, { params }: { params: { negotiationId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(createDealDisputeSchema, payload);

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

  try {
    const access = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    if (!access.isBuyer && !access.isSeller) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_FORBIDDEN',
          message: 'Nur teilnehmende Parteien können einen Disput eröffnen.',
        },
        { status: 403 }
      );
    }

    if (access.negotiation.status === NegotiationStatus.CANCELLED) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_CLOSED',
          message: 'Für stornierte Verhandlungen können keine Disputs eröffnet werden.',
        },
        { status: 409 }
      );
    }

    const attachments = (validation.data.attachments ?? []).map((attachment) => ({
      type: attachment.type ?? DealDisputeEvidenceType.LINK,
      url: attachment.url,
      label: attachment.label ?? null,
    }));

    await createDealDispute({
      negotiationId: access.negotiation.id,
      raisedByUserId: session.user.id,
      summary: validation.data.summary,
      description: validation.data.description,
      requestedOutcome: validation.data.requestedOutcome,
      severity: validation.data.severity,
      category: validation.data.category,
      attachments,
    });

    const negotiation = await reloadNegotiationSnapshot(access.negotiation.id);
    if (!negotiation) {
      throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
    }

    return NextResponse.json({
      negotiation,
      message: 'Disput wurde erfolgreich eingereicht. Unser Team meldet sich zeitnah.',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof DealDisputeCreationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('[dispute][create-failed]', error);
    return NextResponse.json(
      { error: 'DISPUTE_CREATION_FAILED', message: 'Disput konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
