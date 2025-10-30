jest.mock('@prisma/client', () => ({
  FulfilmentOrderStatus: {
    SCHEDULING: 'SCHEDULING',
    SCHEDULED: 'SCHEDULED',
    IN_TRANSIT: 'IN_TRANSIT',
  },
  FulfilmentMilestoneType: {
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
  },
}), { virtual: true });

const publishNegotiationEventMock = jest.fn();
const markReminderSentMock = jest.fn();

jest.mock('@/lib/events/negotiations', () => ({
  publishNegotiationEvent: (...args: unknown[]) => publishNegotiationEventMock(...args),
}));

jest.mock('@/lib/fulfilment/service', () => ({
  markReminderSent: (...args: unknown[]) => markReminderSentMock(...args),
}));

const fulfilmentReminderCountMock = jest.fn();
const fulfilmentReminderFindManyMock = jest.fn();
const fulfilmentOrderFindManyMock = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    fulfilmentReminder: {
      count: (...args: unknown[]) => fulfilmentReminderCountMock(...args),
      findMany: (...args: unknown[]) => fulfilmentReminderFindManyMock(...args),
    },
    fulfilmentOrder: {
      findMany: (...args: unknown[]) => fulfilmentOrderFindManyMock(...args),
    },
  },
}));

import { escalateMissedPickups, runFulfilmentLogisticsSweep } from '@/lib/jobs/fulfilment/reminders';

describe('fulfilment reminder jobs', () => {
  beforeEach(() => {
    publishNegotiationEventMock.mockReset();
    markReminderSentMock.mockReset();
    fulfilmentReminderCountMock.mockReset();
    fulfilmentReminderFindManyMock.mockReset();
    fulfilmentOrderFindManyMock.mockReset();
  });

  it('escalates missed pickups and queues SLA notifications', async () => {
    fulfilmentOrderFindManyMock.mockResolvedValueOnce([
      { id: 'order-1', negotiationId: 'neg-1' },
    ]);

    const escalated = await escalateMissedPickups();

    expect(escalated).toBe(1);
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FULFILMENT_ORDER_UPDATED',
        negotiationId: 'neg-1',
        channels: expect.arrayContaining(['channel:email', 'channel:sms']),
        payload: expect.objectContaining({
          orderId: 'order-1',
          escalation: 'PICKUP_WINDOW_MISSED',
          severity: 'CRITICAL',
        }),
      })
    );
  });

  it('returns metrics including SLA alert count', async () => {
    fulfilmentReminderCountMock.mockResolvedValueOnce(2);
    fulfilmentReminderFindManyMock.mockResolvedValueOnce([
      { id: 'rem-1', orderId: 'order-1' },
    ]);
    markReminderSentMock.mockResolvedValue(undefined);
    fulfilmentOrderFindManyMock.mockResolvedValueOnce([]);

    const metrics = await runFulfilmentLogisticsSweep();

    expect(markReminderSentMock).toHaveBeenCalledWith('rem-1');
    expect(metrics).toEqual({
      pendingReminderCount: 2,
      remindersProcessed: 1,
      overdueOrdersEscalated: 0,
      slaAlertsQueued: 0,
    });
  });
});
