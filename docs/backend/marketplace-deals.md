# Marketplace Deals Backend

The deals API introduces structured negotiations, contract scaffolding, escrow orchestration, and persisted activity streams to
advance the marketplace from lead generation to transaction completion.

## Marketplace Intelligence Hub Service

* **Module:** `lib/intelligence/hub.ts`
* **Description:** Aggregates negotiation metrics, pricing signals, and supply-side availability over a configurable rolling
  window. The helper returns summary KPIs, trending material insights (including GMV, average price, and demand deltas), the
  most acute supply gaps, and automatically generated premium recommendations for operations teams.
* **Parameters:**
  * `windowInDays` (default `30`): Lookback window used for both current and comparison aggregates. Values are clamped to the
    range 7–120 days.
  * `premiumOnly` (default `false`): Restricts the aggregation to negotiations with a premium tier so operators can focus on
    high-value customers.
  * `topMaterials` (default `5`): Limits how many material insights are returned in the trending and supply-gap arrays.
* **Outputs:**
  * `summary`: Counts for total negotiations, closed deals, closure rate, GMV, and the delta versus the previous window.
  * `trendingMaterials`: Array of material snapshots containing GMV, average price, supply counts, and demand growth signals.
  * `supplyGaps`: Sorted subset highlighting where demand exceeds active listings.
  * `premiumRecommendations`: Machine-readable recommendations (headline, description, confidence) surfaced directly to the
    admin UI.

## `POST /api/marketplace/premium/subscription`

* **Description:** Handles premium upgrade actions. `START_TRIAL` and `UPGRADE_CONFIRMED`
  now orchestrate Stripe Checkout Sessions and persist the resulting billing
  metadata on `PremiumSubscription` for reconciliation.
* **Authentication:** Required. Caller must be an authenticated workspace user.
* **Request Body:**
  ```json
  {
    "action": "START_TRIAL",
    "tier": "PREMIUM",
    "negotiationId": "neg_123"
  }
  ```
* **Success Response:**
  ```json
  {
    "profile": { /* updated premium profile */ },
    "checkoutSession": {
      "id": "cs_test_123",
      "url": "https://checkout.stripe.com/c/pay/cs_test_123"
    }
  }
  ```
  `checkoutSession` is omitted for CTA impression logging. When present the UI
  redirects the administrator to the hosted payment page.
* **Side Effects:**
  * Calls `createPremiumCheckoutSession` with the tier-specific price ID.
  * Upserts the subscription, storing `stripeCustomerId`, `stripePriceId`, and
    the latest `checkoutSessionId` for downstream webhook correlation.
  * Flags trialing vs. active status immediately so the UI can render
    provisional access while awaiting Stripe webhooks.
  * Emits `TRIAL_STARTED` or `UPGRADE_CONFIRMED` conversion events after the
    session has been created successfully.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_ERROR`: Unsupported action or tier.
  * `PAYMENT_PROVIDER_UNAVAILABLE`: Stripe credentials or price IDs missing.
  * `UPGRADE_PROCESSING_FAILED`: Catch-all for Stripe API or persistence errors.

## `POST /api/marketplace/premium/stripe/webhook`

* **Description:** Accepts Stripe subscription lifecycle events (checkout completion, renewals, cancellations) and keeps
  `PremiumSubscription` plus entitlement state in sync.
* **Authentication:** Verified via Stripe signature header (`STRIPE_WEBHOOK_SECRET`).
* **Request Body:** Raw Stripe event JSON forwarded by Stripe. The handler validates the signature and ignores unrelated
  event types.
* **Side Effects:**
  * Persists each event into `PremiumSubscriptionWebhookEvent` (idempotent via `stripeEventId`).
  * Reconciles the subscription row, updating `status`, `currentPeriodEndsAt`, billing identifiers, and
    `cancellationRequestedAt`.
  * Ensures default entitlements are granted when the status is `ACTIVE` or `TRIALING` and suppresses analytics access when
    the subscription is cancelled or expired.
* **Error Codes:**
  * `BODY_READ_FAILED`: Request body stream could not be read.
  * `INVALID_SIGNATURE`: Signature header missing or invalid.
  * `WEBHOOK_NOT_CONFIGURED`: `STRIPE_WEBHOOK_SECRET` missing on the server.
  * `PROCESSING_FAILED`: Unexpected persistence failure while applying the event.

## `POST /api/marketplace/deals`

* **Description:** Start a negotiation for a marketplace listing by submitting an initial offer.
* **Authentication:** Required. Buyer must be logged in.
* **Request Body:**
  ```json
  {
    "listingId": "ckx123...",
    "initialOfferPrice": 4200.5,
    "initialOfferQuantity": 12,
    "message": "We can commit to a recurring pickup schedule.",
    "currency": "EUR",
    "expiresAt": "2024-06-30T00:00:00.000Z"
  }
  ```
* **Success Response:**
  ```json
  {
    "negotiation": {
      "id": "neg_123",
      "status": "INITIATED",
      "currency": "EUR",
      "offers": [
        {
          "type": "INITIAL",
          "price": 4200.5,
          "quantity": 12
        }
      ],
      "escrowAccount": {
        "status": "PENDING_SETUP",
        "expectedAmount": 50406
      }
    },
    "message": "Verhandlung wurde erfolgreich gestartet"
  }
  ```
* **Side Effects:** Invokes the configured escrow provider via `getEscrowProvider().createAccount` and stores the resulting
  `providerReference` on the new `EscrowAccount` record so downstream webhooks and reconciliation jobs can match statements.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_ERROR`: Invalid payload.
  * `NOT_FOUND`: Listing does not exist.
  * `SELF_NEGOTIATION_NOT_ALLOWED`: Buyer is listing owner.
  * `LISTING_INACTIVE`: Listing is not currently active.
  * `NEGOTIATION_EXISTS`: Buyer already has an active negotiation.
  * `NEGOTIATION_INIT_FAILED`: Unexpected server failure.

