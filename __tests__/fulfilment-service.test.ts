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
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => {
  const fulfilmentOrderFindManyMock = jest.fn();
  const fulfilmentOrderCreateMock = jest.fn();
  const fulfilmentOrderUpdateMock = jest.fn();
  const fulfilmentOrderFindUniqueMock = jest.fn();
  const fulfilmentMilestoneCreateMock = jest.fn();
  const fulfilmentReminderCreateMock = jest.fn();
  const fulfilmentReminderUpdateMock = jest.fn();

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
    },
    __mocks: {
      fulfilmentOrderFindManyMock,
      fulfilmentOrderCreateMock,
      fulfilmentOrderUpdateMock,
      fulfilmentOrderFindUniqueMock,
      fulfilmentMilestoneCreateMock,
      fulfilmentReminderCreateMock,
      fulfilmentReminderUpdateMock,
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
  },
} = jest.requireMock('@/lib/db/prisma');

const { publishNegotiationEvent } = jest.requireMock('@/lib/events/negotiations');

import {
  createFulfilmentOrder,
  updateFulfilmentOrder,
  recordFulfilmentMilestone,
  scheduleFulfilmentReminder,
  markReminderSent,
  deriveReminderWindow,
  getNegotiationFulfilmentSchedule,
} from '@/lib/fulfilment/service';

beforeEach(() => {
  fulfilmentOrderFindManyMock.mockReset();
  fulfilmentOrderCreateMock.mockReset();
  fulfilmentOrderUpdateMock.mockReset();
  fulfilmentOrderFindUniqueMock.mockReset();
  fulfilmentMilestoneCreateMock.mockReset();
  fulfilmentReminderCreateMock.mockReset();
  fulfilmentReminderUpdateMock.mockReset();
  publishNegotiationEvent.mockReset();
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

    const result = await createFulfilmentOrder({
      negotiationId: 'neg-1',
      pickupWindowStart: new Date('2025-11-01T08:00:00Z'),
      pickupWindowEnd: new Date('2025-11-01T10:00:00Z'),
      createdById: 'user-1',
    });

    expect(fulfilmentOrderCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ negotiationId: 'neg-1', status: 'SCHEDULING' }),
      })
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
