/**
 * meta: module=fulfilment-provider-mock version=0.1 owner=operations scope=logistics
 */
import { addMinutes } from 'date-fns';

import type {
  CarrierManifestInput,
  CarrierProvider,
  CarrierRegistrationResult,
  CarrierTrackingEvent,
  CarrierWebhookPayload,
} from './types';

function buildSyntheticEvents(reference: string, now: Date): CarrierTrackingEvent[] {
  return [
    {
      status: 'MANIFEST_RECEIVED',
      description: `Manifest ${reference} bestätigt`,
      eventTime: now,
      location: 'Hub A',
      rawPayload: { stage: 'manifest' },
    },
    {
      status: 'IN_TRANSIT',
      description: 'Sendung in Zustellung',
      eventTime: addMinutes(now, 90),
      location: 'Hub B',
      rawPayload: { stage: 'linehaul' },
    },
  ];
}

class MockCarrierProvider implements CarrierProvider {
  readonly id = 'MOCK_EXPRESS';

  readonly displayName = 'Mock Express';

  readonly supportsPolling = true;

  readonly supportsWebhooks = true;

  async registerShipment(manifest: CarrierManifestInput): Promise<CarrierRegistrationResult> {
    const reference = `${manifest.carrierCode}-${manifest.reference}`;
    const now = new Date();
    return {
      trackingReference: reference,
      pollingStatus: 'IN_TRANSIT',
      events: buildSyntheticEvents(reference, now),
      manifestEcho: {
        reference,
        payloadHash: JSON.stringify(manifest.payload ?? {}).length,
      },
    };
  }

  async pollTracking(trackingReference: string): Promise<CarrierTrackingEvent[]> {
    const now = new Date();
    const baseEvents = buildSyntheticEvents(trackingReference, addMinutes(now, -90));
    return [
      ...baseEvents,
      {
        status: 'DELIVERED',
        description: 'Sendung zugestellt',
        eventTime: now,
        location: 'Empfänger',
        rawPayload: { stage: 'delivered' },
      },
    ];
  }

  async parseWebhook(payload: unknown): Promise<CarrierWebhookPayload | null> {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record.trackingReference !== 'string' || !Array.isArray(record.events)) {
      return null;
    }

    const events: CarrierTrackingEvent[] = record.events
      .map((event) => {
        if (!event || typeof event !== 'object') {
          return null;
        }

        const raw = event as Record<string, unknown>;
        if (typeof raw.status !== 'string' || typeof raw.eventTime !== 'string') {
          return null;
        }

        const parsedTime = new Date(raw.eventTime);
        if (Number.isNaN(parsedTime.getTime())) {
          return null;
        }

        return {
          status: raw.status,
          description: typeof raw.description === 'string' ? raw.description : null,
          eventTime: parsedTime,
          location: typeof raw.location === 'string' ? raw.location : null,
          rawPayload: raw.rawPayload && typeof raw.rawPayload === 'object' ? (raw.rawPayload as Record<string, unknown>) : null,
        } satisfies CarrierTrackingEvent;
      })
      .filter((value): value is CarrierTrackingEvent => value !== null);

    return {
      trackingReference: record.trackingReference,
      events,
    };
  }
}

export const mockCarrierProvider = new MockCarrierProvider();