## `GET /api/marketplace/deals/[id]`

* **Description:** Returns the current negotiation aggregate (offers, status history, escrow ledger, activities) plus KPI
  metadata for the buyer, seller, or administrators.
* **Authentication:** Required. Only parties to the negotiation or admins receive access.
* **Success Response:** Includes a `kpis` object with `premiumWorkflow`, `escrowFundedRatio`, and `completed` flags in addition to
  the `negotiation` payload.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `NEGOTIATION_NOT_FOUND`: Negotiation ID invalid.
  * `NEGOTIATION_FORBIDDEN`: Caller is not a party nor an admin.
  * `NEGOTIATION_EXPIRED`: SLA elapsed and negotiation was auto-closed.

## Fulfilment & Logistics Endpoints

### `GET /api/marketplace/deals/{negotiationId}/fulfilment/orders`

* **Description:** Returns all fulfilment orders tied to the negotiation including milestones and scheduled reminders so the
  workspace can render the logistics board.
* **Authentication:** Required. Caller must be the buyer, seller, or an admin.
* **Success Response:**
  ```json
  {
    "orders": [
      {
        "id": "ful_123",
        "status": "SCHEDULED",
        "pickupWindowStart": "2025-11-01T08:00:00.000Z",
        "pickupWindowEnd": "2025-11-01T10:00:00.000Z",
        "carrierName": "DHL",
        "milestones": [
          { "type": "CREATED", "occurredAt": "2025-10-30T10:00:00.000Z" }
        ],
        "reminders": []
      }
    ]
  }
  ```
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `NEGOTIATION_FORBIDDEN`: Caller is not part of the negotiation.

### `POST /api/marketplace/deals/{negotiationId}/fulfilment/orders`

* **Description:** Creates a fulfilment order with pickup and delivery metadata, carrier notes, and an initial “created”
  milestone. Emits a negotiation activity via `FULFILMENT_ORDER_CREATED`.
* **Authentication:** Required. Buyer, seller, or admins can create orders.
* **Request Body:**
  ```json
  {
    "pickupWindowStart": "2025-11-01T08:00:00.000Z",
    "pickupWindowEnd": "2025-11-01T10:00:00.000Z",
    "pickupLocation": "Lager Nord",
    "deliveryLocation": "Werk Süd",
    "carrierName": "DHL Freight",
    "carrierContact": "ops@example.com"
  }
  ```
