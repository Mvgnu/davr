import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { getPremiumProfileForUser } from '@/lib/premium/entitlements';

export async function GET(
  _request: NextRequest,
  { params }: { params: { negotiationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  try {
    const result = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    const escrow = result.negotiation.escrowAccount;
    const expected = escrow?.expectedAmount ?? 0;
    const funded = escrow?.fundedAmount ?? 0;

    const viewerPremium = await getPremiumProfileForUser(session.user.id);
    const negotiationPremiumTier =
      result.negotiation.premiumTier ?? (result.negotiation.listing?.isPremiumWorkflow ? 'PREMIUM' : null);

    const negotiationPayload = {
      ...result.negotiation,
      contractRevisions: result.negotiation.contractRevisions ?? [],
      premiumTier: negotiationPremiumTier,
      premium: {
        viewer: viewerPremium,
        negotiationTier: negotiationPremiumTier ?? 'STANDARD',
        upgradePrompt: viewerPremium.upgradePrompt,
      },
    };

    return NextResponse.json({
      negotiation: negotiationPayload,
      kpis: {
        premiumWorkflow: Boolean(result.negotiation.listing?.isPremiumWorkflow),
        escrowFundedRatio: expected > 0 ? Number((funded / expected).toFixed(2)) : funded > 0 ? 1 : 0,
        completed: result.negotiation.status === 'COMPLETED',
      },
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to load negotiation', error);
    return NextResponse.json(
      { error: 'NEGOTIATION_FETCH_FAILED', message: 'Verhandlung konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}
