/**
 * meta: module=marketplace-intelligence version=0.1 owner=platform-insights
 * Aggregates negotiation activity, pricing trends, and supply signals for the admin intelligence hub.
 */
import { ListingStatus, NegotiationStatus } from '@prisma/client';
import { addSeconds, subDays } from 'date-fns';

import {
  buildBucketedSeries,
  detectLatestAnomaly,
  forecastNextValue,
  type SeriesSample,
} from './forecasts';

import { prisma } from '@/lib/db/prisma';

type MaybeNumber = number | null;

type NegotiationRecord = Awaited<
  ReturnType<typeof prisma.negotiation.findMany>
>[number];

export interface MaterialInsight {
  materialId: string | null;
  materialName: string;
  materialSlug: string | null;
  categoryIcon: string | null;
  negotiationCount: number;
  closedCount: number;
  gmv: number;
  averagePrice: MaybeNumber;
  supplyCount: number;
  supplyDemandDelta: number;
  demandGrowth: MaybeNumber;
  forecast: {
    projectedNegotiations: number;
    projectedGmv: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    slope: number;
    anomaly: {
      isAnomaly: boolean;
      zScore: number;
    };
    series: { timestamp: string; value: number }[];
  };
}

export interface PremiumRecommendation {
  headline: string;
  description: string;
  materialId: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  targetTier: 'PREMIUM_CORE' | 'CONCIERGE';
  action: string;
}

export interface MarketplaceIntelligenceOverview {
  window: {
    start: string;
    end: string;
    days: number;
  };
  previousWindow: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalNegotiations: number;
    closedDeals: number;
    closureRate: MaybeNumber;
    grossMerchandiseValue: number;
    averageDealSize: MaybeNumber;
    delta: {
      totalNegotiations: number;
      closedDeals: number;
      grossMerchandiseValue: number;
    };
  };
  trendingMaterials: MaterialInsight[];
  supplyGaps: MaterialInsight[];
  premiumRecommendations: PremiumRecommendation[];
  anomalyAlerts: {
    materialId: string | null;
    materialName: string;
    metric: 'NEGOTIATIONS' | 'GMV';
    zScore: number;
    severity: 'INFO' | 'ALERT';
    message: string;
  }[];
  context: {
    generatedAt: string;
    premiumOnly: boolean;
  };
}

interface IntelligenceOptions {
  windowInDays?: number;
  premiumOnly?: boolean;
  topMaterials?: number;
}

const CLOSED_STATUSES = new Set<NegotiationStatus>([
  NegotiationStatus.AGREED,
  NegotiationStatus.CONTRACT_DRAFTING,
  NegotiationStatus.CONTRACT_SIGNED,
  NegotiationStatus.ESCROW_FUNDED,
  NegotiationStatus.COMPLETED,
]);

interface AggregatedMaterial {
  key: string;
  materialId: string | null;
  materialName: string;
  materialSlug: string | null;
  categoryIcon: string | null;
  negotiationCount: number;
  closedCount: number;
  gmv: number;
  pricedNegotiations: number;
  priceTotal: number;
}

function resolveClosingPrice(record: NegotiationRecord) {
  if (record.agreedPrice != null) {
    return record.agreedPrice;
  }

  const [latestOffer] = record.offers ?? [];
  return latestOffer?.price ?? null;
}

function resolveQuantity(record: NegotiationRecord) {
  if (record.agreedQuantity != null) {
    return record.agreedQuantity;
  }

  return record.listing?.quantity ?? 1;
}