* **Success Response:** Returns the refreshed negotiation snapshot containing the new order so the UI can re-render without an
  extra fetch.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_ERROR`: Invalid pickup window or missing data.
  * `NEGOTIATION_FORBIDDEN`: Caller is not buyer, seller, or admin.

### `PATCH /api/marketplace/deals/{negotiationId}/fulfilment/orders/{orderId}`

* **Description:** Updates carrier, tracking, pickup window, or status information for an existing fulfilment order and emits
  `FULFILMENT_ORDER_UPDATED` (or `FULFILMENT_ORDER_SCHEDULED`) negotiation events to keep the timeline in sync.
* **Authentication:** Buyer, seller, or admin required.
* **Validation:** Payload accepts the same optional fields as creation plus a `status` from the
  `FulfilmentOrderStatus` enum.

### `POST /api/marketplace/deals/{negotiationId}/fulfilment/orders/{orderId}/milestones`

* **Description:** Records a fulfilment milestone (`PICKUP_CONFIRMED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`) for
  the order and appends a corresponding negotiation activity event.

### `POST /api/marketplace/deals/{negotiationId}/fulfilment/orders/{orderId}/reminders`

* **Description:** Schedules notifications for pickup/delivery windows. The fulfilment scheduler job will deliver reminders and
  mark them as sent so operators can monitor pending logistics tasks.

## Fulfilment Scheduler Job

* **Job Name:** `fulfilment-logistics-sweep`
* **Interval:** 5 minutes.
* **Responsibilities:**
  * Sends due reminders by calling `markReminderSent` which emits `FULFILMENT_REMINDER_SENT` events.
  * Escalates orders whose pickup window elapsed without a pickup milestone by emitting
    `FULFILMENT_ORDER_UPDATED` with an escalation payload.
  * Persists run metadata (`pendingReminderCount`, `remindersProcessed`, `overdueOrdersEscalated`) so the admin operations
    console can display live fulfilment health.

## `POST /api/marketplace/deals/[id]/offers`

* **Description:** Submit a counter-offer, automatically switching the lifecycle to `COUNTERING` on the first counter.
* **Authentication:** Required. Buyer or seller only.
* **Request Body:**
  ```json
  {
    "price": 4100.0,
    "quantity": 12,
    "message": "Can split delivery into two batches?",
    "type": "COUNTER"
  }
  ```
* **Side Effects:** Persists an activity entry (`NEGOTIATION_COUNTER_SUBMITTED`) and appends the offer to `Negotiation.activities`.
* **Error Codes:**
  * `NEGOTIATION_CLOSED`: Negotiation already completed/cancelled.
  * `NEGOTIATION_STATUS_INVALID`: Current status forbids new counters.
  * `NEGOTIATION_COUNTER_FAILED`: Unexpected persistence failure.

## `POST /api/marketplace/deals/[id]/disputes`

* **Description:** Allows buyers or sellers to raise a dispute against the active negotiation. Persists the dispute, optional
  evidence links, and emits `DEAL_DISPUTE_RAISED` events so the admin cockpit receives an immediate notification.
* **Authentication:** Required. Caller must be the buyer or seller of the negotiation.
* **Request Body:**
  ```json
  {
    "summary": "Lieferung blieb aus trotz Zahlung",
    "description": "Spediteur meldet fehlende Ware, bitte prüfen.",
    "requestedOutcome": "Erneute Zustellung oder Rückerstattung",
    "severity": "HIGH",
    "category": "DELIVERY",
    "attachments": [
      { "type": "LINK", "url": "https://tracking.example/123", "label": "Tracking" }
    ]
  }
  ```
* **Success Response:**
  ```json
  {
    "negotiation": {
      "id": "neg_123",
      "disputes": [
        {
          "id": "disp_1",
          "status": "OPEN",
          "severity": "HIGH",
          "category": "DELIVERY",
          "summary": "Lieferung blieb aus trotz Zahlung",
          "evidence": [
            { "id": "ev_1", "type": "LINK", "url": "https://tracking.example/123", "label": "Tracking" }
          ]
        }
      ]
    },
    "message": "Disput wurde erfolgreich eingereicht. Unser Team meldet sich zeitnah."
  }
  ```
* **Side Effects:**
  * Creates the `DealDispute` row with SLA due date based on severity (12–72 hours).
  * Records `DealDisputeEvent` entries for creation and evidence attachments.
  * Stores evidence metadata in the new `DealDisputeEvidence` table for auditability.
  * Publishes a `DEAL_DISPUTE_RAISED` negotiation event so the notification queue alerts admins instantly.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_ERROR`: Summary/evidence payload invalid.
  * `NEGOTIATION_FORBIDDEN`: Caller is not the buyer/seller.
  * `NEGOTIATION_CLOSED`: Negotiation already cancelled.
  * `ACTIVE_DISPUTE_EXISTS`: There is already an unresolved dispute for the negotiation.
  * `DISPUTE_CREATION_FAILED`: Unexpected server failure.

## `GET|POST /api/marketplace/deals/[id]/contracts/revisions`

* **Description:** Lists and records contract revisions for the negotiation. `POST` persists a new revision draft, optionally
  with annotated attachment URLs, and marks it `IN_REVIEW` so participants can triage changes.
* **Authentication:** Required. Only negotiation participants or admins may collaborate on revisions.
* **Request Body (`POST`):**
  ```json
  {
    "summary": "Neue Lieferklausel",
    "body": "Bitte Abschnitt 4 um Lieferfristen ergänzen...",
    "attachments": [
      {
        "name": "Redline-PDF",
        "url": "https://cdn.example.com/contracts/neg-123-v3.pdf",
        "mimeType": "application/pdf"
      }
    ]
  }
  ```
