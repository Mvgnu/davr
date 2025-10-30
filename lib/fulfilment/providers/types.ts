/**
 * meta: module=fulfilment-provider-types version=0.1 owner=operations scope=logistics
 */
export interface CarrierManifestInput {
  orderId: string;
  carrierCode: string;
  reference: string;
  payload: Record<string, unknown>;
}

export interface CarrierTrackingEvent {
  status: string;
  description?: string | null;
  eventTime: Date;
  location?: string | null;
  rawPayload?: Record<string, unknown> | null;
}

export interface CarrierRegistrationResult {
  trackingReference: string | null;
  pollingStatus: 'REGISTERED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  events?: CarrierTrackingEvent[];
  manifestEcho?: Record<string, unknown>;
}

export interface CarrierWebhookPayload {
  trackingReference: string;
  events: CarrierTrackingEvent[];
}

export interface CarrierProvider {
  id: string;
  displayName: string;
  supportsPolling: boolean;
  supportsWebhooks: boolean;
  registerShipment(manifest: CarrierManifestInput): Promise<CarrierRegistrationResult>;
  pollTracking?(trackingReference: string): Promise<CarrierTrackingEvent[]>;
  parseWebhook?(payload: unknown): Promise<CarrierWebhookPayload | null>;
}
