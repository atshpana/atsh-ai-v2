# Implementation Status

- Updated: 30 October 2026
- Repository: atshpana/atsh-ai-v2
- Branch: implementation/bootstrap

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
- Request, quote, project-plan, task, change-request and release state-machine rules documented.
- First API unit test added for the health controller.

## Not yet completed or verified
- No clean install or lockfile committed. The local execution container has Node 22.16.0, below the selected Node 22.22.3 baseline; external network access is unavailable here.
- CI run/build/typecheck/Prisma validation status has not been confirmed.
- Local execution is blocked by the current container Node version (22.16.0), below the selected Node 22.22.3 baseline; external network access is unavailable in this execution environment.
- No PostgreSQL database provisioned or connected.
- No migration generated or applied.
- No authentication/session implementation, request-principal population, database-backed permission resolution, business APIs or persistence services are complete.
- Project/workflow/AI/support/hosting/finance/content/media/notification models remain to be designed and added.
- No production/staging environment or deployment exists.
- UI shells are initial scaffolds, not complete reference-matched screens; no measured screenshot comparison has been performed.
- Health endpoint and permission-guard unit tests are authored and compiled separately by the test script, but have not run; no automated browser or full security integration suite has been implemented.

## Next actions
1. Verify GitHub Actions CI; correct dependency/schema/compile failures and commit a reproducible lockfile.
2. Complete the permission matrix, entity ownership matrix and lifecycle state machines; refine drafts into approved permission keys.
3. Expand Prisma schema for projects, workflow plans/tasks, approvals, staff/agents, customer portal, support, hosting, finance, content and notifications.
4. Add authentication/session, authorization guards and tenant-scope tests before protected business endpoints.
5. Convert public website to durable locale-aware routes and metadata; verify context-preserving language switching.
6. Extract remaining detailed screen-by-screen requirements and build design tokens/components against the supplied visual references.
7. Select the PostgreSQL hosting provider only after security, backup, latency and cost review; then provision an isolated development database with owner approval.
