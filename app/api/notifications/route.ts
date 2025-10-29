import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { NegotiationActivityAudience } from '@prisma/client';

import { resolveAdminFlag } from '@/lib/api/negotiations';
import { notificationsQuerySchema } from '@/lib/api/validation';
import { listNegotiationNotifications } from '@/lib/events/queue';
import { authOptions } from '@/lib/auth/options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ message: 'unauthorised' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawQuery = {
    negotiationId: url.searchParams.get('negotiationId') ?? undefined,
    audience: url.searchParams.get('audience') ?? undefined,
    userId: url.searchParams.get('userId') ?? undefined,
    since: url.searchParams.get('since') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    deliveryStatus: url.searchParams.get('deliveryStatus') ?? undefined,
  };

  const queryResult = notificationsQuerySchema.safeParse(rawQuery);

  if (!queryResult.success) {
    return Response.json(
      {
        message: 'invalid-query',
        errors: queryResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { negotiationId, audience, userId, since, limit, deliveryStatus } = queryResult.data;

  const viewerIsAdmin = resolveAdminFlag(session.user);

  if (userId && userId !== session.user.id && !viewerIsAdmin) {
    return Response.json({ message: 'forbidden' }, { status: 403 });
  }

  if (audience === NegotiationActivityAudience.ADMIN && !viewerIsAdmin) {
    return Response.json({ message: 'forbidden' }, { status: 403 });
  }

  const viewer = {
    userId: session.user.id,
    isAdmin: viewerIsAdmin,
  };

  const notifications = await listNegotiationNotifications(
    {
      negotiationId,
      audience,
      userId,
      since,
      limit,
      deliveryStatus,
    },
    viewer
  );

  return Response.json({ notifications });
}
