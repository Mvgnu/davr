# Integrations Layer

This directory hosts client modules that encapsulate interactions with third-party services. Each integration exposes a typed interface, uses machine-readable metadata comments for automation, and keeps implementation details isolated from API routes.

## Modules

- `escrow.ts`: Mock escrow provider abstraction used by the marketplace deal workflow until a real provider is connected.
- `storage.ts`: External document storage adapters (SharePoint/Google Drive) used to mirror contract revision attachments.

## Conventions

1. Export interface contracts for provider capabilities so API handlers can depend on abstractions instead of vendor-specific logic.
2. Include `meta:` comments describing module ownership, integration strategy, and version to support automation.
3. Keep side effects (network calls, secrets) behind functions to facilitate testing and substitution.
