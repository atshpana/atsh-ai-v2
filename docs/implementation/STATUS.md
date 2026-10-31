# Implementation Status

- Updated: 30 October 2026 (approved domain module specification baseline)
- Repository: atshpana/atsh-ai-v2
- Branch: implementation/bootstrap
- Latest changes include the approved domain module specification and decision register, alongside the previously recorded quote/configurator work. Check the branch commit history for the current HEAD.

## Confirmed owner decisions
- Full greenfield rebuild; legacy code and legacy database excluded.
- New independent PostgreSQL database.
- Next.js + NestJS + TypeScript monorepo.
- Modular-monolith backend.
- Prisma 7 with PostgreSQL driver adapter.
- Redis/BullMQ only when justified by workload.
- Public website Arabic/English; admin Arabic only; customer portal language open.
- Public GitHub repository; no secrets or customer data in Git.
- Internal staff sign-in direction: managed identity/sign-in service approved; provider/vendor selection remains open. This does not approve customer-portal identity sharing.

## Completed in repository
- Greenfield README, implementation baseline, delivery plan and open-decision register.
- ADR-0001 architecture marked Accepted.
- Workspace skeleton for public web, admin, customer portal, NestJS API and worker.
- Reworked the public website homepage into a structured bilingual experience: hero, delivery approach, six service areas, engineering capabilities, interactive illustrative workflow, scope/acceptance principles, FAQ and CTA.
- Added responsive layouts for desktop/tablet/mobile, keyboard focus states and reduced-motion handling; the visual direction uses restrained graphite, silver and red accents.
- Added durable `/ar` and `/en` homepage routes; `/` redirects to `/ar`. The language switch navigates between locale routes while retaining the current section hash when present. The Next.js `proxy.ts` convention supplies the locale to the root layout so the document `lang` and `dir` attributes match Arabic RTL or English LTR. Locale-specific title/description, canonical URLs, alternate-language links and Open Graph locale metadata are generated per route.
- Added the owner-supplied original hero artwork (`/images/atsh-hero.jpg`) and original circular ATSH emblem (`/images/atsh-logo.jpg`) to the public homepage. The hero artwork preserves its source aspect ratio; the header emblem is cropped within a circular frame. No stock or generated replacement assets are used.
- Converted the public homepage to durable Arabic/English locale routes, root redirect via Next.js Proxy, locale-aware document direction/language and per-locale SEO metadata.
- Added a bilingual six-service catalogue with client-side search, category filters, sorting, result count and empty state. Added localized service detail routes with benefits, scope, deliverables, related services, contact CTA and route-specific SEO/alternate-language metadata. Homepage service cards now open the corresponding detail page.
- Pricing is intentionally not fabricated: the public pages explain that commercial scope and quotation require requirements review until the approved server-side pricing/catalogue APIs are implemented. No add-to-cart or order submission is represented as live.
- Added `docs/api/PUBLIC_CONFIGURATOR_CART_CONTRACT.md`: versioned configurator read contract, server-authoritative decimal pricing response, custom-quote behavior, cart ownership/revalidation, price-change confirmation, idempotent transactional submission boundary, safe error envelope and acceptance-test matrix. Design only; no live API or cart mutations are enabled.
- Professional Arabic administration shell with responsive navigation across the 15 company workspace areas, owner command center, truthful empty states and module landing routes.
- Expanded owner command center: all 15 company workspaces linked, owner shortcuts, business-pulse metric placeholders tied to their source modules, operational alerts empty state, platform-readiness panel and protected governance gates. No synthetic operational figures are displayed.
- Responsive workspace-card grid and owner command-center visual treatment added to the admin stylesheet.
- Added the first dedicated request-operations screen at `/requests`: truthful unconnected-data state, source-bound KPI placeholders, request inbox table structure, reference lifecycle stages, review checklist and links to catalog operations. Responsive styles included; no mock customer/order records or live mutations are exposed.
- Added the dedicated customer directory at `/customers`: data-model-aligned customer field inventory, KPI source definitions, directory table and Customer 360 section map, disabled actions while APIs/authentication are absent, and explicit unconnected-data state. No mock customer records or live mutations are exposed.
- Extended the Prisma draft with `QuoteDecision` (accept/decline, one terminal decision per quote, unique idempotency key) and `QuoteChangeRequest` (separate customer change-request lifecycle). Schema only; no database migration or persistence API exists yet.\n- Added `docs/quotes/QUOTE_CUSTOMER_DECISION_CONTRACT.md`: proposed customer decision API, authorization invariants, transaction/concurrency/idempotency requirements, customer-safe DTO boundary, schema gaps and acceptance criteria. Design only; no decision endpoint is enabled.\n- Added a customer-facing quote review route at `/quotes/[quoteId]`: responsive quote details, itemized-scope placeholder, commercial summary, terms/delivery area and accept/request-change controls disabled pending authentication and server-side acceptance verification. No customer or quote data is fabricated.\n- Added a quote-review and customer-preview scaffold at `/requests/[requestId]/quotes/[quoteId]`: immutable-version summary, customer-facing preview boundary, internal approval checklist, version-history state and disabled lifecycle controls.
- Added a quote-editor scaffold at `/requests/[requestId]/quotes/new`: version identity, quote line-item table, commercial summary, terms/delivery areas, version governance and disabled actions. It follows the Quote/QuoteItem Prisma model; no price, currency, tax, customer or request values are fabricated.
- Added a request-review detail route at `/requests/[requestId]` with the source-defined ADM-11 structure: overview, immutable request/price snapshot, quote-version history, event timeline, review checklist, disabled controlled actions and lifecycle gates. The route identifier is treated as untrusted input; no request/customer data is exposed without server-side lookup and authorization.
- Customer portal now includes a branded quote-review experience; identity, quote lookup, customer ownership checks, secure acceptance/rejection and notifications remain unimplemented.
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
- The quote-decision Prisma schema, customer decision contract, open-decision register and implementation status commits all completed GitHub Actions CI successfully. The corresponding checks include Prisma validation/generation, typecheck, build and unit tests.
- No clean install or lockfile committed.
- Earlier CI runs for the API bootstrap and quote-editor scaffold completed successfully. Verify each later UI batch against its own workflow run before describing it as verified.
- Local execution is blocked by the current container Node version (22.16.0), below the selected Node 22.22.3 baseline; external network access is unavailable in this environment.
- No PostgreSQL database provisioned or connected.
- The generated baseline preview from CI run `41132445711` (commit `83c6f2a455677976751e042e66ad043f84efe7ee`) was inspected: pure SQL, 10 enum types, 24 tables, 19 unique indexes, 23 non-unique indexes and 30 foreign-key constraints; no DROP statements. The earlier npm lifecycle banner and incorrect CLI path issues are resolved. The preview is not yet committed as a migration and has not been applied to any persistent database. A follow-up CI change adds an isolated PostgreSQL 16 service, writes the PostgreSQL migration lock, and tests `prisma migrate deploy` plus `migrate status` against that ephemeral database; this test is pending CI.
- No authentication/session implementation, request-principal population, database-backed permission resolution, business APIs or persistence services are complete.
- Project/workflow/AI/support/hosting/finance/content/media/notification models remain to be designed and added.
- No production/staging environment or deployment exists.
- UI shells remain incomplete relative to the full reference. The owner command center, request inbox, customer directory and public homepage have received substantive layout passes, but no measured screenshot comparison has been performed. The public homepage does not yet include the full 15-screen public journey.
- Health endpoint and permission-guard unit tests passed in the CI run for commit `a069a32dffb4d0b60482d17a07fdbbfc21d34a3f`; the new customer UI has no dedicated browser tests yet, and no full security integration suite has been implemented.