function aggregateMaterials(records: NegotiationRecord[]) {
  const materialMap = new Map<string, AggregatedMaterial>();

  for (const record of records) {
    const materialId = record.listing?.material?.id ?? record.listing?.material_id ?? null;
    const key = materialId ?? `__listing-${record.listing?.id ?? record.id}`;
    const existing = materialMap.get(key);

    const base: AggregatedMaterial =
      existing ?? {
        key,
        materialId,
        materialName: record.listing?.material?.name ?? record.listing?.title ?? 'Unbekannt',
        materialSlug: record.listing?.material?.slug ?? null,
        categoryIcon: record.listing?.material?.category_icon ?? null,
        negotiationCount: 0,
        closedCount: 0,
        gmv: 0,
        pricedNegotiations: 0,
        priceTotal: 0,
      };

    base.negotiationCount += 1;

    const closingPrice = resolveClosingPrice(record);
    const quantity = resolveQuantity(record);

    if (closingPrice != null) {
      base.pricedNegotiations += 1;
      base.priceTotal += closingPrice;

      if (CLOSED_STATUSES.has(record.status as NegotiationStatus) || record.agreedPrice != null) {
        base.closedCount += 1;
        base.gmv += closingPrice * (quantity ?? 1);
      }
    }

    materialMap.set(key, base);
  }

  return materialMap;
}

function normaliseMaterial(
  material: AggregatedMaterial,
  supplyCount: number,
  previous?: AggregatedMaterial,
): MaterialInsight {
  const averagePrice = material.pricedNegotiations > 0 ? material.priceTotal / material.pricedNegotiations : null;
  const demandGrowth = previous ? material.negotiationCount - previous.negotiationCount : material.negotiationCount;
  return {
    materialId: material.materialId,
    materialName: material.materialName,
    materialSlug: material.materialSlug,
    categoryIcon: material.categoryIcon,
    negotiationCount: material.negotiationCount,
    closedCount: material.closedCount,
    gmv: Number(material.gmv.toFixed(2)),
    averagePrice: averagePrice != null ? Number(averagePrice.toFixed(2)) : null,
    supplyCount,
    supplyDemandDelta: material.negotiationCount - supplyCount,
    demandGrowth,
  };
}

function computeRecommendations(materials: MaterialInsight[]): PremiumRecommendation[] {
  const recommendations: PremiumRecommendation[] = [];

  const highDemand = materials
    .filter((material) => material.supplyDemandDelta > 0)
    .sort((a, b) => b.supplyDemandDelta - a.supplyDemandDelta)
    .slice(0, 3);

  for (const material of highDemand) {
    recommendations.push({
      headline: `${material.materialName}: Nachfrage übersteigt Angebot`,
      description:
        'Steuern Sie zusätzliche Premium-Angebote oder priorisierte Lieferkette ein – Nachfrage übersteigt verfügbares Angebot in diesem Zeitraum.',
      materialId: material.materialId,
      confidence: material.demandGrowth != null && material.demandGrowth > 0 ? 'HIGH' : 'MEDIUM',
      targetTier: 'CONCIERGE',
      action: 'Fast-Track Fulfilment aktivieren und Concierge-Workflow priorisieren',
    });
  }

  const accelerating = materials
    .filter((material) => material.demandGrowth != null && material.demandGrowth > 0)
    .sort((a, b) => (b.demandGrowth ?? 0) - (a.demandGrowth ?? 0))
    .slice(0, 2);

  for (const material of accelerating) {
    recommendations.push({
      headline: `${material.materialName}: steigende Nachfrage`,
      description:
        'Sichern Sie Bestände und verhandeln Sie Vorausverträge mit Premium-Lieferanten, um auf den Nachfrageanstieg vorbereitet zu sein.',
      materialId: material.materialId,
      confidence: 'MEDIUM',
      targetTier: 'PREMIUM_CORE',
      action: 'Inventory-Warnung aktivieren und Verhandlungs-Priorisierung planen',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      headline: 'Stabile Nachfrage',
      description: 'Keine signifikanten Ausreißer – überwachen Sie weiter die Pipeline, um Chancen frühzeitig zu erkennen.',
      materialId: null,
      confidence: 'LOW',
      targetTier: 'PREMIUM_CORE',
      action: 'Monitoring beibehalten und Reminder für nächste Auswertung setzen',
    });
  }

  return recommendations;
}

