# Phase 1 — Environment Inspection Evidence (Partial)

**Assessment date:** 2026-11-07  
**Repository:** atshpana/atsh-ai-v2  
**Status:** INCOMPLETE — live infrastructure evidence unavailable through the connected GitHub access  
**Decision:** Not ready to authorize build/runtime changes under architecture v1.1.

This report records only evidence actually available from repository and GitHub inspection. It does not infer live Coolify, server, database, n8n, Worker, network, backup, or secret state from documentation or Dockerfiles.

## 1. Evidence classification

- **Verified:** directly returned by repository/GitHub inspection in this assessment.
- **Owner-confirmed:** previously confirmed by the owner; not independently tested here.
- **Unknown / inaccessible:** cannot be verified with current connected access.
- **Not present in inspected source:** no implementation or configuration evidence found in the inspected paths; does not prove absence from the live server.

## 2. Phase 0 — protection prerequisites

| Item | Evidence | Status |
|---|---|---|
| Coolify readiness | Owner previously confirmed preparation complete; no Coolify connector/API/SSH access is available in this session | Owner-confirmed; live state unverified |
| GitHub readiness | Repository atshpana/atsh-ai-v2 is accessible; repository metadata reports default branch main; current PRs and commits are inspectable | Partially verified |
| Existing database and backup preparation | Owner previously confirmed preparation complete; no database or backup access is available to independently verify integrity or restoration | Owner-confirmed; backup/restore unverified |
| Sanitized staging copy | No live database access or staging evidence available | Unknown |
| Existing OpenAI key in Coolify | Owner previously confirmed key preparation; secret value intentionally not accessed; cannot verify variable presence/scope in Coolify | Owner-confirmed; live scope unverified |

No backup, restore, staging database, production database, secret, or server setting was changed.

## 3. Phase 1 — repository and GitHub evidence

### 3.1 Repository
- Repository: atshpana/atsh-ai-v2.
- Default branch reported by GitHub: main.
- Review branches and PRs observed: feat/worker-sandbox-contract, docs/production-line-mission-v2, docs/hai-gap-matrix-v1.
- PR #32 remains open and unmerged; PR #33 and PR #34 are documentation review requests and remain unmerged.
- The connected GitHub integration has repository push/admin permissions. This describes the connected integration, not the production-line Worker's runtime token or permissions.

### 3.2 Branch protections and rules
- Repository rulesets endpoint returned an empty list ([]) at inspection time.
- Branch protection endpoint for main returned HTTP 403 (resource not accessible by the integration).
- Therefore, branch protection on main is unknown; an empty rulesets list is not proof that all protection mechanisms are absent.
- Required follow-up: owner/admin must inspect branch protection and repository rules from GitHub settings or grant a read-only inspection path. Do not weaken protections.

### 3.3 CI and sandbox contract
- PR #32 head at inspection: 9a15f41e43edd4d6b30074d495d9eb66bb9b981b.
- The initial CI run failed TypeScript strict checking because the command executable array element could be undefined.
- The code was changed to use guarded optional access.
- Follow-up CI run 42336071140: TypeScript typecheck, build, and unit tests succeeded.
- CodeQL and Dependency Review checks for the same head succeeded.
- This validates the sandbox policy contract and repository checks only. It does not prove a concrete container/microVM backend, network isolation, resource enforcement, or execution safety.

### 3.4 Worker image and runtime boundary
- Dockerfile.worker builds and runs the worker using node:22-bookworm-slim.
- The Dockerfile contains no sandbox runtime, no container orchestration boundary, no network policy, no resource policy, and no separate non-root execution setup for generated customer code.
- Worker README describes the service as a durable execution foundation and says the MVP cannot run tests, invoke n8n, or deploy.
- No customer-generated code execution should be enabled based on this image.

### 3.5 n8n integration
- apps/worker/N8N_INTEGRATION.md describes a draft-only adapter.
- Supported operations include workflow discovery/read, inactive draft create/update, and execution evidence listing.
- It deliberately does not activate workflows, create credentials, install packages, or deploy.
- Live n8n URL, version, connectivity, credential scope, workflow inventory, and executions remain unknown.

### 3.6 Database and schema
- Repository contains Prisma schema and migrations for engine jobs/tool plans.
- apps/api/.env.example contains a placeholder development database URL only.
- These are repository artifacts, not evidence of a deployed database identity, live schema, grants, backup, or connectivity.
- No production DB connection was attempted. No db pull, db push, migration, reset, or write was performed.
- Actual core-db, agent-db, and any other server DB names, owners, schemas, grants, network routes, and approvals table state remain unknown.

## 4. Material documentation conflict discovered

The historical docs/PHASE_0_AUDIT.md on implementation/bootstrap states that the legacy database is excluded and that the new application database is provisioned independently. This conflicts with the higher-priority fixed execution reference v2.0 and production-line architecture v1.1, which require preserving the existing production database (core-db) and safely discovering/integrating with it.

Apply the documented reference hierarchy: the fixed execution reference v2.0 and HAI master govern; architecture v1.1 provides the operational details. The historical Phase 0 audit must not be used to authorize replacing, ignoring, or recreating the existing production database. Record and reconcile this stale document through a reviewed documentation change before using it as an execution instruction.

## 5. Items still requiring safe evidence

| Area | Missing evidence |
|---|---|
| Coolify | Service list/status/version, app-to-domain bindings, environment-variable names/scopes, networks, deployment history |
| Worker | Actual deployed image/commit, runtime user, mounts, capabilities, network routes, limits, logs with secrets redacted |
| n8n | Live version, workflows, active/inactive states, credential references, webhook/auth configuration, execution history |
| Databases | Actual database inventory, owners, schemas, relations, grants, backup status, sanitized staging copy, restore evidence |
| GitHub | main branch protection and ruleset details; Actions/repository permissions; worker-specific token scopes |
| Network | Firewall, service routes, egress policy, proof that Worker cannot reach core-db, host services, Docker socket |
| Secrets | Presence and scope of required variables in runtime secret manager without reading or disclosing values |
| Approvals | Whether an approvals table exists, its schema/constraints, and whether approvals bind to exact commit/release |

## 6. Readiness decision

**NOT READY — PHASE 1 INCOMPLETE**

The repository-only evidence is sufficient to confirm the current software boundary and CI status. It is not sufficient to authorize a build against server resources, enable generated-code execution, or claim that the required production isolation/database boundaries exist.

Continue with non-runtime documentation and code review only. Before build/runtime implementation, complete the missing Phase 0/1 evidence through a safe read-only server inspection path and have the report reviewed/approved. No production write or destructive operation is authorized by this report.
