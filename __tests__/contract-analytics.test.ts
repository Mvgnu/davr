const enums = {
  ContractIntentEventType: {
    ENVELOPE_ISSUED: 'ENVELOPE_ISSUED',
    PARTICIPANT_SIGNED: 'PARTICIPANT_SIGNED',
  },
};

jest.mock('@prisma/client', () => enums, { virtual: true });

const createMock = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  prisma: {
    contractIntentMetric: {
      create: createMock,
    },
  },
}));

describe('contract analytics helpers', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('persists contract intent event with default timestamp', async () => {
    const { recordContractIntentEvent } = require('@/lib/contracts/analytics');

    await recordContractIntentEvent({
      negotiationId: 'neg-1',
      contractId: 'contract-1',
      eventType: enums.ContractIntentEventType.ENVELOPE_ISSUED,
      metadata: { provider: 'mock-esign' },
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const [arg] = createMock.mock.calls[0];
    expect(arg.data.negotiationId).toBe('neg-1');
    expect(arg.data.contractId).toBe('contract-1');
    expect(arg.data.eventType).toBe('ENVELOPE_ISSUED');
    expect(arg.data.metadata).toEqual({ provider: 'mock-esign' });
    expect(arg.data.occurredAt).toBeInstanceOf(Date);
  });

  it('records participant signature event with provided timestamp', async () => {
    const { recordParticipantSignatureEvent } = require('@/lib/contracts/analytics');

    await recordParticipantSignatureEvent({
      negotiationId: 'neg-2',
      contractId: 'contract-2',
      participantRole: 'BUYER',
      signedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const [arg] = createMock.mock.calls[0];
    expect(arg.data.eventType).toBe('PARTICIPANT_SIGNED');
    expect(arg.data.participantRole).toBe('BUYER');
    expect(arg.data.occurredAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });
});
