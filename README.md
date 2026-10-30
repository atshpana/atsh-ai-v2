# ATSH AI — Greenfield Implementation

This repository is the independent, greenfield implementation of ATSH AI, governed by the approved Executive Reference v2.0 and subsequent explicit owner decisions.

## Greenfield mandate
- Build the entire ATSH AI system from zero: application code, architecture, new database schema, migrations, authentication, authorization, APIs, interfaces, workflows and tests.
- The legacy application and its database are out of scope as implementation foundations. Do not copy, extend, connect to, migrate from or depend on them.
- Do not import legacy data. Any future data import requires a separate, explicit owner decision and a reviewed migration plan.
- Keep this repository public as explicitly approved. Never commit secrets, credentials, private customer data, production connection strings or sensitive operational data.
- Enforce all authorization on the server. Pricing is calculated and revalidated server-side; submitted requests retain immutable financial snapshots.
- No production release, payment activation, irreversible AI action or external customer communication without the required configuration and human approval.
- A feature is complete only after implementation, automated/manual verification and recorded acceptance evidence.

## Approved architecture
- TypeScript monorepo.
- Next.js App Router for public website, internal administration and customer portal.
- NestJS modular-monolith backend.
- PostgreSQL as the new independent application database.
- Prisma 7 for data access and migrations; PostgreSQL driver adapter.
- Dedicated worker process; Redis/BullMQ only when justified by workload.
- n8n for workflow orchestration, not system of record.
- Playwright plus unit/API integration tests.
- GitHub Actions for CI.

## Language scope
- Public website: Arabic and English, visitor-selectable, with RTL Arabic and LTR English.
- Internal administration dashboard: Arabic only in the current scope.
- Customer portal language remains an explicit open decision.

## Current status
- Greenfield branch: implementation/bootstrap.
- Initial workspaces exist for public web, admin, customer portal, API and worker.
- Public website has an initial bilingual UI shell; admin and customer portal have placeholder shells.
- NestJS API has a bootstrap and health endpoint.
- Initial PostgreSQL Prisma schema covers identity/RBAC, customer profile, service catalog/options, pricing versions/rules, request snapshots/events, quotes and audit events.
- Screen/flow catalog, API inventory and logical data model drafts are recorded under docs/.
- Dependency versions and CI checks are configured, but clean install/build/typecheck/Prisma validation are not yet verified.
- No database has been provisioned or connected. No migration has been generated/applied. No production deployment exists.

See docs/implementation/STATUS.md for the current verified state and next actions.
