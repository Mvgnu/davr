# Marketplace Deals Frontend

The negotiation workspace is now live on listing detail pages. This document summarises the components, data flow, and admin
console that ship with the first iteration.

## Workspace Components

* `components/marketplace/deals/NegotiationWorkspace.tsx`
  * Client orchestrator that renders the timeline, contract status, offer composer, escrow ledger, and (für Premium-Nutzer)
    das Premium-Insights-Widget.
  * Authenticated users open an SSE stream against `/api/notifications/stream`; the hook automatically scopes subscriptions to
    the viewer's user channel and their active negotiation before falling back to SWR polling. Surfaces SLA warnings/breaches as
    top-level banners, records upgrade CTA impressions via `/api/marketplace/premium/subscription`, and batches acknowledgement
    calls to `/api/notifications/ack` so persisted envelopes drop out of the pending queue once the UI processes them.
  * REST fallbacks call `GET /api/notifications` with schema-validated filters. Failed validations render a toast and keep the
    prior buffer in place so the UI never flashes empty results for minor input mistakes.
* `components/marketplace/deals/NegotiationTimeline.tsx`
  * Merges `negotiation.activities` and `statusHistory` into a chronological list.
  * Highlights SLA warnings (`NEGOTIATION_SLA_WARNING`, `NEGOTIATION_SLA_BREACHED`) with amber/destructive badges and shows a
    badge with unread real-time events.
* `components/marketplace/deals/NegotiationOfferComposer.tsx`
  * Handles counter and acceptance flows with optimistic updates and form validation.
  * Dispatches to `/api/marketplace/deals/[id]/offers` and `/api/marketplace/deals/[id]/accept`.
  * Buttons werden automatisch deaktiviert, sobald der Workspace aufgrund von Dunning oder Sitzplatzüberschreitung gesperrt ist;
    die Workspace-Hülle blendet dann eine Sperrkarte mit Upgrade-/Billing-CTA ein.
* `components/marketplace/deals/NegotiationPremiumInsights.tsx`
  * Premium-only analytics widget showing offer iteration counts, Verhandlungsdauer, SLA-Plan sowie aktuelle Sitzplatzbelegung.
  * Blockt den Inhalt mit Dunning- bzw. Sitzplatz-Bannern wenn `premium.viewer.dunningState === 'PAYMENT_FAILED'` oder
    `premium.viewer.isSeatCapacityExceeded` gesetzt ist.
  * Displays an upsell card linking to `/admin/deals/operations/upgrade` whenever `premium.viewer.hasAdvancedAnalytics` is
    false or das Profil eine `upgradePrompt`-Nachricht (Trial-Ende, Downgrade-Hinweis) liefert.
* `components/marketplace/deals/NegotiationDisputePanel.tsx`
  * New escalation card that lists the latest disputes, their severity, SLA due date, and attached evidence.
  * Exposes a dialog for buyers/sellers to raise disputes with summary, outcome expectation, and optional evidence links.
  * Highlights Treuhand-Holds, Vergleichsvorschläge, Auszahlungen sowie SLA-Verletzungen (Badge) und
    Submits to `/api/marketplace/deals/[id]/disputes`.
  * Fast-Track-Erstellung wird deaktiviert, sobald `premium.viewer.dunningState === 'PAYMENT_FAILED'` außerhalb der
    Grace-Period liegt, das Sitzplatzlimit überschritten wurde oder dem Workspace das `DISPUTE_FAST_TRACK`-Entitlement fehlt;
    die UI zeigt dazu einen erklärenden Alert inklusive Upgrade-Hinweis.
* `components/marketplace/deals/NegotiationFulfilmentBoard.tsx`
  * Logistics board surfaced directly in the workspace, rendering fulfilment orders, pickup/delivery windows, carrier details,
    milestones, and scheduled reminders with real-time negotiation activity updates.
  * Participants can create or edit orders, log milestones, and plan reminders via the new fulfilment REST endpoints. Admins
    inherit the same controls for triage.
  * Displays carrier sync state, last manifest refresh, and streaming tracking events once a valid `carrierCode` is provided. The
    creation form now includes a `Carrier-Code` field to trigger provider registration.
  * Surfaces computed SLA analytics (pickup/delivery delay badges) using `getFulfilmentSlaAnalytics` results so operations teams
    can prioritise overdue shipments directly within the board.
  * SLA-kritische Abholverstöße zeigen eine Alert-Pill mit dem E-Mail-/SMS-Versandstatus; die Komponente liest dafür die neuen
    `slaAlertsQueued` Job-Metadaten und blendet eine „Concierge benachrichtigt“-Notiz ein.
  * Concierge-spezifische Eingaben sind schreibgeschützt, wenn `premium.viewer.hasConciergeSla` fehlt, `isSeatCapacityExceeded`
    true ist oder eine Zahlungsstörung (`dunningState === 'PAYMENT_FAILED'` außerhalb der Grace-Period) erkannt wird. In diesen
    Fällen erscheint eine CTA-Karte mit Link zu `/admin/deals/operations/upgrade`.
