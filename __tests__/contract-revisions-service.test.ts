const aggregateMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();
const updateManyMock = jest.fn();
const dealContractUpdateMock = jest.fn();
const revisionFindUniqueMock = jest.fn();
const commentCreateMock = jest.fn();
const commentUpdateMock = jest.fn();
const publishNegotiationEventMock = jest.fn();
const syncContractRevisionAttachmentsMock = jest.fn();

const transactionMock = jest.fn((callback) =>
  callback({
    dealContractRevision: {
      aggregate: aggregateMock,
      create: createMock,
      update: updateMock,
      updateMany: updateManyMock,
      findUnique: revisionFindUniqueMock,
    },
    dealContract: {
      update: dealContractUpdateMock,
    },
  })
);

jest.mock('@prisma/client', () => ({
  ContractRevisionStatus: {
    DRAFT: 'DRAFT',
    IN_REVIEW: 'IN_REVIEW',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  },
  ContractRevisionCommentStatus: {
    OPEN: 'OPEN',
    RESOLVED: 'RESOLVED',
  },
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    dealContractRevision: {
      aggregate: aggregateMock,
      create: createMock,
      update: updateMock,
      updateMany: updateManyMock,
      findUnique: revisionFindUniqueMock,
    },
    dealContract: {
      update: dealContractUpdateMock,
    },
    dealContractRevisionComment: {
      create: commentCreateMock,
      update: commentUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

jest.mock('@/lib/events/negotiations', () => ({
  publishNegotiationEvent: publishNegotiationEventMock,
}));

jest.mock('@/lib/integrations/storage', () => ({
  syncContractRevisionAttachments: syncContractRevisionAttachmentsMock,
}));

describe('contract revision service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    aggregateMock.mockResolvedValue({ _max: { version: 0 } });
    createMock.mockResolvedValue({
      id: 'rev-1',
      negotiationId: 'neg-1',
      contractId: 'contract-1',
      version: 1,
      summary: 'Initial summary',
      body: 'Draft body',
      attachments: null,
      status: 'IN_REVIEW',
      createdById: 'user-1',
    });
    updateMock.mockResolvedValue({ id: 'rev-1', status: 'ACCEPTED', isCurrent: true });
    updateManyMock.mockResolvedValue({});
    dealContractUpdateMock.mockResolvedValue({});
    revisionFindUniqueMock.mockResolvedValue({
      id: 'rev-1',
      negotiationId: 'neg-1',
      contractId: 'contract-1',
      version: 1,
      summary: 'Initial summary',
      body: 'Draft body',
      attachments: [
        { url: 'https://cdn/contracts/rev-1.pdf', mimeType: 'application/pdf' },
      ],
      contract: { currentRevisionId: null, documentUrl: null },
    });
    syncContractRevisionAttachmentsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('creates a revision and publishes submission event', async () => {
    const { createContractRevision } = await import('@/lib/contracts/revisions');

    const revision = await createContractRevision({
      negotiationId: 'neg-1',
      contractId: 'contract-1',
      authorId: 'user-1',
      body: 'Updated body',
      summary: 'Summary',
      attachments: [
        { id: 'att-1', name: 'Draft', url: 'https://cdn/contracts/rev.pdf', mimeType: 'application/pdf' },
      ],
      submit: true,
    });

    expect(aggregateMock).toHaveBeenCalledWith({
      where: { contractId: 'contract-1' },
      _max: { version: true },
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negotiationId: 'neg-1',
          contractId: 'contract-1',
          summary: 'Summary',
          status: 'IN_REVIEW',
        }),
      })
    );
    expect(revision.version).toBe(1);
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CONTRACT_REVISION_SUBMITTED',
        negotiationId: 'neg-1',
        triggeredBy: 'user-1',
      })
    );
    expect(syncContractRevisionAttachmentsMock).toHaveBeenCalledWith({
      negotiationId: 'neg-1',
      contractId: 'contract-1',
      revisionId: 'rev-1',
      attachments: [
        {
          name: 'Draft',
          url: 'https://cdn/contracts/rev.pdf',
          mimeType: 'application/pdf',
        },
      ],
    });
  });

  it('accepts a revision and updates contract pointers', async () => {
    const { updateRevisionStatus } = await import('@/lib/contracts/revisions');

    await updateRevisionStatus({ revisionId: 'rev-1', actorId: 'admin', status: 'ACCEPTED' });

    expect(revisionFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      include: { contract: true },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data: expect.objectContaining({ status: 'ACCEPTED', isCurrent: true }),
    });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { contractId: 'contract-1', id: { not: 'rev-1' } },
      data: { isCurrent: false },
    });
    expect(dealContractUpdateMock).toHaveBeenCalledWith({
      where: { id: 'contract-1' },
      data: expect.objectContaining({ currentRevisionId: 'rev-1', documentUrl: 'https://cdn/contracts/rev-1.pdf' }),
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CONTRACT_REVISION_ACCEPTED',
        negotiationId: 'neg-1',
        triggeredBy: 'admin',
      })
    );
  });
});
