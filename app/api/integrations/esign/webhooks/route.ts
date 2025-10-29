import { NextResponse, type NextRequest } from 'next/server';

import { handleESignatureWebhook } from '@/lib/integrations/esign';

/**
 * meta: feature=esign-webhooks scope=integrations version=0.1 owner=platform
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    if (!payload?.negotiationId || !payload?.contractId || !payload?.participant?.id || !payload?.status) {
      return NextResponse.json(
        { error: 'INVALID_WEBHOOK', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await handleESignatureWebhook({
      negotiationId: payload.negotiationId,
      contractId: payload.contractId,
      participant: payload.participant,
      status: payload.status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to process e-sign webhook', error);
    return NextResponse.json(
      { error: 'WEBHOOK_PROCESSING_FAILED', message: 'Webhook payload rejected' },
      { status: 500 }
    );
  }
}
