import { NextRequest } from 'next/server';

describe('notifications ack route', () => {
  const acknowledgeMock = jest.fn();
  const getServerSessionMock = jest.fn();
  const resolveAdminFlagMock = jest.fn(
    (user: { isAdmin?: boolean; role?: string } | null | undefined) =>
      Boolean(user?.isAdmin) || user?.role === 'ADMIN'
  );

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    acknowledgeMock.mockReset();
    getServerSessionMock.mockReset();
    resolveAdminFlagMock.mockClear();

    jest.doMock('@/lib/events/queue', () => ({
      acknowledgeNegotiationNotifications: acknowledgeMock,
    }));
    jest.doMock('@/lib/api/negotiations', () => ({ resolveAdminFlag: resolveAdminFlagMock }));
    jest.doMock('next-auth/next', () => ({ getServerSession: getServerSessionMock }));
  });

  async function loadRoute() {
    return import('@/app/api/notifications/ack/route');
  }

  it('requires authentication', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { POST } = await loadRoute();
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ ids: ['event-1'] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(acknowledgeMock).not.toHaveBeenCalled();
  });

  it('requires ids payload', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });

    const { POST } = await loadRoute();
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(acknowledgeMock).not.toHaveBeenCalled();
  });

  it('acknowledges notifications and filters invalid ids', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    acknowledgeMock.mockResolvedValue({ updated: 2 });

    const { POST } = await loadRoute();
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ ids: ['event-1', '', 'event-2', null] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(acknowledgeMock).toHaveBeenCalledWith(['event-1', 'event-2'], {
      userId: 'user-1',
      isAdmin: false,
    });
    expect(response.status).toBe(200);
    expect(payload).toEqual({ updated: 2 });
  });

  it('passes admin flag when viewer is admin', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    acknowledgeMock.mockResolvedValue({ updated: 1 });

    const { POST } = await loadRoute();
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ ids: ['event-3'] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(acknowledgeMock).toHaveBeenCalledWith(['event-3'], {
      userId: 'admin-1',
      isAdmin: true,
    });
    expect(response.status).toBe(200);
  });
});
