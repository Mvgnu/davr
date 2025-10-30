const negotiationFindMany = jest.fn();
const listingFindMany = jest.fn();

jest.mock(
  '@prisma/client',
  () => ({
    ListingStatus: {
      ACTIVE: 'ACTIVE',
    },
    NegotiationStatus: {
      AGREED: 'AGREED',
      CONTRACT_DRAFTING: 'CONTRACT_DRAFTING',
      CONTRACT_SIGNED: 'CONTRACT_SIGNED',
      ESCROW_FUNDED: 'ESCROW_FUNDED',
      COMPLETED: 'COMPLETED',
      COUNTERING: 'COUNTERING',
    },
  }),
  { virtual: true },
);

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    negotiation: {
      findMany: negotiationFindMany,
    },
    marketplaceListing: {
      findMany: listingFindMany,
    },
  },
}));

describe('marketplace intelligence hub', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    negotiationFindMany.mockReset();
    listingFindMany.mockReset();
  });

  it('aggregates negotiation metrics and supply gaps', async () => {
    const now = new Date('2025-10-30T00:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    negotiationFindMany
      .mockResolvedValueOnce([
        {
          id: 'neg-1',
          status: 'COMPLETED',
          initiatedAt: new Date('2025-10-15T10:00:00Z'),
          agreedPrice: 1200,
          agreedQuantity: 2,
          premiumTier: 'PREMIUM',
          listing: {
            id: 'list-1',
            title: 'Kupferschrott',
            quantity: 2,
            material_id: 'mat-1',
            material: {
              id: 'mat-1',
              name: 'Kupfer',
              slug: 'copper',
              category_icon: 'metal',
              price_unit: 'tonne',
            },
          },
          offers: [
            {
              price: 1200,
              createdAt: new Date('2025-10-15T09:00:00Z'),
            },
          ],
        },
        {
          id: 'neg-2',
          status: 'COUNTERING',
          initiatedAt: new Date('2025-10-20T08:00:00Z'),
          agreedPrice: null,
          agreedQuantity: null,
          premiumTier: null,
          listing: {
            id: 'list-2',
            title: 'Aluminium',
            quantity: 3,
            material_id: 'mat-2',
            material: {
              id: 'mat-2',
              name: 'Aluminium',
              slug: 'aluminium',
              category_icon: 'metal',
              price_unit: 'tonne',
            },
          },
          offers: [
            {
              price: 800,
              createdAt: new Date('2025-10-21T12:00:00Z'),
            },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'neg-3',
          status: 'COMPLETED',
          initiatedAt: new Date('2025-09-15T10:00:00Z'),
          agreedPrice: 900,
          agreedQuantity: 1,
          premiumTier: 'PREMIUM',
          listing: {
            id: 'list-1',
            title: 'Kupferschrott',
            quantity: 2,
            material_id: 'mat-1',
            material: {
              id: 'mat-1',
              name: 'Kupfer',
              slug: 'copper',
              category_icon: 'metal',
              price_unit: 'tonne',
            },
          },
          offers: [
            {
              price: 900,
              createdAt: new Date('2025-09-14T12:00:00Z'),
            },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'neg-historical-1',
          status: 'COMPLETED',
          initiatedAt: new Date('2025-08-10T10:00:00Z'),
          agreedPrice: 750,
          agreedQuantity: 2,
          premiumTier: 'PREMIUM',
          listing: {
            id: 'list-1',
            title: 'Kupferschrott',
            quantity: 2,
            material_id: 'mat-1',
            material: {
              id: 'mat-1',
              name: 'Kupfer',
              slug: 'copper',
              category_icon: 'metal',
              price_unit: 'tonne',
            },
          },
          offers: [
            {
              price: 750,
              createdAt: new Date('2025-08-10T08:00:00Z'),
            },
          ],
        },
        {
          id: 'neg-historical-2',
          status: 'COMPLETED',
          initiatedAt: new Date('2025-07-20T10:00:00Z'),
          agreedPrice: 600,
          agreedQuantity: 1,
          premiumTier: 'PREMIUM',
          listing: {
            id: 'list-2',
            title: 'Aluminium',
            quantity: 3,
            material_id: 'mat-2',
            material: {
              id: 'mat-2',
              name: 'Aluminium',
              slug: 'aluminium',
              category_icon: 'metal',
              price_unit: 'tonne',
            },
          },
          offers: [
            {
              price: 600,
              createdAt: new Date('2025-07-19T12:00:00Z'),
            },
          ],
        },
      ]);

    listingFindMany.mockResolvedValue([
      { material_id: 'mat-1' },
      { material_id: 'mat-1' },
    ]);

    const { getMarketplaceIntelligenceOverview } = await import('@/lib/intelligence/hub');
    const overview = await getMarketplaceIntelligenceOverview({ windowInDays: 30 });

    expect(overview.summary.totalNegotiations).toBe(2);
    expect(overview.summary.closedDeals).toBe(1);
    expect(overview.summary.grossMerchandiseValue).toBeCloseTo(2400);
    expect(overview.summary.delta.totalNegotiations).toBe(1);

    expect(overview.trendingMaterials[0]).toMatchObject({
      materialId: 'mat-1',
      negotiationCount: 1,
      gmv: 2400,
      supplyCount: 2,
      supplyDemandDelta: -1,
    });

    expect(overview.supplyGaps.length).toBe(1);
    expect(overview.supplyGaps[0]).toMatchObject({ materialId: 'mat-2', supplyDemandDelta: 1 });
    expect(overview.premiumRecommendations.length).toBeGreaterThan(0);
    expect(overview.trendingMaterials[0].forecast.projectedNegotiations).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(overview.trendingMaterials[0].forecast.series)).toBe(true);
    expect(Array.isArray(overview.anomalyAlerts)).toBe(true);

    jest.useRealTimers();
  });

  it('handles empty datasets gracefully', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-10-30T00:00:00Z'));

    negotiationFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    listingFindMany.mockResolvedValue([]);

    const { getMarketplaceIntelligenceOverview } = await import('@/lib/intelligence/hub');
    const overview = await getMarketplaceIntelligenceOverview({ windowInDays: 7, premiumOnly: true });

    expect(overview.summary.totalNegotiations).toBe(0);
    expect(overview.trendingMaterials).toEqual([]);
    expect(overview.supplyGaps).toEqual([]);
    expect(overview.premiumRecommendations[0].confidence).toBe('LOW');

    jest.useRealTimers();
  });
});
