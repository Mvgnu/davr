import type Stripe from 'stripe';

describe('handleStripeWebhookEvent', () => {
  const premiumSubscriptionFindFirst = jest.fn();
  const premiumSubscriptionUpdate = jest.fn();
  const premiumEntitlementCreateMany = jest.fn();
  const premiumSubscriptionWebhookEventUpsert = jest.fn();

  const prismaTxDouble: any = {
    premiumSubscription: {
      findFirst: premiumSubscriptionFindFirst,
      update: premiumSubscriptionUpdate,
      create: jest.fn(),
    },
    premiumEntitlement: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: premiumEntitlementCreateMany,
    },
    premiumSubscriptionWebhookEvent: {
      upsert: premiumSubscriptionWebhookEventUpsert,
    },
  };

  const prismaDouble: any = {
    premiumSubscription: {
      findFirst: premiumSubscriptionFindFirst,
    },
    $transaction: jest.fn(async (callback: (tx: typeof prismaTxDouble) => Promise<unknown>) =>
      callback(prismaTxDouble)
    ),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    premiumSubscriptionFindFirst.mockReset();
    premiumSubscriptionUpdate.mockReset();
    premiumEntitlementCreateMany.mockReset();
    premiumSubscriptionWebhookEventUpsert.mockReset();

    jest.doMock('@prisma/client', () => ({
      PremiumSubscriptionStatus: {
        ACTIVE: 'ACTIVE',
        TRIALING: 'TRIALING',
        CANCELED: 'CANCELED',
        EXPIRED: 'EXPIRED',
      },
      PremiumTier: {
        STANDARD: 'STANDARD',
        PREMIUM: 'PREMIUM',
        CONCIERGE: 'CONCIERGE',
      },
      PremiumFeature: {
        ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
        DISPUTE_FAST_TRACK: 'DISPUTE_FAST_TRACK',
        CONCIERGE_SLA: 'CONCIERGE_SLA',
      },
      PremiumConversionEventType: {},
      Prisma: { JsonNullValueNull: null },
    }));

    jest.doMock('@/lib/db/prisma', () => ({ prisma: prismaDouble }));
  });

  it('updates subscription and grants entitlements from subscription webhook', async () => {
    const now = Math.floor(Date.now() / 1000);
    premiumSubscriptionFindFirst.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      tier: 'PREMIUM',
      status: 'TRIALING',
      currentPeriodEndsAt: null,
      cancellationRequestedAt: null,
      metadata: {},
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      latestInvoiceId: null,
    });
    premiumSubscriptionUpdate.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      tier: 'PREMIUM',
      status: 'ACTIVE',
      currentPeriodEndsAt: new Date(now * 1000),
      cancellationRequestedAt: null,
      metadata: {},
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_1',
      latestInvoiceId: 'in_1',
      entitlements: [],
    });

    const { handleStripeWebhookEvent } = await import('@/lib/premium/entitlements');

    const subscriptionEvent = {
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          status: 'active',
          customer: 'cus_1',
          metadata: { userId: 'user-1', tier: 'PREMIUM' },
          current_period_end: now,
          trial_end: null,
          cancel_at: null,
          canceled_at: null,
          cancel_at_period_end: false,
          collection_method: 'charge_automatically',
          items: { data: [{ price: { id: 'price_1' } }] },
          latest_invoice: 'in_1',
          start_date: now,
        },
      },
    } as unknown as Stripe.Event;

    await handleStripeWebhookEvent(subscriptionEvent);

    expect(prismaDouble.$transaction).toHaveBeenCalled();
    expect(premiumSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-db-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
          stripePriceId: 'price_1',
          latestInvoiceId: 'in_1',
        }),
      })
    );
    expect(premiumEntitlementCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ feature: 'ADVANCED_ANALYTICS' }),
          expect.objectContaining({ feature: 'DISPUTE_FAST_TRACK' }),
        ]),
      })
    );
    expect(premiumSubscriptionWebhookEventUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ stripeEventId: 'evt_1' }),
      })
    );
  });
});