* **Success Response:** Returns the newly created revision, including generated version number and metadata. Listing requests
  return the latest 12 revisions with nested comments for inline collaboration.
* **Side Effects:**
  * Increments the revision version counter per contract.
  * Emits `CONTRACT_REVISION_SUBMITTED` so the activity stream and notifications surface the update.
  * Clears transient contract errors so envelope issuance can resume from the latest draft.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_FAILED`: Body/attachment payload invalid.
  * `CONTRACT_MISSING`: Negotiation has no contract yet.
  * `REVISION_CREATE_FAILED`: Persistence or event publication failed.

## `PATCH /api/marketplace/deals/[id]/contracts/revisions/[revisionId]`

* **Description:** Updates the lifecycle of a revision (e.g., mark as accepted or rejected) and syncs the active contract pointers.
* **Authentication:** Required. Buyer, seller, or admin only.
* **Request Body:**
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
* **Side Effects:**
  * When accepted, flips all other revisions to `isCurrent = false`, stores the pointer on `DealContract.currentRevisionId`,
    and updates `draftTerms` plus the active document URL if a PDF attachment is available.
  * Emits `CONTRACT_REVISION_ACCEPTED` or `CONTRACT_REVISION_REJECTED` events for audit trails.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `FORBIDDEN`: Caller is not authorised to update the revision.
  * `REVISION_ALREADY_ACCEPTED`: Revision already the active baseline.
  * `REVISION_STATUS_FAILED`: Persistence failure.

## `POST /api/marketplace/deals/[id]/contracts/revisions/[revisionId]/comments`

* **Description:** Adds an inline discussion comment to a revision to capture requested adjustments or clarifications.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "body": "Bitte Lieferfenster konkretisieren."
  }
  ```
* **Side Effects:** Persists the comment, associates it with the revision, and emits `CONTRACT_REVISION_COMMENTED` so
  participants receive notifications.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_FAILED`: Empty comment body.
  * `COMMENT_CREATE_FAILED`: Persistence failure.

## `PATCH /api/marketplace/deals/[id]/contracts/revisions/[revisionId]/comments/[commentId]`

* **Description:** Marks a revision comment as resolved or reopens it for further discussion.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "resolved": true
  }
  ```
* **Side Effects:** Updates `ContractRevisionComment.status`, captures the resolver, and emits
  `CONTRACT_REVISION_COMMENTED` to keep the activity feed consistent.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_FAILED`: Missing `resolved` boolean.
  * `COMMENT_RESOLVE_FAILED`: Persistence failure.

## `POST /api/marketplace/deals/[id]/accept`

* **Description:** Accept the latest counter-offer. Captures the agreed price/quantity, begins contract drafting, and flips escrow
  to `AWAITING_FUNDS`.
* **Authentication:** Required. Opposing party only (cannot accept your own offer).
* **Request Body:**
  ```json
  {
    "agreedPrice": 4150.0,
    "agreedQuantity": 12,
    "note": "Draft contract with staged pickup clause."
  }
  ```
* **Side Effects:**
  * Creates an `OfferCounter` record flagged as `FINAL`.
  * Upserts the `DealContract` row (status `PENDING_SIGNATURES`) and primes escrow with the new amount expectation.
  * Emits `NEGOTIATION_ACCEPTED` and `CONTRACT_SIGNATURE_REQUESTED` activities.
* **Error Codes:**
  * `NEGOTIATION_NO_OFFER`: No offer exists to accept.
  * `NEGOTIATION_PRICE_REQUIRED`: Final price missing.

## `POST /api/marketplace/deals/[id]/contracts/sign`

* **Description:** Requests provider-backed envelope issuance (if missing) and records a signature intent that routes through
  the configured e-sign adapter. When both parties complete their signatures the negotiation automatically advances.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "intent": "BUYER"
  }
  ```
* **Behavior:**
  * Issues a provider envelope via `lib/integrations/esign.ts` the first time a participant signs.
  * Persists participant signature state in `DealContract.participantStates` and appends status history notes.
  * When both parties are signed, transitions the negotiation to `CONTRACT_SIGNED` and emits `CONTRACT_SIGNATURE_COMPLETED`.
  * Otherwise, re-emits `CONTRACT_SIGNATURE_REQUESTED` with envelope metadata to keep downstream notifications in sync.

## `POST /api/integrations/esign/webhooks`

* **Description:** Receives signature lifecycle callbacks from the mock/provider adapter.
* **Authentication:** Provider-signed webhook (mock implementation accepts unsigned JSON).
* **Request Body:**
  ```json
  {
    "negotiationId": "neg_123",
    "contractId": "ctr_123",
    "participant": { "id": "user_1", "role": "BUYER", "name": "Buyer" },
    "status": "SIGNED"
  }
  ```