## Next actions
1. Verify CI for the isolated PostgreSQL 16 migration test; confirm the generated baseline deploys cleanly from an empty database and `migrate status` reports it up to date. Do not connect a shared or production database.
2. Commit the reviewed baseline SQL and PostgreSQL migration lock only after the isolated deployment test succeeds.
3. Implement the server-side pricing module and tests against `docs/api/PUBLIC_CONFIGURATOR_CART_CONTRACT.md`; keep prices and taxes disabled until approved commercial rules exist.
4. Implement cart ownership/session, server-side revalidation, price-change confirmation and idempotent request submission only after authentication/session, persistence and API integration tests are ready.
5. Complete browser verification for locale routes and service listing/details: `/` redirect, Arabic RTL, English LTR, search/filter/empty states, detail links and alternate-language metadata.
5. Complete the permission matrix, entity ownership matrix and lifecycle state machines; refine drafts into approved permission keys.
6. Expand Prisma schema for projects, workflow plans/tasks, approvals, staff/agents, customer portal, support, hosting, finance, content and notifications.
7. Add authentication/session, authorization guards and tenant-scope tests before protected business endpoints.
8. Extract remaining detailed screen-by-screen requirements and build design tokens/components against the supplied visual references.
9. Select the PostgreSQL hosting provider only after security, backup, latency and cost review; then provision an isolated development database with owner approval.


