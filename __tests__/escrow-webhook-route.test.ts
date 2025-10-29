import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

describe('escrow provider webhooks', () => {
  const publishNegotiationEventMock = jest.fn();
  const prismaTxDouble = {
    escrowTransaction: {
      create: jest.fn(),
    },
    escrowAccount: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    negotiation: {
      update: jest.fn(),
    },
  };

  const prismaDouble = {
    escrowAccount: {
      findFirst: jest.fn(),
    },
    escrowTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    negotiation: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const originalSecret = process.env.ESCROW_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    prismaDouble.escrowAccount.findFirst.mockReset();
    prismaDouble.escrowTransaction.findFirst.mockReset();
    prismaDouble.escrowTransaction.create.mockReset();
    prismaDouble.negotiation.update.mockReset();
    prismaDouble.$transaction.mockReset();
    publishNegotiationEventMock.mockReset();

    prismaTxDouble.escrowTransaction.create.mockReset();
    prismaTxDouble.escrowAccount.update.mockReset();
    prismaTxDouble.escrowAccount.findUnique.mockReset();
    prismaTxDouble.negotiation.update.mockReset();

    delete process.env.ESCROW_WEBHOOK_SECRET;
  });

  afterAll(() => {
    process.env.ESCROW_WEBHOOK_SECRET = originalSecret;
  });

  function mockModules() {
    jest.doMock('@prisma/client', () => ({
      EscrowStatus: {
        AWAITING_FUNDS: 'AWAITING_FUNDS',
        FUNDED: 'FUNDED',
        RELEASED: 'RELEASED',
        REFUNDED: 'REFUNDED',
        DISPUTED: 'DISPUTED',
        CLOSED: 'CLOSED',
      },
      EscrowTransactionType: {
        FUND: 'FUND',
        RELEASE: 'RELEASE',
        REFUND: 'REFUND',
        ADJUSTMENT: 'ADJUSTMENT',
      },
      NegotiationStatus: {
        NEGOTIATION: 'NEGOTIATION',
        ESCROW_FUNDED: 'ESCROW_FUNDED',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
      },
    }));

    jest.doMock('@/lib/db/prisma', () => ({ prisma: prismaDouble }));
    jest.doMock('@/lib/events/negotiations', () => ({ publishNegotiationEvent: publishNegotiationEventMock }));
  }

  async function loadRoute() {
    mockModules();
    return import('@/app/api/integrations/escrow/webhooks/route');
  }

  function createRequest(body: Record<string, unknown>, signature?: string): NextRequest {
    const raw = JSON.stringify(body);
    const headers = new Headers();
    if (signature) {
      headers.set('x-escrow-signature', signature);
    }

    return {
      text: jest.fn().mockResolvedValue(raw),
      headers,
    } as unknown as NextRequest;
  }

  it('fails with 500 when no webhook secret configured', async () => {
    const { POST } = await loadRoute();
    const request = createRequest({ event: 'funding_confirmed' });

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'WEBHOOK_SECRET_NOT_CONFIGURED' });
  });

  it('rejects invalid signatures', async () => {
    process.env.ESCROW_WEBHOOK_SECRET = 'test-secret';
    const { POST } = await loadRoute();
    const request = createRequest({ event: 'funding_confirmed' }, 'invalid');

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_SIGNATURE' });
  });

  it('processes dispute events with valid signatures', async () => {
    process.env.ESCROW_WEBHOOK_SECRET = 'test-secret';

    prismaDouble.escrowAccount.findFirst.mockResolvedValue({
      id: 'escrow-1',
      providerReference: 'provider-1',
      currency: 'EUR',
      expectedAmount: 0,
      fundedAmount: 100,
      releasedAmount: 0,
      refundedAmount: 0,
      negotiation: { id: 'neg-1', status: 'NEGOTIATION' },
    });

    prismaDouble.escrowTransaction.findFirst.mockResolvedValue(null);
    prismaDouble.$transaction.mockImplementation(async (callback: (tx: typeof prismaTxDouble) => Promise<unknown>) =>
      callback(prismaTxDouble)
    );
    prismaTxDouble.escrowAccount.update.mockResolvedValue({ id: 'escrow-1', status: 'DISPUTED' });

    const payload = {
      event: 'dispute_opened',
      providerReference: 'provider-1',
      externalTransactionId: 'txn-1',
      amount: 0,
      metadata: { reason: 'evidence_missing' },
    };

    const raw = JSON.stringify(payload);
    const signature = createHmac('sha256', 'test-secret').update(raw).digest('hex');
    const request = createRequest(payload, signature);

    const { POST } = await loadRoute();
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });

    expect(prismaDouble.$transaction).toHaveBeenCalled();
    expect(prismaTxDouble.escrowTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reference: 'txn-1',
        }),
      })
    );
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESCROW_DISPUTE_OPENED',
        negotiationId: 'neg-1',
      })
    );
  });
});
