jest.mock('@prisma/client', () => ({
  FulfilmentOrderStatus: {
    SCHEDULING: 'SCHEDULING',
    SCHEDULED: 'SCHEDULED',
    IN_TRANSIT: 'IN_TRANSIT',
  },
  FulfilmentMilestoneType: {
    CREATED: 'CREATED',
    PICKUP_CONFIRMED: 'PICKUP_CONFIRMED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
  },
  FulfilmentReminderType: {
    PICKUP_WINDOW: 'PICKUP_WINDOW',
    DELIVERY_WINDOW: 'DELIVERY_WINDOW',
  },
  FulfilmentCarrierSyncStatus: {
    REGISTERED: 'REGISTERED',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED',
  },
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => {
  const fulfilmentOrderFindManyMock = jest.fn();
  const fulfilmentOrderCreateMock = jest.fn();
  const fulfilmentOrderUpdateMock = jest.fn();
  const fulfilmentOrderFindUniqueMock = jest.fn();
  const fulfilmentMilestoneCreateMock = jest.fn();
  const fulfilmentReminderCreateMock = jest.fn();
  const fulfilmentReminderUpdateMock = jest.fn();
  const fulfilmentCarrierManifestUpsertMock = jest.fn();
  const fulfilmentCarrierManifestFindFirstMock = jest.fn();
  const fulfilmentCarrierManifestUpdateMock = jest.fn();
  const fulfilmentTrackingEventDeleteManyMock = jest.fn();
  const fulfilmentTrackingEventCreateManyMock = jest.fn();

  return {
    prisma: {
      fulfilmentOrder: {
        findMany: fulfilmentOrderFindManyMock,
        create: fulfilmentOrderCreateMock,
        update: fulfilmentOrderUpdateMock,
        findUnique: fulfilmentOrderFindUniqueMock,
      },
      fulfilmentMilestone: {
        create: fulfilmentMilestoneCreateMock,
      },
      fulfilmentReminder: {
        create: fulfilmentReminderCreateMock,
        update: fulfilmentReminderUpdateMock,
      },
      fulfilmentCarrierManifest: {
        upsert: fulfilmentCarrierManifestUpsertMock,
        findFirst: fulfilmentCarrierManifestFindFirstMock,
        update: fulfilmentCarrierManifestUpdateMock,
      },
      fulfilmentTrackingEvent: {
        deleteMany: fulfilmentTrackingEventDeleteManyMock,
        createMany: fulfilmentTrackingEventCreateManyMock,
      },
    },
    __mocks: {
      fulfilmentOrderFindManyMock,
      fulfilmentOrderCreateMock,
      fulfilmentOrderUpdateMock,
      fulfilmentOrderFindUniqueMock,
      fulfilmentMilestoneCreateMock,
      fulfilmentReminderCreateMock,
      fulfilmentReminderUpdateMock,
      fulfilmentCarrierManifestUpsertMock,
      fulfilmentCarrierManifestFindFirstMock,
      fulfilmentCarrierManifestUpdateMock,
      fulfilmentTrackingEventDeleteManyMock,
      fulfilmentTrackingEventCreateManyMock,
    },
  };
});

jest.mock('@/lib/fulfilment/providers', () => {
  const registerShipmentMock = jest.fn();
  const pollTrackingMock = jest.fn();
  const parseWebhookMock = jest.fn();

  return {
    getCarrierProvider: jest.fn(() => ({
      id: 'MOCK_EXPRESS',
      displayName: 'Mock Express',
      supportsPolling: true,
      supportsWebhooks: true,
      registerShipment: registerShipmentMock,
      pollTracking: pollTrackingMock,
      parseWebhook: parseWebhookMock,
    })),
    __mocks: {
      registerShipmentMock,
      pollTrackingMock,
      parseWebhookMock,
    },
  };
});

jest.mock('@/lib/events/negotiations', () => ({
  publishNegotiationEvent: jest.fn(),
}));

const {
  __mocks: {
    fulfilmentOrderFindManyMock,
    fulfilmentOrderCreateMock,
    fulfilmentOrderUpdateMock,
    fulfilmentOrderFindUniqueMock,
    fulfilmentMilestoneCreateMock,
    fulfilmentReminderCreateMock,
    fulfilmentReminderUpdateMock,
    fulfilmentCarrierManifestUpsertMock,
    fulfilmentCarrierManifestFindFirstMock,
    fulfilmentCarrierManifestUpdateMock,
    fulfilmentTrackingEventDeleteManyMock,
    fulfilmentTrackingEventCreateManyMock,
  },
} = jest.requireMock('@/lib/db/prisma');

const { publishNegotiationEvent } = jest.requireMock('@/lib/events/negotiations');

const {
  __mocks: { registerShipmentMock, pollTrackingMock, parseWebhookMock },
} = jest.requireMock('@/lib/fulfilment/providers');

import {
  createFulfilmentOrder,
  updateFulfilmentOrder,
  recordFulfilmentMilestone,
  scheduleFulfilmentReminder,
  markReminderSent,
  deriveReminderWindow,
  getNegotiationFulfilmentSchedule,
  pollCarrierTracking,
  ingestCarrierWebhook,
  getFulfilmentSlaAnalytics,
} from '@/lib/fulfilment/service';

beforeEach(() => {
  fulfilmentOrderFindManyMock.mockReset();
  fulfilmentOrderCreateMock.mockReset();
  fulfilmentOrderUpdateMock.mockReset();
  fulfilmentOrderFindUniqueMock.mockReset();
  fulfilmentMilestoneCreateMock.mockReset();
  fulfilmentReminderCreateMock.mockReset();
  fulfilmentReminderUpdateMock.mockReset();
  fulfilmentCarrierManifestUpsertMock.mockReset();
  fulfilmentCarrierManifestFindFirstMock.mockReset();
  fulfilmentCarrierManifestUpdateMock.mockReset();
  fulfilmentTrackingEventDeleteManyMock.mockReset();
  fulfilmentTrackingEventCreateManyMock.mockReset();
  publishNegotiationEvent.mockReset();
  registerShipmentMock.mockReset();
  pollTrackingMock.mockReset();
  parseWebhookMock.mockReset();

  registerShipmentMock.mockResolvedValue({
    trackingReference: 'MOCK_EXPRESS-order-1',
    pollingStatus: 'IN_TRANSIT',
    events: [],
    manifestEcho: { foo: 'bar' },
  });
  pollTrackingMock.mockResolvedValue([]);
  parseWebhookMock.mockResolvedValue(null);
  fulfilmentCarrierManifestUpsertMock.mockResolvedValue({
    id: 'manifest-1',
    pollingStatus: 'IN_TRANSIT',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fulfilment service', () => {
  const baseOrder = {
    id: 'order-1',
    negotiationId: 'neg-1',
    reference: null,
    status: 'SCHEDULING',
    carrierCode: 'MOCK_EXPRESS',
    carrierSyncStatus: 'IN_TRANSIT',
    lastCarrierSyncAt: new Date('2025-10-30T11:30:00Z'),
    pickupWindowStart: new Date('2025-11-01T08:00:00Z'),
    pickupWindowEnd: new Date('2025-11-01T10:00:00Z'),
    pickupLocation: 'Lager A',
    deliveryLocation: 'Ziel B',
    carrierName: 'DHL',
    carrierContact: 'ops@carrier',
    carrierServiceLevel: 'Express',
    trackingNumber: 'TRACK123',
    externalId: null,
    specialInstructions: null,
    milestones: [
      {
        id: 'mile-1',
        type: 'CREATED',
        occurredAt: new Date('2025-10-30T10:00:00Z'),
        notes: 'Fulfilmentauftrag angelegt.',
        recordedById: 'user-1',
        recordedBy: { id: 'user-1', name: 'Ops' },
        payload: null,
      },
    ],
    reminders: [],
    carrierManifest: {
      id: 'manifest-1',
      carrierCode: 'MOCK_EXPRESS',
      trackingReference: 'MOCK_EXPRESS-order-1',
      pollingStatus: 'IN_TRANSIT',
      lastSyncedAt: new Date('2025-10-30T11:30:00Z'),
      manifestPayload: { foo: 'bar' },
      trackingEvents: [],
    },
  };

  function mockScheduleResponse(orderOverride?: Partial<typeof baseOrder>) {
    fulfilmentOrderFindManyMock.mockResolvedValue([
      { ...baseOrder, ...orderOverride },
    ]);
  }

  it('creates fulfilment order with initial milestone and emits event', async () => {
    fulfilmentOrderCreateMock.mockResolvedValue({ ...baseOrder });
    fulfilmentMilestoneCreateMock.mockResolvedValue({
      id: 'mile-1',
      type: 'CREATED',
      occurredAt: new Date('2025-10-30T10:00:00Z'),
      notes: 'Fulfilmentauftrag angelegt.',
      recordedById: 'user-1',
      recordedBy: { id: 'user-1', name: 'Ops' },
      payload: null,
    });
    mockScheduleResponse();
    fulfilmentOrderFindUniqueMock.mockResolvedValue({
      id: 'order-1',
      reference: null,
      carrierCode: 'MOCK_EXPRESS',
      pickupWindowStart: new Date('2025-11-01T08:00:00Z'),
      pickupWindowEnd: new Date('2025-11-01T10:00:00Z'),
      pickupLocation: 'Lager A',
      deliveryLocation: 'Ziel B',
      carrierServiceLevel: 'Express',
      trackingNumber: null,
      carrierManifest: null,
    });

    const result = await createFulfilmentOrder({
      negotiationId: 'neg-1',
      pickupWindowStart: new Date('2025-11-01T08:00:00Z'),
      pickupWindowEnd: new Date('2025-11-01T10:00:00Z'),
      carrierCode: 'mock_express',
      createdById: 'user-1',
    });

    expect(fulfilmentOrderCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ negotiationId: 'neg-1', status: 'SCHEDULING' }),
      })
    );
    expect(registerShipmentMock).toHaveBeenCalledWith(
      expect.objectContaining({ carrierCode: 'MOCK_EXPRESS', orderId: 'order-1' })
    );
    expect(fulfilmentCarrierManifestUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ carrierCode: 'MOCK_EXPRESS' }),
        update: expect.objectContaining({ carrierCode: 'MOCK_EXPRESS' }),
      })
    );
    expect(fulfilmentTrackingEventDeleteManyMock).toHaveBeenCalledWith({ where: { manifestId: 'manifest-1' } });
    expect(fulfilmentOrderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ carrierSyncStatus: 'IN_TRANSIT' }) })
    );
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FULFILMENT_ORDER_CREATED', negotiationId: 'neg-1' })
    );
    expect(result.id).toBe('order-1');
    expect(result.milestones).toHaveLength(1);
  });

  it('updates fulfilment order status and publishes scheduling event', async () => {
    fulfilmentOrderFindUniqueMock.mockResolvedValue({ negotiationId: 'neg-1' });
    fulfilmentOrderUpdateMock.mockResolvedValue({ id: 'order-1', negotiationId: 'neg-1', status: 'SCHEDULED' });
    mockScheduleResponse({ status: 'SCHEDULED' });

    const result = await updateFulfilmentOrder({
      orderId: 'order-1',
      status: 'SCHEDULED' as const,
      updatedById: 'user-2',
    });

    expect(fulfilmentOrderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: expect.objectContaining({ status: 'SCHEDULED' }),
      })
    );
    expect(registerShipmentMock).not.toHaveBeenCalled();
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FULFILMENT_ORDER_SCHEDULED' })
    );
    expect(result?.status).toBe('SCHEDULED');
  });

  it('records milestone and returns dto', async () => {
    fulfilmentOrderFindUniqueMock.mockResolvedValue({ negotiationId: 'neg-1' });
    fulfilmentMilestoneCreateMock.mockResolvedValue({
      id: 'mile-2',
      type: 'PICKED_UP',
      occurredAt: new Date('2025-11-01T08:30:00Z'),
      notes: null,
      recordedById: 'user-2',
      recordedBy: { id: 'user-2', name: 'Ops' },
      payload: null,
    });

    const milestone = await recordFulfilmentMilestone({
      orderId: 'order-1',
      type: 'PICKED_UP' as const,
      recordedById: 'user-2',
    });

    expect(fulfilmentMilestoneCreateMock).toHaveBeenCalled();
    expect(milestone?.type).toBe('PICKED_UP');
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FULFILMENT_MILESTONE_RECORDED' })
    );
  });

  it('polls carrier tracking and updates status', async () => {
    fulfilmentOrderFindUniqueMock.mockResolvedValue({
      id: 'order-1',
      carrierCode: 'MOCK_EXPRESS',
      carrierManifest: { id: 'manifest-1', trackingReference: 'MOCK_EXPRESS-order-1', pollingStatus: 'IN_TRANSIT' },
    });

    pollTrackingMock.mockResolvedValue([
      {
        status: 'DELIVERED',
        description: 'Zugestellt',
        eventTime: new Date('2025-11-02T10:00:00Z'),
        location: 'Empfänger',
        rawPayload: { foo: 'bar' },
      },
    ]);

    await pollCarrierTracking('order-1');

    expect(pollTrackingMock).toHaveBeenCalledWith('MOCK_EXPRESS-order-1');
    expect(fulfilmentTrackingEventDeleteManyMock).toHaveBeenCalledWith({ where: { manifestId: 'manifest-1' } });
    expect(fulfilmentTrackingEventCreateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ status: 'DELIVERED', location: 'Empfänger' }),
        ]),
      })
    );
    expect(fulfilmentCarrierManifestUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pollingStatus: 'DELIVERED' }) })
    );
    expect(fulfilmentOrderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ carrierSyncStatus: 'DELIVERED' }) })
    );
  });

  it('ingests carrier webhook payload and refreshes manifest', async () => {
    parseWebhookMock.mockResolvedValue({
      trackingReference: 'MOCK_EXPRESS-order-1',
      events: [
        {
          status: 'DELIVERED',
          description: 'Webhook bestätigt',
          eventTime: new Date('2025-11-02T11:00:00Z'),
          location: 'Empfänger',
          rawPayload: { via: 'webhook' },
        },
      ],
    });
    fulfilmentCarrierManifestFindFirstMock.mockResolvedValue({
      id: 'manifest-1',
      orderId: 'order-1',
      pollingStatus: 'IN_TRANSIT',
    });

    await ingestCarrierWebhook('MOCK_EXPRESS', { trackingReference: 'MOCK_EXPRESS-order-1' });

    expect(parseWebhookMock).toHaveBeenCalled();
    expect(fulfilmentTrackingEventDeleteManyMock).toHaveBeenCalledWith({ where: { manifestId: 'manifest-1' } });
    expect(fulfilmentCarrierManifestUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pollingStatus: 'DELIVERED' }) })
    );
    expect(fulfilmentOrderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ carrierSyncStatus: 'DELIVERED' }) })
    );
  });

  it('schedules reminders and marks them as sent', async () => {
    fulfilmentOrderFindUniqueMock.mockResolvedValue({ negotiationId: 'neg-1' });
    fulfilmentReminderCreateMock.mockResolvedValue({
      id: 'rem-1',
      orderId: 'order-1',
      type: 'PICKUP_WINDOW',
      scheduledFor: new Date('2025-10-31T07:00:00Z'),
      sentAt: null,
      metadata: null,
    });
    fulfilmentReminderUpdateMock.mockResolvedValue({
      orderId: 'order-1',
      order: { negotiationId: 'neg-1' },
    });

    const reminder = await scheduleFulfilmentReminder({
      orderId: 'order-1',
      type: 'PICKUP_WINDOW' as const,
      scheduledFor: new Date('2025-10-31T07:00:00Z'),
    });
    expect(reminder?.type).toBe('PICKUP_WINDOW');

    await markReminderSent('rem-1');
    expect(fulfilmentReminderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rem-1' } })
    );
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FULFILMENT_REMINDER_SENT' })
    );
  });

  it('maps negotiation fulfilment schedule', async () => {
    mockScheduleResponse();

    const orders = await getNegotiationFulfilmentSchedule('neg-1');
    expect(fulfilmentOrderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { negotiationId: 'neg-1' } })
    );
    expect(orders).toHaveLength(1);
    expect(orders[0].carrierName).toBe('DHL');
  });

  it('aggregates fulfilment SLA analytics across orders', async () => {
    mockScheduleResponse({
      milestones: [
        {
          id: 'mile-1',
          type: 'CREATED',
          occurredAt: new Date('2025-10-30T10:00:00Z'),
          notes: 'Fulfilmentauftrag angelegt.',
          recordedById: 'user-1',
          recordedBy: { id: 'user-1', name: 'Ops' },
          payload: null,
        },
        {
          id: 'mile-2',
          type: 'PICKED_UP',
          occurredAt: new Date('2025-11-01T08:30:00Z'),
          notes: null,
          recordedById: 'user-2',
          recordedBy: { id: 'user-2', name: 'Ops' },
          payload: null,
        },
        {
          id: 'mile-3',
          type: 'DELIVERED',
          occurredAt: new Date('2025-11-01T10:30:00Z'),
          notes: null,
          recordedById: 'user-3',
          recordedBy: { id: 'user-3', name: 'Ops' },
          payload: null,
        },
      ],
      carrierManifest: {
        id: 'manifest-1',
        carrierCode: 'MOCK_EXPRESS',
        trackingReference: 'MOCK_EXPRESS-order-1',
        pollingStatus: 'IN_TRANSIT',
        lastSyncedAt: new Date('2025-10-30T11:30:00Z'),
        manifestPayload: { foo: 'bar' },
        trackingEvents: [
          {
            id: 'track-1',
            status: 'IN_TRANSIT',
            description: 'Unterwegs',
            eventTime: new Date('2025-11-01T08:15:00Z'),
            location: 'Hub B',
            rawPayload: null,
          },
        ],
      },
    });

    const analytics = await getFulfilmentSlaAnalytics('neg-1');

    expect(analytics.evaluatedOrders).toBe(1);
    expect(analytics.pickup.evaluated).toBe(1);
    expect(analytics.pickup.averageDelayMinutes).toBeCloseTo(30);
    expect(analytics.pickup.breaches).toBe(0);
    expect(analytics.delivery.evaluated).toBe(1);
    expect(analytics.delivery.averageDelayMinutes).toBeCloseTo(30);
    expect(analytics.delivery.breaches).toBe(1);
  });

  it('derives reminder window from pickup slots', () => {
    const now = new Date('2025-10-30T10:00:00Z');
    jest.spyOn(global.Date, 'now').mockReturnValue(now.getTime());

    const { pickupReminderAt, deliveryReminderAt } = deriveReminderWindow({
      status: 'SCHEDULED',
      pickupWindowStart: new Date('2025-10-31T08:00:00Z'),
      pickupWindowEnd: new Date('2025-10-31T10:00:00Z'),
    });

    expect(pickupReminderAt).toBeInstanceOf(Date);
    expect(deliveryReminderAt).toBeInstanceOf(Date);
  });
});