## Domain module — owner-approved specification baseline

- Owner decisions recorded on 30 October 2026: package policy `both` (some packages may include an eligible domain entitlement; other domains are separately priced) and ownership policy `client` (customer is registrant/legal owner; ATSH manages only under recorded customer authorization).
- Added `docs/domains/DOMAIN_MANAGEMENT_SPEC.md` covering customer configurator step 5/8, customer domain portal, administration screens, logical domain entities/relationships/constraints, NestJS API contracts, lifecycle state machines, n8n orchestration, permission keys, security controls, test plan and acceptance gates.
- Added domain decisions and unresolved provider/commercial dependencies to `docs/OPEN_DECISIONS.md`.
- Specification commit: `dcf927f4da9a1c3445297f432aa4c6f784237fd9`.
- Decision-register commit: `db749f2baeb5f2a62b9ff30610a47f5f0769f086`.
- **Design only:** no domain UI routes, Prisma models, migrations, persistence APIs, registrar integration, DNS mutation or n8n workflows have been implemented or tested. No registrar/provider was selected.
- Before implementation: reconcile the proposed domain entities with existing Customer/Package/Contract/Invoice/HostedService/AuditEvent models; finalize open registrar, TLD, renewal, DNS and registrant-data policies; then implement the vertical slice with tests. Do not provision or migrate a database as part of this specification-only change.


## Domain module addendum — live search and in-platform registration

- Owner clarified that domain availability must be searched live from ATSH screens and the customer must be able to complete the standard registration purchase inside ATSH screens.
- Updated `docs/domains/DOMAIN_MANAGEMENT_SPEC.md` to v1.1: live provider-backed availability lookup, timestamped results, supported-TLD coverage, explicit available/unavailable/premium/indeterminate/error states, quote and renewal disclosure, customer registrant authorization, payment gate, fresh recheck, server-to-server registrar registration, and verified outcome states.
- Registrar selection is now explicitly blocked on a provider API supporting live availability and server-side registration for the required TLDs. Registrar storefront redirect does not satisfy the requirement.
- Specification update commit: `bcd5b2d6cfee3fedb4bd841777a4b6b0cb2fcc48`.
- **Design only:** live search and in-platform purchase are mandatory requirements, not implemented/verified capabilities. Provider, payment integration, supported TLD coverage and registry-specific exceptions remain open.


## Prisma baseline SQL review — 30 October 2026

- GitHub Actions run `41132485355` for source commit `dc08f488bfe53c29073a0127f95056c46ec535b0` completed successfully: dependency installation, Prisma validation/generation, migration-preview generation, artifact upload, typecheck, build and unit tests all passed.
- Downloaded artifact `prisma-baseline-migration-preview` (artifact `13012818964`) and verified that its ZIP contains a single pure PostgreSQL `migration.sql` file (21,182 bytes; 575 lines), with no npm banner contamination.
- Static inventory: 10 enum types, 24 tables, 42 indexes and 30 foreign keys; no DROP/TRUNCATE/DELETE statements detected.
- Added `docs/data/PRISMA_BASELINE_SQL_REVIEW.md` with findings and required follow-up: database CHECK constraints for quantities/monetary values, explicit decision on `pricing_versions.approved_by_id` relation, temporal/lifecycle invariants, transaction-level quote decision and customer ownership checks, and broader model completeness.
- **Not approved for baseline application:** do not commit as `0_init` or apply. The current schema is still an incomplete draft relative to the full ATSH scope. Reconcile domain/project/contract/invoice/hosting/workflow/AI/support/finance/content/notification models, resolve review findings, regenerate SQL, then run an isolated PostgreSQL migration test in CI.
- No PostgreSQL database was provisioned or connected; no migration was applied.


## Prisma model gap analysis — 30 October 2026

