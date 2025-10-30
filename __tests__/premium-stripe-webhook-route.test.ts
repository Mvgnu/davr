import type { NextRequest } from 'next/server';

const constructEventMock = jest.fn();
const handleWebhookMock = jest.fn();

const exportedErrors: {
  StripeConfigurationError?: new (message: string) => Error;
  StripeWebhookSignatureError?: new (message: string) => Error;
} = {};

function setupMocks() {
  jest.doMock('@/lib/premium/payments/stripe', () => {
    class MockStripeConfigurationError extends Error {}
    class MockStripeWebhookSignatureError extends Error {}
    exportedErrors.StripeConfigurationError = MockStripeConfigurationError;
    exportedErrors.StripeWebhookSignatureError = MockStripeWebhookSignatureError;

    return {
      constructStripeWebhookEvent: constructEventMock,
      StripeConfigurationError: MockStripeConfigurationError,
      StripeWebhookSignatureError: MockStripeWebhookSignatureError,
    };
  });

  jest.doMock('@/lib/premium/entitlements', () => ({
    handleStripeWebhookEvent: handleWebhookMock,
  }));
}

function createRequest(rawBody: string, signature: string | null = 'sig'): NextRequest {
  const headers = new Headers();
  if (signature) {
    headers.set('stripe-signature', signature);
  }

  return {
    text: jest.fn().mockResolvedValue(rawBody),
    headers,
  } as unknown as NextRequest;
}

describe('premium stripe webhook route', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    constructEventMock.mockReset();
    handleWebhookMock.mockReset();
    setupMocks();
  });

  it('returns 500 when body cannot be read', async () => {
    const { POST } = await import('@/app/api/marketplace/premium/stripe/webhook/route');
    const request = {
      text: jest.fn().mockRejectedValue(new Error('fail')),
      headers: new Headers(),
    } as unknown as NextRequest;

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'BODY_READ_FAILED' });
  });

  it('returns 401 for invalid signatures', async () => {
    const { POST } = await import('@/app/api/marketplace/premium/stripe/webhook/route');
    const request = createRequest('{}');
    const SignatureError = exportedErrors.StripeWebhookSignatureError!;
    constructEventMock.mockImplementation(() => {
      throw new SignatureError('bad signature');
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'INVALID_SIGNATURE' });
  });

  it('returns 500 when webhook not configured', async () => {
    const { POST } = await import('@/app/api/marketplace/premium/stripe/webhook/route');
    const request = createRequest('{}');
    const ConfigError = exportedErrors.StripeConfigurationError!;
    constructEventMock.mockImplementation(() => {
      throw new ConfigError('missing secret');
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'WEBHOOK_NOT_CONFIGURED' });
  });

  it('forwards events to handler when signature valid', async () => {
    const { POST } = await import('@/app/api/marketplace/premium/stripe/webhook/route');
    constructEventMock.mockReturnValue({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: {} } });
    const request = createRequest('{}');

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(handleWebhookMock).toHaveBeenCalledWith({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: { object: {} },
    });
  });

  it('reports processing failures from handler', async () => {
    const { POST } = await import('@/app/api/marketplace/premium/stripe/webhook/route');
    constructEventMock.mockReturnValue({ id: 'evt_2', type: 'invoice.paid', data: { object: {} } });
    handleWebhookMock.mockRejectedValue(new Error('db down'));
    const request = createRequest('{}');

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: 'PROCESSING_FAILED' });
  });
});
