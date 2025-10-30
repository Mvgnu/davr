import {
  buildBucketedSeries,
  detectLatestAnomaly,
  forecastNextValue,
  type SeriesSample,
} from '@/lib/intelligence/forecasts';

describe('marketplace intelligence forecasts', () => {
  it('builds bucketed series with default weekly buckets', () => {
    const base = new Date('2025-01-01T00:00:00Z');
    const samples: SeriesSample[] = [
      { occurredAt: new Date(base) },
      { occurredAt: new Date(base) },
      { occurredAt: new Date('2025-01-05T00:00:00Z') },
      { occurredAt: new Date('2025-01-09T00:00:00Z') },
    ];

    const series = buildBucketedSeries(samples);

    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({ value: 3 });
    expect(series[1]).toMatchObject({ value: 1 });
  });

  it('forecasts the next value using linear regression', () => {
    const samples: SeriesSample[] = [
      { occurredAt: new Date('2025-01-01T00:00:00Z') },
      { occurredAt: new Date('2025-01-02T00:00:00Z') },
      { occurredAt: new Date('2025-01-07T00:00:00Z') },
      { occurredAt: new Date('2025-01-08T00:00:00Z') },
      { occurredAt: new Date('2025-01-09T00:00:00Z') },
    ];

    const series = buildBucketedSeries(samples, 3);
    const forecast = forecastNextValue(series);

    expect(forecast.forecast).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(forecast.confidence);
  });

  it('detects anomalies based on z-score of last bucket', () => {
    const series = [
      { timestamp: '2025-01-01T00:00:00Z', value: 2 },
      { timestamp: '2025-01-08T00:00:00Z', value: 2 },
      { timestamp: '2025-01-15T00:00:00Z', value: 20 },
    ];

    const anomaly = detectLatestAnomaly(series);

    expect(anomaly.zScore).toBeGreaterThan(0);
    expect(Math.abs(anomaly.zScore)).toBeGreaterThan(1);
  });
});
