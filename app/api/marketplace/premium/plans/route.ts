import { NextResponse } from 'next/server';

/**
 * meta: route=premium-plans version=0.1 owner=platform
 */
const PREMIUM_PLANS = [
  {
    id: 'premium',
    tier: 'PREMIUM',
    label: 'Premium Analytics',
    monthlyPrice: 249,
    currency: 'EUR',
    trialLengthDays: 14,
    features: [
      'Erweiterte Deal-Analytics',
      'Dispute Fast-Track',
      'Priorisierte Support-Antworten',
    ],
  },
  {
    id: 'concierge',
    tier: 'CONCIERGE',
    label: 'Concierge SLA',
    monthlyPrice: 499,
    currency: 'EUR',
    trialLengthDays: 7,
    features: [
      'Persönlicher Operations-Manager',
      'SLA Overrides (4h Reaktionsfenster)',
      'Escrow-Dispute Fast-Track',
    ],
  },
];

export async function GET() {
  return NextResponse.json({ plans: PREMIUM_PLANS });
}