- Added `docs/data/PRISMA_MODEL_GAP_ANALYSIS.md` after comparing the current Prisma schema with the logical data model, screen/flow catalogue and approved domain specification.
- The analysis maps current Prisma coverage and enumerates missing areas: organizations/security grants, CMS and visual administration, packages/configurator/cart, complete quote/contract evidence, project delivery/release governance, staff/workflow/AI workforce, support/communications, hosting/domain/backup, finance and operational integrations.
- It records the known baseline review findings and a phased implementation order, while preserving open provider/commercial decisions.
- Analysis commit: `1d96299ca68f9910f26c93b9ad34fba3f370f517`.
- **Analysis only:** no Prisma schema or migration was changed by this document; no provider, currency, tax, price, payment, registrar, TLD, DNS, AI model or customer-portal language decision was inferred.
- CI for the updated workflow containing the isolated PostgreSQL 16 migration-deploy/status test has not been independently confirmed in this continuation. The previously verified run `41132485355` predates that workflow change and does not prove the ephemeral PostgreSQL test passed.
- Gap-analysis document commit: `1d96299ca68f9910f26c93b9ad34fba3f370f517`; status-record commit: `170b9e33d0a1844f4f4a432c3a3276344d312fb4`.
- The first durable migration remains blocked pending model completion, resolution of review findings, a successful isolated PostgreSQL test, and owner approval. No persistent database was provisioned and no migration was applied.


## Baseline gate correction — 30 October 2026

- The follow-up CI run `41132838966` for commit `3c42f840407b298f9b9f49919bedc54024c96141` completed successfully. Its generated preview was checked: 10 enum types, 24 tables, 19 unique indexes, 23 non-unique indexes and 30 foreign keys; no DROP statements and no npm banner.
- That run also successfully applied the generated draft to a disposable PostgreSQL 16 CI service and verified migration status. This is evidence of SQL executability for the current draft only; it is **not** owner approval, production readiness, scope completeness or permission to create a durable baseline.
- The existing static review `docs/data/PRISMA_BASELINE_SQL_REVIEW.md` explicitly says not to commit this SQL as `0_init` or apply it. Its unresolved items include database CHECK constraints, the pricing approver reference decision, temporal/lifecycle invariants, transactional quote/customer authorization enforcement, and missing approved product domains (domains, projects, contracts, invoices, hosted services, workflow plans/tasks, AI agents, support, finance, content and notifications).
- Accordingly, no migration SQL or migration lock was committed. CI was corrected in commit `94188fb6b3d79c9345351059aa7bf04ed5beda52` to generate and upload the SQL as a temporary review artifact only. It no longer provisions PostgreSQL or applies the incomplete draft. The preview is written under the runner temporary directory, not the Prisma migrations folder.
- **Current state:** Prisma schema validation/generation, typecheck, build and unit tests remain CI checks. The database baseline remains **Designed / under review**, not approved or applied. No persistent database exists or is connected.
- Next: reconcile the complete approved screen/flow requirements and domain specifications into the logical data model; resolve the static review findings; regenerate and review a new preview. Only after that, run a disposable empty-PostgreSQL migration test and seek explicit baseline approval before committing a first migration.


## Screen/flow-to-data traceability — 30 October 2026

- Expanded `docs/data/PRISMA_MODEL_GAP_ANALYSIS.md` with a source-ID mapping across PUB-01..PUB-15, ADM-01..ADM-20, public intake/pricing, administration review, content publication, quote acceptance, project/software delivery, customer portal, support, AI/workflows, hosting, domains and finance.
- Added cross-cutting customer/staff/agent authority paths, source-derived flow acceptance gates, and a dependency-ordered recommendation for the next schema design slice.
- The analysis explicitly distinguishes existing Prisma coverage from missing records and unimplemented controls. It does not claim UI/API/runtime completion and does not change the Prisma schema.
- Traceability update commit: `f8fee900bec6f8e691c510095d1a01502c9b765b`.
- Next implementation boundary: design the vendor-neutral identity/ownership and commercial-intake foundation before adding downstream project, AI, hosting, finance or domain models. Authentication vendor, payment/tax/currency policy and external providers remain open.

## Identity and ownership design — 30 October 2026

