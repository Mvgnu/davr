/**
 * meta: module=negotiations type=snapshot version=0.2 owner=platform
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
  currentRevisionId?: string | null;
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

export interface ContractRevisionAttachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string | null;
}

export interface ContractRevisionComment {
  id: string;
  body: string;
  status: string;
  anchor?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name?: string | null; email?: string | null };
  resolvedBy?: { id: string; name?: string | null; email?: string | null } | null;
  resolvedAt?: string | null;
}

export interface ContractRevisionSnapshot {
  id: string;
  version: number;
  status: string;
  isCurrent: boolean;
  summary?: string | null;
  body: string;
  attachments?: ContractRevisionAttachment[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name?: string | null; email?: string | null };
  comments: ContractRevisionComment[];
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

export interface NegotiationDisputeEvidence {
  id: string;
  type: string;
  url: string;
  label?: string | null;
  uploadedAt: string;
}

export interface NegotiationDisputeEvent {
  type: string;
  status?: string | null;
  message?: string | null;
  createdAt: string;
}

export interface NegotiationDispute {
  id: string;
  status: string;
  severity: string;
  category: string;
  summary: string;
  description?: string | null;
  requestedOutcome?: string | null;
  raisedAt: string;
  slaDueAt?: string | null;
  slaBreachedAt?: string | null;
  raisedBy: { id: string; name?: string | null; role?: string | null };
  assignedTo?: { id: string; name?: string | null; email?: string | null } | null;
  holdAmount?: number;
  counterProposalAmount?: number | null;
  resolutionPayoutAmount?: number | null;
  escrowStatus?: string | null;
  escrowCurrency?: string | null;
  evidence: NegotiationDisputeEvidence[];
  latestEvent?: NegotiationDisputeEvent | null;
}

export interface PremiumUpgradePrompt {
  headline: string;
  description: string;
  cta: string;
}

export interface NegotiationFulfilmentMilestone {
  id: string;
  type: string;
  occurredAt: string;
  notes?: string | null;
  recordedBy?: { id: string; name?: string | null } | null;
  payload?: Record<string, unknown> | null;
}

export interface NegotiationFulfilmentReminder {
  id: string;
  type: string;
  scheduledFor: string;
  sentAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NegotiationFulfilmentOrder {
  id: string;
  status: string;
  reference?: string | null;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  carrierName?: string | null;
  carrierContact?: string | null;
  carrierServiceLevel?: string | null;
  trackingNumber?: string | null;
  externalId?: string | null;
  specialInstructions?: string | null;
  milestones: NegotiationFulfilmentMilestone[];
  reminders: NegotiationFulfilmentReminder[];
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
  contractRevisions: ContractRevisionSnapshot[];
  premiumTier?: string | null;
  premium?: NegotiationPremiumSummary | null;
  listing: NegotiationListingSummary;
  disputes: NegotiationDispute[];
  fulfilmentOrders: NegotiationFulfilmentOrder[];
}

export interface NegotiationApiResponse {
  negotiation: NegotiationSnapshot;
  message?: string;
}
