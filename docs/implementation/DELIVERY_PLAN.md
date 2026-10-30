# ATSH AI — Greenfield Delivery Plan

## Delivery rule
Work in vertical slices. Each slice includes requirement traceability, UI, API, persistence, server-side authorization, tests and review evidence. Do not mark a feature accepted merely because its files exist.

## Phase 0 — Foundation
- Confirm reference authority and owner decisions.
- Build requirement-to-screen/API/data/test traceability.
- Ratify the stack and module boundaries.
- Establish design tokens, RTL/LTR rules, accessibility baseline and component conventions.
- Establish secure configuration, CI checks and isolated test setup.

## Phase 1 — Platform core
- Monorepo and application skeleton.
- New database schema and migration workflow.
- Identity, authentication, sessions, roles and permission evaluation.
- Audit log, notification primitives, file metadata and secure storage adapter.
- Health checks, structured logs, error handling and operational metrics.

## Phase 2 — Public website and intake
- Public pages and localized navigation/content.
- Service catalog, packages and configurable options.
- Multi-service selection and guided intake.
- Server-side price calculation and immutable request snapshot.
- File upload validation and request tracking.
- Public-site assistant with scoped knowledge and escalation.

## Phase 3 — Administration and commercial operations
- Owner dashboard and configurable workspace layout.
- Customers, leads, requests, quote review and approvals.
- Services, packages, options, pricing versions and content management.
- Staff, roles, permissions, assignments and delegation.
- Notifications, audit search and reporting.

## Phase 4 — Projects and customer portal
- Contract, payment and project lifecycle gates.
- Configurable project templates, stages, tasks and dependencies.
- AI-generated plan draft with human approval and version history.
- Customer portal for project status, files, reviews, change requests and approvals.
- Delivery acceptance, release approval and handover.

## Phase 5 — Post-delivery operations
- Contract-scoped product management modules.
- Support, service cases and customer communication.
- Hosting/domain inventory, renewals, backups and operational status.
- Finance, invoices, payments and reconciliation after commercial decisions are approved.

## Phase 6 — AI workforce and automation
- AI manager, specialized agent registry and scoped tools.
- Agent task lifecycle, independent review, escalation and budget limits.
- n8n signed webhooks, idempotency, retry handling and event integration.
- Human approval gates for sensitive actions.
- Evaluation datasets, quality metrics and audit evidence.

## Phase 7 — Hardening and release
- Security and privacy review.
- Accessibility, RTL/LTR, responsive and browser testing.
- Load/performance tests and backup/restore rehearsal.
- Staging acceptance against the executive reference.
- Explicit owner approval before any production release.

## Initial vertical slice
The first implementation slice should be identity-free and non-production: a working public shell with bilingual routing, shared design tokens, RTL/LTR behavior, responsive navigation and CI checks. Authentication and database writes follow only after the platform security design is ratified.