- Re-verified branch HEAD before continuing: `f2dc85f20e54cb265a501474640690cbdc063df7`; CI run `41133219862` completed successfully.
- Inspected the actual workflow and job steps: this run validates/generates Prisma, creates/uploads a temporary SQL preview, typechecks, builds and runs unit tests. It does **not** start PostgreSQL or execute `prisma migrate deploy`.
- Added `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md` (design only) to define trust boundaries, ownership resolution, permission ceilings, scoped-grant requirements, authentication/session boundaries and cross-account security tests.
- Identified a blocking data-model decision: the current `Customer.userId` is optional and unique, while the logical model separately names Organization and OrganizationMember. The account semantics/cardinality are not sufficiently defined to implement safely.
- The design records three account-model options and recommends Option A (Customer as the commercial account) as a proposal only; no owner decision is inferred.
- No Prisma schema, migration, database, authentication provider, runtime authorization behavior or production resource was changed.
- **Important status correction:** the historical note that run `41132838966` applied a draft to ephemeral PostgreSQL describes an earlier workflow state. The current workflow has since been changed to preview-only as recorded in the Baseline gate correction. Current HEAD run `41133219862` does not prove a PostgreSQL migration-deploy test.
- Next: obtain an explicit account-model decision and authentication/session ownership decision; then implement the foundational identity/organization/grant schema and tests in a separate change. Keep the durable baseline blocked pending full-scope reconciliation and owner approval.


## Commercial intake data design — 30 October 2026

- Added `docs/data/COMMERCIAL_INTAKE_DATA_DESIGN.md` as a detailed, provider-neutral design proposal for package/version composition, immutable configurator definitions, request answers, server-authoritative price-calculation evidence, cart lifecycle and atomic request submission.
- The design reuses the existing service catalogue, pricing, request snapshots/events and quote records; it does not duplicate those models.
- Specified candidate fields, unique constraints, CHECK constraints, indexes, immutable publication rules, ownership controls, idempotency scope, concurrency behavior and transaction acceptance gates.
- Explicitly blocked cart ownership/API implementation on the unresolved Customer-versus-Organization account model and authentication/session/anonymous-cart decisions. Currency, rounding, discounts, taxes, recurring terms and price-binding semantics remain open.
- Design commit: `b2a34a153206104026ddb4f7e4620995f12f51e7`.
- **Design only:** no Prisma schema, migration, database, pricing runtime, cart API, payment behavior or customer-facing checkout was changed or enabled.
- CI runs `41134492195` and `41134478802` were still in progress at the last inspection; earlier completed runs `41133806561` and `41133801712` succeeded. Verify the latest branch-head run before marking this design/status batch as CI-verified.
- Next: resolve the account-model and authentication/session decisions before any cart ownership schema. Meanwhile, continue a source-traceable specification of the package/configurator publication workflow and admin review controls; do not invent commercial rules.


## Catalogue/configurator administration workflow — 30 October 2026

- Added `docs/admin/CATALOGUE_CONFIGURATOR_PUBLICATION_WORKFLOW.md`.
- Source-mapped ADM-06/07/08/09/13/15/19 and the public catalogue journey PUB-02..PUB-05 into a unified administration workflow while keeping catalogue, configurator, pricing, CMS and protected settings publication domains distinct.
- Specified immutable draft/review/approval/publication revisions; package/configurator version binding; scenario testing; localization checks; dependency validation; reviewer/publisher separation; publish/rollback evidence; optimistic concurrency; idempotent retries; cache invalidation and failure states.
- Added candidate atomic permission keys for future RBAC review only. They are not seeded, approved or enforced.
- Added proposed screen states and 17 acceptance tests, including cross-version integrity and publication safety.
- Design commit: `3798482d3363a0dcdc050c2d4704ae675885274e`.
- **Design only:** no Prisma models, migrations, UI, APIs, RBAC seeds, publication, pricing activation or customer-facing commerce behavior were changed or enabled.
- Latest CI run for the preceding status commit `973ce0c5b750682a46acfb4c5e69a6dd99ef86f2` was `41134604857` and was in progress at inspection; CodeQL run `41134604956` was also in progress. New documentation commit will trigger a fresh run; verify its final result before treating this batch as CI-verified.
- Next: map the candidate permission keys against the actual current RBAC schema and existing guard implementation, then create a concrete screen/API/permission/test traceability matrix. Do not seed new permissions or alter schema until the owner-approved role matrix and identity decisions are settled.


## Screen/API/permission/data/test traceability — 30 October 2026

