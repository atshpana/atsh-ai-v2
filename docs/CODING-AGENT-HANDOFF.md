# Coding Agent Handoff — Complete the ATSH AI Production Line

**Status:** ACTIVE ASSIGNMENT  
**Repository:** `atshpana/atsh-ai-v2`  
**Base branch:** `implementation/bootstrap`  
**Working branch:** `agent/production-line-handoff`  
**Assignment date:** 2026-11-07  
**Owner authorization:** The owner has delegated broad execution authority to the coding agent, including tool/dependency selection, code changes, final merge, and production changes, with spending permitted only from the available prepaid/API balance until exhausted. No borrowing, credit, or commitments beyond available funds.

## 1. Mission — do not confuse the two products

You are being assigned to build and complete the **ATSH AI Software Production Line itself** (the factory/engine). You are NOT being asked to implement the customer-facing ATSH AI platform in this assignment.

The factory must ultimately accept the approved HAI master specification, extract and trace requirements, plan and implement the ATSH AI platform, safely discover/integrate approved existing server databases and services, build/test in an isolated environment, produce previews, process revisions, obtain version-bound approvals, and release/deploy the approved product. The ATSH AI platform that the factory will later build is the system that receives/manages customer requests.

## 2. Current state — use this as the handoff baseline

### Owner-confirmed environment preparation (do not repeat broad setup checks)
The owner explicitly confirms that the following preparation is complete:
- Coolify/server setup and the relevant services are prepared.
- GitHub repository and access are prepared.
- Existing server database and backup preparation are complete.
- An OpenAI API key has been prepared.
- The owner has updated the existing Worker `OPENAI_API_KEY` environment variable with the newly created dedicated key; the secret must never be requested, printed, logged, committed, or copied into artifacts.
- Worker configuration already contains `OPENAI_MODEL` (owner showed `gpt-6.1-sol`), `DATABASE_URL`, `GITHUB_TOKEN`, and `ATSH_GITHUB_REPOSITORY`. Do not add duplicates or ask the owner to re-enter values.
- Coolify performed a rolling update; logs showed `ATSH AI agent worker started`. This proves the worker process started, **not** that an LLM request or coding task succeeded.

Treat these as owner-confirmed facts. Do not send the owner back through API-key creation, environment-variable review, Coolify setup, or repeated screenshots. If a technical test later proves a specific setting is wrong, report the exact failing evidence and request only the minimum corrective action.

### Verified repository implementation already present
- Durable PostgreSQL worker queue foundation: `FOR UPDATE SKIP LOCKED`, leases/heartbeats, retry/backoff, job events, checkpoints, bounded model turns.
- Persisted/versioned tool planning and plan events. This is planning metadata, not a general-purpose tool executor.
- Read-only GitHub inspection with allowlisting, path validation and size cap.
- Per-job workspace primitive and guarded create-only file writes.
- Worker tool-loop integration for workspace file creation.
- PR #32 sandbox contract/policy adapter merged to `implementation/bootstrap`; it is a contract only, **not** a concrete isolation runtime.
- Repository CI evidence exists for earlier baseline changes (typecheck/build/unit tests; CodeQL and Dependency Review passed on recorded PR heads). Re-run checks for every new change; historical CI is not evidence for new commits.

### Actual operational boundary
- Coolify Worker process has started after the owner updated its existing environment variable.
- No successful OpenAI API request from the deployed Worker has yet been evidenced in this handoff.
- No end-to-end coding task has been evidenced.
- No concrete OS/container sandbox backend has been implemented and proven.
- Do not infer a working agent from a running Worker container.

## 3. Work still required — execute, do not merely restate

Follow the existing task identifiers in `TASKS.md`, `PROGRESS.md`, `DECISIONS.md`, and `docs/ENGINE-EXECUTION-BASELINE.md`. Keep these open until implementation, tests and evidence exist:

