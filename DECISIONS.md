# ATSH AI Software Production Line — DECISIONS

## Binding target and scope
- This repository builds the ATSH AI Software Production Line, not the customer-facing ATSH AI platform itself.
- The production line's primary mission is to receive the approved HAI master file, extract and trace its requirements, build the ATSH AI platform, discover and safely integrate with approved databases/services already on the designated server, test it, produce a preview, process revisions, and prepare a controlled release.
- After approved deployment and handover, the ATSH AI platform is the system that receives and manages customer requests. The production line remains the controlled build/release mechanism for future changes.
- The detailed target lifecycle is recorded in `docs/ENGINE-EXECUTION-BASELINE.md`.

## Existing server database boundary
- Existing server databases must be discovered and their ownership/purpose understood before integration design.
- Do not assume they are disposable, replaceable, or all owned by ATSH AI.
- `agent-db` remains the durable source of truth for engine tasks/jobs/plans/checkpoints/approvals/audit events.
- The Build Worker must not receive unrestricted production database credentials or direct network access to `core-db`.
- ATSH AI application runtime data access is separate from the build sandbox and must use approved APIs or narrowly scoped least-privilege access.
- No destructive schema/data changes or production migrations without a reviewed plan, non-production validation, recovery plan, and explicit approval.

## Governance and security
- Owner confirms Coolify, GitHub, existing server database/backup, and existing OpenAI key preparation complete; do not repeat broad readiness checks.
- Use existing OpenAI key initially; inject at runtime, task-scoped and redacted. Never store secrets in Git/chat/logs.
- Every consequential approval must be persisted and tied to the exact release/version or commit SHA.
- One active task at a time; do not redo completed tasks without concrete evidence and a new scoped task.
- No merge to `main`, production migration, or production deployment without explicit version-specific approval and required safety gates.
- A working directory, command allowlist, timeout, or environment filtering alone is not a security sandbox; generated/customer-controlled code must not execute in the worker process or on the host.

## Verified implementation facts
- Durable queue/lease/retry/event/checkpoint foundation exists in worker source.
- Tool planner persists plans but is not a general executor.
- GitHub worker integration is read-only.
- PR #27 merged: per-job workspace and guarded create-only file writes.
- PR #30 merged: `workspace_write_file` exposed in worker tool loop; PR checks all passed.
- PR #32 is a sandbox contract/policy proposal only until CI is resolved and a concrete isolation backend is implemented and tested.

## Open technical decisions
- Concrete sandbox runtime and verified Coolify deployment support.
- Read-only database discovery mechanism and approved inventory scope.
- Database/API integration map after HAI requirements are extracted.
- Parent/child task graph schema and dispatch concurrency.
- Restricted GitHub write credential and PR lifecycle.
- Model/provider quality/cost evidence and spend limits.


## Coding-agent delegation — 2026-11-07
- Owner has delegated broad authority to a coding agent to select tools/dependencies, implement the production-line engine, perform final merge and production changes, and spend from the available prepaid/API balance until exhausted.
- Do not borrow, create credit, or create recurring/renewing commitments beyond available funds. Track usage and stop before funds are exhausted if safe continuation cannot be funded.
- Owner-confirmed Coolify, GitHub, existing DB/backup and OpenAI key preparation are accepted; do not repeat broad setup audits or ask for secrets/screenshots. Validate only a concrete failure or missing safety evidence needed for the next operation.
- Repository implementation and CI may proceed immediately. Generated/customer code execution requires a proven real sandbox; production-impacting changes require least-privilege, backup, tested rollback, health checks and audit evidence.
- Detailed assignment and acceptance criteria: `docs/CODING-AGENT-HANDOFF.md`.
