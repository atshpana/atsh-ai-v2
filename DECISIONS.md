# ATSH AI Engine — DECISIONS

## Binding decisions

### D-001 — Reference hierarchy
1. ATSH AI المرجع التنفيذي الثابت الشامل v2.0
2. ATSH AI المرجع الأم الشامل
3. ATSH AI مرجع معمارية خط الإنتاج والعقل المركزي v1.1
Higher-priority references prevail.

### D-002 — Infrastructure preparation
Owner-confirmed complete on 2026-11-07: Coolify, GitHub repo/branches/permissions, core-db/data/backup, and existing OpenAI key preparation. Do not repeat broad checks. This is owner attestation, not independent runtime verification.

### D-003 — Initial model provider
Use the owner's existing OpenAI key for initial implementation. Inject only at runtime from Coolify environment variables, with task-scoped access and redacted logs. Never store secrets in Git, code, chat, or logs. Long-term provider choice remains open pending evidence.

### D-004 — Production data boundary
Existing `core-db` is production business data. Build Worker must not access it. Engine state belongs in isolated `agent-db`. No production DB changes without explicit scoped authorization and safeguards.

### D-005 — Approval traceability
Every consequential approval is stored in `approvals` and linked to the exact release/version or commit SHA. Generic chat approval is not sufficient for production deployment.

### D-006 — Execution cadence
One active task at a time; do not redo completed work without concrete evidence and a new scoped corrective task.

## Code audit findings — 2026-11-07

### A-001 — Durable worker foundation exists
Current `implementation/bootstrap` source includes PostgreSQL queue claiming with `FOR UPDATE SKIP LOCKED`, leases, heartbeats, retries/backoff, event records, checkpoint persistence, and bounded model turns. Treat as existing implementation; do not recreate.

### A-002 — Tool planner is not an executor
`apps/worker/src/tool-orchestrator.ts` maintains capability metadata and produces persisted versioned plans. Its result explicitly states `executionAllowed: false`; it does not provision or invoke tools.

### A-003 — GitHub integration is read-only
Worker exposes `github_read_file` for allowlisted repository inspection. No verified GitHub write/commit/PR tool exists in the inspected worker tool loop.

### A-004 — Workspace writer is pending integration
PR #27 adds an isolated per-job workspace and guarded file-write primitive/tests. It remains draft/unmerged and is not referenced by the current worker tool loop. Do not count it as a delivered worker capability yet.

### A-005 — No verified task decomposition/dispatch
Inspected worker claims one job, runs its model loop, and finishes/requeues it. No verified parent-child task graph, dependency scheduler, bounded parallel dispatch, or result aggregation exists in this code path. Implement this after the worker can safely write files and execute bounded commands.

### A-006 — No verified end-to-end delivery pipeline
Build/test command execution, preview artifact production, client revision loop, version-bound approvals, and production deployment are not verified as implemented in the inspected worker path.

## Open decisions
- Exact task graph schema and concurrency limits, to be finalized in ENG-04 from actual agent-db migrations/schema.
- Command allowlist and sandbox technology, to be decided in ENG-03 with a strict security boundary.
- Model evaluation and spend limits based on representative task measurements.
- Exact preview/hosting integration, after build artifacts and approval gates exist.

## Change log
- 2026-11-07: Added execution baseline to correct engine repository.
- 2026-11-07: Audited worker source and historical PRs; marked verified foundations and identified workspace integration and task-dispatch gaps.
