// meta: feature=contract-redline owner=platform stage=alpha

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { resolveRevisionComment } from '@/lib/contracts/revisions';
import {
  formatValidationErrors,
  resolveRevisionCommentSchema,
  validateRequest,
} from '@/lib/api/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { negotiationId: string; revisionId: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(resolveRevisionCommentSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', details: formatValidationErrors(validation.error) },
      { status: 400 }
    );
  }

  try {
    await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    const comment = await resolveRevisionComment({
      commentId: params.commentId,
      actorId: session.user.id,
      resolved: validation.data.resolved,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('[contract-revision-comment][resolve-failed]', error);
    return NextResponse.json(
      { error: 'COMMENT_RESOLVE_FAILED', message: 'Kommentar konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}
