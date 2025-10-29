/**
 * meta: module=negotiations type=snapshot version=0.1 owner=platform
 */
export interface NegotiationActivity {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  audience: 'PARTICIPANTS' | 'ADMIN' | 'ALL';
  status?: string | null;
  occurredAt: string;
  triggeredById?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface NegotiationOffer {
  id: string;
  senderId: string;
  price: number | null;
  quantity: number | null;
  message?: string | null;
  type: string;
  createdAt: string;
}

export interface NegotiationStatusEntry {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
  createdById?: string | null;
}

export interface EscrowTransaction {
  id: string;
  type: string;
  amount: number;
  occurredAt: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EscrowAccountSnapshot {
  id: string;
  status: string;
  expectedAmount: number | null;
  fundedAmount: number;
  releasedAmount: number;
  refundedAmount: number;
  currency: string;
  transactions: EscrowTransaction[];
}

export interface NegotiationContract {
  id: string;
  status: string;
  draftTerms?: string | null;
  documentUrl?: string | null;
  buyerSignedAt?: string | null;
  sellerSignedAt?: string | null;
  finalizedAt?: string | null;
  provider?: string | null;
  providerEnvelopeId?: string | null;
  providerDocumentId?: string | null;
  envelopeStatus?: string | null;
  participantStates?: Record<string, ContractParticipantState> | null;
  documents?: NegotiationContractDocument[];
  lastError?: string | null;
}

export interface ContractParticipantState {
  status: string;
  signedAt?: string | null;
}

export interface NegotiationContractDocument {
  id: string;
  provider?: string | null;
  providerDocumentId?: string | null;
  providerEnvelopeId?: string | null;
  status: string;
  url?: string | null;
  issuedAt?: string | null;
  completedAt?: string | null;
}

export interface PremiumUpgradePrompt {
  headline: string;
  description: string;
  cta: string;
}

export interface PremiumViewerProfile {
  tier: string;
  status: string;
  entitlements: string[];
  currentPeriodEndsAt?: string | null;
  isTrialing: boolean;
  hasAdvancedAnalytics: boolean;
  hasConciergeSla: boolean;
  hasDisputeFastTrack: boolean;
  upgradePrompt?: PremiumUpgradePrompt | null;
}

export interface NegotiationPremiumSummary {
  negotiationTier: string | null;
  viewer: PremiumViewerProfile;
  upgradePrompt?: PremiumUpgradePrompt | null;
}

export interface NegotiationListingSummary {
  id: string;
  title: string;
  seller_id: string;
  isPremiumWorkflow?: boolean;
}

export interface NegotiationSnapshot {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  initiatedAt: string;
  expiresAt?: string | null;
  agreedPrice?: number | null;
  agreedQuantity?: number | null;
  currency: string;
  notes?: string | null;
  offers: NegotiationOffer[];
  statusHistory: NegotiationStatusEntry[];
  activities: NegotiationActivity[];
  escrowAccount?: EscrowAccountSnapshot | null;
  contract?: NegotiationContract | null;
  premiumTier?: string | null;
  premium?: NegotiationPremiumSummary | null;
  listing: NegotiationListingSummary;
}

export interface NegotiationApiResponse {
  negotiation: NegotiationSnapshot;
  message?: string;
}