- Added `docs/traceability/SCREEN_API_PERMISSION_DATA_TEST_MATRIX.md`.
- Mapped ADM-01..20 and the main public commerce journey to proposed API operations, current Prisma data dependencies, candidate permission keys and required positive/negative/edge tests.
- Distinguished verified repository artifacts from proposed/not-yet-implemented business APIs. In particular, the current NestJS guard is deny-by-default and checks `request.user.permissions`, but the inspected API source does not yet establish trusted authentication or principal population; it is not a complete auth system.
- Confirmed generic permission guard/decorator unit tests exist. They do not prove database-backed permission resolution, ownership isolation or protected business API behavior.
- Identified current model coverage and gaps for CMS, configurator versioning, cart, organization membership, sessions, publication history, exports, finance and other modules.
- Matrix commit: `2ca5ccb639e808619afcd39cf3cd04b8be96d506`.
- **Traceability only:** no API endpoints, schema, role assignments, permission seeds, UI behavior or business mutations were added.
- CI for the preceding documentation batch: CI run `41134604857` and CodeQL run `41134604956` completed successfully. CI runs `41134785940`, `41134798782` and current branch-head run `41134802856` were still in progress at last inspection; CodeQL run `41134798804` was cancelled by a newer push and `41134802961` was pending. Verify current head checks before marking this traceability batch as CI-verified.
- Next: inspect the admin route tree and current frontend navigation implementation, then produce a page-by-page acceptance/evidence checklist and prioritize connected implementation only after identity/ownership and API contracts are approved.


## Admin UI route and acceptance inspection — 30 October 2026

- Inspected the actual admin route tree and source components: dedicated owner home, customer directory, request inbox, request detail, and shared `/[module]` landing page.
- Confirmed the navigation exposes 15 workspace areas, but most destinations currently resolve to a generic scope/placeholder page rather than a domain-specific operational screen.
- Confirmed the request detail route displays the path identifier but does not query the database; actions remain disabled and customer data is not fabricated.
- Added `docs/admin/ADMIN_UI_ROUTE_ACCEPTANCE_CHECKLIST.md` with route inventory, ADM screen acceptance checks, module-by-module blockers, navigation/accessibility checks, evidence requirements and truthful implementation status.
- UI classification from source inspection: owner command center, customer directory, request inbox and request detail are **Implemented — unverified** scaffolds; remaining workspace modules are generic design/scaffold pages; no browser E2E, screenshot comparison or staging verification was performed.
- Checklist commit: `c8f640ac37f342df49c6ff943a76a8ac70e76c4e`.
- No UI code, API, schema, permission, deployment or business data changed.
- CI for the prior traceability/status commits was still running at last inspection: run `41134957050` for commit `62ff30c67102418b31fa07bfeaf6b997e760af03` and run `41134944796` for commit `2ca5ccb639e808619afcd39cf3cd04b8be96d506`; verify the latest checklist/status commit runs before claiming CI verification.
- Next implementation priority: make identity/session and ownership decisions explicit, then build the first connected vertical slice for request inbox/detail (read-only first, scoped queries and isolation tests) before enabling mutations.

## Identity and request-operations implementation gate — 31 October 2026

- Re-inspected the current API bootstrap, AppModule, global PermissionsGuard, decorators and guard tests. The API currently registers only the health controller; there are no authentication modules, session services, verified-principal population, database-backed permission resolution, request/customer business controllers or persistence services.
- Confirmed the global guard checks request.user.permissions, but no inspected middleware/guard/provider establishes that this object is populated from a verified credential. The guard unit tests prove metadata and permission-array behavior only; they do not prove request identity or prevent an upstream untrusted principal from being supplied.
- Re-read docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md and docs/OPEN_DECISIONS.md. Two owner decisions still block safe implementation: (1) managed identity provider versus first-party authentication/session ownership; (2) customer-account semantics (Customer account, Organization account, or Customer contact under Organization account). Option A in the design remains a recommendation only, not an approved decision.
- Therefore no request read endpoint, customer directory data endpoint, identity schema, auth dependency, permission seed or database migration was added. Implementing any of these before resolving the trust and ownership model would risk creating an unsafe or incompatible foundation.
- Verified the latest branch-head commit at this inspection is dd192eeee3ea4347886171384924b9da2a9fe8c1. GitHub Actions CI run 41135114534 and CodeQL run 41135114426 both completed successfully for that exact SHA. This verifies the repository configured CI and CodeQL checks, not browser behavior, database connectivity, authentication or business APIs.
- Current status: API authentication/session and customer ownership remain Blocked by owner decisions; request inbox/detail remain Implemented — unverified scaffolds. No staging or production deployment exists.
- Required next owner input: choose the authentication/session ownership approach and one customer-account model. Once confirmed, implement identity and account ownership as a separately reviewed schema/API slice, then add database-backed permission resolution and cross-account tests before connecting request list/detail screens.


