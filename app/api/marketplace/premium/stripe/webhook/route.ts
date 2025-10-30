import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';

import {
  constructStripeWebhookEvent,
  StripeConfigurationError,
  StripeWebhookSignatureError,
} from '@/lib/premium/payments/stripe';
import { handleStripeWebhookEvent } from '@/lib/premium/entitlements';

/**
 * meta: route=premium-stripe-webhook version=0.1 owner=platform
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    return NextResponse.json(
      { error: 'BODY_READ_FAILED', message: 'Webhook payload konnte nicht gelesen werden.' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(rawBody, request.headers.get('stripe-signature'));
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      return NextResponse.json(
        { error: 'INVALID_SIGNATURE', message: 'Stripe-Signatur ungültig oder fehlt.' },
        { status: 401 }
      );
    }

    if (error instanceof StripeConfigurationError) {
      return NextResponse.json(
        { error: 'WEBHOOK_NOT_CONFIGURED', message: 'Stripe-Webhooks sind nicht konfiguriert.' },
        { status: 500 }
      );
    }

    console.error('[premium-stripe-webhook] construct-event', error);
    return NextResponse.json(
      { error: 'EVENT_CONSTRUCTION_FAILED', message: 'Webhook konnte nicht verarbeitet werden.' },
      { status: 500 }
    );
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (error) {
    console.error('[premium-stripe-webhook] handle-event', error);
    return NextResponse.json(
      { error: 'PROCESSING_FAILED', message: 'Webhook-Verarbeitung fehlgeschlagen.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'ok' });
}
