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
- Concrete sandbox runtime implementation is a dedicated rootless Linux Docker Engine controlled over HTTPS/mTLS; verify actual Coolify-side support, isolated-daemon identity, and network placement before activation.
- Read-only database discovery mechanism and approved inventory scope.
- Database/API integration map after HAI requirements are extracted.
- Parent/child task graph schema and dispatch concurrency.
- Restricted GitHub write credential and PR lifecycle.
- Model/provider quality/cost evidence and spend limits.

## ENG-03 sandbox backend decision — 2026-11-07
- Implement the backend against the Docker Engine API over HTTPS/mTLS, with a pinned daemon ID, the `atsh.sandbox=true` daemon label, Linux/rootless mode, and cgroup limit support. Do not use the Coolify host daemon or mount its Docker socket into the Worker.
- Run one disposable, non-root container per command from an immutable image digest. Enforce `NetworkMode=none`, disabled IPC, private PID/UTS/cgroup namespaces, read-only root, no host bind/device/port mounts, UID 65532, dropped capabilities, no-new-privileges, exactly two bounded tmpfs mounts, CPU/memory/PID/time/output limits, cancellation and cleanup. Inspect effective settings and reject deviations before start.
- The sandbox receives no credentials and no network access. Package installation that requires a registry is not enabled; ENG-09 must use an approved artifact cache or a separately reviewed allowlist policy.
- The Worker adds `sandbox_run_command` only after complete runtime configuration and daemon preflight. Sandbox variables are currently absent, and local Docker is unavailable; therefore this conditional path has not run against the deployed Worker. Do not treat ENG-03 as accepted until the real-runtime integration workflow and deployment-side GATE-01 evidence pass.
- No paid npm package or sandbox-runtime subscription was introduced; the Docker Engine client uses Node built-ins. The integration job uses the repository's existing GitHub Actions configuration and its existing usage quota.

## Rootless CI runner compatibility — 2026-11-07
- The ephemeral GitHub Actions Ubuntu runner logged RootlessKit `fork/exec /proc/self/exe: operation not permitted`; the official Rootless Containers guidance documents this AppArmor/user-namespace failure for Ubuntu 24.04+ with RootlessKit at `/usr/local/bin/rootlesskit` (https://rootlesscontaine.rs/getting-started/common/apparmor/).
- Apply the documented executable-specific AppArmor profile only on the disposable CI runner so the real rootless-daemon acceptance test can start. Do not copy this CI workaround to Coolify or treat it as evidence that the deployment daemon is isolated. The integration test remains the acceptance gate.


## Coding-agent delegation — 2026-11-07
- Owner has delegated broad authority to a coding agent to select tools/dependencies, implement the production-line engine, perform final merge and production changes, and spend from the available prepaid/API balance until exhausted.
- Do not borrow, create credit, or create recurring/renewing commitments beyond available funds. Track usage and stop before funds are exhausted if safe continuation cannot be funded.
- Owner-confirmed Coolify, GitHub, existing DB/backup and OpenAI key preparation are accepted; do not repeat broad setup audits or ask for secrets/screenshots. Validate only a concrete failure or missing safety evidence needed for the next operation.
- Repository implementation and CI may proceed immediately. Generated/customer code execution requires a proven real sandbox; production-impacting changes require least-privilege, backup, tested rollback, health checks and audit evidence.
- Detailed assignment and acceptance criteria: `docs/CODING-AGENT-HANDOFF.md`.
