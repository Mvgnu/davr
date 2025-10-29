# Marketplace Deals Backend

The deals API introduces structured negotiations, contract scaffolding, escrow orchestration, and persisted activity streams to
advance the marketplace from lead generation to transaction completion.

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
  * `lib/escrow/metrics.ts` aggregiert offene Disputes, Reconciliation-Mismatches sowie Funding-Latenzen.
  * `/app/admin/deals/operations/page.tsx` visualisiert diese Daten als Tabellen (Dispute-Queue, Reconciliation-Warnungen)
    und Kennzahlen (Durchschnitt/Median/90. Perzentil, Overdue-Warteschlange).
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
* `EscrowTransaction`: Ledger for escrow fund, release, and refund events.

## Enums

* `NegotiationStatus`: Lifecycle for deals (initiation, countering, contracting, escrow, closure).
* `OfferType`: Distinguishes initial offers, counters, finals, and system adjustments.
* `ContractStatus`: Tracks contract drafting and signature phases.
* `ContractEnvelopeStatus`: Reflects provider envelope lifecycle (draft, issued, partially signed, completed, void, failed).
* `ContractIntentEventType`: Enumerates analytics events emitted during issuance, signatures, completion, and declines.
* `EscrowStatus`: Monitors escrow readiness, funding, release, and dispute states.
* `EscrowTransactionType`: Categorises escrow ledger events.
* `NegotiationActivityType`: Enumerates persisted timeline events (creation, counters, signatures, SLA warnings, escrow disputes,
  reconciliation alerts).
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
