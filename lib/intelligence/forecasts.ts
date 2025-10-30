/**
 * meta: module=marketplace-intelligence-forecasts version=0.1 owner=platform-insights
 * intent: provide lightweight forecasting and anomaly detection helpers for the intelligence hub
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns';

export interface SeriesSample {
  occurredAt: Date;
  weight?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface ForecastResult {
  forecast: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  slope: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
}

const DEFAULT_BUCKET_DAYS = 7;

export function buildBucketedSeries(
  samples: SeriesSample[],
  bucketSizeInDays: number = DEFAULT_BUCKET_DAYS,
): TimeSeriesPoint[] {
  if (samples.length === 0) {
    return [];
  }

  const sorted = [...samples].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const series: TimeSeriesPoint[] = [];

  const bucketWeights = new Map<number, number>();
  const bucketStart = startOfDay(sorted[0].occurredAt).getTime();

  for (const sample of sorted) {
    const dayDelta = differenceInCalendarDays(sample.occurredAt, new Date(bucketStart));
    const bucketIndex = Math.floor(dayDelta / bucketSizeInDays);
    const current = bucketWeights.get(bucketIndex) ?? 0;
    bucketWeights.set(bucketIndex, current + (sample.weight ?? 1));
  }

  const bucketEntries = Array.from(bucketWeights.entries()).sort((a, b) => a[0] - b[0]);
  for (const [index, value] of bucketEntries) {
    const timestamp = new Date(bucketStart + index * bucketSizeInDays * 24 * 60 * 60 * 1000).toISOString();
    series.push({ timestamp, value });
  }

  return series;
}

function computeLinearRegression(series: TimeSeriesPoint[]): { slope: number; intercept: number } {
  const n = series.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i;
    const y = series[i]?.value ?? 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function forecastNextValue(series: TimeSeriesPoint[]): ForecastResult {
  if (series.length === 0) {
    return { forecast: 0, confidence: 'LOW', slope: 0 };
  }

  if (series.length === 1) {
    return { forecast: series[0].value, confidence: 'LOW', slope: 0 };
  }

  const { slope, intercept } = computeLinearRegression(series);
  const forecastIndex = series.length; // next bucket
  const forecast = slope * forecastIndex + intercept;

  const absSlope = Math.abs(slope);
  const confidence = absSlope > 2 ? 'HIGH' : absSlope > 0.5 ? 'MEDIUM' : 'LOW';

  return { forecast: Math.max(forecast, 0), confidence, slope };
}

export function detectLatestAnomaly(series: TimeSeriesPoint[]): AnomalyResult {
  if (series.length < 3) {
    return { isAnomaly: false, zScore: 0 };
  }

  const values = series.map((point) => point.value);
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { isAnomaly: false, zScore: 0 };
  }

  const latest = values[values.length - 1];
  const zScore = (latest - mean) / stdDev;
  const isAnomaly = Math.abs(zScore) >= 2;

  return { isAnomaly, zScore: Number(zScore.toFixed(2)) };
}
