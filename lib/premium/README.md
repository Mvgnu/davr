# Premium Monetization Utilities

Helper utilities for resolving premium subscription entitlements, granting default
features for new subscriptions, logging monetization conversion events, and
aggregating conversion funnel metrics for the admin operations console.

## Billing Integration

`lib/premium/payments/stripe.ts` now exposes the production Stripe adapter used by
the `/api/marketplace/premium/subscription` route. `START_TRIAL` and
`UPGRADE_CONFIRMED` actions create Checkout Sessions using the tier-specific Price
IDs (`STRIPE_PRICE_ID_PREMIUM`, `STRIPE_PRICE_ID_CONCIERGE`) and persist the
Stripe customer/session metadata on `PremiumSubscription` so webhook handlers can
reconcile lifecycle updates.

`lib/premium/entitlements.ts` now includes `handleStripeWebhookEvent`, which
persists lifecycle callbacks (`customer.subscription.updated`, `invoice.paid`,
`invoice.payment_failed`, `checkout.session.completed`) via the
`PremiumSubscriptionWebhookEvent` table. The handler reconciles subscription
status, billing identifiers, seat usage metadata, grace periods, and default
entitlements, removing premium analytics from the workspace when eine
Subscription ausläuft, das Sitzplatzlimit überschritten ist oder eine Zahlung
nach Ablauf der Grace-Period nicht eingeht. The negotiation API forwards the
updated `upgradePrompt` so frontend components can display upsell or dunning
messaging instantly.

`lib/premium/reminders.ts` adds a lean reminder dispatcher that scans
`PremiumSubscription` records for payment failures still innerhalb der
Grace-Period and stamps `lastReminderSentAt` when a nudge is issued. The module
is wired into `lib/jobs/registry.ts` as `premium-dunning-reminders`, updating
job metadata with the number of reminders sent to aid operations oversight
without adding extra telemetry sinks.
