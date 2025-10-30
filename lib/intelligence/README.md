# Marketplace Intelligence Hub

This module aggregates negotiation, pricing, and supply signals to power the admin-facing marketplace intelligence dashboard. It exposes service helpers that compute rolling-window metrics, trending material insights, premium-focused recommendations, as well as lightweight time-series forecasts and anomaly detection.

## Forecasting helpers

- `lib/intelligence/forecasts.ts` implements weekly bucketisation, linear regression forecasting, and z-score anomaly checks. The helper returns slope, forecast confidence, and structured anomaly metadata so UI clients can surface predictive cues without sending raw telemetry downstream.
- The hub consumes these helpers to enrich `MaterialInsight` responses with projected negotiation counts, GMV estimates, and alert payloads for the anomaly feed.

## Admin intelligence overview

- `getMarketplaceIntelligenceOverview` now queries an extended 4× window lookback to create bucketed series. The response includes `anomalyAlerts` and tier-targeted recommendation payloads so the admin console can present both descriptive and prescriptive analytics.
- Premium recommendations now carry `targetTier` and actionable copy, allowing the premium negotiation surfaces to filter guidance per entitlement segment.
