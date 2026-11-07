# ATSH AI Engine — DECISIONS

## Binding
- Reference hierarchy: ATSH AI المرجع التنفيذي الثابت الشامل v2.0 > المرجع الأم الشامل > مرجع معمارية خط الإنتاج والعقل المركزي v1.1.
- Owner confirms Coolify, GitHub, core-db/backup, and existing OpenAI key preparation complete; do not repeat broad readiness checks.
- Use existing OpenAI key initially; runtime-only injection, task-scoped, redacted. Never store secrets in Git/chat/logs.
- Build Worker must not access production core-db. Engine state belongs in agent-db.
- Every consequential approval must be persisted in `approvals` and tied to exact release/version or commit SHA.
- One active task at a time; do not redo completed tasks without concrete evidence and a new scoped corrective task.

## Verified implementation decisions/findings
- Durable queue/lease/retry/event/checkpoint foundation exists in worker source.
- Tool planner persists plans but is not an executor.
- GitHub worker integration is read-only.
- PR #27 merged: isolated per-job workspace and guarded create-only file writes.
- PR #30 merged: `workspace_write_file` exposed in worker tool loop; PR checks all passed.
- Workspace writes are create-only (`wx`), capped at 1 MB, and reject absolute/traversal/reserved paths and symlink parents.

## Security decision — command execution
A command runner that merely sets `cwd` to the workspace, filters environment variables, or applies a timeout is not a security sandbox. Generated/customer-controlled code must not execute inside the worker process or on the host.
Before enabling commands, establish a real isolated runtime with non-root execution, no production/core-db connectivity or credentials, no host/docker socket, read-only base filesystem, bounded workspace/tmp, CPU/memory/PID/time/output limits, cancellation, and explicit network policy.
Until an approved backend is available and tested, execution must fail closed. The first ENG-03 deliverable is a policy/interface and tests proving no command launches without that backend.

## Open
- Actual sandbox runtime choice and availability, based on verified deployment capabilities.
- Parent/child task graph schema and dispatch concurrency.
- GitHub write credential scope and PR lifecycle.
- Model quality/cost evidence and spend limits.
