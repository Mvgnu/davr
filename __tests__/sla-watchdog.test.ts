import { addHours } from 'date-fns';

jest.mock('@prisma/client', () => ({
  NegotiationStatus: {
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
  },
}));

describe('scanNegotiationSlaWindows', () => {
  const mockPrisma = {
    negotiation: {
      findMany: jest.fn(),
    },
  };
  const publishNegotiationEvent = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPrisma.negotiation.findMany.mockReset();
    publishNegotiationEvent.mockReset();
  });

  async function prepare(referenceNegotiations: Array<{ id: string; expiresAt: Date | null }>) {
    mockPrisma.negotiation.findMany.mockResolvedValue(referenceNegotiations);

    jest.doMock('@/lib/db/prisma', () => ({ prisma: mockPrisma }));
    jest.doMock('@/lib/events/negotiations', () => ({ publishNegotiationEvent }));

    const module = await import('@/lib/jobs/negotiations/sla');
    return module.scanNegotiationSlaWindows;
  }

  it('emits breach events when expiration is past reference time', async () => {
    const referenceDate = new Date('2025-06-05T10:00:00.000Z');
    const scan = await prepare([
      { id: 'n1', expiresAt: addHours(referenceDate, -1) },
    ]);

    await scan(referenceDate);

    expect(mockPrisma.negotiation.findMany).toHaveBeenCalled();
    expect(publishNegotiationEvent).toHaveBeenCalledTimes(1);
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NEGOTIATION_SLA_BREACHED',
        negotiationId: 'n1',
        occurredAt: referenceDate,
      })
    );
  });

  it('emits warning events when expiration is within threshold window', async () => {
    const referenceDate = new Date('2025-06-05T10:00:00.000Z');
    const warningDate = addHours(referenceDate, 6);
    const scan = await prepare([
      { id: 'warn', expiresAt: warningDate },
    ]);

    await scan(referenceDate);

    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NEGOTIATION_SLA_WARNING',
        negotiationId: 'warn',
        payload: expect.objectContaining({ expiresAt: warningDate.toISOString() }),
      })
    );
  });

  it('ignores negotiations without expiration or outside threshold', async () => {
    const referenceDate = new Date('2025-06-05T10:00:00.000Z');
    const scan = await prepare([
      { id: 'future', expiresAt: addHours(referenceDate, 48) },
      { id: 'missing', expiresAt: null },
    ]);

    await scan(referenceDate);

    expect(publishNegotiationEvent).not.toHaveBeenCalled();
  });
});