function computeSummaryMetrics(records: NegotiationRecord[]) {
  const totalNegotiations = records.length;
  const closedRecords = records.filter((record) => {
    if (record.agreedPrice != null) {
      return true;
    }

    const status = record.status as NegotiationStatus | undefined;
    return status ? CLOSED_STATUSES.has(status) : false;
  });
  const closedDeals = closedRecords.length;
  const grossMerchandiseValue = closedRecords.reduce((sum, record) => {
    const closingPrice = resolveClosingPrice(record);
    if (closingPrice == null) {
      return sum;
    }
    const quantity = resolveQuantity(record) ?? 1;
    return sum + closingPrice * quantity;
  }, 0);

  const closureRate = totalNegotiations > 0 ? Number((closedDeals / totalNegotiations).toFixed(4)) : null;
  const averageDealSize = closedDeals > 0 ? Number((grossMerchandiseValue / closedDeals).toFixed(2)) : null;

  return {
    totalNegotiations,
    closedDeals,
    closureRate,
    grossMerchandiseValue: Number(grossMerchandiseValue.toFixed(2)),
    averageDealSize,
  };
}

export async function getMarketplaceIntelligenceOverview({
  windowInDays = 30,
  premiumOnly = false,
  topMaterials = 5,
}: IntelligenceOptions = {}): Promise<MarketplaceIntelligenceOverview> {
  const now = new Date();
  const windowEnd = addSeconds(now, 0);
  const windowStart = subDays(windowEnd, windowInDays);
  const previousWindowEnd = windowStart;
  const previousWindowStart = subDays(previousWindowEnd, windowInDays);

  const baseWhere = {
    initiatedAt: {
      gte: windowStart,
      lt: windowEnd,
    },
    ...(premiumOnly
      ? {
          premiumTier: {
            not: null,
          },
        }
      : {}),
  } as const;

  const previousWhere = {
    initiatedAt: {
      gte: previousWindowStart,
      lt: previousWindowEnd,
    },
    ...(premiumOnly
      ? {
          premiumTier: {
            not: null,
          },
        }
      : {}),
  } as const;

  const negotiationSelect = {
    id: true,
    status: true,
    initiatedAt: true,
    agreedPrice: true,
    agreedQuantity: true,
    premiumTier: true,
    listing: {
      select: {
        id: true,
        title: true,
        quantity: true,
        material_id: true,
        material: {
          select: {
            id: true,
            name: true,
            slug: true,
            category_icon: true,
            price_unit: true,
          },
        },
      },
    },
    offers: {
      select: {
        price: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    },
  } satisfies Parameters<typeof prisma.negotiation.findMany>[0]['select'];

  const lookbackWhere = {
    initiatedAt: {
      gte: subDays(windowEnd, windowInDays * 4),
      lt: windowEnd,
    },
    ...(premiumOnly
      ? {
          premiumTier: {
            not: null,
          },
        }
      : {}),
  } as const;

  const [currentNegotiations, previousNegotiations, historicalNegotiations] = await Promise.all([
    prisma.negotiation.findMany({ where: baseWhere, select: negotiationSelect }),
    prisma.negotiation.findMany({ where: previousWhere, select: negotiationSelect }),
    prisma.negotiation.findMany({ where: lookbackWhere, select: negotiationSelect }),
  ]);

  const materialIds = new Set<string>();
  for (const negotiation of currentNegotiations) {
    const materialId = negotiation.listing?.material?.id ?? negotiation.listing?.material_id;
    if (materialId) {
      materialIds.add(materialId);
    }
  }

  const activeListings = materialIds.size
    ? await prisma.marketplaceListing.findMany({
        where: {
          material_id: {
            in: Array.from(materialIds),
          },
          status: ListingStatus.ACTIVE,
        },
        select: {
          material_id: true,
        },
      })
    : [];

  const supplyCounts = new Map<string, number>();
  for (const listing of activeListings) {
    const key = listing.material_id ?? 'unknown';
    supplyCounts.set(key, (supplyCounts.get(key) ?? 0) + 1);
  }

  const currentMaterialMap = aggregateMaterials(currentNegotiations);
  const previousMaterialMap = aggregateMaterials(previousNegotiations);

  const materialInsights: MaterialInsight[] = [];

  const anomalyAlerts: MarketplaceIntelligenceOverview['anomalyAlerts'] = [];
  const bucketSizeInDays = Math.max(Math.floor(windowInDays / 4), 1);

  const historicalSeries = new Map<
    string,
    {
      samples: SeriesSample[];
    }
  >();

  for (const record of historicalNegotiations) {
    const materialId = record.listing?.material?.id ?? record.listing?.material_id ?? null;
    const key = materialId ?? `__listing-${record.listing?.id ?? record.id}`;
    const entry = historicalSeries.get(key) ?? { samples: [] };
    entry.samples.push({ occurredAt: record.initiatedAt ?? new Date() });
    historicalSeries.set(key, entry);
  }

  for (const material of currentMaterialMap.values()) {
    const supplyCount = material.materialId ? supplyCounts.get(material.materialId) ?? 0 : 0;
    const previous = material.materialId ? previousMaterialMap.get(material.materialId) : undefined;
    const baseInsight = normaliseMaterial(material, supplyCount, previous);
    const historicalKey = material.key;
    const historical = historicalSeries.get(historicalKey);
    const series = historical ? buildBucketedSeries(historical.samples, bucketSizeInDays) : [];
    const forecast = forecastNextValue(series);
    const projectedNegotiations = Math.round(forecast.forecast);
    const projectedGmv = baseInsight.averagePrice != null ? Number((projectedNegotiations * baseInsight.averagePrice).toFixed(2)) : 0;
    const anomaly = detectLatestAnomaly(series);

    if (anomaly.isAnomaly) {
      anomalyAlerts.push({
        materialId: baseInsight.materialId,
        materialName: baseInsight.materialName,
        metric: 'NEGOTIATIONS',
        zScore: anomaly.zScore,
        severity: Math.abs(anomaly.zScore) >= 3 ? 'ALERT' : 'INFO',
        message:
          anomaly.zScore > 0
            ? 'Nachfrage-Ausreißer erkannt – prüfen Sie Concierge-Bereitschaft.'
            : 'Nachfrageeinbruch festgestellt – prüfen Sie aktive Deals und Kommunikation.',
      });
    }

    materialInsights.push({
      ...baseInsight,
      forecast: {
        projectedNegotiations,
        projectedGmv,
        confidence: forecast.confidence,
        slope: Number(forecast.slope.toFixed(2)),
        anomaly,
        series,
      },
    });
  }

  materialInsights.sort((a, b) => b.gmv - a.gmv);

  const trendingMaterials = materialInsights.slice(0, topMaterials);
  const supplyGaps = materialInsights
    .filter((material) => material.supplyDemandDelta > 0)
    .sort((a, b) => b.supplyDemandDelta - a.supplyDemandDelta)
    .slice(0, topMaterials);

  const currentSummary = computeSummaryMetrics(currentNegotiations);
  const previousSummary = computeSummaryMetrics(previousNegotiations);

  const summaryDelta = {
    totalNegotiations: currentSummary.totalNegotiations - previousSummary.totalNegotiations,
    closedDeals: currentSummary.closedDeals - previousSummary.closedDeals,
    grossMerchandiseValue:
      currentSummary.grossMerchandiseValue - previousSummary.grossMerchandiseValue,
  };

  return {
    window: {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
      days: windowInDays,
    },
    previousWindow: {
      start: previousWindowStart.toISOString(),
      end: previousWindowEnd.toISOString(),
      days: windowInDays,
    },
    summary: {
      ...currentSummary,
      delta: summaryDelta,
    },
    trendingMaterials,
    supplyGaps,
    premiumRecommendations: computeRecommendations(trendingMaterials),
    anomalyAlerts,
    context: {
      generatedAt: now.toISOString(),
      premiumOnly,
    },
  };
}
