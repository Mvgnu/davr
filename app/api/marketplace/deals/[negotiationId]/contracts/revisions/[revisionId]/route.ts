// meta: feature=contract-redline owner=platform stage=alpha

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import {
  updateContractRevisionStatus,
} from '@/lib/contracts/revisions';
import {
  formatValidationErrors,
  updateContractRevisionStatusSchema,
  validateRequest,
} from '@/lib/api/validation';
import { ContractRevisionStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { negotiationId: string; revisionId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(updateContractRevisionStatusSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', details: formatValidationErrors(validation.error) },
      { status: 400 }
    );
  }

  try {
    const access = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    const allowed = access.isBuyer || access.isSeller || access.isAdmin;
    if (!allowed) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Keine Berechtigung für Vertragsrevisionen' },
        { status: 403 }
      );
    }

    if (
      validation.data.status === ContractRevisionStatus.ACCEPTED &&
      access.negotiation.contract?.currentRevisionId === params.revisionId
    ) {
      return NextResponse.json(
        { error: 'REVISION_ALREADY_ACCEPTED', message: 'Diese Revision ist bereits aktiv' },
        { status: 409 }
      );
    }

    const revision = await updateContractRevisionStatus({
      revisionId: params.revisionId,
      actorId: session.user.id,
      status: validation.data.status,
    });

    return NextResponse.json({ revision });
  } catch (error) {
    console.error('[contract-revision][status-failed]', error);
    return NextResponse.json(
      { error: 'REVISION_STATUS_FAILED', message: 'Status konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}
