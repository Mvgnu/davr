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
`checkout.session.completed`) via the new `PremiumSubscriptionWebhookEvent`
table. The handler reconciles subscription status, billing identifiers, and
default entitlements, removing premium analytics from the workspace when a
subscription expires or is cancelled. The negotiation API forwards the updated
`upgradePrompt` so frontend components can display upsell messaging instantly.
