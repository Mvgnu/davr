# Dispute Services

- status: experimental
- owner: operations
- scope: admin-workflows
- version: 0.2

Dieses Modul kapselt Datenzugriff und Workflows für Deal-Disputes. Die Queue-API
(`getDealDisputeQueue`) wird vom Admin-Operations-Cockpit genutzt, während
`createDealDispute` neue Vorgänge inklusive Evidenz und Benachrichtigung
anlegt. `transitionDealDisputeStatus` und `assignDealDispute` pflegen das
Audit-Protokoll und SLA-Metadaten. Mit Version 0.2 ergänzen
`applyDisputeEscrowHold`, `recordDisputeCounterProposal` und
`settleDisputeEscrowPayout` die Treuhand-Integration, während der Scheduler
(`scanDealDisputeSlaBreaches`) SLA-Verletzungen automatisch eskaliert.
