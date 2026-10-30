# ADR-0001 — Greenfield Application Architecture

- Status: **Accepted by owner**
- Decision date: 30 October 2026
- Scope: new ATSH AI application only

## Decision
The owner approved a **TypeScript monorepo using Next.js, NestJS, PostgreSQL and Prisma, with a modular-monolith backend**. This is the implementation baseline for the greenfield system.

| Layer | Approved technology / pattern | Responsibility |
|---|---|---|
| Web applications | Next.js App Router | Public website, internal admin and customer portal |
| Language | TypeScript | Shared language across web and backend |
| Backend | NestJS modular monolith | Domain APIs, authorization, business rules, events and integrations |
| New database engine | PostgreSQL | Independent new system of record |
| Data access/migrations | Prisma ORM + reviewed SQL where needed | Typed persistence and schema evolution |
| Background processing | Dedicated worker process | Long-running and scheduled work |
| Queue infrastructure | Redis/BullMQ only when justified by workload | Reliable asynchronous jobs and retries |
| Orchestration | n8n | Workflow orchestration, not system of record or unrestricted code executor |
| File storage | Private S3-compatible object storage | Provider remains open |
| Testing | Unit, API integration and Playwright | Unit, integration, authorization and end-to-end verification |
| CI/CD | GitHub Actions | Quality gates, build and controlled preview/staging |
| Backend topology | Modular monolith first | Explicit domain boundaries without premature microservices |

## Backend module boundaries
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
- Secure session lifecycle and MFA support; implementation details require a threat-model review.
- Secrets only in environment/secret manager, never in Git.
- Private object storage with short-lived authorized access.
- Immutable audit events for privileged actions and approvals.
- Idempotency keys for retried commands and webhook handling.
- Transactional outbox for reliable domain-event delivery.
- AI agents receive scoped tools and budgets; no self-approval or unrestricted production access.
- Human approval gates for contractual, financial, security-sensitive and production actions.
- Development, test, staging and production are isolated.

## Rationale
A modular monolith gives the product explicit domain boundaries while avoiding early distributed-systems complexity, service-to-service authentication overhead and fragmented transactions. A module may be extracted later only when measured scaling, team ownership or reliability requirements justify it.

## Consequences and remaining open choices
- TypeScript is shared across frontend and backend, reducing context switching and contract drift.
- NestJS provides explicit modules, dependency injection, guards and testable services.
- PostgreSQL supports relational workflows, constraints, transactions and audit records.
- Prisma provides typed data access; complex constraints and specialized queries may use reviewed SQL.
- The PostgreSQL hosting provider, storage provider, hosting provider, auth details, payment provider and email provider remain open.
- Redis/BullMQ is not mandatory on day one; add it when the workload demonstrates the need.
- No production infrastructure or paid service is provisioned by this ADR.

## Implementation constraint
This ADR authorizes the technology baseline, not production provisioning, paid subscriptions, production deployment or any connection to the legacy system.