* `components/marketplace/deals/AdminPremiumUpgradeFlow.tsx`
  * Administrator CTA that calls `/api/marketplace/premium/subscription`.
  * On successful `START_TRIAL`/`UPGRADE_CONFIRMED` actions the component now
    redirects the browser to the Stripe Checkout URL returned by the API and
    displays a transition message while navigation occurs.
* `components/marketplace/deals/EscrowStatusCard.tsx`
  * Visualises expected vs. funded balances, reconciliation warnings, disputes, and ledger history with contextual badges.
* `components/marketplace/deals/NegotiationContractCard.tsx`
  * Surfaces signature state, provider envelope lifecycle, and exposes document preview links via `/api/marketplace/deals/[id]/contracts/sign`.
  * Hosts the new redlining workspace: renders revision history, allows buyers/sellers/admins to submit revisions with summary, body, and attachment links, and wires accept/reject actions to `/api/marketplace/deals/[id]/contracts/revisions`.
  * Displays inline comments per revision with resolve/reopen controls. Mutation handlers refresh the workspace via the SWR `refresh` callback so negotiation snapshots stay consistent after collaboration events.
  * Generates clause-level and inline diffs via `lib/contracts/diff.ts`, including add/remove/modify rollups and expandable detailed views.
  * Persists revision drafts offline, showing conflict alerts when cached fingerprints diverge from the latest server revision or when the workspace reconnects after outages.
  * Respektiert Premium-Sperren: Bei Zahlungsfehlern außerhalb der Grace-Period oder Sitzplatzüberlauf werden Vertragsaktionen deaktiviert und die Workspace-Sperrkarte verweist auf die nächsten Schritte.

## Listing Detail Integration

`app/marketplace/listings/[listingId]/page.tsx` now:

* Pre-loads the latest negotiation for the current user (buyer or seller) and passes it to the workspace.
* Renders a “Verhandlung starten” card for authenticated buyers without an active negotiation.
* Displays the interactive workspace with role-aware CTAs, escrow ledger, and contract progress.

### API Snapshot

`GET /api/marketplace/deals/{id}` returns the negotiation snapshot and KPI envelope:

```json
{
  "negotiation": {
    "id": "neg_123",
    "status": "CONTRACT_DRAFTING",
    "offers": [/* latest 25 offers */],
    "activities": [/* persisted lifecycle events */],
    "escrowAccount": {
      "expectedAmount": 12500,
      "fundedAmount": 7500,
      "transactions": [/* ledger entries */]
    },
    "contract": {
      "status": "PENDING_SIGNATURES",
      "envelopeStatus": "PARTIALLY_SIGNED",
      "provider": "mock-esign",
      "participantStates": {
        "BUYER": { "status": "SIGNED", "signedAt": "2025-10-29T15:15:00.000Z" },
        "SELLER": { "status": "PENDING" }
      },
      "documents": [
        { "id": "doc_1", "status": "ISSUED", "providerEnvelopeId": "env_1" }
      ]
    },
    "contractRevisions": [
      {
        "id": "rev_3",
        "version": 3,
        "status": "IN_REVIEW",
        "summary": "Lieferklausel aktualisiert",
        "attachments": [
          { "name": "Redline", "url": "https://cdn.example.com/contracts/neg_123_v3.pdf", "mimeType": "application/pdf" }
        ],
        "comments": [
          {
            "id": "com_1",
            "body": "Bitte Lieferfenster bestätigen",
            "status": "OPEN",
            "author": { "id": "user_2", "name": "S. Müller" }
          }
        ]
      }
    ],
    "premiumTier": "PREMIUM",
    "premium": {
      "negotiationTier": "PREMIUM",
      "viewer": {
        "tier": "PREMIUM",
        "status": "TRIALING",
        "entitlements": ["ADVANCED_ANALYTICS", "DISPUTE_FAST_TRACK"],
        "hasAdvancedAnalytics": true,
        "hasConciergeSla": false,
        "hasDisputeFastTrack": true,
        "seatCapacity": 5,
        "seatsInUse": 4,
        "seatsAvailable": 1,
        "isSeatCapacityExceeded": false,
        "gracePeriodEndsAt": null,
        "isInGracePeriod": false,
        "isDowngradeScheduled": false,
        "downgradeAt": null,
        "downgradeTargetTier": "STANDARD",
        "dunningState": "NONE",
        "lastPaymentFailureAt": null,
        "lastReminderSentAt": null
      }
    },
    "disputes": [
      {
        "id": "disp_1",
        "status": "OPEN",
        "severity": "HIGH",
        "category": "DELIVERY",
        "summary": "Lieferung blieb aus trotz Zahlung",
        "raisedAt": "2025-10-30T09:00:00.000Z",
        "slaDueAt": "2025-10-31T09:00:00.000Z",
        "evidence": [
          { "id": "ev_1", "type": "LINK", "url": "https://tracking.example/123", "label": "Tracking" }
        ]
      }
    ]
  },
  "kpis": {
    "premiumWorkflow": true,
    "escrowFundedRatio": 0.6,
    "completed": false
  }
}
```

