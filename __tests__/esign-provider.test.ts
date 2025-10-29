const contractEnums = {
  ContractEnvelopeStatus: {
    ISSUED: 'ISSUED',
    PARTIALLY_SIGNED: 'PARTIALLY_SIGNED',
    COMPLETED: 'COMPLETED',
  },
  ContractIntentEventType: {
    ENVELOPE_ISSUED: 'ENVELOPE_ISSUED',
    PARTICIPANT_SIGNED: 'PARTICIPANT_SIGNED',
    ENVELOPE_COMPLETED: 'ENVELOPE_COMPLETED',
    ENVELOPE_DECLINED: 'ENVELOPE_DECLINED',
  },
  ContractStatus: {
    DRAFT: 'DRAFT',
    PENDING_SIGNATURES: 'PENDING_SIGNATURES',
    SIGNED: 'SIGNED',
  },
};

jest.mock('@prisma/client', () => contractEnums, { virtual: true });

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  prisma: {
    dealContract: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/events/negotiations', () => ({
  publishNegotiationEvent: jest.fn(),
}));

jest.mock('@/lib/contracts/analytics', () => ({
  recordEnvelopeLifecycleEvent: jest.fn(),
  recordParticipantSignatureEvent: jest.fn(),
}));

const { ContractEnvelopeStatus, ContractStatus } = require('@prisma/client');
const { prisma } = require('@/lib/db/prisma');
const { publishNegotiationEvent } = require('@/lib/events/negotiations');
const {
  recordEnvelopeLifecycleEvent,
  recordParticipantSignatureEvent,
} = require('@/lib/contracts/analytics');
const { getESignProvider } = require('@/lib/integrations/esign');

describe('MockESignProvider', () => {
  const provider = getESignProvider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('issueEnvelope updates contract metadata', async () => {
    const negotiationId = 'neg-1';
    const contractId = 'contract-1';

    (prisma.dealContract.update as jest.Mock).mockResolvedValue({});

    const result = await provider.issueEnvelope({
      negotiationId,
      contractId,
      draftTerms: 'Test clause',
      participants: [
        { id: 'buyer-1', role: 'BUYER', name: 'Buyer' },
        { id: 'seller-1', role: 'SELLER', name: 'Seller' },
      ],
    });

    expect(prisma.dealContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: contractId },
        data: expect.objectContaining({
          provider: 'mock-esign',
          envelopeStatus: ContractEnvelopeStatus.ISSUED,
          participantStates: expect.objectContaining({ BUYER: expect.any(Object), SELLER: expect.any(Object) }),
        }),
      })
    );
    expect(result.status).toBe(ContractEnvelopeStatus.ISSUED);
    expect(result.participantStates.BUYER.status).toBe('PENDING');
    expect(recordEnvelopeLifecycleEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        negotiationId,
        contractId,
        eventType: 'ENVELOPE_ISSUED',
      })
    );
  });

  it('recordSignature publishes completion event once both parties sign', async () => {
    const negotiationId = 'neg-2';
    const contractId = 'contract-2';

    (prisma.dealContract.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: contractId,
        provider: 'mock-esign',
        providerEnvelopeId: 'env-1',
        providerDocumentId: 'doc-1',
        envelopeStatus: ContractEnvelopeStatus.ISSUED,
        participantStates: {},
        buyerSignedAt: null,
        sellerSignedAt: null,
        finalizedAt: null,
        documentUrl: null,
      })
      .mockResolvedValueOnce({
        id: contractId,
        provider: 'mock-esign',
        providerEnvelopeId: 'env-1',
        providerDocumentId: 'doc-1',
        envelopeStatus: ContractEnvelopeStatus.PARTIALLY_SIGNED,
        participantStates: { BUYER: { status: 'SIGNED', signedAt: new Date().toISOString() } },
        buyerSignedAt: new Date(),
        sellerSignedAt: null,
        finalizedAt: null,
        documentUrl: null,
      });

    (prisma.dealContract.update as jest.Mock)
      .mockResolvedValueOnce({
        provider: 'mock-esign',
        providerEnvelopeId: 'env-1',
        providerDocumentId: 'doc-1',
        envelopeStatus: ContractEnvelopeStatus.PARTIALLY_SIGNED,
        participantStates: { BUYER: { status: 'SIGNED', signedAt: new Date().toISOString() } },
        documentUrl: null,
      })
      .mockResolvedValueOnce({
        provider: 'mock-esign',
        providerEnvelopeId: 'env-1',
        providerDocumentId: 'doc-1',
        envelopeStatus: ContractEnvelopeStatus.COMPLETED,
        participantStates: {
          BUYER: { status: 'SIGNED', signedAt: new Date().toISOString() },
          SELLER: { status: 'SIGNED', signedAt: new Date().toISOString() },
        },
        documentUrl: 'https://example.com/doc.pdf',
        status: ContractStatus.SIGNED,
      });

    const buyerResult = await provider.recordSignature({
      negotiationId,
      contractId,
      participant: { id: 'buyer-2', role: 'BUYER', name: 'Buyer' },
    });
    expect(buyerResult.status).toBe(ContractEnvelopeStatus.PARTIALLY_SIGNED);
    expect(publishNegotiationEvent).not.toHaveBeenCalled();

    const sellerResult = await provider.recordSignature({
      negotiationId,
      contractId,
      participant: { id: 'seller-2', role: 'SELLER', name: 'Seller' },
    });

    expect(sellerResult.status).toBe(ContractEnvelopeStatus.COMPLETED);
    expect(prisma.dealContract.update).toHaveBeenCalledTimes(2);
    expect(publishNegotiationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CONTRACT_SIGNATURE_COMPLETED',
        negotiationId,
      })
    );
    expect(recordParticipantSignatureEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        negotiationId,
        contractId,
        participantRole: 'SELLER',
      })
    );
    expect(recordEnvelopeLifecycleEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        negotiationId,
        contractId,
        eventType: 'ENVELOPE_COMPLETED',
      })
    );
  });
});
