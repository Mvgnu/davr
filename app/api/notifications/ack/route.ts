import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { resolveAdminFlag } from '@/lib/api/negotiations';
import { acknowledgeNegotiationNotifications } from '@/lib/events/queue';
import { authOptions } from '@/lib/auth/options';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ message: 'unauthorised' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? Array.from(
        new Set(
          (body.ids as unknown[]).flatMap((value) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              return value.trim();
            }
            return [] as string[];
          })
        )
      )
    : [];

  if (!ids.length) {
    return Response.json({ message: 'ids-required' }, { status: 400 });
  }

  const viewer = {
    userId: session.user.id,
    isAdmin: resolveAdminFlag(session.user),
  };

  const { updated } = await acknowledgeNegotiationNotifications(ids, viewer);

  return Response.json({ updated });
}
