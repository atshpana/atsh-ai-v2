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
