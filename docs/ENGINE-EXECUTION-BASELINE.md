# ATSH AI — Software Production Line Execution Baseline

**Document status:** Proposed owner-review baseline  
**Version:** 2.0  
**Recorded:** 2026-11-07  
**Repository:** `atshpana/atsh-ai-v2`  
**Review branch:** `docs/production-line-mission-v2`

## 1. Purpose — what we are building

This repository builds the **ATSH AI Software Production Line** (the factory/engine). The production line is not the final customer-facing ATSH AI product, and its purpose is not to become a generic command runner.

Its primary mission is to receive the approved **HAI master file** (the authoritative specification for ATSH AI), understand it, and use it to build, integrate, test, package, and prepare the actual ATSH AI system for release.

The intended outcome is two distinct deliverables:

1. **The production line:** the controlled software-factory capability developed in this repository.
2. **The ATSH AI platform:** the application that the production line will build from the HAI master file and that, after an approved release, will operate on the designated server/domain and receive/manage customer requests.

Do not confuse progress on the factory with completion of the ATSH AI platform.

## 2. Target end-to-end production flow

The production line must ultimately perform the following lifecycle:

1. **Specification intake**
   - Receive the approved HAI master file and its supporting assets.
   - Preserve the original file unchanged, calculate a content hash, record its version/source, and create an immutable intake record.
   - Extract requirements, modules, screens, user journeys, roles/permissions, business rules, integrations, data entities, acceptance criteria, and unresolved questions.
   - Maintain traceability from each extracted requirement to implementation artifacts and tests.
   - Do not silently invent missing business decisions. Mark gaps and conflicts for owner review.

2. **Specification analysis and build planning**
   - Convert the extracted specification into a dependency-aware work plan.
   - Identify application modules, APIs, UI screens, workflows, data models, integrations, and test cases.
   - Separate mandatory requirements from optional or unresolved items.
   - Produce a reviewable plan before execution; retain the plan and its version in the engine database.

3. **Repository and implementation setup**
   - Create or use the approved GitHub repository and a dedicated feature branch for the build.
   - Generate the application structure and implement the ATSH AI requirements from the HAI master file.
   - Keep source changes reviewable, traceable, and isolated from production branches.
   - The engine must not grant itself permission to merge to `main`.

4. **Existing-server database discovery and integration**
   - Discover and document the databases and services already present on the designated server before deciding how the new ATSH AI application should integrate with them.
   - Build a verified inventory of database engines, database names, schemas, tables, views, relationships, existing application ownership, and available integration interfaces. Record only the metadata needed for the approved integration.
   - Map HAI requirements to existing data structures. Identify which data can be reused through existing APIs, controlled database roles, views, or explicitly approved schema changes.
   - Prefer existing supported application APIs or narrowly scoped database access over broad direct access.
   - Do not assume that every existing database belongs to ATSH AI or is safe to modify.
   - Do not drop, truncate, rename, overwrite, bulk-transform, or migrate existing tables/data as an incidental part of application generation.
   - Any schema change must be proposed as a versioned migration, reviewed against the discovered schema, tested on a non-production copy, backed by a recovery plan, and explicitly approved before production application.
   - Existing production databases remain protected. The Build Worker must not receive unrestricted production database credentials or direct network access to `core-db`. Database integration must occur through a separately controlled application/data-access boundary with least-privilege credentials, audited operations, and explicit allowlisted targets.
   - Keep `agent-db` separate as the source of truth for production-line tasks, jobs, plans, checkpoints, approvals, and audit events. Do not use it as a substitute for ATSH AI business data.

5. **Build, test, and verification**
   - Execute package installation, code generation, build, lint, unit, API/integration, migration-validation, and browser/E2E tests only inside a proven isolated build environment.
   - Never execute generated/customer-controlled code inside the worker process or directly on the host.
   - Verify requirements against the HAI traceability matrix, including RTL/LTR, responsive behavior, permissions, data boundaries, failure paths, and integrations where applicable.
   - Record test results, artifacts, logs with secrets redacted, and the exact source commit.

6. **Preview/staging**
   - Produce a non-production preview or staging release on the approved infrastructure.
   - Verify the application against the HAI acceptance criteria and the actual target environment configuration without exposing production secrets to the build sandbox.
   - Provide a reviewable preview and a list of passed, failed, blocked, and unverified requirements.

7. **Revisions and acceptance**
   - Capture owner/client feedback as versioned change requests.
   - Distinguish defects (failure to meet the approved HAI requirement) from scope changes (new or altered requirements).
   - Apply revisions on a new branch/commit and rerun affected tests.
   - Store approval against the exact release identifier and commit SHA. A general chat message or approval of an earlier build is not approval of a later build.

8. **Controlled release and deployment**
   - Prepare a release candidate with source commit, build artifact, test evidence, migration plan, environment target, rollback plan, and approval record.
   - Deploy only to the explicitly approved target server/domain and only after the required version-specific approval and release gates.
   - Never merge to `main`, apply production migrations, or deploy to production automatically without the required explicit approval.
   - Verify health, routing, TLS/domain, application behavior, database connectivity, backups, and observability after deployment.
   - Keep rollback/recovery procedures available and record the deployment result.

