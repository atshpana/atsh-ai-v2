# ATSH AI Software Production Line — PROGRESS

## Current status — 2026-11-07

**Repository:** `atshpana/atsh-ai-v2`  
**Assessment branch:** `docs/hai-gap-matrix-v1`  
**Mission baseline:** `docs/ENGINE-EXECUTION-BASELINE.md`  
**Gap matrix:** `docs/HAI-PRODUCTION-LINE-GAP-MATRIX.md`  
**Phase 1 evidence:** `docs/PHASE-1-ENVIRONMENT-EVIDENCE.md` (partial; not a readiness approval)  
**Product audit:** `docs/HAI-APPLICATION-CONFORMANCE-AUDIT.md` (repository-source audit; not live deployment acceptance)  
**HAI requirement baseline:** `docs/HAI-REQUIREMENT-TRACEABILITY-BASELINE.md` (source-derived requirement IDs, scope, evidence status and acceptance gates)  
**Code/test evidence map:** `docs/HAI-CODE-TEST-EVIDENCE-MAP.md` (requirement families mapped to audited source paths and focused test evidence)

## Mission
Build a controlled software production line that receives the approved HAI master file, extracts and traces its requirements, builds the ATSH AI platform, discovers and safely integrates with approved existing server databases/services, tests the result, produces a preview, processes revisions, and prepares a gated release/deployment. The resulting ATSH AI platform — not the production-line engine — receives and manages customer requests after approved deployment.

## Owner-confirmed prerequisites
The owner confirms Coolify, GitHub repository/branches/permissions, existing server database/backup preparation, and the existing OpenAI key preparation are complete. This remains owner-confirmed preparation, not fresh independent evidence of live service state, backup restore, network isolation, or secret scope. Broad readiness checks will not be repeated; only missing evidence will be requested.

## Completed assessment
- GAP-01: reviewed the HAI master (v1.0), architecture v1.1 and repository evidence.
- Added `docs/HAI-PRODUCTION-LINE-GAP-MATRIX.md`.
- Updated `TASKS.md` with the assessment result, explicit Phase 0/1 gate, and separate product-conformance audit.
- The assessment distinguishes production-line capability from ATSH AI application completeness. The repository contains public-web, admin, API and customer-portal workspaces and product documentation; their complete conformance to HAI has not yet been established.

## Verified implementation foundation
- PR #28: repository governance baseline.
- PR #29: task/progress/decision audit.
- PR #27: per-job workspace writer primitive.
- PR #30: worker tool-loop integration for `workspace_write_file`.
- PR #30 CI, CodeQL, Dependency Review: success for that PR head.
- Worker queue/lease/retry/event/checkpoint foundation and read-only GitHub inspection retained.
- PR #32 merged into implementation/bootstrap at commit `ebeabf4de468783d0cc7fc68b0738abc17d4054b` after all required checks passed. It adds a fail-closed sandbox contract only; no concrete runtime backend. PR #33 validation completed successfully: CI typecheck/build/unit tests, CodeQL and Dependency Review all passed on head `2ec0b9bc7300f2157d3471149845b6b573de897b`. PR #34 CI run `42337871439` completed successfully on the latest traceability/documentation head; its `validate` job passed Prisma schema validation, Prisma client generation, migration preview generation (not applied), typecheck, build and unit tests. This is repository CI evidence only.

## Current technical boundary
The worker can create new files in a per-job workspace. It does not yet have a proven isolated command/build/test runtime. Running generated/customer-controlled scripts with only `cwd=workspace`, an allowlist, timeout, or environment filtering is not OS isolation and is prohibited.