* **Behavior:**
  * Delegates to `handleESignatureWebhook` to persist signature state and mark failures.
  * On `SIGNED`, mirrors the contract update path and publishes domain events for the notification fan-out.
  * On `DECLINED`, flags the contract as `REJECTED`/`FAILED` with the provider error string so the UI can display recovery
    options.

## `POST /api/marketplace/deals/[id]/cancel`

* **Description:** Cancels the negotiation and closes or refunds escrow balances.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "reason": "Supplier can no longer guarantee spec compliance."
  }
  ```
* **Behavior:**
  * Refunds any outstanding escrow funds via `EscrowTransaction` entries.
  * Adds a cancellation note to `NegotiationStatusHistory` and persists the message to `Negotiation.notes`.
  * Emits `NEGOTIATION_CANCELLED` activity for audit trails.

## `POST /api/marketplace/deals/[id]/escrow/fund`

* **Description:** Records escrow deposits and transitions the negotiation to `ESCROW_FUNDED` once the expected amount is
  collected.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "amount": 5000,
    "reference": "wire-123"
  }
  ```
* **Side Effects:** Updates escrow ledger, adjusts negotiation status, and emits `ESCROW_FUNDED` or partial funding activities.
* **Error Codes:**
  * `ESCROW_NOT_INITIALISED`: Negotiation missing an escrow account.
  * `NEGOTIATION_STATUS_INVALID`: Funding attempted from an unsupported lifecycle stage.

## `POST /api/marketplace/deals/[id]/escrow/release`

* **Description:** Releases escrow funds to the seller. When the escrow balance hits zero, the negotiation is marked `COMPLETED`.
* **Authentication:** Required. Buyer, seller, or admin.
* **Error Codes:**
  * `ESCROW_RELEASE_EXCEEDS_FUNDS`: Release amount greater than current escrow balance.

## `POST /api/marketplace/deals/[id]/escrow/refund`

* **Description:** Issues partial or full refunds back to the buyer. Fully refunded negotiations auto-transition to `CANCELLED`
  and close the escrow account.
* **Authentication:** Required. Buyer, seller, or admin.
* **Error Codes:**
  * `ESCROW_REFUND_EXCEEDS_FUNDS`: Refund amount greater than remaining escrow balance.

## Activity, Notifications & SLA Jobs

* `lib/events/negotiations.ts` persists every lifecycle event to `NegotiationActivity` and now forwards annotated payloads to
  the queue provider. Each envelope includes `channels` (e.g. `negotiation:{id}`, `user:{id}`, `audience:ADMIN`) so transport
  adapters can fan out to buyer, seller, and admin listeners deterministically.
* `lib/events/queue.ts` exposes a provider interface. The default `PersistentNegotiationQueueProvider` writes envelopes to the
  `NegotiationNotification` table while maintaining an in-memory buffer for hot SSE subscribers. Swap in Redis Streams or a
  websocket broadcaster by calling `setNegotiationQueueProvider` during bootstrap.
* `lib/events/transports.ts` lets you register fan-out transports. A console transport ships by default for diagnostics; plug
  in webhooks or push gateways by registering additional transports at startup.
* `POST /api/integrations/escrow/webhooks` accepts provider callbacks for funding confirmations, release/refund settlements,
  dispute state changes, and statement notifications. Requests must include `x-escrow-signature`, a lowercase hex-encoded
  HMAC SHA-256 of the raw request body using `ESCROW_WEBHOOK_SECRET`. Missing configuration returns `500`, absent or invalid
  signatures return `401`. Payloads are idempotent by `externalTransactionId` and mirror updates to `EscrowTransaction`/
  `EscrowAccount` while emitting domain events (`ESCROW_FUNDED`, `ESCROW_DISPUTE_OPENED`, `ESCROW_STATEMENT_READY`).
* `GET /api/notifications` requires an authenticated session and automatically restricts results to negotiations the caller is
  party to (unless the viewer is an admin). Query parameters (`negotiationId`, `audience`, `userId`, `since`, `limit`,
  `deliveryStatus`) are validated with Zod before execution; invalid payloads return `400` with a flattened error structure.
  Non-admins cannot impersonate other users or inspect admin-only envelopes even when filters pass schema validation.
* `GET /api/notifications/stream` exposes a Server-Sent Events feed protected by the same access rules. Buyers and sellers must
  supply a negotiation they participate in (or rely on their personal channel), while admins may subscribe to global audience
  channels.
* `POST /api/notifications/ack` requires authentication and only marks envelopes as delivered if the requester is authorised for
  the underlying negotiation/audience. Clients still batch acknowledgement payloads so delivery metrics mirror real
  consumption.