9. **ATSH AI operational handover**
   - Once the ATSH AI platform has been released and accepted, it becomes the customer-facing/business system that receives and manages customer requests.
   - The production line remains its controlled build-and-release mechanism for future changes; it is not itself the customer portal or public website.
   - The deployed ATSH AI platform must follow the HAI requirements for public website, customer journey, administration, permissions, projects, support, integrations, and other approved modules.

## 3. System boundaries and data safety

### 3.1 Separate responsibilities

- **Production-line engine:** owns specification intake metadata, requirement extraction, build plans, task graph, jobs, checkpoints, tool activity, approvals, audit events, and release records.
- **Build Worker:** executes only bounded, isolated build/test tasks. It does not own business data and does not hold unrestricted production credentials.
- **`agent-db`:** durable system of record for engine operations.
- **Existing server databases (including `core-db` where applicable):** remain existing data systems whose purpose and ownership must be discovered before integration. They are not to be presumed disposable or replaced.
- **ATSH AI application data layer:** connects to only the explicitly approved database targets through least-privilege application-side access or approved APIs. It is separate from the untrusted build sandbox.
- **n8n:** triggers, orchestration, integrations, and notifications only; not the source of truth for engine or customer business state.
- **GitHub:** versioned source, branches, reviews, and pull requests; the engine must not self-merge to production branches.
- **Coolify / target hosting:** runtime and deployment environment, accessed through scoped deployment mechanisms and explicit release gates.

### 3.2 Required security boundaries

- No secrets in Git, source files, prompts, chat transcripts, build artifacts, or logs.
- Inject credentials at runtime, scoped to the exact task/service and redacted from output.
- The build sandbox must have no route to production databases, host services, Docker socket, or unrelated internal services.
- The application runtime's database access is distinct from the build sandbox's access and must use narrowly scoped credentials.
- Require non-root execution, read-only base filesystem, bounded writable workspace/temp storage, CPU/memory/PID/time/output limits, cancellation, and explicit network policy.
- Fail closed when the required isolation backend or database integration controls are not available.
- Audit sensitive reads, schema changes, permission changes, approvals, migrations, and deployments.

## 4. Approved technical direction

Subject to the approved architecture references and explicit owner decisions:

- TypeScript monorepo.
- Next.js App Router for the ATSH AI public website, administration, and customer portal.
- NestJS modular-monolith backend.
- PostgreSQL and Prisma for engine/application data where approved by the database discovery and architecture plan.
- Separate Build Worker and a real OS/container sandbox backend.
- Durable engine state in `agent-db`.
- n8n for orchestration/integrations/notifications, not durable state.
- GitHub branches and pull requests for source governance.
- Existing OpenAI API key as the initial model provider, injected at runtime only; no secrets in Git/chat/logs.
- Model/provider choices and spend controls remain subject to measured quality, reliability, latency, and cost evidence.

This baseline does not authorize a specific production database mutation, migration, credential grant, deployment, or merge.

## 5. Completion definition for the production line

The production line is not considered ready merely because it can call a model or write source files. Its first meaningful end-to-end acceptance milestone is:

- It can ingest the approved HAI master file immutably.
- It can extract and trace requirements without silently filling gaps.
- It can inspect the designated server's database metadata through a controlled read-only discovery path.
- It can produce a reviewed implementation plan and data-integration map.
- It can create and modify application source in a governed GitHub branch.
- It can build and test the application in a proven isolated sandbox.
- It can produce a non-production preview with requirement/test evidence.
- It can process versioned revisions and record approval against the exact release/commit.
- It can prepare a controlled deployment package and, after explicit approval, deploy to the designated target and verify it.
- It can hand over the resulting ATSH AI platform for customer-facing operation.

Production deployment is a separately gated milestone; it is not implied by passing the earlier acceptance steps.

## 6. Current implementation facts — do not overstate

As of the recorded baseline, the repository contains a durable worker queue foundation, leases/heartbeats, retry/backoff, events/checkpoints, persisted tool-plan metadata, read-only GitHub inspection, per-job workspaces, guarded create-only workspace writes, and a model tool-loop integration for workspace file creation.

The following are not yet established as working end-to-end capabilities: real sandbox execution, build/test command execution, parent/child task dispatch and aggregation, HAI intake and requirement traceability, database discovery/integration workflow, GitHub write/PR lifecycle, preview artifacts, revision management, version-bound release approvals, and controlled deployment.

A policy/interface or mock test is not proof that a real sandbox or production integration exists.

## 7. Execution protocol

- One active implementation task at a time.
- Work on feature branches and submit pull requests; do not commit this work directly to `main`.
- Every task must have acceptance criteria, automated tests where applicable, and recorded evidence.
- Update `TASKS.md`, `PROGRESS.md`, and `DECISIONS.md` when implementation status or binding decisions change.
- Distinguish owner-confirmed environment preparation from independently verified live state.
- Do not repeat completed readiness checks without a concrete, narrowly scoped failure.
- Do not claim a service, database connection, migration, test, preview, or deployment is operational unless verified.
- Production data, schema, credentials, merge, and deployment remain protected by explicit approvals.

## 8. Immediate next step

Use this document as the proposed target definition for the production line. Review it against the HAI master reference and the repository implementation. Then create a requirement-to-capability gap assessment before selecting the next implementation task. The next task must advance the HAI-to-ATSH-AI build path, not expand generic engine functionality without a traceable need.
