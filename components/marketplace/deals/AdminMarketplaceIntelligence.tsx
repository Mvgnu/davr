/**
 * meta: component=AdminMarketplaceIntelligence version=0.1 owner=platform-insights
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketplaceIntelligenceOverview } from '@/lib/intelligence/hub';

interface AdminMarketplaceIntelligenceProps {
  overview: MarketplaceIntelligenceOverview;
}

const euroFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const percentFormatter = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });

function formatPercent(value: number | null) {
  if (value == null) {
    return '–';
  }

  return percentFormatter.format(value);
}

function deltaTone(delta: number) {
  if (delta === 0) {
    return 'text-muted-foreground';
  }

  return delta > 0 ? 'text-emerald-600' : 'text-destructive';
}

export function AdminMarketplaceIntelligence({ overview }: AdminMarketplaceIntelligenceProps) {
  const { summary, trendingMaterials, supplyGaps, premiumRecommendations, anomalyAlerts, window } = overview;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace Intelligence Hub</CardTitle>
        <CardDescription>
          Aggregierte Kennzahlen der letzten {window.days} Tage – inklusive Deal-Volumen, Materialtrends und Premium-Empfehlungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Verhandlungen</p>
              <p className="text-2xl font-semibold">{summary.totalNegotiations.toLocaleString('de-DE')}</p>
              <p className={`text-xs ${deltaTone(summary.delta.totalNegotiations)} mt-1`}>
                Δ {summary.delta.totalNegotiations >= 0 ? '+' : ''}
                {summary.delta.totalNegotiations.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Geschlossene Deals</p>
              <p className="text-2xl font-semibold">{summary.closedDeals.toLocaleString('de-DE')}</p>
              <p className={`text-xs ${deltaTone(summary.delta.closedDeals)} mt-1`}>
                Δ {summary.delta.closedDeals >= 0 ? '+' : ''}
                {summary.delta.closedDeals.toLocaleString('de-DE')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Abschlussrate {formatPercent(summary.closureRate)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Handelsvolumen</p>
              <p className="text-2xl font-semibold">{euroFormatter.format(summary.grossMerchandiseValue)}</p>
              <p className={`text-xs ${deltaTone(summary.delta.grossMerchandiseValue)} mt-1`}>
                Δ {summary.delta.grossMerchandiseValue >= 0 ? '+' : ''}
                {summary.delta.grossMerchandiseValue.toLocaleString('de-DE')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ø Dealgröße {summary.averageDealSize != null ? euroFormatter.format(summary.averageDealSize) : '–'}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Premium Fokus</p>
              <p className="text-2xl font-semibold">{premiumRecommendations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Empfehlungen mit hohem Hebel für Premium-Betreiber</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top-Materialtrends</h3>
            <span className="text-xs text-muted-foreground">
              Bewertet nach geschlossenem Volumen und Nachfrageanstieg
            </span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Material</th>
                  <th className="px-4 py-2 font-medium">Verhandlungen</th>
                  <th className="px-4 py-2 font-medium">Geschlossen</th>
                  <th className="px-4 py-2 font-medium">GMV</th>
                  <th className="px-4 py-2 font-medium">Ø Preis</th>
                  <th className="px-4 py-2 font-medium">Δ Nachfrage</th>
                  <th className="px-4 py-2 font-medium">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {trendingMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Keine aussagekräftigen Trends in diesem Zeitraum.
                    </td>
                  </tr>
                ) : (
                  trendingMaterials.map((material) => (
                    <tr key={`${material.materialId ?? material.materialSlug ?? material.materialName}`} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {material.categoryIcon ? (
                            <span className="text-lg" aria-hidden>{material.categoryIcon}</span>
                          ) : null}
                          <div className="flex flex-col">
                            <span className="font-medium">{material.materialName}</span>
                            {material.materialSlug ? (
                              <span className="text-xs text-muted-foreground">{material.materialSlug}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">{material.negotiationCount.toLocaleString('de-DE')}</td>
                      <td className="px-4 py-2">{material.closedCount.toLocaleString('de-DE')}</td>
                      <td className="px-4 py-2">{euroFormatter.format(material.gmv)}</td>
                      <td className="px-4 py-2">
                        {material.averagePrice != null ? euroFormatter.format(material.averagePrice) : '–'}
                      </td>
                      <td className={`px-4 py-2 ${deltaTone(material.demandGrowth ?? 0)}`}>
                        {material.demandGrowth != null && material.demandGrowth !== 0
                          ? `${material.demandGrowth > 0 ? '+' : ''}${material.demandGrowth.toLocaleString('de-DE')}`
                          : '±0'}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {material.forecast.projectedNegotiations.toLocaleString('de-DE')} N.
                          </span>
                          <span className="text-muted-foreground">
                            {material.forecast.confidence} – {euroFormatter.format(material.forecast.projectedGmv)} GMV
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Anomalien & Forecast-Signale</h3>
            <span className="text-xs text-muted-foreground">Berechnet aus 4× Zeitfenstern (wöchentlich gebucketed)</span>
          </div>
          <div className="mt-3 space-y-3">
            {anomalyAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine signifikanten Ausreißer in den aktuellen Zeitreihen.</p>
            ) : (
              anomalyAlerts.map((alert, index) => (
                <div
                  key={`${alert.materialId ?? alert.materialName}-${index}`}
                  className={`rounded-lg border p-4 ${alert.severity === 'ALERT' ? 'border-destructive/60 bg-destructive/10' : 'border-amber-500/50 bg-amber-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{alert.materialName}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <Badge variant={alert.severity === 'ALERT' ? 'destructive' : 'outline'}>
                      z={alert.zScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Versorgungslücken</h3>
            <span className="text-xs text-muted-foreground">
              Differenz aus Nachfrage zu aktiven Listings
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {supplyGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Versorgungslücken identifiziert.</p>
            ) : (
              supplyGaps.map((gap) => (
                <div key={`${gap.materialId ?? gap.materialSlug ?? gap.materialName}`} className="rounded-lg border bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{gap.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        Nachfrage übersteigt Angebot um {gap.supplyDemandDelta.toLocaleString('de-DE')} Fälle.
                      </p>
                    </div>
                    <Badge variant="destructive">Lücke</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Premium Empfehlungen</h3>
            <span className="text-xs text-muted-foreground">
              Automatisch generierte Maßnahmen für Premium Kundschaft
            </span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {premiumRecommendations.map((recommendation, index) => (
              <div key={`${recommendation.materialId ?? 'all'}-${index}`} className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{recommendation.headline}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{recommendation.targetTier}</Badge>
                    <Badge variant={recommendation.confidence === 'HIGH' ? 'default' : recommendation.confidence === 'MEDIUM' ? 'outline' : 'secondary'}>
                      {recommendation.confidence}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{recommendation.description}</p>
                <p className="mt-2 text-xs font-medium text-foreground">Aktion: {recommendation.action}</p>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
