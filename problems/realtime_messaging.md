# Problem Tracker – Real-time Negotiation Messaging

- ID: RTM-001
- Status: DONE
- Task: Deliver streaming notifications for negotiation lifecycle events.
- Hypothesis: Introducing a provider-backed queue and SSE feed will allow clients to receive lifecycle pushes without polling while keeping the admin buffer intact.
- Log:
  - 2025-10-29T16:30:00Z – Stub queue replaced with provider abstraction and in-memory broadcaster. Negotiation events now annotate delivery channels for downstream consumers.
  - 2025-10-29T16:45:00Z – Added `/api/notifications` REST feed and `/api/notifications/stream` SSE gateway. Workspace hook upgraded to consume push updates with SLA state tracking.
  - 2025-10-29T18:10:00Z – Notifications persist to `NegotiationNotification`, scheduler fan-out delivers via registered transports, and admin console surfaces delivery backlog metrics.
  - 2025-10-29T19:05:00Z – Envelopes expose persistence IDs, clients acknowledge via `/api/notifications/ack`, and workspace auto-batches delivery receipts to keep operations metrics current.
  - 2025-10-29T19:40:00Z – Locked notification APIs behind authenticated session checks with negotiation-level authorisation so only buyers, sellers, and admins can stream, list, or acknowledge envelopes.
  - 2025-10-29T20:05:00Z – Added query validation + deduplicated acknowledgements so REST fallbacks reject malformed filters gracefully and operations metrics stay accurate.
