import type { NextRequest } from 'next/server';

const getServerSessionMock = jest.fn();
const getNegotiationWithAccessMock = jest.fn();
const resolveAdminFlagMock = jest.fn();
const reloadNegotiationSnapshotMock = jest.fn();
const createDealDisputeMock = jest.fn();

class MockNegotiationAccessError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}

describe('deal dispute route', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    getServerSessionMock.mockReset();
    getNegotiationWithAccessMock.mockReset();
    resolveAdminFlagMock.mockReset();
    reloadNegotiationSnapshotMock.mockReset();
    createDealDisputeMock.mockReset();

    jest.doMock('@prisma/client', () => ({
      DealDisputeEvidenceType: { LINK: 'LINK', FILE: 'FILE', NOTE: 'NOTE' },
      DealDisputeSeverity: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' },
      DealDisputeCategory: { ESCROW: 'ESCROW', DELIVERY: 'DELIVERY', QUALITY: 'QUALITY', OTHER: 'OTHER' },
      NegotiationStatus: { CANCELLED: 'CANCELLED', IN_PROGRESS: 'IN_PROGRESS' },
    }));

    jest.doMock('next-auth/next', () => ({
      getServerSession: getServerSessionMock,
    }));

    jest.doMock('@/lib/auth/options', () => ({ authOptions: {} }));

    jest.doMock('@/lib/api/negotiations', () => ({
      getNegotiationWithAccess: getNegotiationWithAccessMock,
      NegotiationAccessError: MockNegotiationAccessError,
      resolveAdminFlag: resolveAdminFlagMock,
      reloadNegotiationSnapshot: reloadNegotiationSnapshotMock,
    }));

    jest.doMock('@/lib/disputes/service', () => ({
      createDealDispute: createDealDisputeMock,
      DealDisputeCreationError: class extends Error {
        constructor(public readonly code: string, public readonly status: number, message: string) {
          super(message);
        }
      },
    }));
  });

  function createRequest(body: Record<string, unknown>): NextRequest {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  }

  it('returns 401 when session missing', async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/marketplace/deals/[negotiationId]/disputes/route');

    const response = await POST(createRequest({}), { params: { negotiationId: 'neg-1' } });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'UNAUTHENTICATED' });
  });

  it('rejects when user not participant', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    resolveAdminFlagMock.mockReturnValue(false);
    getNegotiationWithAccessMock.mockResolvedValue({
      negotiation: { id: 'neg-1', status: 'IN_PROGRESS' },
      isBuyer: false,
      isSeller: false,
    });

    const { POST } = await import('@/app/api/marketplace/deals/[negotiationId]/disputes/route');

    const response = await POST(
      createRequest({ summary: 'Gültige Zusammenfassung', attachments: [] }),
      { params: { negotiationId: 'neg-1' } }
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: 'NEGOTIATION_FORBIDDEN' });
  });

  it('creates dispute and returns negotiation snapshot', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'buyer-1' } });
    resolveAdminFlagMock.mockReturnValue(false);
    getNegotiationWithAccessMock.mockResolvedValue({
      negotiation: { id: 'neg-1', status: 'IN_PROGRESS' },
      isBuyer: true,
      isSeller: false,
    });
    reloadNegotiationSnapshotMock.mockResolvedValue({ id: 'neg-1', disputes: [], status: 'IN_PROGRESS' });

    const { POST } = await import('@/app/api/marketplace/deals/[negotiationId]/disputes/route');

    const payload = {
      summary: 'Lieferung fehlgeschlagen',
      description: 'Keine Zustellung trotz Tracking',
      requestedOutcome: 'Erneute Lieferung',
      severity: 'HIGH',
      category: 'DELIVERY',
      attachments: [{ type: 'LINK', url: 'https://example.com', label: 'Tracking' }],
    };

    const response = await POST(createRequest(payload), { params: { negotiationId: 'neg-1' } });

    expect(createDealDisputeMock).toHaveBeenCalledWith({
      negotiationId: 'neg-1',
      raisedByUserId: 'buyer-1',
      summary: payload.summary,
      description: payload.description,
      requestedOutcome: payload.requestedOutcome,
      severity: payload.severity,
      category: payload.category,
      attachments: payload.attachments,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ negotiation: { id: 'neg-1' } });
  });
});