* Delivery guarantees: events persist immediately with `NotificationDeliveryStatus` metadata. Scheduler-driven transports or
  direct acknowledgements mark envelopes as `DELIVERED`/`FAILED` and track attempts so retries or manual replays are auditable.
* `lib/jobs/negotiations/sla.ts` scans negotiations approaching expiry and emits `NEGOTIATION_SLA_WARNING`/`NEGOTIATION_SLA_BREACHED`
  events to feed the workspace timeline and admin console. Covered by `__tests__/sla-watchdog.test.ts`, which mocks provider state
  to assert breach and warning fan-out behaviour.
* `lib/jobs/negotiations/reconciliation.ts` polls provider statements, records `EscrowTransaction` adjustments, and raises
  `ESCROW_STATEMENT_READY` events whenever the provider balance diverges from the local ledger.

## Premium Subscription APIs

* `GET /api/marketplace/premium/plans` returns the static plan catalog (Premium vs. Concierge) so upgrade prompts stay in sync.
* `GET /api/marketplace/premium/subscription` resolves the caller's entitlements, tier, and upgrade prompt metadata.
* `POST /api/marketplace/premium/subscription` records monetisation events:
  * `UPGRADE_CTA_VIEWED` captures impressions for conversion analysis.
  * `START_TRIAL` provisions a `PremiumSubscription`, grants default entitlements, and logs the trial start.
  * `UPGRADE_CONFIRMED` activates the subscription and persists the conversion.
* `GET /api/marketplace/premium/metrics` (admins only) aggregates conversion funnel counts, unique user touch points, and
  active subscription totals for a configurable rolling window (7–120 Tage). Invalid query parameters return `400` with Zod
  error details.

The resolved profile populates `NegotiationSnapshot.premium`, unlocking premium-only analytics and SLA overrides in clients.

## Scheduler & Operations Runbook

* `lib/jobs/scheduler.ts` persists recurring job state (`RecurringJob`) and writes execution outcomes to `JobExecutionLog`.
* `lib/jobs/registry.ts` registers three jobs by default:
  * `negotiation-sla-watchdog` (15 min cadence).
  * `escrow-reconciliation` (30 min cadence, 25 accounts per sweep).
  * `notification-fanout` (5 min cadence). Pulls persisted envelopes, pipes them through registered transports, and updates
    `NotificationDeliveryStatus`/error metadata for the operations console.
* Each execution merges static job metadata (`registerJob(... metadata)`) with runtime state:
  * `attempt` resets to 1 after a success. Failures increment the counter and schedule retries with an exponential backoff
    (60s base, capped at the configured interval).
  * `lastError`/`lastErrorAt` capture the provider message + timestamp for the operations console.
  * After five consecutive failures the scheduler sets `isActive = false` and records `disabledAt`. Admins can reactivate a job
    by updating the row (`UPDATE "RecurringJob" SET "isActive" = true, metadata = jsonb_set(metadata, '{attempt}', '1') WHERE name = '...';`) or by
    invoking the manual run endpoint, which resets the attempt counter on success.
* Launch the worker locally via `npm run jobs:start`. The bootstrap run executes due jobs once before entering the polling loop.
* Manual re-run controls are exposed at `POST /api/admin/jobs/[jobName]/run` and surfaced in `/app/admin/deals/operations`.
  * Die Konsole löst seit 2025-10-29T23:20Z Server Actions aus, validiert Admin-Rechte erneut und zeigt Statusmeldungen an,
    damit JSON-Antworten nicht länger den Seitenfluss unterbrechen.
  * 2025-10-30T00:05Z – `SchedulerJobTriggerButton` ersetzt Query-Redirects durch Inline-Feedback. Erfolgreiche Trigger lösen
    ein `router.refresh()` im Client aus und revalidieren den Server-Cache via `triggerJobAction`, wodurch Tabellenwerte ohne
    Seitenwechsel aktualisiert werden.
  * 2025-10-30T01:20Z – Die Operations-Ansicht zeigt zusätzlich einen "Premium Conversion Funnel" mit CTA-Aufrufen,
    Trial-Starts, Upgrades, abgeschlossenen Premium-Deals und Conversion-Raten aus `GET /api/marketplace/premium/metrics`.
  * 2025-10-30T02:10Z – Admins können den Auswertungszeitraum via `premiumWindow`-Query (7–120 Tage) im Dashboard wählen;
    Server Actions bewahren bestehende Parameter (`upgrade`) und reichen den Zeitraum an `getPremiumConversionMetrics` durch.
  * 2025-10-30T02:40Z – `getPremiumConversionMetrics` liefert zusätzlich ein `comparison`-Objekt (Vorperiode + Δ), sodass der
    Funnel Zuwächse/Rückgänge bei CTA-Aufrufen, Trials, Upgrades, Premium-Abschlüssen, Conversion-Rates und aktiven Abos inline
    hervorhebt.
  * 2025-10-30T03:15Z – `/api/marketplace/premium/metrics` akzeptiert jetzt `premiumTier` (`ALL`, `PREMIUM`, `CONCIERGE`),
    wodurch Funnel und Admin-Konsole gezielt Concierge-/Premium-Kohorten analysieren können. Events ohne Tier-Metadaten werden
    dem Premium-Tier zugeordnet, damit historische CTA-Aufrufe erhalten bleiben.
  * 2025-10-30T03:45Z – `getPremiumConversionMetrics` liefert zusätzlich `timeseries`-Buckets (Tageswerte + Tages-Conversionsraten).
    Die Operations-Konsole zeigt die neuesten Ereignisse zuerst in einer scrollbaren Tabelle, sodass Ausreißer schnell erkannt
    und mit den aggregierten Kennzahlen abgeglichen werden können.
