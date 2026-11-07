# ATSH AI Engine — TASKS

**Execution rule:** one active task at a time. Do not start the next task until the current task is marked `تم` with evidence.

## Completed by owner confirmation

- [x] **PREP-01 — Coolify readiness checks** — Owner confirms services/settings are checked, configured, and recorded in project materials. No routine repetition.
- [x] **PREP-02 — GitHub readiness checks** — Owner confirms repository, branches, and permissions are checked, configured, and recorded. No routine repetition.
- [x] **PREP-03 — core-db and backup preparation** — Owner confirms database/data and backup preparation is complete and recorded. No routine repetition.
- [x] **PREP-04 — OpenAI key preparation** — Owner confirms the existing OpenAI key is prepared/configured. Never copy the secret into Git or chat.

> These are marked complete by explicit owner confirmation dated 2026-11-07; this checkbox does not claim an independent retest by this commit.

## Active implementation queue

- [ ] **ENG-01 — Establish repository governance baseline**
  - Confirm this baseline and reference hierarchy in repository docs.
  - Maintain `TASKS.md`, `PROGRESS.md`, and `DECISIONS.md`.
  - Acceptance: files committed on a feature branch; no secrets; no changes to production services or databases.
- [ ] **ENG-02 — Define engine domain model and job lifecycle**
  - Specify project, specification version, task, job, artifact, test result, approval, release, and audit event.
  - Define explicit state transitions, retry limits, cancellation, and failure handling.
  - Acceptance: reviewed schema/API contract and state-transition tests.
- [ ] **ENG-03 — Build the engine API skeleton**
  - NestJS modular structure, health endpoint, configuration validation, structured redacted logging.
  - Acceptance: builds and tests pass; no production DB connection.
- [ ] **ENG-04 — Implement isolated job runner contract**
  - Define bounded worker job input/output, timeout, retry policy, resource limits, and artifact handling.
  - Acceptance: deterministic test job runs in isolation; production core-db access is impossible.
- [ ] **ENG-05 — Implement first vertical slice**
  - Accept a sample specification, create a project/task record, enqueue one bounded job, collect result and audit trail.
  - Acceptance: end-to-end test on isolated development resources with no production data.
- [ ] **ENG-06 — GitHub branch/PR integration**
  - Create a work branch and draft PR through restricted credentials; no direct push to main and no merge permission for engine.
  - Acceptance: test repository PR created and linked to task.
- [ ] **ENG-07 — Model adapter using existing OpenAI key**
  - Runtime-only secret injection; task-scoped use, cost accounting, redacted logs.
  - Acceptance: controlled test call succeeds without secret leakage; cost/quality evidence recorded.
- [ ] **ENG-08 — n8n orchestration**
  - Trigger and notify through n8n; durable state remains in engine DB.
  - Acceptance: retry-safe workflow with idempotency and observable failure state.
- [ ] **ENG-09 — Preview, revision, approval, release gates**
  - Build preview artifacts, capture feedback, bind approval to exact commit/release.
  - Acceptance: deployment path refuses absent or mismatched approval.
- [ ] **ENG-10 — Security and failure acceptance suite**
  - Retry cap, spend cap, destructive-operation rejection, secret redaction, worker isolation.
  - Acceptance: automated tests demonstrate each required stop condition.
- [ ] **ENG-11 — Pilot project and controlled rollout**
  - Run a non-ATSH sample project, then ATSH staging only after acceptance and owner review.
  - Production remains gated by explicit version-specific approval.

## Reopening completed preparation

Do not reopen PREP-01..PREP-04 as broad checks. If a concrete implementation blocker proves one specific prerequisite is missing, create a new task with:
- exact failing step and evidence;
- smallest required corrective action;
- impact and rollback;
- owner action, if any.
