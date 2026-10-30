# Implementation Status

- Updated: 30 October 2026 (public configurator and cart contract)
- Repository: atshpana/atsh-ai-v2
- Branch: implementation/bootstrap
- Latest branch HEAD before this status update: `6c40f59dd80ad4a5120412f80377d4d1d49bf2a3` (linked public configurator/cart contract into the API inventory).

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
- Added a quote-editor scaffold at `/requests/[requestId]/quotes/new`: version identity, quote line-item table, commercial summary, terms/delivery areas, version governance and disabled actions. It follows the existing Quote/QuoteItem/QuoteAcceptance Prisma model; no price, currency, tax, customer or request values are fabricated.
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
- CI for the first service-catalogue/detail commits exposed a TypeScript import-path error; the import was corrected in a follow-up commit. The current CI run for `2678730be8c6085c1fb4ff0ebcd28e89a8a7f685` has passed TypeScript typecheck and is running the build; unit tests have not yet started. Do not mark this batch fully verified until the run concludes.
- No clean install or lockfile committed.
- The CI run for commit `a069a32dffb4d0b60482d17a07fdbbfc21d34a3f` completed successfully, including dependency installation, Prisma validation/generation, TypeScript typecheck, build and unit tests. CI for the quote-editor scaffold through commit `83cfbeac779cd138340c9861ed639c2012dc4b65` completed successfully. Later quote-review UI and localized public-routing commits are still running/queued and are not yet verified.
- Local execution is blocked by the current container Node version (22.16.0), below the selected Node 22.22.3 baseline; external network access is unavailable in this environment.
- No PostgreSQL database provisioned or connected.
- No migration generated or applied.
- No authentication/session implementation, request-principal population, database-backed permission resolution, business APIs or persistence services are complete.
- Project/workflow/AI/support/hosting/finance/content/media/notification models remain to be designed and added.
- No production/staging environment or deployment exists.
- UI shells remain incomplete relative to the full reference. The owner command center, request inbox, customer directory and public homepage have received substantive layout passes, but no measured screenshot comparison has been performed. The public homepage does not yet include the full 15-screen public journey.
- Health endpoint and permission-guard unit tests passed in the CI run for commit `a069a32dffb4d0b60482d17a07fdbbfc21d34a3f`; the new customer UI has no dedicated browser tests yet, and no full security integration suite has been implemented.

## Next actions
1. Verify the current CI run and all service-catalogue/detail and customer quote-review workflows; correct failures before expanding the public purchase flow.
2. Complete the catalog/configurator persistence design and review option dependency/conflict rules against the reference before extending Prisma; no migration or database connection without owner-approved provider and isolated environment.
3. Implement the server-side pricing module and tests against `docs/api/PUBLIC_CONFIGURATOR_CART_CONTRACT.md`; keep prices and taxes disabled until approved commercial rules exist.
4. Implement cart ownership/session, server-side revalidation, price-change confirmation and idempotent request submission only after authentication/session, persistence and API integration tests are ready.
5. Complete browser verification for locale routes and service listing/details: `/` redirect, Arabic RTL, English LTR, search/filter/empty states, detail links and alternate-language metadata.
5. Complete the permission matrix, entity ownership matrix and lifecycle state machines; refine drafts into approved permission keys.
6. Expand Prisma schema for projects, workflow plans/tasks, approvals, staff/agents, customer portal, support, hosting, finance, content and notifications.
7. Add authentication/session, authorization guards and tenant-scope tests before protected business endpoints.
8. Extract remaining detailed screen-by-screen requirements and build design tokens/components against the supplied visual references.
9. Select the PostgreSQL hosting provider only after security, backup, latency and cost review; then provision an isolated development database with owner approval.