* Runbook – restarting workers:
  * **Local development:** stop the worker with `Ctrl+C`, reset disabled rows with
    `psql $DATABASE_URL -c 'UPDATE "RecurringJob" SET "isActive" = true, "nextRunAt" = NOW(), metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{attempt}', '1')'`,
    then relaunch via `npm run jobs:start`.
  * **Production:** scale the worker deployment down (e.g. `kubectl scale deployment marketplace-jobs --replicas=0`), wait for
    all pods to terminate, then scale back up. On boot the worker inspects `RecurringJob.isActive`; any rows disabled after five
    failures remain paused until an engineer re-enables them with the SQL statement above or via the manual run endpoint.
* Runbook – handling poison events:
  * Poisoned payloads surface as rows in `JobExecutionLog` with matching `jobName` and a repeated `lastError`. Capture the raw
    payload (stored in `metadata.payload`) and reproduce the failure in staging using the same handler invoked by the scheduler.
  * If the payload cannot be safely replayed, mark it as quarantined by issuing
    `UPDATE "JobExecutionLog" SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{quarantined}', 'true') WHERE id = '<log-id>';`
    and document the follow-up in the incident tracker. This prevents automatic retries while preserving auditability.
* Runbook – recovering missed alerts:
  * Use the operations console to identify when `notification-fanout` last succeeded. If the job is disabled, trigger
    `POST /api/admin/jobs/notification-fanout/run`; a successful execution resets the attempt counter and reactivates the job.
  * Re-queue undelivered envelopes by marking them `PENDING`:
    `UPDATE "NegotiationNotification" SET "deliveryStatus" = 'PENDING', "deliveryAttempts" = 0 WHERE "deliveryStatus" = 'FAILED' AND "occurredAt" >= '<ISO_TIMESTAMP>';`.
    The next scheduler sweep will pick them up automatically.
  * After recovery, export the delivery audit with
    `COPY (SELECT id, "negotiationId", "deliveryStatus", "deliveredAt" FROM "NegotiationNotification" WHERE "occurredAt" >= '<ISO_TIMESTAMP>' ORDER BY "occurredAt") TO STDOUT WITH CSV HEADER`
    and attach it to the incident record for stakeholder sign-off.
* Die Operations-Konsole listet neben Zeitplänen jetzt auch Escrow-spezifische Insights:
  * `lib/disputes/service.ts` aggregiert offene `DealDispute`-Datensätze (inkl. SLA-Fälligkeiten, Severity, Assignment) und
    stellt Transitions-/Assignment-Hilfsfunktionen sowie Escrow-spezifische Workflows bereit, die Audit-Events anlegen.
  * `lib/escrow/metrics.ts` proxied die Dispute-Queue zu diesem Modul und liefert weiterhin Reconciliation-Mismatches sowie
    Funding-Latenzen.
  * `/app/admin/deals/operations/page.tsx` visualisiert diese Daten als Tabellen (Dispute-Queue, Reconciliation-Warnungen)
    und Kennzahlen (Durchschnitt/Median/90. Perzentil, Overdue-Warteschlange) und bietet Buttons für Status-/Assignment-Wechsel
    sowie Inline-Formulare für Escrow-Holds, Vergleichsvorschläge und Auszahlungen.
  * `__tests__/deal-dispute-e2e.test.ts` fährt den kompletten Lifecycle (Workspace-Raising, Admin-Triage, Escrow-Hold, Vergleich,
    Auszahlung, Statusabschluss) gegen die Server Actions und das Event-Fan-out, sodass Integrationsbrüche sofort auffallen.
  * `lib/jobs/disputes/sla.ts` registriert den `deal-dispute-sla-monitor`, der SLA-Verletzungen automatisch protokolliert und
    Eskalationen im Timeline-Stream veröffentlicht.
  * `__tests__/escrow-reconciliation-job.test.ts` validiert den Reconciliation-Job für Matching- und Mismatch-Szenarien samt
    Idempotenzkontrolle, damit Initiative 2 Aufgabe 3 regressionssicher bleibt.
