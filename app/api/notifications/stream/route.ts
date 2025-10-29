import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { resolveAdminFlag } from '@/lib/api/negotiations';
import { subscribeToNegotiationLifecycleEvents } from '@/lib/events/queue';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorised', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const negotiationId = searchParams.get('negotiationId');
  const audience = searchParams.get('audience');
  const userId = searchParams.get('userId');

  const channels = new Set<string>();
  const viewerIsAdmin = resolveAdminFlag(session.user);

  channels.add(`user:${session.user.id}`);

  if (userId && userId !== session.user.id && !viewerIsAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  if (audience === 'ADMIN' && !viewerIsAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  if (viewerIsAdmin && audience) {
    channels.add(`audience:${audience}`);
  }

  if (negotiationId) {
    if (!viewerIsAdmin) {
      const negotiation = await prisma.negotiation.findUnique({
        where: { id: negotiationId },
        select: { buyerId: true, sellerId: true },
      });

      if (!negotiation || (negotiation.buyerId !== session.user.id && negotiation.sellerId !== session.user.id)) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    channels.add(`negotiation:${negotiationId}`);
  }

  if (viewerIsAdmin && !negotiationId && !audience && !userId) {
    channels.add('events:all');
  }

  const encoder = new TextEncoder();

  let subscription: ReturnType<typeof subscribeToNegotiationLifecycleEvents> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      subscription = subscribeToNegotiationLifecycleEvents(
        (envelope) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(envelope)}\n\n`));
          } catch (error) {
            console.error('[notifications-stream][send-failed]', error);
          }
        },
        { channels: Array.from(channels) }
      );

      const close = () => {
        subscription?.unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', close);
    },
    cancel() {
      subscription?.unsubscribe();
      subscription = null;
      console.info('[notifications-stream] cancelled by client');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
