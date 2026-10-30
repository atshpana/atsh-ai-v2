# ADR-0001 — Greenfield Application Architecture

- Status: **Proposed for owner ratification**
- Date: 30 October 2026
- Scope: new ATSH AI application only

## Context
ATSH AI is a multi-domain business platform: bilingual public website, Arabic internal administration, customer portal, configurable commerce/intake, project operations, finance, support, hosting operations and a permission-scoped AI workforce. The owner has explicitly directed a full greenfield rebuild with a new independent database.

## Recommended architecture
Adopt a **TypeScript monorepo with a modular backend and separate web applications**:

| Layer | Recommendation | Responsibility |
|---|---|---|
| Public website | Next.js App Router | SEO, Arabic/English routes, public content and intake UX |
| Internal admin + customer portal | Next.js applications or clearly separated route groups | Role-specific user experiences; Arabic-only admin |
| Backend | NestJS modular monolith | Domain APIs, authorization, business rules, events and integrations |
| Database | PostgreSQL, independently provisioned | New system of record |
| Data access/migrations | Prisma ORM + reviewed SQL migrations where needed | Typed persistence and schema evolution |
| Background processing | Dedicated worker process; Redis/BullMQ when justified | Retries, scheduled work and long-running jobs |
| Orchestration | n8n | External workflow orchestration; not core business logic or system of record |
| File storage | S3-compatible private object storage (provider TBD) | Customer files, deliverables and controlled downloads |
| UI system | TypeScript + accessible component primitives + central design tokens | Consistent design, RTL/LTR and configurable themes |
| Testing | Unit, API integration and Playwright | Unit, integration, authorization and end-to-end verification |
| Delivery | GitHub Actions + isolated preview/staging | CI, quality gates and controlled releases |

## Backend module boundaries
Begin as a modular monolith, not microservices. Keep domain boundaries explicit:
- Identity, sessions and access control
- Customers and organizations
- Public content and localization
- Service catalog, packages and pricing
- Configurator, carts, requests and immutable price snapshots
- Quotes, contracts and approvals
- Projects, plans, stages, tasks and change requests
- Customer portal and contracted product modules
- Team, roles, assignments and delegations
- Notifications and communication history
- Support and service cases
- Hosting, domains and renewals
- Finance, invoices, payments and reconciliation
- AI manager, agent registry, runs, tools, budgets and human approvals
- Workflow integration and event outbox
- Audit, reporting and operational monitoring

Modules own their business rules and data access. Cross-module operations use explicit application services/events rather than direct table manipulation.

## Security and reliability requirements
- Server-side authorization on every protected operation; deny by default.
- Tenant/customer/project scoping enforced in the API and tested for horizontal privilege escalation.
- Separate staff, customer and agent identities.
- MFA support and secure session lifecycle; final provider/implementation is subject to threat-model review.
- Secrets only in environment/secret manager, never in Git.
- Private object storage with short-lived authorized access.
- Immutable audit events for privileged actions and approvals.
- Idempotency keys for retried commands and webhook handling.
- Transactional outbox for reliable domain-event delivery.
- AI agents receive scoped tools and budgets; no self-approval or unrestricted production access.
- Human approval gates for contractual, financial, security-sensitive and production actions.
- Development, test, staging and production are isolated.

## Why a modular monolith first
It provides clear domain boundaries and a single deployable backend while the product is being established. It avoids early distributed-systems complexity, service-to-service authentication overhead and fragmented transactions. A module may be extracted later only when measured scaling, team ownership or reliability requirements justify it.

## Consequences and trade-offs
- TypeScript is shared across frontend and backend, reducing context switching and contract drift.
- NestJS provides explicit modules, dependency injection, guards and testable services; it adds framework structure and conventions.
- PostgreSQL is a strong fit for relational business workflows, constraints, transactions and audit records.
- Prisma accelerates typed data access, but complex constraints and specialized queries may require reviewed SQL.
- Redis/worker infrastructure is deferred until a concrete queue/retry workload requires it.
- Database provider, storage provider, hosting provider, auth details and payment provider remain separate open decisions.

## Ratification required
The owner should approve or change:
1. Next.js + NestJS + TypeScript monorepo.
2. PostgreSQL as the new database engine.
3. Prisma as the default data access/migration tool.
4. Modular monolith first, with asynchronous workers where required.

No production infrastructure or paid service is provisioned by this ADR.
