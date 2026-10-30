# Admin UI Route and Acceptance Evidence Checklist — Draft v1.0

- Date: 30 October 2026
- Branch: `implementation/bootstrap`
- Source baseline: `docs/requirements/SCREEN_AND_FLOW_CATALOG.md`, `docs/traceability/SCREEN_API_PERMISSION_DATA_TEST_MATRIX.md`, current `apps/admin/src/app` route tree and page components.
- Status: **Code inspection only. No browser run, screenshot comparison, API integration or functional acceptance is claimed.**

## 1. Observed route architecture

| Route | Current implementation | Source screen mapping | Current state |
|---|---|---|---|
| `/` | Dedicated owner command center | ADM-02 | UI scaffold with placeholders; no real metrics |
| `/customers` | Dedicated customer directory | ADM-12 | UI scaffold; unconnected data; actions disabled |
| `/requests` | Dedicated request inbox and lifecycle explainer | ADM-10 | UI scaffold; no records/API |
| `/requests/[requestId]` | Dedicated request detail | ADM-11 | Displays route ID only; no database lookup; actions disabled |
| `/[module]` | Shared generic module landing page | Broader workspace; partial ADM-03..20 | Scope statement only; no domain-specific controls/data |
| `/notifications` | Generic module landing page | Workspace notification center | Scope statement only; not a functional notification inbox |

The shared `[module]` route statically enumerates 14 modules: customers, requests, projects, portal, support, workflows, ai-team, team, catalog, hosting, finance, website, reports, settings and notifications. The dedicated `/customers` and `/requests` routes take precedence for those paths. The 15th workspace is the dedicated home route.

The navigation currently links to the 15 company workspace areas. Several other links (for example deeper project, support, notification or settings subroutes) are not demonstrated as dedicated functional screens by this route inventory.

## 2. Admin UI acceptance checklist

### ADM-02 — Owner command center (`/`)

- [ ] All 15 workspace links resolve to the intended destination.
- [ ] Metrics load from authorized API aggregates; no placeholder dash remains after data connection.
- [ ] Every metric links to a matching filtered source view.
- [ ] Loading, empty, partial failure and service outage states are distinct.
- [ ] Operational alerts show severity, source, timestamp, owner and required action.
- [ ] Owner-only governance controls are server-authorized, not merely visually hidden.
- [ ] Mobile/tablet layouts, keyboard navigation and RTL are verified.

### ADM-10 — Request inbox (`/requests`)

- [ ] Server-side search, filtering, sorting and pagination.
- [ ] Columns and status labels derive from canonical request DTO/state machine.
- [ ] Assignment and state transitions require permissions and valid transition rules.
- [ ] Customer and financial fields are minimized by role.
- [ ] Empty/loading/error states and no-results state are separately tested.
- [ ] Export is separately authorized and audited if introduced.
- [ ] No client-side state mutation can bypass server rules.

### ADM-11 — Request detail (`/requests/[requestId]`)

- [ ] Server loads record by ID and returns not-found without leaking existence across accounts.
- [ ] Authorization and ownership checks occur before returning customer or financial fields.
- [ ] Original request, option and price snapshots are immutable.
- [ ] Quote versions, decisions and change requests appear in correct chronology.
- [ ] Internal notes are never returned in customer-facing DTOs.
- [ ] Every transition/note/contact/quote action records actor, timestamp and audit evidence.
- [ ] Concurrency, duplicate submission and idempotency behavior are tested.
- [ ] Invalid, malformed and unauthorized route identifiers are handled safely.

### ADM-12 — Customer directory (`/customers`)

- [ ] Search and filters are server-side and scoped by staff permission.
- [ ] Customer 360 aggregates only authorized requests/projects/quotes/contracts.
- [ ] Customer/account ownership semantics are approved before organization membership implementation.
- [ ] Contact corrections are validated, reasoned and audited.
- [ ] Cross-customer ID substitution is denied for list, detail, export and mutation.
- [ ] Sensitive fields and internal notes are omitted from unauthorized DTOs.

### Generic module routes

