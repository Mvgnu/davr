// meta: feature=contract-redline owner=platform stage=alpha

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { addRevisionComment } from '@/lib/contracts/revisions';
import {
  addRevisionCommentSchema,
  formatValidationErrors,
  validateRequest,
} from '@/lib/api/validation';

export async function POST(
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
  const validation = validateRequest(addRevisionCommentSchema, payload);

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

    const comment = await addRevisionComment({
      revisionId: params.revisionId,
      authorId: session.user.id,
      body: validation.data.body,
      anchor: validation.data.anchor,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('[contract-revision-comment][create-failed]', error);
    return NextResponse.json(
      { error: 'COMMENT_CREATE_FAILED', message: 'Kommentar konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
