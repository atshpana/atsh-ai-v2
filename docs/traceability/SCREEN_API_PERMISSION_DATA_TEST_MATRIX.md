# Screen–API–Permission–Data–Test Traceability Matrix — Draft v1.0

- Date: 30 October 2026
- Branch: `implementation/bootstrap`
- Authority: Executive Reference v2.0 indexed in `docs/requirements/SCREEN_AND_FLOW_CATALOG.md`, current Prisma draft, current NestJS security guard/decorator/spec, and the administration workflow design.
- Status: **Traceability/design artifact. This matrix does not claim that listed APIs, permissions, data access or tests are implemented.**

## 1. Evidence-based current-state boundary

### Implemented artifacts observed in repository

- Prisma draft contains User/Role/Permission/RolePermission/UserRole, Customer, service catalogue/options, pricing versions/rules, ServiceRequest snapshots/events, Quote/QuoteItem/QuoteDecision/QuoteChangeRequest and AuditEvent.
- API security contains:
  - `RequirePermissions(...permissions)` metadata decorator.
  - `Public()` metadata decorator (public route marker).
  - Global `PermissionsGuard`.
  - Guard denies unmarked protected routes and requires every declared permission to appear in `request.user.permissions`.
  - Unit tests cover explicit public route, unmarked route denial, absent principal denial and all-required-permissions behavior.
- API bootstrap and health endpoint exist.
- No business API modules/endpoints, authentication/session principal population, database-backed permission resolver, or protected persistence services are established by the inspected API source files.
- Admin UI routes and screens are scaffolds with unconnected-data states and disabled actions; do not interpret a route as a connected business capability.

### Critical security qualification

The guard consumes a pre-populated `request.user.permissions` array. The inspected code does not establish who authenticates the request or populates/verifies that principal. Until a trusted authentication strategy and database-backed permission resolution are implemented and tested, the guard is a deny-by-default authorization boundary, not a complete authentication/authorization system.

## 2. Matrix conventions

- **API status:** None = no business endpoint verified in inspected API source; Proposed = contract/design only.
- **Data status:** Draft = Prisma model exists but no connected persistence API; Missing = required domain entity is not yet in Prisma.
- **Permission status:** Guard primitive = generic guard/decorator exists; key = candidate permission string only, not an approved/seeded role assignment.
- **Test status:** Guard unit = generic guard test only; Required = domain acceptance tests not implemented/verified.
- Every protected API must authorize server-side and scope database queries by persisted ownership. A screen-level permission check is never sufficient.

## 3. Screen traceability

