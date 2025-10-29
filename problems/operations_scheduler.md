# Problem Tracker – Operations Scheduler Reliability

- ID: OPS-SCHED-001
- Status: DONE
- Task: Introduce structured retries, disable thresholds, and surfacing metadata for job executions.
- Hypothesis: Persisting attempt counters and last error metadata lets on-call engineers triage failing workers quickly while preventing runaway retries.
- Log:
  - 2025-10-29T21:45:00Z – Added exponential backoff (60s base, capped at interval) with five-attempt disable guardrails in `lib/jobs/scheduler.ts`, plus structured console diagnostics.
  - 2025-10-29T21:47:00Z – Extended admin operations console to display attempt counts, last error details, and disable state.
  - 2025-10-29T21:48:00Z – Documented retry policy and disable flow in `docs/backend/marketplace-deals.md`.
  - 2025-10-29T22:05:00Z – Added scheduler runbook guidance (restart, poison payload triage, notification recovery) to `docs/backend/marketplace-deals.md` to satisfy Initiative 7 task 4.
  - 2025-10-29T22:40:00Z – Surfaced backlog depth in job health (`lib/jobs/scheduler.ts`) and `/app/admin/deals/operations` with documentation updates, fulfilling Initiative 7 task 3 backlog visibility.
  - 2025-10-29T23:20:00Z – Migrated die manuellen Job-Trigger auf Server Actions mit Inline-Benachrichtigungen, sodass Admins den Scheduler ohne JSON-Redirect verlassen können; Dokumentation aktualisiert.
  - 2025-10-30T00:05:00Z – Ersetzte Query-Parameter-basierte Rückmeldungen durch `SchedulerJobTriggerButton` mit `useFormState`, wodurch jede Tabellenzeile Statusmeldungen inline anzeigen und nach Erfolg automatisch aktualisieren kann; ergänzende Tests decken das Server-Action-Verhalten ab.
