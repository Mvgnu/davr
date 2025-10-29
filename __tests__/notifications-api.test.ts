import { NextRequest } from 'next/server';

describe('notifications list route', () => {
  const listNotificationsMock = jest.fn();
  const getServerSessionMock = jest.fn();
  const resolveAdminFlagMock = jest.fn(
    (user: { isAdmin?: boolean; role?: string } | null | undefined) =>
      Boolean(user?.isAdmin) || user?.role === 'ADMIN'
  );

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    listNotificationsMock.mockReset();
    getServerSessionMock.mockReset();
    resolveAdminFlagMock.mockClear();

    jest.doMock('@prisma/client', () => ({
      NegotiationActivityAudience: {
        PARTICIPANTS: 'PARTICIPANTS',
        ADMIN: 'ADMIN',
        ALL: 'ALL',
      },
      NotificationDeliveryStatus: {
        PENDING: 'PENDING',
        DELIVERED: 'DELIVERED',
        FAILED: 'FAILED',
      },
    }));
    jest.doMock('@/lib/events/queue', () => ({
      listNegotiationNotifications: listNotificationsMock,
    }));
    jest.doMock('@/lib/api/negotiations', () => ({ resolveAdminFlag: resolveAdminFlagMock }));
    jest.doMock('next-auth/next', () => ({ getServerSession: getServerSessionMock }));
  });

  async function loadRoute() {
    return import('@/app/api/notifications/route');
  }

  it('rejects unauthenticated access', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { GET } = await loadRoute();
    const request = new NextRequest('http://localhost/api/notifications');

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(listNotificationsMock).not.toHaveBeenCalled();
  });

  it('rejects foreign userId filter for non-admin viewers', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });

    const { GET } = await loadRoute();
    const request = new NextRequest(
      'http://localhost/api/notifications?userId=cluser000000000000000000999'
    );

    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(listNotificationsMock).not.toHaveBeenCalled();
  });

  it('passes viewer context to the notification listing', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    listNotificationsMock.mockResolvedValue([]);

    const { GET } = await loadRoute();
    const request = new NextRequest(
      'http://localhost/api/notifications?negotiationId=clneg000000000000000000001&since=2025-06-05T10:00:00.000Z'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(listNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        negotiationId: 'clneg000000000000000000001',
        since: new Date('2025-06-05T10:00:00.000Z'),
        limit: 50,
      }),
      { userId: 'user-1', isAdmin: false }
    );
  });

  it('allows admin-specific filters for admins', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    listNotificationsMock.mockResolvedValue([]);

    const { GET } = await loadRoute();
    const request = new NextRequest(
      'http://localhost/api/notifications?audience=ADMIN&userId=cluser000000000000000000002&limit=10'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(listNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: 'ADMIN',
        userId: 'cluser000000000000000000002',
        limit: 10,
      }),
      { userId: 'admin-1', isAdmin: true }
    );
  });

  it('rejects invalid query filters', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });

    const { GET } = await loadRoute();
    const request = new NextRequest('http://localhost/api/notifications?negotiationId=not-a-cuid');

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(listNotificationsMock).not.toHaveBeenCalled();
  });
});
