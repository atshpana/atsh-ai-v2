# ATSH AI Software Production Line — PROGRESS

## Current status — 2026-11-07

**Repository:** `atshpana/atsh-ai-v2`  
**Review branch:** `docs/production-line-mission-v2`  
**Governing target:** `docs/ENGINE-EXECUTION-BASELINE.md`

## Mission
Build a controlled software production line that receives the HAI master file, builds the ATSH AI platform from it, discovers and safely integrates with approved databases/services already on the designated server, tests the result, produces a preview, processes revisions, and prepares a gated release/deployment. The resulting ATSH AI platform — not the production-line engine — will receive and manage customer requests after approved deployment.

## Owner-confirmed prerequisites
The owner confirms Coolify, GitHub repository/branches/permissions, existing server database/backup preparation, and the existing OpenAI key preparation are complete. This is owner-confirmed status, not a fresh independent runtime test. Do not repeat broad readiness checks.

## Verified implementation foundation
- PR #28: repository governance baseline.
- PR #29: task/progress/decision audit.
- PR #27: per-job workspace writer primitive.
- PR #30: worker tool-loop integration for `workspace_write_file`.
- PR #30 CI, CodeQL, Dependency Review: success for that PR head.
- Worker queue/lease/retry/event/checkpoint foundation and read-only GitHub inspection retained.

## Current technical boundary
The worker can create new files in a per-job workspace. It does not yet have a proven isolated command/build/test runtime. Running generated/customer-controlled scripts with only `cwd=workspace`, an allowlist, timeout, or environment filtering is not OS isolation and is prohibited.

PR #32 currently represents a sandbox contract/policy layer, not a concrete container/microVM backend. Its CI must be diagnosed and pass before the contract change is accepted; a passing contract still does not prove real sandbox execution.

## HAI-to-ATSH AI lifecycle — not yet complete
- HAI file intake/version/hash and requirement extraction/traceability: not implemented.
- Existing server database metadata discovery and HAI-to-schema integration mapping: not implemented.
- Real isolated build/test execution: not verified.
- Durable parent/child task graph and bounded dispatch: not verified.
- GitHub branch/commit/PR write lifecycle: not verified.
- Preview artifacts, revision management, and version-bound approval: not implemented end-to-end.
- Controlled deployment and post-deploy verification: not implemented end-to-end.
- ATSH AI platform operational handover/customer request intake: not yet delivered by this production line.

## Immediate next action
Review this proposed mission baseline against the HAI master reference, then perform a repository gap assessment requirement by requirement. Continue one scoped task at a time, starting with the concrete sandbox blocker and then HAI intake/database discovery in the order recorded in `TASKS.md`.

## Safety
No production database, schema, service, secret, merge to `main`, or deployment was changed by this documentation update.
