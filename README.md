# ATSH AI — Software Production Line

This repository contains the **software production line** that will receive the approved ATSH AI HAI master specification, analyze it, build the ATSH AI platform, integrate it with approved databases/services already present on the designated server, test it, produce a preview, and prepare a controlled release.

The production line is distinct from the customer-facing ATSH AI platform that it will build.

## Mission
1. Ingest and version the HAI master file without changing the source.
2. Extract requirements, screens, workflows, roles, business rules, data needs, integrations, and acceptance criteria with traceability.
3. Plan and implement the ATSH AI platform in governed GitHub branches.
4. Discover existing server databases and services before designing integration.
5. Integrate only with approved database targets through controlled, least-privilege application-side access or supported APIs.
6. Build and test in a proven isolated sandbox.
7. Produce a non-production preview, process revisions, and bind approval to the exact release/commit.
8. Deploy to the designated server/domain only after explicit version-specific approval and release gates.
9. Hand over the released ATSH AI platform to receive and manage customer requests.

## Existing server data — important boundary
Existing server databases are not assumed to be disposable, replaced, or safe to modify. The production line must inspect their metadata and map HAI requirements before proposing integration. No destructive changes, production migrations, or broad database credentials are permitted by default. The Build Worker must not have unrestricted production database access; application data access is provided separately through narrowly scoped credentials or approved APIs. Engine state remains in `agent-db`.

## Architecture direction
- TypeScript monorepo.
- Next.js App Router for public website, administration, and customer portal.
- NestJS modular-monolith backend.
- PostgreSQL/Prisma for engine and application data where confirmed by the approved database plan and discovery.
- Dedicated Build Worker with a real OS/container isolation boundary.
- n8n for orchestration, integrations, and notifications — not system of record.
- GitHub branches and pull requests for source governance.
- Playwright plus unit/API/integration tests.
- GitHub Actions for CI.

## Safety and release governance
- Never execute generated/customer-controlled code in the worker process or directly on the host.
- Fail closed if a real sandbox backend is unavailable.
- Never put secrets, production connection strings, or private customer data in Git/chat/logs.
- Do not merge to `main`, apply production migrations, or deploy without explicit approval tied to the exact release/commit and required safeguards.
- A feature is complete only with implementation, verification, and recorded evidence.

## Current status
The repository has initial web/admin/API/worker workspaces and a partial durable worker/tool foundation. It is **not yet** a complete HAI-to-production pipeline. See `docs/ENGINE-EXECUTION-BASELINE.md`, `TASKS.md`, and `PROGRESS.md` for the target lifecycle and verified implementation boundary.
