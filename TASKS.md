# ATSH AI Engine — TASKS

**Rule:** one active task at a time. Complete only with code, tests, and evidence.

## Completed prerequisites — owner-confirmed
- [x] PREP-01 Coolify readiness — owner-confirmed complete; no broad repeat.
- [x] PREP-02 GitHub readiness — owner-confirmed complete; no broad repeat.
- [x] PREP-03 core-db and backup preparation — owner-confirmed complete; no broad repeat.
- [x] PREP-04 existing OpenAI key preparation — owner-confirmed complete; never expose secret.

## Completed implementation — verified in repository
- [x] ENG-01 Repository governance baseline — PR #28 merged; commit `a26b8fe0ff9dca2d9c570fbe6d412fd58f798a09`.
- [x] ENG-BASE-01 Durable worker foundation — queue claim via PostgreSQL `FOR UPDATE SKIP LOCKED`, leases/heartbeats, retry/backoff, events, checkpoints, bounded model turns. Code presence verified; not a fresh live runtime test.
- [x] ENG-BASE-02 Persisted tool planning — versioned plans/events; planner is planning metadata and explicitly not an executor.
- [x] ENG-BASE-03 Read-only GitHub inspection — allowlisted reader, path validation, 1 MB cap, checkpoint persistence.
- [x] ENG-BASE-04 Per-job workspace primitive — PR #27 merged; isolated UUID workspace and guarded file creation.
- [x] ENG-02 Worker workspace-write integration — PR #30 merged; commit `78a2fd5ce6745e816668d7858bd8d984e3ee78a7`. CI, CodeQL, Dependency Review all succeeded for the PR head. Tool `workspace_write_file` is exposed in the worker loop and fails closed when `AGENT_WORKSPACE_ROOT` is absent.

## Active task
- [ ] **ENG-03 — Design and implement a fail-closed sandbox execution adapter**
  - First establish the actual isolation boundary available to the Build Worker. A working-directory change, command allowlist, timeout, or environment filtering alone is NOT OS isolation.
  - Do not execute customer-controlled package scripts or generated code in the worker process or on the host.
  - Define a sandbox contract with immutable job workspace mount, no production/core-db network or credentials, no host/docker socket, non-root UID, read-only base filesystem, bounded writable workspace/tmp, CPU/memory/PID/time/output limits, cancellation, and explicit network policy.
  - Implement policy validation and adapter interface first; fail closed when no approved sandbox backend is configured.
  - Acceptance: automated tests prove policy rejection and that no command is launched without a configured isolated backend; sandbox integration tests only after a real runtime boundary is identified and validated.

## Following tasks
- [ ] ENG-04 Durable task decomposition and dispatch — parent/child tasks, dependencies, concurrency caps, leases, retries, cancellation, result aggregation in agent-db.
- [ ] ENG-05 GitHub write/branch/PR integration — restricted credentials; feature branch and draft PR only; no merge permission.
- [ ] ENG-06 Specification intake — immutable spec version/hash, extracted requirements and acceptance traceability.
- [ ] ENG-07 OpenAI adapter and spend controls — runtime-only existing key, task-scoped use, redaction, accounting, caps.
- [ ] ENG-08 n8n orchestration — triggers/notifications only; durable state in engine DB.
- [ ] ENG-09 Preview/revisions/approvals/release gates — approval row linked to exact release/commit SHA.
- [ ] ENG-10 Security/failure acceptance suite — isolation, core-db denial, secret redaction, spend/retry caps, destructive-action rejection.
- [ ] ENG-11 Non-production pilot and controlled rollout — production remains gated by explicit version-specific approval.

## Completion policy
Do not mark runtime or deployment capabilities complete from code presence alone. Require tests and environment evidence. Do not repeat completed tasks without a concrete failure and a new scoped corrective task.
