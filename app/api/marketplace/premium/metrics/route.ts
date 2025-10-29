import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/options';
import { getPremiumConversionMetrics } from '@/lib/premium/metrics';
import { parsePremiumTierParam } from '@/lib/premium/params';

/**
 * meta: route=premium-metrics version=0.1 owner=platform
 */
const querySchema = z.object({
  windowDays: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().min(7).max(120))
    .optional(),
  tier: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Premium-Metriken stehen nur Administratoren zur Verfügung.' },
      { status: 403 }
    );
  }

  const parseResult = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'INVALID_QUERY', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const tier = parsePremiumTierParam(parseResult.data.tier ?? null);
  const metrics = await getPremiumConversionMetrics({
    windowInDays: parseResult.data.windowDays,
    tier: tier === 'ALL' ? undefined : tier,
  });
  return NextResponse.json({ metrics });
}
