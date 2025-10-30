/**
 * meta: module=fulfilment-provider-registry version=0.1 owner=operations scope=logistics
 */
import { mockCarrierProvider } from './mock';
import type { CarrierProvider } from './types';

const registry: Record<string, CarrierProvider> = {
  [mockCarrierProvider.id]: mockCarrierProvider,
};

export function getCarrierProvider(carrierCode: string | null | undefined): CarrierProvider | null {
  if (!carrierCode) {
    return null;
  }

  const normalised = carrierCode.trim().toUpperCase();
  return registry[normalised] ?? null;
}

export function listCarrierProviders(): CarrierProvider[] {
  return Object.values(registry);
}

export type { CarrierProvider } from './types';
export type { CarrierManifestInput, CarrierRegistrationResult, CarrierTrackingEvent } from './types';
