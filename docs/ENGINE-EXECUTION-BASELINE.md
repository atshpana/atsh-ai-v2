# ATSH AI Engine — Execution Baseline

**Status:** Active execution baseline  
**Repository:** `atshpana/atsh-ai-v2`  
**Branch:** `docs/engine-execution-baseline`  
**Recorded:** 2026-11-07

## 1. Authority and reference order

1. `ATSH AI المرجع التنفيذي الثابت الشامل v2.0` — highest authority.
2. `ATSH AI المرجع الأم الشامل`.
3. `ATSH AI – مرجع معمارية خط الإنتاج والعقل المركزي v1.1` — operational and architecture detail, subordinate to the two references above.

If references conflict, the higher-ranked reference governs. This file records execution status and does not override approved architecture or higher-level requirements.

## 2. Owner-confirmed completed prerequisites

The owner explicitly confirms that the following preparation and checks have already been completed, saved, and configured in the project environment and prior project records:

- Coolify services and settings inspection/configuration.
- GitHub repository, branches, and permissions inspection/configuration.
- `core-db` data/schema and backup preparation.
- Existing OpenAI API key preparation/configuration.

**Execution treatment:** Do not restart these checks or ask the owner to repeat them as routine prerequisites. Treat them as owner-confirmed complete for purposes of moving the project forward. If a later concrete implementation step reveals a specific missing dependency, open one narrowly scoped task with the exact evidence; do not reopen the entire preparation stage.

This status is based on the owner's explicit confirmation on 2026-11-07. It is not a claim that this commit independently re-tested those systems.

## 3. Immediate execution direction

Proceed to practical construction of the software-production engine. Do not spend further cycles repeating completed infrastructure checks.

The next work is repository-level implementation preparation and the first executable vertical slice, following the approved references:
1. Preserve the current repository contents and work on a feature branch / pull request.
2. Establish the governance and execution files (`TASKS.md`, `PROGRESS.md`, `DECISIONS.md`).
3. Implement the engine incrementally, one task at a time, with acceptance evidence.
4. Keep the existing ATSH production database (`core-db`) protected; the Build Worker must not access it.
5. Use the existing OpenAI key as the initial model provider, injected only at runtime from Coolify environment variables when a task requires it. Never place secrets in Git, code, chat, or logs.
6. Keep model-provider selection open for later evidence-based evaluation; record quality, adherence, latency, and cost observations in `DECISIONS.md`.
7. Require every consequential approval to be recorded in `approvals` and linked to the exact release/version or commit SHA. Do not infer production approval from a generic chat message.
8. Do not merge to `main` or deploy to production without the required explicit, version-specific approval and the safeguards required by the highest-priority reference.

## 4. Architecture guardrails

- Next.js + NestJS + TypeScript, Modular Monolith, subject to the approved primary references.
- PostgreSQL / Prisma only in accordance with the inspected and approved database plan.
- `n8n` is orchestration, integration, and notification infrastructure; it is not the business source of truth.
- A separate, isolated Build Worker executes bounded build/test jobs.
- `agent-db` owns engine state, tasks, jobs, and audit records; `core-db` remains the existing ATSH production database.
- The Worker must have no network path or credentials to production `core-db`.
- All code changes are reviewed through branches and pull requests. The engine must not directly merge to `main`.

## 5. Working protocol

- One active task at a time.
- A task is complete only when its stated acceptance criteria and evidence are recorded.
- Never redo a task already marked complete without a specific documented reason and a new scoped task.
- Distinguish owner-confirmed prerequisites from independently verified implementation.
- Never report a service, table, workflow, test, or deployment as implemented unless verified.
- If owner action is required, provide exact screen-by-screen instructions and never request secrets in chat.

## 6. Immediate next milestone

Start with the first concrete implementation task in `TASKS.md`: establish the repository's engine governance and implementation skeleton on this feature branch, then proceed to the smallest end-to-end engine slice. Do not return to generic infrastructure re-checks.