## ENG-03 — sandbox implementation in progress
- Added `apps/worker/src/docker-sandbox.ts`: Docker Engine API client using HTTPS/mTLS; pinned daemon ID, dedicated-daemon label, Linux/rootless and cgroup capability checks; immutable image requirement; per-command container creation and inspection; UID 65532; dropped capabilities; no-new-privileges; read-only root; no network, device, host bind, port, or extra mount; private PID/UTS/cgroup namespaces; 1 CPU / 512 MiB / 128 PID caps; bounded workspace and `/tmp` tmpfs; bounded local logs; command timeout, AbortSignal cancellation and forced container cleanup. Inspection verifies the effective command and exactly two writable tmpfs mounts before start.
- Added `apps/worker/src/sandbox-archive.ts`: bounded workspace tar transfer; `.env*`, `.git`, and `node_modules` exclusion; symlink/special-file/traversal rejection; safe output synchronization.
- Updated the worker tool loop so `sandbox_run_command` is added only when all sandbox runtime settings exist and the configured daemon passes preflight. Current environment has no sandbox settings, so the model receives no command tool. The worker does not receive Docker socket access; generated/customer-controlled code still has not run.
- Added `Dockerfile.sandbox`, `apps/worker/REAL_SANDBOX.md`, unit tests, an opt-in real-runtime acceptance test, and `.github/workflows/sandbox-integration.yml`. The CI test daemon is disposable and rootless; the worker reaches it only through a local mTLS test proxy.
- Local checks: temporary Node 24 type-stripping harness ran 15 worker sandbox/contract tests: **14 passed, 1 skipped** (real Docker integration skipped because no daemon endpoint was configured). `node --check apps/worker/scripts/docker-mtls-proxy.mjs`, `node --check apps/worker/src/agent-runner.ts`, and `git diff --check` passed.
- `npm run typecheck --workspace @atsh/worker` was attempted but failed because `tsc` is not installed. `npm install --workspace @atsh/worker --include-workspace-root --ignore-scripts --no-audit --no-fund --package-lock=false` stalled without registry output in the restricted network and was stopped; no lockfile or dependency declarations changed. `docker version` found no local Windows Docker daemon, and Podman is not installed.
- First GitHub CI run on head `4ae47660b4f554c0003efbb2d340f8ed48280eef` caught two TypeScript issues: an omitted `DeviceRequests` container-spec field and an exit status not narrowed from `number | undefined`. Both were corrected; follow-up CI and the real rootless Docker acceptance are pending. CodeQL and Dependency Review passed on the first head.
- ENG-03 remains open. The actual Docker Engine acceptance test, standard TypeScript/build/unit CI, selected Coolify runtime support, and deployment-side daemon/network evidence remain unverified. No generated code or package script has been permitted to execute in the deployed Worker.

PR #32 CI run `42335451638` exposed TS2532 in `sandbox-contract.ts`. The unsafe array access was guarded in commit `9a15f41e43edd4d6b30074d495d9eb66bb9b981b`. Follow-up CI run `42336071140` passed TypeScript typecheck, build, and unit tests; CodeQL and Dependency Review also passed for this head. This validates the contract change only. It does not prove a concrete sandbox backend or safe execution of generated code.

## Mandatory environment gate
Architecture v1.1 requires Phase 0 protection and a documented Phase 1 environment report before build or architectural implementation. A partial report is recorded in `docs/PHASE-1-ENVIRONMENT-EVIDENCE.md`. GitHub repository metadata and CI were inspected; rulesets returned empty, but branch protection could not be read (403), so protection status remains unknown. Dockerfile.worker is a standard Node runtime image, not a sandbox. The n8n adapter is draft-only. Coolify, live Worker/n8n state, database metadata/ownership, backup/restore, sanitized staging, secret scope, network isolation and approvals schema remain unverified. A historical `docs/PHASE_0_AUDIT.md` on implementation/bootstrap conflicts with the higher-priority requirement to preserve and safely integrate the existing production database; it must not govern execution. No production writes were made.

## HAI product conformance audit — initial source audit completed
The audit at `docs/HAI-APPLICATION-CONFORMANCE-AUDIT.md` inspected the public web, admin, customer portal, API, security primitives and Prisma schema at the recorded implementation/bootstrap commit. It confirms meaningful UI and schema foundations, but not an operational product: public content/catalog are hard-coded; the 15 admin workspaces are scaffold routes; customer and request actions are disabled; API AppModule registers only HealthController; the global permission guard has no demonstrated authentication/session principal provider; portal workflows are incomplete/unverified. The audit also identifies a material conflict: README.md and docs/PHASE_0_AUDIT.md describe a greenfield reset excluding the existing database, while the approved fixed reference, HAI and architecture require inspection/preservation of current structure and protection of core-db. No database operation was performed.

## HAI requirement extraction
Created `docs/HAI-REQUIREMENT-TRACEABILITY-BASELINE.md` from the fixed executive reference v2.0, HAI master and architecture v1.1 in their governing order. It records PUB-01…PUB-16, ADM-01…ADM-20, roles, order states, API contracts, data integrity rules, expanded product module IDs (CRM/SAL/WF/AI/TEAM/DSN/CP/CPS/CAI/SUP/HST/FIN/REV), production-line gates, acceptance requirements and current evidence classifications. This is a documentation extraction, not automated HAI intake or proof of implementation.

