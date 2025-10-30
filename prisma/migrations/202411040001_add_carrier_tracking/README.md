# Add carrier tracking manifest tables

This migration introduces carrier sync metadata for fulfilment orders:

- Extends `FulfilmentOrder` with `carrierCode`, `carrierSyncStatus`, and `lastCarrierSyncAt` so the service can persist provider
  status transitions.
- Creates `FulfilmentCarrierManifest` and `FulfilmentTrackingEvent` to store webhook/polling data emitted by
  `lib/fulfilment/providers/` adapters.
- Adds supporting indexes to accelerate carrier lookups and SLA analytics.

> The SQL guards enum/table creation with `IF NOT EXISTS` because the migration may be replayed in ephemeral environments while we
> iterate on the provider registry.