| Screen | Domain operations required by source | API operations (proposed; not implemented) | Data dependencies | Candidate permission keys | Required tests |
|---|---|---|---|---|---|
| ADM-01 Sign-in | Authenticate, recover access, MFA if approved | POST auth/session; recovery and MFA endpoints only after provider decision | User, identity mapping, session (missing) | auth.signin; auth.recovery (policy pending) | Rate limits, invalid credentials, disabled user, session revocation, MFA policy |
| ADM-02 Home/metrics | Real metrics, time filters, drill-down | GET dashboard summary and metric drill-down | Requests, quotes, projects/finance/etc.; partial/missing | dashboard.read | Aggregates reconcile to source queries; filters; empty/error; permission scope |
| ADM-03 Pages | List/create/edit/archive/preview | GET/POST/PATCH pages; archive; preview | CMS Page/Revision missing | cms.page.read/write/archive | Draft isolation, locale, validation, archive dependencies |
| ADM-04 Page editor | Arrange sections, save draft, request approval, publish | PATCH page draft; POST review; GET preview | CMS page/revision/section/media missing | cms.page.write; cms.review; cms.publish | XSS/content validation, revision conflict, approval, preview isolation |
| ADM-05 Identity/design | Brand tokens, preview, rollback | GET/PATCH design tokens; POST rollback | DesignToken/BrandRevision missing | design.read/write/publish/rollback | RTL/LTR, contrast/accessibility, version rollback |
| ADM-06 Categories | CRUD, order, locale, publication | GET/POST/PATCH categories; submit review; publish/archive | ServiceCategory, CategoryTranslation exist | catalog.category.read/write; catalog.review; catalog.publish | Slug uniqueness, locale completeness, referenced category archive |
| ADM-07 Services | CRUD, duplicate/archive, locale/media/pricing mode | GET/POST/PATCH services; duplicate; archive | Service, ServiceTranslation, ServiceCategory exist | catalog.service.read/write/archive | Required fields, slug uniqueness, media validation, active dependencies |
| ADM-08 Options | Add-ons, quantity, constraints, visibility/conflicts, scenario test | CRUD options/rules; POST validation scenarios | ServiceOption/OptionTranslation exist; rule model capability needs verification | catalog.option.read/write; configurator.test | Invalid/cyclic dependencies, conflicts, cardinality, quantity boundaries |
| ADM-09 Pricing | Rule versions, scenario testing, diff, approval/activation | CRUD pricing draft; POST scenarios/review/activate | PricingVersion/PricingRule exist | pricing.read/write/test/review/activate | Decimal arithmetic, stale version, approval gate, tax/discount policy unresolved |
| ADM-10 Requests | Search/filter/assign/transitions | GET request list/detail; PATCH assignment; POST transition | ServiceRequest/RequestEvent exist | requests.read/assign/transition | Cross-customer isolation, filters, valid state machine, audit event |
| ADM-11 Request detail | Snapshot, customer data, notes, contact log, quote, transition | GET detail; POST note/contact; POST quote; POST transition | Request snapshots/events, Customer, Quote records exist; notes/contact evidence needs review | requests.read; requests.note; quotes.create; requests.transition | Immutable snapshot, customer DTO redaction, event ordering, concurrency |
| ADM-12 Customers | Search/correct permitted contact data/order history | GET customers/detail; PATCH allowed fields | Customer exists; organization/membership missing | customers.read/update | PII minimization, role scope, cross-customer access, correction audit |
| ADM-13 Forms | Field editor, validation, ordering, helper text, preview/test | CRUD configurator draft/version; POST test; submit review | ConfiguratorVersion/Step/Field/Option missing | configurator.read/write/test; catalog.review/publish | Schema validation, conditional branches, locale, immutable published version |
| ADM-14 Content | FAQ/use cases/page text/media CRUD/publish | CRUD content; preview/review/publish | CMS/FAQ/CaseStudy/Media models missing | content.read/write/review/publish | Draft isolation, media access, locale, XSS, publication history |
| ADM-15 Languages | Translation completeness/review/publish | GET locale coverage; PATCH translations; POST locale review/publish | Existing category/service/option translations; broader translation revisions missing | localization.read/write/review/publish | Missing/stale translations, RTL/LTR, fallback policy |
| ADM-16 Users/roles | Invite/disable/roles/permissions | GET users/roles; POST invite; PATCH status; grant/revoke role | User/Role/Permission/RolePermission/UserRole exist | identity.user.read/manage; rbac.role.read/manage | Privilege escalation, grant ceiling, revocation, self-lockout, audit |
| ADM-17 Audit log | Search/filter actor/action/entity/time/before-after | GET audit search/detail | AuditEvent exists | audit.read | Tamper resistance, no secrets, scoped access, pagination |
| ADM-18 Settings/integrations | Currency/region/tax/email/gateway/integration test | GET/PATCH setting; POST connection test | Settings/integration/secret references missing | settings.read/write; integrations.manage | Secret redaction, approval gates, safe connection test, audit |
| ADM-19 Preview/publish | Diff, approval, publish, rollback | GET candidate diff; POST approve/publish/rollback | Version/review/publication records missing | catalog.review/publish/rollback; pricing.review/activate | Stale candidate, dependency change, idempotency, rollback, separation of duties |
| ADM-20 Reports/export | Date-filtered reporting and restricted export | GET report; POST export job/download | Analytics/export job models missing; source records partial | reports.read; reports.export | Scope enforcement, PII redaction, export audit, large-result controls |

## 4. Public journey cross-links

