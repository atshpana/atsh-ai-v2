# Screen, Flow and Acceptance Catalogue — Executive Reference v2.0

This catalogue is extracted from the supplied 143-page Executive Reference v2.0. It preserves the reference's identifiers and functional intent. It is a working implementation index, not a replacement for the source document. Additional requirements in the main reference and appendices remain binding.

## 1. Public website screen inventory

| ID | Screen | Required content and actions | Required states / controls |
|---|---|---|---|
| PUB-01 | Home | Header, hero, service sections, how-we-work, use cases/real offers, selected FAQs, contact CTA, footer; explore services, configure request, request consultation | Loading, content available, section-load error |
| PUB-02 | Service listing | Search, category, filters, sort, service cards, pagination/load more; open service, add to cart | No results, no published services, network error |
| PUB-03 | Service detail | Name, description, benefits, scope, deliverables, options, pricing, terms, related questions; select options, add to cart or request quote | Fixed price, starting price, custom quote, unavailable |
| PUB-04 | Cart | Multiple line items, options, quantities, remove, financial summary, recurring/non-final fee notices; edit, continue, clear with confirmation | Empty cart, server price revalidation, invalidated option |
| PUB-05 | Request details/review | Unambiguous order summary, contact details, project details, required consents, preferred contact method; validate and submit securely | Field errors, submitting, save failure, success with reference |
| PUB-06 | Request confirmation | Public reference, request summary, initial status, next-step instructions; copy reference, open tracking | Never show success before server confirms persistence |
| PUB-07 | Request tracking | Reference input, verification, simplified status, permitted last update | Invalid/not-found reference; no private data disclosure |
| PUB-08 | How we work | Discovery, scope, prototype, implementation, testing, approval and handover | Editable content |
| PUB-09 | Use cases | Search, filters by industry/problem, case cards, related services | No results, unpublished case |
| PUB-10 | Use-case detail | Problem, approach, expected outcome, requirements, suggested services; request assessment/service | Do not state unverified performance results as facts |
| PUB-11 | Demos | Real demos, prerequisites, limits, contact form where needed; launch demo/request demo | Unavailable, integration failure, microphone permission denied if voice demo exists |
| PUB-12 | FAQ | Categories, optional search, expandable questions; open answer/contact support | No results |
| PUB-13 | Contact/consultation | Name, contact method, optional company, interest type, details, required consent; submit | Validation, rate limit, success/failure |
| PUB-14 | Privacy/terms | Approved policies, updated date and contact method; read/print | No publication before review/approval |
| PUB-15 | 404/general error | Clear message, home link, non-sensitive support ID; return/retry | Never expose stack traces or secrets |

## 2. Internal administration screen inventory

| ID | Screen | Required operations | Required controls / acceptance |
|---|---|---|---|
| ADM-01 | Sign-in | Email/username, password, secure recovery, MFA if approved | Authentication and rate limiting |
| ADM-02 | Home/metrics | New requests/statuses, recent activity, real-data metrics | Time filters; each metric links to filtered details |
| ADM-03 | Pages | Page list, draft/published status, locale, last edit | Create, edit, archive, preview |
| ADM-04 | Page/section editor | Arrange approved sections, text, images, links, visibility, preview | Save draft, preview, request approval, publish |
| ADM-05 | Identity/design | Logo, colors, fonts, buttons, spacing, RTL/LTR | Preview and rollback |
| ADM-06 | Categories | Name, description, image, ordering, publish state, translations | Create, edit, archive |
| ADM-07 | Services | Service details, pricing type, state, media, locale | Create, edit, duplicate, archive |
| ADM-08 | Service options | Add-ons, quantities, constraints, visibility and conflict rules | Test rule scenarios before activation |
| ADM-09 | Pricing rules | Base/unit/recurring/custom prices, discounts, fees, tax, rule version | Test examples, compare before/after, approve and activate |
| ADM-10 | Requests | Search, filters, status, date, reference, value, assignee | Open details and authorized state transitions |
| ADM-11 | Request detail | Immutable line/price snapshot, customer details, internal notes, event history | Request information, log contact, quote, transition |
| ADM-12 | Customers | Necessary contact data and permitted order history | Search/correct according to permissions and privacy |
| ADM-13 | Forms | Fields, type, required, validation, ordering, helper text | Preview and test before publish |
| ADM-14 | Content | FAQ, use cases, page text, media | Draft/publish and ordering |
| ADM-15 | Languages | Translation fields, completion state and direction | Review and publish locale |
| ADM-16 | Users/roles | Accounts, roles, permissions, account status | Invite, disable, privileged role change |
| ADM-17 | Audit log | Actor, action, entity, time, before/after | Search/filter; generally read-only |
| ADM-18 | Settings/integrations | Currency, region, tax, email, gateways, integrations | Protected changes and connection tests without exposing secrets |
| ADM-19 | Preview/publish | Change list, diff, approvals, release history | Publish or rollback according to role |
| ADM-20 | Reports/export | Reports from known sources, restricted exports | Date range, authorized download, audit event |

