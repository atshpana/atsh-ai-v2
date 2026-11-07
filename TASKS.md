# ATSH AI Software Production Line — TASKS

**Rule:** one active task at a time. Complete only with implementation, tests, and evidence. The governing target lifecycle is `docs/ENGINE-EXECUTION-BASELINE.md`.

## Completed prerequisites — owner-confirmed
- [x] PREP-01 Coolify readiness — owner-confirmed complete; do not repeat broadly.
- [x] PREP-02 GitHub readiness — owner-confirmed complete; do not repeat broadly.
- [x] PREP-03 existing server database and backup preparation — owner-confirmed complete; no destructive action is implied.
- [x] PREP-04 existing OpenAI key preparation — owner-confirmed complete; never expose the secret.

## Completed implementation — verified in repository
- [x] ENG-01 Repository governance baseline — PR #28 merged; commit `a26b8fe0ff9dca2d9c570fbe6d412fd58f798a09`.
- [x] ENG-BASE-01 Durable worker foundation — PostgreSQL `FOR UPDATE SKIP LOCKED`, leases/heartbeats, retry/backoff, events, checkpoints, bounded model turns. Code presence verified; not a fresh live runtime test.
- [x] ENG-BASE-02 Persisted tool planning — versioned plans/events; planning metadata only, not a general tool executor.
- [x] ENG-BASE-03 Read-only GitHub inspection — allowlisted reader, path validation, 1 MB cap, checkpoint persistence.
- [x] ENG-BASE-04 Per-job workspace primitive — PR #27 merged; per-job workspace and guarded file creation.
- [x] ENG-02 Worker workspace-write integration — PR #30 merged; commit `78a2fd5ce6745e816668d7858bd8d984e3ee78a7`. CI, CodeQL, Dependency Review succeeded for that PR head.

## Active task
- [ ] **ENG-03 — Real fail-closed build sandbox**
  - Current PR #32 defines a sandbox contract/policy adapter only; it is not a concrete runtime and must not be represented as one.
  - Diagnose the current PR checks and complete the contract only after required checks pass.
  - Identify and validate the actual supported isolation runtime for the Build Worker.
  - Implement a concrete backend with non-root execution, no host/core-db network or host sockets, read-only root filesystem, bounded workspace/tmp writes, CPU/memory/PID/time/output limits, cancellation, and explicit network policy.
  - Acceptance: integration tests prove a real job runs inside the isolated runtime, cannot reach host/core-db, respects resource limits, and is terminated on cancellation. Until then, generated code and package scripts must not execute.

## Following tasks — ordered around the HAI build
- [ ] **ENG-04 — HAI specification intake and traceability:** immutable source file/version/hash; extraction of modules/screens/flows/roles/rules/data/integrations/acceptance criteria; unresolved-question register; requirement-to-code/test traceability.
- [ ] **ENG-05 — Existing server database discovery and safe integration plan:** read-only metadata inventory; database/schema/table/relationship map; identify ownership and interfaces; map HAI entities to existing structures; propose API/view/least-privilege access; migration and rollback plans; no production writes until approved.
- [ ] **ENG-06 — Durable task decomposition and dispatch:** parent/child tasks, dependencies, concurrency caps, leases, retries, cancellation, and result aggregation in `agent-db`.
- [ ] **ENG-07 — GitHub implementation lifecycle:** restricted credentials; create feature branches, commit changes, open draft PRs; no merge permission.
- [ ] **ENG-08 — Model adapter and spend controls:** existing OpenAI key injected at runtime only; task-scoped use, redaction, usage/cost accounting, budgets and caps.
- [ ] **ENG-09 — Build/test pipeline and evidence:** isolated install/build/lint/unit/API/integration/E2E and migration validation; artifacts and traceability tied to commit SHA.
- [ ] **ENG-10 — Preview, revisions, approval and release:** non-production preview; versioned defect/change requests; approval bound to exact release/commit; release/rollback manifest.
- [ ] **ENG-11 — n8n orchestration:** triggers, notifications and external workflow integration only; durable state remains in engine DB.
- [ ] **ENG-12 — Controlled deployment and post-deploy verification:** explicit target, version-bound approval, migration gate, backup/rollback, domain/TLS/health/data-access checks; no autonomous production deployment without approval.
- [ ] **ENG-13 — Security/failure acceptance suite and non-production pilot:** isolation, core-db denial from worker, tenant/data boundaries, secret redaction, spend/retry caps, destructive-action rejection, recovery and pilot acceptance.

## Completion policy
Do not mark runtime, database integration, preview, or deployment complete from code presence or mocks alone. Require automated tests and environment evidence. Do not repeat completed tasks without a concrete failure and a new scoped corrective task.