Each generic module currently provides title, description and scope only. Before calling any one of these screens implemented, replace the generic landing with a domain-specific acceptance-backed UI.

| Workspace | Required next dedicated screen(s) | Blocking data/API/security dependencies |
|---|---|---|
| Projects | Project list, project detail, plan/stages/tasks, release and approval views | Project/task/release models, ownership, workflow API, approval gates |
| Customer portal | Authenticated account home, requests, project, files, quote decisions | Auth/session, approved customer account model, ownership isolation |
| Support | Ticket inbox/detail, communication timeline, SLA/escalation | Ticket/message/SLA models, customer-safe DTOs, notification delivery |
| Workflows | Workflow catalogue/version editor, execution monitor, retry/dead-letter | Workflow definitions/runs, signed webhook boundary, worker permissions |
| AI team | Agent registry, task queue, run detail, approval/cost controls | Agent/task/run/tool policy models, budget and human approval gates |
| Team | Staff directory, role/permission editor, delegation history | Auth identity, approved RBAC model, grant ceilings and audit |
| Catalogue | Categories/services/options/packages and immutable version workflow | Catalogue API, configurator schema/versioning, pricing review/publish |
| Hosting | Reseller account, client allocations, domains, renewals, backup evidence | Hosting/domain/credential reference models, provider integration boundary |
| Finance | Invoices, payment ledger, reconciliation, refunds/adjustments | Currency/tax/accounting policy, finance models, separation of duties |
| Website | CMS pages, locale editor, design tokens, preview/publish/rollback | CMS revisions/media, publication approvals, safe asset storage |
| Reports | Source-defined reports, filters, drill-down and export jobs | Governed aggregates, row-level scope, export audit |
| Settings | System policies, integrations, secrets references, backup/restore, audit | Secret manager, integration registry, owner gates, audit/security events |
| Notifications | Inbox, read/unread, routing, delivery attempts, retry | Notification/outbox models, channel integrations, idempotency |

## 3. Navigation and usability checks

- [ ] Active navigation state works for nested paths, not only exact root equality.
- [ ] Every navigation target resolves; no dead links or placeholder routes presented as operational features.
- [ ] Search and notification controls are either functional or clearly marked unavailable (never imply functionality).
- [ ] Workspace switcher and owner identity are real authenticated context, not hard-coded labels.
- [ ] Sidebar and mobile navigation expose current location accessibly.
- [ ] Responsive overflow, long Arabic labels and keyboard focus are tested.
- [ ] Every screen includes consistent breadcrumbs, page title, status context and return path.
- [ ] No fake counts, customer records, project activity or financial values.

## 4. Evidence required to advance status

For every screen, store:
1. Requirement IDs and source reference.
2. Route and component paths.
3. API contract and endpoint implementation commit.
4. Data model/migration references.
5. Permission keys and authorization policy.
6. Positive, negative, edge, failure and ownership-isolation test IDs.
7. Browser test run and screenshots for desktop/tablet/mobile where visual acceptance is required.
8. CI run URL/ID and conclusion.
9. Known gaps and owner acceptance record.

Status progression:
- Designed → screen structure and interactions reviewed.
- In implementation → code exists but acceptance incomplete.
- Implemented — unverified → implementation exists, evidence incomplete.
- Verified in local test → automated/manual local evidence recorded.
- Verified in staging → isolated staging verification with test data.
- Accepted → explicit owner acceptance for defined scope.

## 5. Current assessment

- Admin navigation shell: **Implemented — unverified**.
- Owner command center: **Implemented — unverified** (truthful placeholders, no operational metrics).
- Customer directory: **Implemented — unverified** (unconnected scaffold).
- Request inbox: **Implemented — unverified** (unconnected scaffold).
- Request detail: **Implemented — unverified** (route-param display and scaffold only).
- Remaining workspace modules: **Designed/scaffolded only** (shared generic landing page).
- Authentication, real staff identity, data APIs, browser E2E, visual screenshot comparison and staging: **Not implemented/verified**.

No screen is classified as Accepted or production-ready by this inspection.