## 3. Broader administration workspace modules

The administration workspace must also cover the approved operating model and detailed reference appendices:
1. Command center and owner workspace customization.
2. Customers and organizations.
3. Requests, sales, quotes and contracts.
4. Projects, plans, stages, tasks and delivery.
5. Customer portal and contracted product operations.
6. Support and customer communication.
7. Workflows and automation.
8. AI manager and specialized agents.
9. Employees, roles, permissions and delegations.
10. Services, packages, options and pricing versions.
11. Hosting, domains, renewals and backup status.
12. Finance, invoices, payments and reconciliation.
13. Website content, SEO, design tokens and visual editor.
14. Reports and analytics.
15. Settings, integrations, security and audit.

The screen IDs above are a source-derived base inventory. The broader modules include additional screens that must be decomposed before their implementation.

## 4. Core public request flow

1. Home → service list/search → service details.
2. Select service options; validate visibility/constraints and display price or quote-required state.
3. Add to cart; show non-blocking confirmation and update cart indicator.
4. Open cart; edit options/quantities or remove lines; recalculate.
5. Continue; server revalidates service availability, option validity and prices.
6. If price changed, display the delta and obtain customer confirmation before committing.
7. Enter contact details and review terms and full summary.
8. Submit; create request/reference and immutable line/price snapshot in one transaction.
9. Show confirmation only after successful persistence; then allow tracking.

## 5. Conditional pricing flow

- Each option has a documented type, price, constraints and visibility conditions.
- Changing an option recalculates related rules and removes/flags newly invalid options.
- Show line-level base price, options/add-ons, quantity, one-time fees and recurring fees separately.
- Apply discounts by documented priority and conditions, then taxes according to the approved policy.
- The server is authoritative and calculates against a known pricing-rule version.
- If calculation fails, do not allow submission with a stale total.
- Money uses decimal/numeric representation, never floating point.

## 6. Administration request-review flow

1. Authorized staff member opens the request list and selects a request.
2. Staff sees the original financial snapshot, necessary customer data and state history.
3. Staff may add internal notes, request more information or prepare an alternate quote; the original request snapshot is not edited.
4. State transitions are validated server-side and create an order event and audit entry.
5. Revised quote creates a new quote version; it does not silently overwrite prior history.
6. After customer acceptance through an approved mechanism, move the request to the next valid state.

## 7. Content publication flow

1. Editor opens a draft separate from the live version.
2. Save changes and preview desktop/mobile and supported locales.
3. Validate links, required fields, images and permissions.
4. Authorized user approves publication; record version, actor and timestamp.
5. Authorized rollback restores an earlier version and records the action.

## 8. Project delivery lifecycle

- Review request and determine whether scope is clear; request more information or prepare a custom quote when needed.
- After customer acceptance and required contract/payment gates, create a project and plan with stages, tasks, dates and owners.
- For software delivery: analyze client specification, create a new GitHub repository, implement, independently review code, test, and create preview/staging.
- Present preview to customer and collect revisions in a traceable log; retest after changes.
- Obtain explicit customer approval for a specific final version and scope before production deployment.
- Deploy to authorized GitHub/hosting targets; verify health, links and functions; confirm backup arrangements.
- Handover agreed access/documentation and define support, maintenance and hosting where contracted.

## 9. Acceptance rules that must be testable

- Never show a successful request before the server confirms save.
- Never trust browser-supplied price or customer/project ownership.
- Preserve immutable order/quote snapshots and version history.
- State changes follow a server-side state machine and permission checks.
- A customer cannot access another customer's records by changing an ID or URL.
- Exports have a separate permission and create audit events.
- Secret values never appear in admin screens, logs, public settings or API responses.
- Publication and production deployment have explicit approval gates.
- Every important state transition has actor, time and evidence in its event/audit history.
- Responsive, keyboard, RTL/LTR and loading/error/empty states are part of acceptance, not optional polish.

## 10. Traceability follow-up

For each row and flow above, create a stable requirement ID and link it to:
- Source paragraph/section in Executive Reference v2.0.
- Screen/component and user role.
- API endpoint and domain operation.
- Data entities and constraints.
- Permission rule.
- Positive, negative, edge and failure tests.
- Evidence and implementation commit SHA.

Do not claim complete reference compliance until this detailed traceability and test evidence exists.