## Admin Oversight Console

`/app/admin/deals/page.tsx` lists the 50 most recent negotiations with filters for lifecycle status, SLA risk buckets (24h risk,
breached), and premium vs. standard workflows. Summary cards now include dispute counts, reconciliation warnings, and average
funding latency alongside active negotiation and escrow volume KPIs. Each row shows escrow balance, premium badge, dispute
state, reconciliation alerts, and the last activity timestamp. Nicht-Premium-Admins sehen einen Upgrade-Hinweis mit Verweis auf
die Operations-Ansicht.

`/app/admin/deals/operations/page.tsx` zeigt Scheduler-Gesundheit (Intervall, nächste/letzte Ausführung), die 25 jüngsten
Ausführungen sowie eine Notification-Fan-out-Kachel mit Pending-/Failed-Zählern. Ein zusätzlicher "Premium Conversion Funnel"
visualisiert CTA-Aufrufe, Trial-Starts, Upgrades, abgeschlossene Premium-Deals, aktive Abos und Conversion-Raten (Basis:
`GET /api/marketplace/premium/metrics`). Über das Formular im Card-Header lässt sich der Auswertungszeitraum (7–120 Tage)
mittels `premiumWindow`-Query ändern, bestehende Parameter wie `upgrade` bleiben erhalten. Seit 2025-10-30T03:15Z steht
zusätzlich ein Tier-Dropdown bereit: Der `premiumTier`-Parameter (`ALL`, `PREMIUM`, `CONCIERGE`) filtert Funnel, Vergleichsdeltas
und aktive Abos auf die gewünschte Kohorte. Ein Formular-POST auf
`/api/admin/jobs/[jobName]/run` löst Jobs manuell aus; Concierge-Berechtigungen werden bei fehlendem Premium-Profil explizit
eingefordert und verlinken jetzt auf `/admin/deals/operations/upgrade`. Die Concierge-CTA liest Headline und Call-to-Action aus
`premiumProfile.upgradePrompt`, sodass Trial-Ende, Zahlungsfehler oder Kündigungen unmittelbar reflektiert werden. Neu blenden
die Admin-Ansicht automatische Warnkarten ein, wenn `premiumProfile.dunningState === 'PAYMENT_FAILED'` (Grace-Period Hinweis)
oder `premiumProfile.isSeatCapacityExceeded` (Sitzplatzverwaltung) greift – beide verlinken in den Billing-Bereich.
Seit 2025-10-30T02:40Z hebt der Funnel zusätzlich Vorperioden-Vergleiche hervor: Die `comparison`-Deltas werden in der UI als
grüne/rote Inline-Werte dargestellt und basieren auf identischen Fenstergrößen, sodass Growth- oder Rückgänge sofort ins Auge
fallen.
Neu seit 2025-10-30T04:55Z: Der Marketplace-Intelligence-Block sitzt oberhalb der Scheduler-Sektion und kombiniert ein Query-
Formular (`insightsWindow`, `insightsScope`) mit dem `AdminMarketplaceIntelligence`-Card. Die Karte zeigt aggregierte Deal-KPIs,
die fünf wichtigsten Materialtrends, identifizierte Versorgungslücken und automatisch generierte Premium-Empfehlungen. Der
Segment-Schalter erlaubt wahlweise einen Premium-only Blick oder die Gesamtmarkt-Perspektive, ohne dass die anderen Query-
Parameter (Premium-Funnel) verloren gehen.
Neu seit 2025-11-07T02:45Z: Die Karte reichert Trends mit Forecast-Spalten (projizierte Negotiations & GMV samt Confidence) an,
visualisiert Anomalien aus einem vierfachen Lookback als separate Alert-Liste und kennzeichnet Premium-Empfehlungen mit
`targetTier`-Badges plus konkreten Aktionsvorschlägen. Damit lassen sich Concierge- und Core-Premium-Workflows gezielt
aussteuern und mit den Premium-Insights im Workspace synchronisieren.
Seit 2025-10-30T23:20Z besitzt die Dispute-Kachel eine strukturierte Queue auf Basis der neuen `DealDispute`-Modelle: Spalten
für Summary, Lifecycle-Status (Badges), Severity (farbcodierte Outlines), SLA-Fälligkeit, Assignment und letzte Aktivität helfen
Admins, Engpässe zu priorisieren. Inline-Formulare triggern die Server Actions `updateDisputeStatusAction` und
`assignDisputeAction`, womit Disputes übernommen, eskaliert, gelöst oder neu zugewiesen werden können (inkl. Audit-Trail).
Seit 2025-10-30T04:25Z zeigen die Zeilen zusätzlich Hold-, Vergleichs- und Auszahlungsbeträge an und binden
`applyDisputeHoldAction`, `recordDisputeCounterProposalAction` sowie `settleDisputePayoutAction` an neue Inline-Formulare;
überfällige SLA-Fenster erhalten ein rotes Badge.
Neu seit 2025-11-06T08:10Z: Unter jeder Dispute-Zeile erscheint ein Guidance-Grid mit empfohlenen Workflows (inkl. Status-Buttons,
Workflow-Links und ausklappbaren Nachrichtenvorlagen), einer Kommunikationsliste samt Copy-&-Paste-Texten sowie einer
Compliance-Checkliste mit SLA-Indikatoren. Daneben visualisiert ein "Dispute Insights"-Card im Kopfbereich offene/eskalierte
Fälle, die Abschlussgeschwindigkeit, die SLA-Verletzungsrate und ein Win/Loss-Breakdown der letzten 30 Tage.
Seit 2025-10-30T00:45Z ergänzt eine Fulfilment-Kachel die Operations-Ansicht: Sie liest die Metadaten des Jobs
`fulfilment-logistics-sweep` aus, zeigt ausstehende Erinnerungen, zuletzt versandte Reminder und eskalierte Abholfenster an und
markiert parallel die anstehenden E-Mail-/SMS-Alarmierungen. Ein Klick auf den Scheduler-Trigger erlaubt weiterhin die
sofortige Neu-Ausführung.
Seit 2025-10-30T03:45Z ergänzt eine scrollbare Tageswerte-Tabelle die Kennzahlen. Die neuesten Conversion-Ereignisse stehen
oberhalb, inklusive Tages-Conversionsraten, damit Growth-Experimente und Anomalien schneller erkannt werden.

