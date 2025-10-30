// meta: feature=contract-redline owner=platform stage=alpha

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import {
  createContractRevision,
  listContractRevisions,
} from '@/lib/contracts/revisions';
import {
  createContractRevisionSchema,
  formatValidationErrors,
  validateRequest,
} from '@/lib/api/validation';

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

    const revisions = await listContractRevisions(params.negotiationId);
    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('[contract-revision][list-failed]', error);
    return NextResponse.json(
      { error: 'REVISION_LIST_FAILED', message: 'Revisionen konnten nicht geladen werden' },
      { status: 500 }
    );
  }
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

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(createContractRevisionSchema, payload);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', details: formatValidationErrors(validation.error) },
      { status: 400 }
    );
  }

  try {
    const negotiation = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    if (!negotiation.negotiation.contract) {
      return NextResponse.json(
        { error: 'CONTRACT_MISSING', message: 'Für diese Verhandlung existiert noch kein Vertrag' },
        { status: 409 }
      );
    }

    const revision = await createContractRevision({
      negotiationId: params.negotiationId,
      contractId: negotiation.negotiation.contract.id,
      authorId: session.user.id,
      body: validation.data.body,
      summary: validation.data.summary,
      attachments: validation.data.attachments,
      submit: validation.data.submit,
    });

    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    console.error('[contract-revision][create-failed]', error);
    return NextResponse.json(
      { error: 'REVISION_CREATE_FAILED', message: 'Revision konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