## Staff authentication direction — 31 October 2026

- Owner approved using a managed identity/sign-in service for internal ATSH staff rather than building and operating an ATSH-owned password-authentication system.
- Updated `docs/OPEN_DECISIONS.md` and `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md` to record the decision and its boundary.
- Still open: select the managed provider/vendor and finalize its integration/session configuration. Customer-portal authentication is explicitly not decided by this approval; the Customer-versus-Organization account model also remains open.
- No auth package, provider connection, Prisma model, migration, session service, API endpoint, permission seed or runtime principal population was implemented in this documentation-only decision update.
- Next: compare suitable managed identity providers for staff use, then request approval of the specific provider. Keep protected business APIs blocked until trusted principal population and customer ownership are implemented and tested.


## AI-first workforce identity architecture — 31 October 2026

- Owner clarified that ATSH AI's operating model is expected to automate or AI-assist approximately 90% of routine work. This is an architectural planning assumption, not a measured production metric.
- Added `docs/security/AI_FIRST_WORKFORCE_IDENTITY_MODEL.md` (Draft v1.0), separating human, workload/service, AI-agent, customer, and external-provider identity boundaries.
- Defined provider-neutral principal resolution, least-privilege capabilities, permission ceilings, server-side tool/action brokering, n8n/worker boundaries, agent run attribution, human approval gates for protected actions, audit evidence, provider-evaluation criteria, and security acceptance tests.
- Updated `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md` to make clear that managed sign-in applies to human staff only and is not an identity authority for agents/workloads.
- Updated `docs/OPEN_DECISIONS.md`: human sign-in provider remains open; workload identity/secret-management provider and agent roster/capability catalogue are separate open decisions.
- **Documentation/design only:** no provider selected, no auth or agent package added, no Prisma model or migration changed, no credentials or integrations created, no agent tool access enabled, and no API/UI/runtime behavior implemented.
- Existing blockers remain: customer-account semantics, customer portal identity boundary, trusted principal population, server-side authorization, and ownership/isolation implementation.
- Next: evaluate the human sign-in provider for a small human workforce independently from workload identity; then design the minimum principal/capability/audit schema and tool-broker API against approved workflows. Do not enable write-capable agents before the approval and security gates are implemented and tested.


## Human identity provider and AI principal foundation — 31 October 2026

- Researched official vendor pricing and technical documentation for Amazon Cognito, Supabase Auth and Clerk.
- Added `docs/security/HUMAN_IDENTITY_PROVIDER_AND_AI_PRINCIPAL_FOUNDATION.md` with a comparative evaluation for a small human workforce, a leading-but-unapproved recommendation to test Cognito Lite for staff sign-in, and explicit pricing/feature trade-offs.
- The evaluation separates human MAU/MRU costs from AI model, n8n, worker, workload identity and tool-call costs. It specifically avoids treating AI agents as human seats or assuming that the staff identity vendor should issue every machine credential.
- Added provider-neutral conceptual entities for Principal, ExternalIdentity, WorkloadIdentity, AgentDefinition/AgentRun, Capability/CapabilityGrant, ApprovalRequest/Decision, ToolInvocation and AuditEvent extension, plus proposed API boundaries, implementation sequence and proof-of-concept acceptance criteria.
- Updated `docs/OPEN_DECISIONS.md`: Cognito Lite is the leading candidate to test, not an approved vendor selection. Provider-neutral agent/workload architecture remains design-only.
- Official research checked 31 October 2026: Cognito Lite/Essentials 10,000 direct/social MAU free tier and TOTP MFA on Lite; Supabase Auth Free 50,000 MAU / Pro from $25 and TOTP MFA; Clerk Hobby 50,000 MRU but no MFA, Pro $20/month billed annually with MFA.
- **Documentation and evaluation only:** no identity vendor account or pool created, no package installed, no provider connection or credential added, no Prisma schema/migration changed, no API route or tool broker implemented, and no AI-agent permission granted.
- Current identity implementation remains blocked on owner provider selection, customer account semantics, customer portal identity boundary, trusted principal verification, and security-tested authorization.
- Next: if the owner approves Cognito Lite, build a minimal staff-only proof of concept with TOTP and OIDC verification. In parallel, reconcile the proposed principal/capability entities with the current Prisma User/RBAC/AuditEvent models and logical data model before any schema change.