* The operations console lists attempt counters, backlog depth (missed run count + minutes overdue), next/last run timestamps,
  and the 25 most recent executions. Failures include the stored `lastError`, relative timestamps, and disable status so
  on-call engineers can triage without querying the database.

## Prisma Models

* `Negotiation`: Tracks listing, buyer/seller pair, statuses, agreed terms, and metadata.
* `OfferCounter`: Stores negotiation messages and offer payloads.
* `NegotiationStatusHistory`: Time-series log of status transitions.
* `NegotiationActivity`: Persisted event stream powering the workspace timeline and admin feed.
* `DealContract`: Stores provider envelope metadata, participant signature states, and the active contract document reference.
* `ContractTemplate`: Defines merge fields for provider-backed documents and versioned contract blueprints.
* `DealContractDocument`: Archives issued envelopes/documents including provider IDs, status, and completion timestamps.
* `ContractIntentMetric`: Captures envelope lifecycle + participant signature analytics without broad telemetry ingestion.
* `EscrowAccount`: Mirrors escrow account state and expected funds.
* `EscrowTransaction`: Ledger for escrow fund, release, refund, and dispute-specific hold/payout adjustments.
* `DealDispute`: Persistiert Dispute-Summary, SLA-Fälligkeiten, Lifecycle-Status, Severity, Assignment-Infos sowie Hold-,
  Vergleichs- und Auszahlungsbeträge je Negotiation.
* `DealDisputeEvent`: Audit-Trail für Statuswechsel, Notizen, Assignment-Änderungen, Treuhand-Meilensteine und Eskalationen.

## Enums

* `NegotiationStatus`: Lifecycle for deals (initiation, countering, contracting, escrow, closure).
* `OfferType`: Distinguishes initial offers, counters, finals, and system adjustments.
* `ContractStatus`: Tracks contract drafting and signature phases.
* `ContractEnvelopeStatus`: Reflects provider envelope lifecycle (draft, issued, partially signed, completed, void, failed).
* `ContractIntentEventType`: Enumerates analytics events emitted during issuance, signatures, completion, and declines.
* `EscrowStatus`: Monitors escrow readiness, funding, release, and dispute states.
* `EscrowTransactionType`: Categorises escrow ledger events (fund, release/refund, dispute hold/release/payout adjustments).
* `DealDisputeStatus`: Lifecycle für Disputes (offen, in Prüfung, Rückfrage, eskaliert, gelöst, abgeschlossen).
* `DealDisputeSeverity`: Klassifiziert Auswirkungen (niedrig bis kritisch) für SLA-Priorisierung.
* `DealDisputeCategory`: Kategorisiert Ursachen (Escrow, Lieferung, Qualität, Sonstiges).
* `DealDisputeEventType`: Audit-Events (Statuswechsel, Eskalation, Assignment, SLA-Vermerke, Evidenz sowie Escrow-Holds,
  Vergleichsvorschläge und Auszahlungen).
* `NegotiationActivityType`: Enumerates persisted timeline events (creation, counters, signatures, SLA warnings, escrow disputes,
  reconciliation alerts, Treuhand-Holds/-Vergleiche/-Auszahlungen und Dispute-SLA-Verletzungen).
* `NegotiationActivityAudience`: Marks activity visibility (participants vs. admin).

### Contract Intent Analytics

Contract analytics are intentionally lightweight: issuing an envelope writes an `ENVELOPE_ISSUED` metric, each participant
signature emits `PARTICIPANT_SIGNED`, completion writes `ENVELOPE_COMPLETED`, and declines surface via `ENVELOPE_DECLINED`.
The helpers in `lib/contracts/analytics.ts` accept an optional Prisma transaction client so analytics can piggyback on existing
workflows. Downstream dashboards calculate signature cycle times by diffing these timestamps rather than relying on verbose
event telemetry.

## Next Steps

* Wire actual messaging/queue integrations to consume the new domain events (`lib/events/negotiations.ts`).
* Replace the in-memory escrow provider with a production integration that signs webhooks and verifies reconciliation payloads.
* Expand SLA handling to notify participants before automatic expiration kicks in (scheduler integration required).
* Harden the mock e-sign provider by introducing signed webhook verification and mapping to a production adapter.
