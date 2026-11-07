# ATSH AI Engine — PROGRESS

## Current status — 2026-11-07

**Repository:** `atshpana/atsh-ai-v2`  
**Base branch:** `implementation/bootstrap`  
**Latest completed change:** PR #30 merged at `78a2fd5ce6745e816668d7858bd8d984e3ee78a7`.

## Owner-confirmed prerequisites
Coolify, GitHub repo/branches/permissions, core-db/backup, and existing OpenAI key preparation are confirmed complete by the owner. These are not independently re-tested here and will not be broadly repeated.

## Completed
- PR #28: governance baseline.
- PR #29: task/progress/decision audit.
- PR #27: isolated per-job workspace writer primitive.
- PR #30: worker tool-loop integration for `workspace_write_file`.
- PR #30 CI: CI success, CodeQL success, Dependency Review success.
- Existing worker queue/lease/retry/event/checkpoint foundation and read-only GitHub inspection retained.

## Current technical boundary
The worker can now create new files in its per-job workspace. It still cannot safely execute build/test commands. Running customer-controlled scripts with `cwd=workspace` in the worker process would not isolate filesystem, network, credentials, or process resources; do not implement that shortcut.

## Active task
**ENG-03 — Design and implement a fail-closed sandbox execution adapter.**

First identify and validate a real OS/container sandbox boundary. Until then, only implement a strict policy/interface that refuses execution when no approved backend is configured.

## Not yet verified
- Build/test execution in an isolated runtime.
- Parent/child task graph and actual multi-worker dispatch/result aggregation.
- GitHub branch/commit/PR write integration.
- Full spec-to-preview-to-revision-to-version-bound-approval delivery.
- Live Coolify/DB runtime state.

## Safety
No production DB, service, secret, or deployment was changed in this update. No merge to main or production deployment.