## HAI-to-ATSH AI lifecycle — not yet complete
- Immutable HAI intake/version/hash and automated requirement extraction/traceability: not implemented.
- Existing server metadata discovery and HAI-to-live-schema mapping: not verified.
- Real isolated build/test execution: blocked pending concrete backend.
- Durable parent/child task graph and bounded dispatch: not verified.
- GitHub branch/commit/PR write lifecycle from the engine: not verified.
- Preview artifacts, revision management, and version-bound approval: not implemented end-to-end.
- Controlled deployment and post-deploy verification: not implemented end-to-end.
- ATSH AI platform operational handover/customer request intake: not yet delivered by this production line.

## Next sequence
1. Complete ENG-03 repository typecheck/build/unit CI and run its real-runtime acceptance workflow. Keep the model command tool disabled in deployed Worker configuration until that test passes against the selected dedicated daemon.
2. Close only residual GATE-01 evidence: actual isolated daemon identity/network separation, least-privilege `agent-db` target, and backup/rollback evidence before any production-impacting operation. Phase 1 remains INCOMPLETE — NOT READY; broad setup checks are complete and will not be repeated.
3. After ENG-03 acceptance and the relevant GATE-01 evidence review, continue in order with automated immutable HAI intake (ENG-04) and read-only existing-database discovery (ENG-05).
4. Continue task graph, restricted GitHub write lifecycle, spend controls, isolated build/test evidence, preview, revisions, exact-version approvals, n8n integration, and release gates.
5. Keep the ATSH AI customer product separate from this factory implementation and keep all unverified requirement/evidence links open.

## Safety
No production database, schema, service, secret, merge to `main`, or deployment was changed by this assessment. PRs remain review-only.


## Latest PR validation snapshot
- PR #34 head `8d489139ccb913bc8052e43d2d18b1d25b0b7a5a`: CI run `42337871439` — **success**; validation job passed all steps, including schema validation, client generation, non-applied migration preview, typecheck, build and unit tests.
- PR #33 head `2ec0b9bc7300f2157d3471149845b6b573de897b`: CI, CodeQL and Dependency Review — **success**.
- PR #33 and PR #34 remain open and unmerged. No merge authorization is inferred from passing checks.


## Source-to-test evidence mapping
Added `docs/HAI-CODE-TEST-EVIDENCE-MAP.md` at commit `1d93867641a38e6f29e3ad5ebc5788489f35b574`. It maps production-line and product requirement families to concrete source paths and available focused tests at audited revision `ebeabf4de468783d0cc7fc68b0738abc17d4054b`. It explicitly distinguishes UI scaffolds, schema foundations, unit-tested primitives, missing end-to-end workflows and unverified live runtime facts. This does not close HAI requirements or satisfy GATE-01.


## Direct coding-agent handoff — 2026-11-07
- Added `docs/CODING-AGENT-HANDOFF.md` as the executable assignment for a coding agent to complete the production-line engine in this repository.
- Owner confirms Coolify, GitHub, database/backup preparation and OpenAI key preparation are complete; the owner updated the existing Worker `OPENAI_API_KEY` and observed a successful Coolify rolling update followed by `ATSH AI agent worker started` in runtime logs. These are owner-observed operational facts, not proof of a successful model request or coding task.
- No repeated environment-variable/key setup is requested. The configured `OPENAI_MODEL` shown by the owner was `gpt-6.1-sol`; agent must verify it with a minimal API call and correct only if an actual API error demonstrates it is invalid.
- Verified implementation baseline remains unchanged: durable queue/leases/retries/events/checkpoints, persisted planning, read-only GitHub inspection, per-job workspace and workspace file-write integration. Sandbox PR #32 is contract-only; no concrete isolated execution backend exists yet.
- Immediate delegated implementation target: ENG-03 concrete fail-closed sandbox. Continue ENG-04 automated immutable HAI intake, ENG-05 safe DB discovery, ENG-06 task graph/dispatch, ENG-07 GitHub write/PR lifecycle, ENG-08 model adapter/spend accounting, ENG-09 isolated build/test, ENG-10 preview/revisions/approval, ENG-11 n8n orchestration, ENG-12 controlled release/deployment and ENG-13 security/pilot.
- GATE-01 is narrowed to missing safety evidence only. Repository implementation and CI may proceed now; generated/customer code execution and production-impacting operations remain gated on concrete isolation, least privilege, backup/rollback and release acceptance.
- The owner delegated tool/dependency selection, implementation, final merge and production-change authority, and spending from available prepaid/API balance until exhausted. No borrowing or commitments beyond available funds. Apply the safeguards in the handoff.
- This handoff change does not itself implement the sandbox or launch a coding agent process. It records the immediate assignment for the connected coding-agent environment.
