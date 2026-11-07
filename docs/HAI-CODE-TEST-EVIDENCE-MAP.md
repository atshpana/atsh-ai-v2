# HAI → Source / Test Evidence Map — v1

**Assessment date:** 2026-11-07  
**Audited source revision:** `ebeabf4de468783d0cc7fc68b0738abc17d4054b` (`implementation/bootstrap`)  
**Purpose:** extend the HAI requirement baseline with concrete repository paths and test evidence. This is a source-level map only; it does not prove live deployment, connected production data, or end-to-end acceptance.

## Evidence rules

- **Source present** means the cited code exists at the audited revision.
- **Unit-tested primitive** means a focused test exists for the cited primitive; it does not establish a full business workflow.
- **Scaffold / disconnected** means the UI explicitly declares itself unconnected or lacks a business API.
- **Not evidenced** means no implementation was identified in the inspected source paths; this is not proof that no implementation exists anywhere outside the audited revision.
- Runtime, database, identity-provider, network and deployment claims remain **unverified** unless supported by separate environment evidence.

## 1. Production-line engine

| Requirement family | Source evidence | Test evidence | Assessment / remaining proof |
|---|---|---|---|
| Durable worker / checkpoints | `apps/worker/src/agent-runner.ts`, `apps/worker/src/checkpoint-state.ts` | `apps/worker/src/checkpoint-state.test.ts` | Engine foundation present; test coverage is not proof of live worker, durable DB availability or multi-worker behavior. |
| Tool orchestration | `apps/worker/src/tool-orchestrator.ts` | `apps/worker/src/tool-orchestrator.test.ts` | Tool planning/orchestration primitives present; no complete HAI-to-product executor established. |
| Per-job workspace writes | `apps/worker/src/workspace-executor.ts` | `apps/worker/src/workspace-executor.test.ts` | Guarded workspace-write primitive present; not a sandbox and not permission to execute generated code. |
| Sandbox policy contract | `apps/worker/src/sandbox-contract.ts` | `apps/worker/src/sandbox-contract.test.ts` | Fail-closed contract and validation tests present. **No concrete SandboxBackend implementation was identified.** No generated code execution enabled. |
| n8n integration | `apps/worker/src/n8n-client.ts`, `apps/worker/N8N_INTEGRATION.md` | `apps/worker/src/n8n-client.test.ts` | Client and draft-only integration evidence; live credentials, workflows and connectivity unverified. |
| Worker runtime | `Dockerfile.worker`, `apps/worker/COOLIFY_DEPLOYMENT.md`, `apps/worker/README.md` | Repository CI only | Standard Node container build definition is not an OS sandbox. Live Coolify deployment and network policy remain unverified. |
| Immutable HAI intake and automated extraction | No intake/parser implementation identified in audited source | No HAI intake/extraction tests identified | Not implemented in audited source. Current requirement baseline is manual documentation extraction. |
| Durable parent/child task graph and bounded dispatch | Worker queue and lease primitives exist; no verified DAG scheduler/aggregator identified | No end-to-end DAG/parallel-dispatch acceptance suite identified | Partial foundation only. |
| GitHub branch/commit/PR write lifecycle | Read-only inspection and local workspace write primitives | No engine branch/commit/PR write acceptance tests identified | Not established. Restricted write credential and no-merge policy still required. |
| Preview/revisions/version-bound approvals/release | No complete engine lifecycle identified in audited source | No end-to-end lifecycle tests identified | Not implemented end-to-end. |

## 2. ATSH AI product surfaces

| HAI requirement family | Source evidence | Test evidence | Assessment / remaining proof |
|---|---|---|---|
| Public home | `apps/public-web/src/app/[locale]/page.tsx`, `apps/public-web/src/app/home-page.tsx` | No page-level acceptance tests identified in audited tree | UI source exists; verify content, localization, accessibility and production behavior separately. |
| Public service catalogue | `apps/public-web/src/app/service-catalog.ts`, `apps/public-web/src/app/[locale]/services/page.tsx` | No catalogue acceptance tests identified | Six bilingual hard-coded service definitions with client-side search/category/sort. Not a server-published catalogue or pricing engine. |
| Public service details | `apps/public-web/src/app/[locale]/services/[slug]/page.tsx` | No detail-flow acceptance tests identified | Static details; page explicitly avoids unapproved price estimates. No configurator/order funnel evidenced here. |
| Admin shell / module workspaces | `apps/admin/src/app/admin-shell.tsx`, `apps/admin/src/app/[module]/page.tsx` | No admin business-workflow tests identified | Module routes declare “وحدة غير موصولة” and planned scope; these are scaffolds, not operational business modules. |
| Admin customers | `apps/admin/src/app/customers/page.tsx` | No customer API integration tests identified | Screen states data is not connected and actions are disabled. |
| Admin requests / request detail | `apps/admin/src/app/requests/page.tsx`, `apps/admin/src/app/requests/[requestId]/page.tsx` | No request lifecycle API tests identified | UI exists; detail screen's own disclaimer says it does not fetch a DB record and actions are disabled. |
| Admin quote screens | `apps/admin/src/app/requests/[requestId]/quotes/new/page.tsx`, `apps/admin/src/app/requests/[requestId]/quotes/[quoteId]/page.tsx` | No end-to-end quote acceptance tests identified | UI routes exist; do not infer persisted quote workflow or customer approval. |
| Customer portal | `apps/customer-portal/src/app/page.tsx`, `apps/customer-portal/src/app/quotes/[quoteId]/page.tsx` | No portal auth/data isolation tests identified | Page shell and quote route exist; authenticated customer lifecycle not established. |
| API bootstrap | `apps/api/src/app.module.ts`, `apps/api/src/health.controller.ts` | `apps/api/src/health.controller.spec.ts` | AppModule registers only HealthController at audited revision. No commercial/admin business controllers identified. |
| Authorization primitive | `apps/api/src/security/permissions.guard.ts`, `apps/api/src/security/permissions.decorator.ts`, `apps/api/src/security/public.decorator.ts` | `apps/api/src/security/permissions.guard.spec.ts` | Deny-by-default guard primitive exists. No trusted auth/session principal population or database-backed permission resolver established by inspected AppModule/source. |
| Data schema foundation | `apps/api/prisma/schema.prisma` | CI Prisma validation/generation | Schema models are not proof of live database identity, migrations applied, or connected business APIs. |

## 3. Key security and acceptance boundaries

1. The permission guard consumes `request.user.permissions`; a trusted authentication layer must establish and verify that principal before protected routes are enabled.
2. UI visibility and disabled buttons are not authorization. Every business endpoint needs server-side permissions and ownership-scoped database predicates.
3. Prisma models and migration files do not prove that the live `core-db` or `agent-db` matches the repository schema.
4. The sandbox contract is not a sandbox runtime. A real backend must be separately selected, threat-modeled and tested for non-root execution, network denial (especially `core-db`), no host sockets, read-only root, writable mounts, resource limits and cancellation.
5. Repository CI success validates the checked repository revision only. It does not prove staging, backup restoration, production runtime, live integrations, customer workflows or HAI conformance.
6. Do not apply migrations, connect the Build Worker to `core-db`, enable generated-code execution, merge to `main`, or deploy production under this evidence map.

## 4. Next traceability increment

After GATE-01 is reviewed and approved, extend each HAI requirement ID to:
- exact source path and symbol;
- API route/controller and DTO;
- schema model and migration;
- permission key and ownership predicate;
- positive, negative and edge-case test;
- CI run and commit SHA;
- staging/runtime evidence and acceptance decision.

Until then, retain unresolved rows as open. This map does not close any HAI requirement by itself.
