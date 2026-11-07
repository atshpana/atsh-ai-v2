# ATSH AI Software Production Line — TASKS

**Rule:** one active task at a time. Complete only with implementation, tests, and evidence. The governing target lifecycle is `docs/ENGINE-EXECUTION-BASELINE.md`.

## Completed prerequisites — owner-confirmed
- [x] PREP-01 Coolify readiness — owner-confirmed complete; do not repeat broadly.
- [x] PREP-02 GitHub readiness — owner-confirmed complete; do not repeat broadly.
- [x] PREP-03 existing server database and backup preparation — owner-confirmed complete; no destructive action is implied.
- [x] PREP-04 existing OpenAI key preparation — owner-confirmed complete; never expose the secret.

## Completed assessment
- [x] GAP-01 HAI → production-line capability gap matrix — documented in `docs/HAI-PRODUCTION-LINE-GAP-MATRIX.md`; repository evidence and live-environment unknowns are explicitly distinguished. This is an assessment deliverable, not implementation completion.

## Completed implementation — verified in repository
- [x] ENG-01 Repository governance baseline — PR #28 merged; commit `a26b8fe0ff9dca2d9c570fbe6d412fd58f798a09`.
- [x] ENG-BASE-01 Durable worker foundation — PostgreSQL `FOR UPDATE SKIP LOCKED`, leases/heartbeats, retry/backoff, events, checkpoints, bounded model turns. Code presence verified; not a fresh live runtime test.
- [x] ENG-BASE-02 Persisted tool planning — versioned plans/events; planning metadata only, not a general tool executor.
- [x] ENG-BASE-03 Read-only GitHub inspection — allowlisted reader, path validation, 1 MB cap, checkpoint persistence.
- [x] ENG-BASE-04 Per-job workspace primitive — PR #27 merged; per-job workspace and guarded file creation.
- [x] ENG-02 Worker workspace-write integration — PR #30 merged; commit `78a2fd5ce6745e816668d7858bd8d984e3ee78a7`. CI, CodeQL, Dependency Review succeeded for that PR head.

## Active task
- [ ] **GATE-01 — Complete Phase 0/1 evidence and review:** verify current backup integrity and restore test, sanitized staging, Coolify services, Worker/n8n runtime, database inventory/ownership/permissions, GitHub rules/CI, secret presence/scope without disclosure, network isolation and approvals schema. Phase 1 remains INCOMPLETE — NOT READY; no build/runtime/database work until review and approval.

- [ ] **ENG-03 — Real fail-closed build sandbox**
  - PR #32 was merged into implementation/bootstrap at `ebeabf4de468783d0cc7fc68b0738abc17d4054b` after CI run `42336071140` passed typecheck, build, and unit tests; CodeQL and Dependency Review also passed.
  - The merged code defines a sandbox contract/policy adapter only; it is not a concrete runtime.
  - Identify and validate the actual supported isolation runtime for the Build Worker.
  - Implement a concrete backend with non-root execution, no host/core-db network or host sockets, read-only root filesystem, bounded workspace/tmp writes, CPU/memory/PID/time/output limits, cancellation, and explicit network policy.
  - Acceptance: integration tests prove a real job runs inside the isolated runtime, cannot reach host/core-db, respects resource limits, and is terminated on cancellation. Until then, generated code and package scripts must not execute.

## Mandatory environment gate
- [ ] **PHASE-0/1 — protection and actual environment inspection**
  - Owner confirms preparation is complete; independently verify only missing evidence.
  - Phase 0: backup integrity/restore evidence, sanitized staging readiness, and safe secret-scope verification without exposing values.
  - Phase 1: Coolify services, Worker/n8n, actual databases and metadata, GitHub branch/Actions controls, secret presence/scope, network isolation, backup evidence, and approvals schema if present.
  - Partial report committed at docs/PHASE-1-ENVIRONMENT-EVIDENCE.md. GitHub/repository evidence is recorded; Coolify/server/database/network/backup/secret runtime evidence remains inaccessible. Keep this task open until the missing safe evidence is supplied and reviewed; no production writes.
  - No build or architectural implementation before the report is reviewed and approved, as required by architecture v1.1.

## Following tasks — ordered around the HAI build
- [x] **ENG-04 — HAI requirement traceability baseline (documentation extraction):** `docs/HAI-REQUIREMENT-TRACEABILITY-BASELINE.md` records source hierarchy, PUB/ADM/API/role/lifecycle/product-module/production-line requirement families and current evidence status. This is not automated immutable intake or complete implementation traceability; those remain open.
- [ ] **ENG-05 — Existing server database discovery and safe integration plan:** read-only metadata inventory; database/schema/table/relationship map; identify ownership and interfaces; map HAI entities to existing structures; propose API/view/least-privilege access; migration and rollback plans; no production writes until approved.
- [ ] **ENG-06 — Durable task decomposition and dispatch:** parent/child tasks, dependencies, concurrency caps, leases, retries, cancellation, and result aggregation in `agent-db`.
- [ ] **ENG-07 — GitHub implementation lifecycle:** restricted credentials; create feature branches, commit changes, open draft PRs; no merge permission.
- [ ] **ENG-08 — Model adapter and spend controls:** existing OpenAI key injected at runtime only; task-scoped use, redaction, usage/cost accounting, budgets and caps.
- [ ] **ENG-09 — Build/test pipeline and evidence:** isolated install/build/lint/unit/API/integration/E2E and migration validation; artifacts and traceability tied to commit SHA.
- [ ] **ENG-10 — Preview, revisions, approval and release:** non-production preview; versioned defect/change requests; approval bound to exact release/commit; release/rollback manifest.
- [ ] **ENG-11 — n8n orchestration:** triggers, notifications and external workflow integration only; durable state remains in engine DB.
- [ ] **ENG-12 — Controlled deployment and post-deploy verification:** explicit target, version-bound approval, migration gate, backup/rollback, domain/TLS/health/data-access checks; no autonomous production deployment without approval.
- [ ] **ENG-13 — Security/failure acceptance suite and non-production pilot:** isolation, core-db denial from worker, tenant/data boundaries, secret redaction, spend/retry caps, destructive-action rejection, recovery and pilot acceptance.

## Separate product audit
- [x] **PRODUCT-HAI-01 — initial repository conformance audit:** recorded in `docs/HAI-APPLICATION-CONFORMANCE-AUDIT.md` against commit `ebeabf4de468783d0cc7fc68b0738abc17d4054b`. This is a source-code audit, not live deployment or visual acceptance. Findings: public site is static bilingual content; admin 15 workspaces are scaffolds; API registers only health; Prisma schema is a foundation; auth principal/session flow, configurator/order APIs, CMS publishing and complete portal workflows are not evidenced. Follow-up implementation tasks remain open.

## Completion policy
Do not mark runtime, database integration, preview, or deployment complete from code presence or mocks alone. Require automated tests and environment evidence. Do not repeat completed tasks without a concrete failure and a new scoped task.