## Telemetry Notes

* Workspace components rely on `useNegotiationWorkspace`, which now opens an SSE stream to `/api/notifications/stream`,
  acknowledges processed envelopes through `/api/notifications/ack`, and only falls back to the 15s poll when the stream drops.
  Optimistic updates remain in place for counter and signing flows. Upgrade CTA-Aufrufe werden an
  `/api/marketplace/premium/subscription` gemeldet.
* KPI data is included in the API response for downstream analytics (completion, escrow funding ratio, premium flag) and is
  surfaced in the admin dashboard und im Premium-Insights-Widget.
* Contract signature analytics feed the new `ContractIntentMetric` table via helpers in `lib/contracts/analytics.ts`, so
  dashboards can render signature completion times without subscribing to raw webhook traffic.
* Contract collaboration events (`CONTRACT_REVISION_SUBMITTED`, `CONTRACT_REVISION_ACCEPTED`, `CONTRACT_REVISION_COMMENTED`) are published whenever revisions or comments change, keeping the timeline and notifications in sync with the UI.

## Follow-ups

* Swap the SSE gateway for a websocket transport backed by Redis or Temporal when the production messaging layer is available.
* Capture screenshot assets for die Premium-Insights-Komponente, sobald visuelles QA abgeschlossen ist.
* Expand Premium-Analytics (z. B. Forecasts, Conversion-Heatmaps) sobald ausreichend Daten vorliegen.
