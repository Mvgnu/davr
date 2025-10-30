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

  it('marks subscription as expired and stores dunning metadata on invoice failure', async () => {
    const failureTimestamp = Math.floor(Date.now() / 1000);
    const locatedRecord = {
      id: 'sub-db-2',
      userId: 'user-2',
      tier: 'PREMIUM',
      status: 'ACTIVE',
      currentPeriodEndsAt: new Date('2025-02-01T00:00:00.000Z'),
      cancellationRequestedAt: null,
      metadata: { premiumLifecycle: { seatCapacity: 5, seatsInUse: 4 } },
      stripeCustomerId: 'cus_2',
      stripeSubscriptionId: 'sub_2',
      stripePriceId: 'price_2',
      latestInvoiceId: 'in_9',
    };

    premiumSubscriptionFindFirst.mockImplementation(async (args: any) => {
      if (args?.where?.stripeSubscriptionId === 'sub_2') {
        return locatedRecord;
      }

      return null;
    });

    premiumSubscriptionUpdate.mockResolvedValue({
      ...locatedRecord,
      status: 'EXPIRED',
      metadata: { premiumLifecycle: { dunningState: 'PAYMENT_FAILED' } },
      entitlements: [],
    });

    const { handleStripeWebhookEvent } = await import('@/lib/premium/entitlements');

    const invoiceEvent = {
      id: 'evt_invoice_failed',
      type: 'invoice.payment_failed',
      created: failureTimestamp,
      data: {
        object: {
          id: 'in_10',
          status: 'open',
          customer: 'cus_2',
          subscription: 'sub_2',
          metadata: { userId: 'user-2' },
        },
      },
    } as unknown as Stripe.Event;

    await handleStripeWebhookEvent(invoiceEvent);

    expect(prismaDouble.$transaction).toHaveBeenCalled();
    expect(premiumSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-db-2' },
        data: expect.objectContaining({
          status: 'EXPIRED',
          latestInvoiceId: 'in_10',
          metadata: expect.objectContaining({
            premiumLifecycle: expect.objectContaining({
              dunningState: 'PAYMENT_FAILED',
              lastReminderSentAt: null,
            }),
          }),
        }),
      })
    );
    expect(premiumEntitlementCreateMany).not.toHaveBeenCalled();
    expect(premiumSubscriptionWebhookEventUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ stripeEventId: 'evt_invoice_failed' }),
      })
    );
  });
});
