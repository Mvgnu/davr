import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
} from '@/lib/api/negotiations';

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
    const result = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    return NextResponse.json({ negotiation: result.negotiation });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to load negotiation', error);
    return NextResponse.json(
      { error: 'NEGOTIATION_FETCH_FAILED', message: 'Verhandlung konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}
