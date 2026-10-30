# Implementation Status

- Updated: 30 October 2026 (customer workspace implementation pass)
- Repository: atshpana/atsh-ai-v2
- Branch: implementation/bootstrap
- Latest confirmed commit: `7081ffbc1216ed8f55dcae80227ff13b34d09510` (implementation status update).

## Confirmed owner decisions
- Full greenfield rebuild; legacy code and legacy database excluded.
- New independent PostgreSQL database.
- Next.js + NestJS + TypeScript monorepo.
- Modular-monolith backend.
- Prisma 7 with PostgreSQL driver adapter.
- Redis/BullMQ only when justified by workload.
- Public website Arabic/English; admin Arabic only; customer portal language open.
- Public GitHub repository; no secrets or customer data in Git.

## Completed in repository
- Greenfield README, implementation baseline, delivery plan and open-decision register.
- ADR-0001 architecture marked Accepted.
- Workspace skeleton for public web, admin, customer portal, NestJS API and worker.
- Initial bilingual public website UI shell with RTL/LTR switching and responsive styling.
- Professional Arabic administration shell with responsive navigation across the 15 company workspace areas, owner command center, truthful empty states and module landing routes.
- Expanded owner command center: all 15 company workspaces linked, owner shortcuts, business-pulse metric placeholders tied to their source modules, operational alerts empty state, platform-readiness panel and protected governance gates. No synthetic operational figures are displayed.
- Responsive workspace-card grid and owner command-center visual treatment added to the admin stylesheet.
- Added the first dedicated request-operations screen at `/requests`: truthful unconnected-data state, source-bound KPI placeholders, request inbox table structure, reference lifecycle stages, review checklist and links to catalog operations. Responsive styles included; no mock customer/order records or live mutations are exposed.\n- Added the dedicated customer directory at `/customers`: data-model-aligned customer field inventory, KPI source definitions, directory table and Customer 360 section map, disabled actions while APIs/authentication are absent, and explicit unconnected-data state. No mock customer records or live mutations are exposed.
- Customer portal placeholder.
- NestJS API bootstrap and health endpoint.
- Global deny-by-default permissions guard, explicit Public/RequirePermissions decorators and unit tests for authorization behavior.
- Initial shared UI design tokens.
- CI workflow configured for Node 22.22.3, dependency installation, Prisma validation/generation, typecheck, build and unit tests.
- Dependency baseline documented: Next.js 16.4.3, React 19.3.1, NestJS 12.3.0, CLI/schematics 12.0.11, TypeScript 6.0.3 and Prisma 7.10.1.
- Source-derived catalog of 15 public screens and 20 admin screens.
- Core public intake, conditional pricing, admin review, content publishing and software-delivery flows catalogued.
- Logical API route inventory drafted.
- New PostgreSQL logical data model drafted.
- Initial Prisma schema added for users/RBAC, customers, bilingual service catalog/options, pricing versions/rules, service requests/snapshots/events, quotes/acceptance and audit events.
- Prisma config and safe .env.example added.
- Draft server-side role/permission matrix and data-classification baseline added.
- Workflow state-machine rules documented for requests, quotes, project plans, tasks, change requests, approvals and releases.
- Admin UI module route scaffolds added; no protected data or operational APIs are connected.
- API unit tests added for the health controller and deny-by-default permission guard.

## Not yet completed or verified
- No clean install or lockfile committed.
- The CI run for commit `a069a32dffb4d0b60482d17a07fdbbfc21d34a3f` completed successfully, including dependency installation, Prisma validation/generation, TypeScript typecheck, build and unit tests. The newly added customer screen has not yet been covered by a CI run.
- Local execution is blocked by the current container Node version (22.16.0), below the selected Node 22.22.3 baseline; external network access is unavailable in this environment.
- No PostgreSQL database provisioned or connected.
- No migration generated or applied.
- No authentication/session implementation, request-principal population, database-backed permission resolution, business APIs or persistence services are complete.
- Project/workflow/AI/support/hosting/finance/content/media/notification models remain to be designed and added.
- No production/staging environment or deployment exists.
- UI shells are initial scaffolds, not complete reference-matched screens; the owner command center and request-operations screen have received their first substantive layout passes, but no measured screenshot comparison has been performed.
- Health endpoint and permission-guard unit tests passed in the CI run for commit `a069a32dffb4d0b60482d17a07fdbbfc21d34a3f`; the new customer UI has no dedicated browser tests yet, and no full security integration suite has been implemented.

## Next actions
1. Verify the push-triggered GitHub Actions run for the latest implementation commit; correct dependency/schema/compile failures and commit a reproducible lockfile.
2. Run CI for the customer screen commits, fix any type/build failures, then implement the sales quote/review detail flow; keep all data states honest until authenticated APIs are connected.
2. Complete the permission matrix, entity ownership matrix and lifecycle state machines; refine drafts into approved permission keys.
3. Expand Prisma schema for projects, workflow plans/tasks, approvals, staff/agents, customer portal, support, hosting, finance, content and notifications.
4. Add authentication/session, authorization guards and tenant-scope tests before protected business endpoints.
5. Convert public website to durable locale-aware routes and metadata; verify context-preserving language switching.
6. Extract remaining detailed screen-by-screen requirements and build design tokens/components against the supplied visual references.
7. Select the PostgreSQL hosting provider only after security, backup, latency and cost review; then provision an isolated development database with owner approval.