1. **GATE-01 (narrow residual evidence only):** Do not repeat completed owner setup. Resolve only the missing safety evidence necessary to operate the build runtime: concrete sandbox/network boundary, actual database target/permissions as needed, backup/restore evidence if a production-impacting operation is planned, and release/rollback safeguards. Use read-only checks first. Do not block repository-only implementation and CI work on repeated owner setup questions.
2. **ENG-03 — concrete fail-closed sandbox:** select a supported isolation runtime; implement non-root execution, no host sockets or host/core-db network access, read-only root filesystem, bounded workspace/tmp writes, CPU/memory/PID/time/output limits, cancellation and explicit network policy. Prove isolation in integration tests. Until proven, generated/customer-controlled code and package scripts must not execute.
3. **ENG-04 — automated immutable HAI intake:** preserve source bytes, hash/version the source, extract requirements/screens/modules/roles/workflows/business rules/entities/integrations/acceptance criteria/questions, and maintain requirement-to-code/test/evidence traceability. Existing documentation baseline is completed; do not redo it.
4. **ENG-05 — safe existing DB discovery/integration:** read-only metadata inventory and ownership map; map HAI needs to existing structures; least-privilege APIs/views/access; migration and rollback design. Never recreate/replace existing databases or perform destructive writes.
5. **ENG-06 — task graph and dispatch:** parent/child tasks, dependencies, bounded concurrency, leases, retries, cancellation and result aggregation in `agent-db`.
6. **ENG-07 — GitHub lifecycle:** restricted token; feature branch, commits, draft PR, status/evidence capture. Never expose token. Use the repository and branch already designated.
7. **ENG-08 — model adapter and spend controls:** use the existing runtime-injected OpenAI key; verify the configured model through a real minimal API call; task-scoped calls, redaction, usage/cost accounting and hard stop at available balance. Do not assume the dashboard credit amount is an enforceable API hard cap; implement internal budgets and stop behavior.
8. **ENG-09 — isolated build/test pipeline:** install/build/lint/unit/API/integration/E2E and migration validation inside the sandbox; persist logs/artifacts tied to commit SHA.
9. **ENG-10 — preview/revisions/approval:** non-production preview, revision/change-request tracking, approval bound to exact commit/release.
10. **ENG-11 — n8n integration:** triggers, notifications and external workflow orchestration only; engine DB remains source of truth.
11. **ENG-12 — controlled release/deployment:** deployment manifest, target/version checks, migrations gate, backup/rollback, health/domain/TLS/data checks and post-deploy verification.
12. **ENG-13 — security and pilot acceptance:** prove isolation, core-db denial, tenant/data boundaries, secret redaction, spend/retry limits, cancellation, recovery and a non-production end-to-end pilot.

## 4. Immediate execution order

- Start from `implementation/bootstrap`; this handoff branch is based on it.
- Read the current code and task docs once. Do not redo completed implementation or documentation.
- First implementation objective: ENG-03 concrete sandbox backend, while resolving only the specific GATE-01 evidence needed to validate it.
- Create small, independently testable changes. Run relevant tests and all required CI/security checks. Record exact commands, results, commit SHAs and known gaps.
- After ENG-03 acceptance, proceed in the ordered sequence above. Keep `TASKS.md`, `PROGRESS.md`, and `DECISIONS.md` current as work proceeds.
- Do not claim success from configuration presence, a running container, mocks, or code presence alone.

## 5. Delegated authority and non-negotiable safeguards

The owner has explicitly authorized the agent to choose suitable tools/dependencies, implement changes, merge final changes and make production changes, and to spend from the available prepaid/API balance until it is exhausted.

Exercise that authority conservatively:
- Prefer existing infrastructure and free/open-source options; justify every paid dependency.
- Never borrow, create credit, or create recurring/renewing commitments that can exceed available prepaid funds. Track spend and stop before the available balance is exhausted or when the remaining balance cannot cover a safe completion step.
- Keep secrets in runtime secret stores only. Never put keys, tokens, passwords, private customer data or production connection strings in Git, prompts, logs or artifacts.
- No direct unrestricted `core-db` access from the Build Worker or sandbox. `agent-db` is the engine's durable source of truth.
- No generated/customer code execution outside the proven sandbox. Fail closed if isolation is unavailable.
- Back up before production-impacting changes; validate on non-production first; use staged rollout, health checks, rollback plan and audit trail.
- Preserve existing services and databases. No destructive migration, database replacement, or broad credential grants.
- Use feature branches and PRs; merge only after tests/security checks pass and evidence is recorded. Production changes are authorized in principle but must still satisfy the technical safeguards above.
- Report blockers with the exact missing permission/evidence and a minimal owner action. Do not ask the owner to repeat completed setup steps.

## 6. Definition of done

The production line is complete only when a non-production end-to-end pilot proves: HAI file intake and immutable traceability; task decomposition and bounded dispatch; isolated implementation/build/test; GitHub PR lifecycle; preview and revisions; approval bound to exact version; controlled release/deployment with rollback; auditability, secret safety and spend enforcement. Provide evidence and update all project status documents.

**Begin implementation immediately. Do not stop after writing another plan or audit.**