| Public screen | Required operation | Proposed API | Data dependencies | Required authorization / validation |
|---|---|---|---|---|
| PUB-01 Home | Read published content/services | GET published homepage/configuration | CMS and catalogue (partial) | Public-only published projection |
| PUB-02 Service listing | Search/filter/paginate published services | GET /public/services | Service/category/translations | Public published state only; bounded pagination |
| PUB-03 Service detail | Read service/options/configurator/pricing state | GET /public/services/:slug and configurator/pricing preview | Service/options exist; configurator missing; pricing draft exists | Server resolves eligible versions; no internal rule leakage |
| PUB-04 Cart | Read/update/remove/reprice items | GET/POST/PATCH/DELETE /cart | Cart/CartItem missing; ownership model open | Authenticated/session owner; every mutation revalidates |
| PUB-05 Request review | Validate answers/consent/contact and submit | POST /requests/validate; POST /requests | Request models exist; answer model missing | Principal/anonymous policy, server price, idempotency, consent |
| PUB-06 Confirmation | Show persisted reference/status | GET /requests/:publicReference/confirmation | ServiceRequest exists | Non-secret reference; success only after transaction commit |
| PUB-07 Tracking | Verify reference and disclose minimal status | POST verification; GET tracking | Request/event exist; verification challenge policy open | Anti-enumeration, rate limit, no private details |
| PUB-13 Contact | Submit consultation/contact | POST /public/contact | ContactSubmission missing | Rate limit, spam controls, consent and retention |
| PUB-14 Policies | Read approved legal text | GET /public/policies/:slug | CMS/policy revision missing | Published approved revision only |

## 5. Proposed permission namespace (not approved)

Candidate keys should be treated as names for a future permission catalogue, not permissions that currently exist in the database or have been assigned to roles.

- `dashboard.read`
- `cms.page.read/write/archive/review/publish`
- `design.read/write/publish/rollback`
- `catalog.category.read/write`
- `catalog.service.read/write/archive`
- `catalog.option.read/write`
- `catalog.package.read/write`
- `configurator.read/write/test`
- `pricing.read/write/test/review/activate`
- `requests.read/assign/note/transition`
- `customers.read/update`
- `quotes.read/create/revise`
- `content.read/write/review/publish`
- `localization.read/write/review/publish`
- `identity.user.read/manage`
- `rbac.role.read/manage`
- `audit.read`
- `settings.read/write`
- `integrations.manage`
- `reports.read/export`

The current guard supports all-of semantics: every permission listed in `RequirePermissions(...)` must be present. Do not encode alternatives as multiple arguments. If any endpoint needs any-of semantics, define and test an explicit policy decorator/guard contract rather than relying on ambiguous metadata.

## 6. API conventions required before implementation

- Public routes must be explicitly marked public and return only published, customer-safe projections.
- Protected routes must declare permissions; missing metadata remains denied.
- Authentication must populate a verified principal before the guard; untrusted body/query/header fields cannot supply permissions.
- Use DTO validation and bounded pagination/filtering.
- Mutations require explicit state-machine validation and concurrency/version checks.
- Use idempotency keys for externally retryable create/submit/publish operations.
- Use decimal-safe monetary DTOs; do not accept browser totals as authoritative.
- Customer ownership must be enforced in database query predicates, not post-filtered after broad retrieval.
- Audit state-changing commercial and privileged operations.
- Avoid returning raw Prisma records; map to explicit role-specific DTOs.
- Do not expose internal notes, staff-only metadata, provider credentials or AI execution traces to customers.

## 7. Priority implementation sequence

1. Resolve and implement trusted authentication/session principal.
2. Approve account model and explicit customer ownership relations.
3. Complete database-backed permission resolution and role/permission seed policy.
4. Implement request/customer read APIs with cross-account isolation tests.
5. Implement quote and request lifecycle APIs with immutable evidence.
6. Implement catalogue/options and configurator versioning/review.
7. Implement pricing test/approval/activation separately from public pricing.
8. Implement cart and atomic request submission after owner/session policy is approved.
9. Implement CMS, localization, publication and audit views.
10. Implement projects, workflow, support, hosting, finance, AI and integrations as separate traceable domains.

## 8. Acceptance gate

A row becomes implementation-complete only when its API, persistence, permission policy, positive/negative/edge tests and evidence commit are all present and verified. A visual scaffold, Prisma model, generic guard test, or design document alone does not satisfy that gate.

**Current decision: traceability baseline only. No API, permission seed, role assignment, schema or UI behavior is changed by this document.**
