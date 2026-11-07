# ATSH AI Engine — TASKS

**Execution rule:** one active task at a time. Do not start the next task until the current task is marked `تم` with evidence.

## Completed prerequisites — owner-confirmed

- [x] **PREP-01 — Coolify readiness** — Owner confirms services/settings are checked, configured, and recorded.
- [x] **PREP-02 — GitHub readiness** — Owner confirms repository, branches, and permissions are checked, configured, and recorded.
- [x] **PREP-03 — core-db and backup preparation** — Owner confirms data and backup preparation is complete and recorded.
- [x] **PREP-04 — OpenAI key preparation** — Owner confirms existing key is prepared/configured. Never place the secret in Git or chat.

These four items are complete by explicit owner confirmation (2026-11-07), not by an independent live retest in this commit. Do not repeat broad readiness checks.

## Completed repository work — verified

- [x] **ENG-01 — Establish repository governance baseline** — Merged via PR #28, commit `a26b8fe0ff9dca2d9c570fbe6d412fd58f798a09`. Files: `docs/ENGINE-EXECUTION-BASELINE.md`, `TASKS.md`, `PROGRESS.md`, `DECISIONS.md`.
- [x] **ENG-BASE-01 — Durable worker foundation** — Present in current branch: PostgreSQL job claim with `FOR UPDATE SKIP LOCKED`, leases/heartbeats, retry/backoff, job event records, checkpoint persistence, bounded model turns, and graceful shutdown. Historical PRs #16 and #20–#26 include worker/checkpoint/read-loop fixes. This is a code-presence finding, not a fresh runtime test.
- [x] **ENG-BASE-02 — Tool planning persistence** — Present: capability registry/planner and versioned `agent_tool_plans` plus plan events. Planner explicitly returns `executionAllowed: false`; it is planning metadata, not a tool executor.
- [x] **ENG-BASE-03 — Read-only GitHub inspection** — Present: allowlisted GitHub repository/file reader with path validation and a 1 MB full-file limit; checkpoint retains inspected files.
- [x] **ENG-BASE-04 — Workspace file-write primitive (unmerged)** — PR #27 adds per-job workspace creation, guarded UTF-8 file writes, traversal/reserved-path/symlink/overwrite/size checks and tests. It remains a draft PR and is not in `implementation/bootstrap`; do not count it as integrated engine capability.

## Active implementation queue

- [ ] **ENG-02 — Integrate isolated workspace writing into the worker tool loop**
  - Review PR #27, address any issues, and wire a narrowly scoped `workspace_write_file` tool to the per-job workspace.
  - Validate the job ID, workspace root, allowed paths, byte limits, and idempotent/resume behavior.
  - Acceptance: tests prove normal writes and rejection of traversal, symlinks, reserved paths, overwrites, and oversized content; worker build/typecheck/tests pass; tool writes only inside its assigned job directory.
- [ ] **ENG-03 — Add a bounded command/build/test executor**
  - Execute commands only inside the assigned workspace, with explicit allowlist, timeout, output cap, environment allowlist, process/resource limits, and cancellation.
  - No privileged shell, host filesystem access, Docker socket, production credentials, or core-db network access.
  - Acceptance: deterministic fixture build/test succeeds; forbidden commands, timeout, output overflow, and path escape fail closed.
- [ ] **ENG-04 — Implement durable task decomposition and dispatch**
  - Define parent/child tasks, dependencies, worker leases, concurrency caps, priorities, cancellation, retries, and result aggregation using `agent-db`.
  - A coordinator decomposes a brief into bounded tasks; independent tasks may be dispatched concurrently; dependent tasks wait for prerequisites.
  - Acceptance: integration tests demonstrate parallel independent children, dependency blocking, retry isolation, lease recovery, cancellation, and deterministic parent completion. Do not claim distribution from a single worker polling one shared job queue.
- [ ] **ENG-05 — Implement GitHub write/branch/PR integration**
  - Restricted installation/token permissions; create feature branch and commit workspace output; open draft PR. No merge permission and no direct main push.
  - Acceptance: isolated test repository PR created and linked to job/artifact; secret redaction verified.
- [ ] **ENG-06 — Specification intake and project/task records**
  - Persist source specification, immutable version/hash, extracted requirements, constraints, acceptance criteria, and traceability to generated work.
  - Acceptance: sample spec intake round-trips without loss and every child task maps to requirement IDs.
- [ ] **ENG-07 — OpenAI model adapter and cost controls**
  - Use existing OpenAI key only from runtime environment; task-scoped exposure, model config, token/cost accounting, spend caps, retries and redaction.
  - Acceptance: controlled test succeeds without secret leakage; representative task quality/cost evidence recorded.
- [ ] **ENG-08 — n8n orchestration**
  - n8n triggers and notifications only; durable state stays in engine DB; idempotent webhook handling.
  - Acceptance: retry-safe workflow and observable failure state.
- [ ] **ENG-09 — Preview, revisions, approvals and release gates**
  - Build preview artifacts, capture client feedback, record approvals in `approvals` bound to exact commit/release SHA.
  - Acceptance: deployment path rejects missing or mismatched approval.
- [ ] **ENG-10 — Security and failure acceptance suite**
  - Worker isolation, core-db denial, secret redaction, spend cap, retry cap, destructive-action rejection, audit completeness.
  - Acceptance: automated tests prove every stop condition.
- [ ] **ENG-11 — Non-production pilot and controlled rollout**
  - Complete a non-ATSH sample project first; ATSH staging only after acceptance. Production remains gated by explicit version-specific approval.

## Reopening completed work

Do not redo completed tasks. If new evidence proves a specific gap, create a narrowly scoped corrective task with the failing step, evidence, impact, and rollback.
