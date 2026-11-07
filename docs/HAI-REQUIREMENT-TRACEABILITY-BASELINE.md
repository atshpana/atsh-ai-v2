# HAI Requirement Traceability Baseline — v1

**Date:** 2026-11-07  
**Source of requirements:**  
1. `ATSH_AI_المرجع_التنفيذي_الثابت_الشامل_v2_0.docx` — governing functional reference.  
2. `ATSH_AI_المرجع_الأم_الشامل_المستقل_v1_0.docx` — parent scope and product framing.  
3. `ATSH_AI_مرجع_معمارية_خط_الإنتاج_والعقل_المركزي_v1_1.docx` — production-line execution and safety controls.

**Hierarchy:** fixed executive reference v2.0 first, HAI master second, architecture v1.1 for operational detail. This document extracts and organizes requirements; it does not amend the source references or resolve undecided business choices.

**Audit baseline:** application source revision `ebeabf4de468783d0cc7fc68b0738abc17d4054b`. This is repository-source evidence only, not proof of live deployment or server state.

## Status vocabulary

- **Scaffold:** route/UI exists but operational behavior or connected data is absent.
- **Partial:** some source implementation exists, but end-to-end acceptance is not evidenced.
- **Not evidenced:** no implementation found in the inspected source baseline.
- **Unknown:** requires Phase 0/1 live environment evidence or further source inspection.
- **Decision pending:** source explicitly leaves the policy/configuration unresolved.

A requirement is not complete until implementation, server-side authorization/validation, automated tests, evidence and HAI traceability are present.

## 1. Public customer experience

| Requirement ID | Requirement from v2.0 | Baseline evidence | Status | Acceptance evidence required |
|---|---|---|---|---|
| PUB-01 | Home: hero, value, CTA, categories, selected services, work method, verified metrics | Static public page/content exists | Partial | Responsive Arabic/English rendering; CMS-backed sections; metrics sourced from verified data |
| PUB-02 | Service catalog with search, filters, sorting, categories and empty states | Static service catalog definitions exist | Partial | Published-only API, filters/search/sort, loading/empty/error states |
| PUB-03 | Service details: scope, deliverables, exclusions, pricing type and options | Static service definitions | Partial | Localized service API and complete detail view |
| PUB-04 | Service configurator with options, quantity, compatibility and live estimate | No end-to-end configurator evidenced | Not evidenced | Server-validated options and reproducible price-preview tests |
| PUB-05 | Multi-service cart; edit options/quantities; separate one-time and recurring charges | Cart schema exists; functional customer flow not evidenced | Schema only | Cart API, expiry, validation, totals and recurring-charge tests |
| PUB-06 | Customer details limited to required contact/project information | No complete submission flow evidenced | Not evidenced | Data-minimization rules, validation, consent and retention tests |
| PUB-07 | Order review with line items, price, currency and approved tax/discount rules | No complete review flow evidenced | Not evidenced | Server-recalculated summary; no client-trusted totals |
| PUB-08 | Submission confirmation with reference, status and follow-up instructions | Order schema exists | Schema only | Idempotent order creation and confirmation response |
| PUB-09 | Order tracking through a valid secret token | Token schema exists; endpoint/UI not evidenced | Schema only | Hashed token, expiry/revocation, rate limit, no token logging |
| PUB-10 | Work-method explanation and customer review/approval points | Static explanatory content exists | Partial | CMS-controlled, accurate workflow and stage content |
| PUB-11 | Case studies with original, verified and authorized claims | Not verified in source audit | Unknown | Evidence and publication authorization per case study |
| PUB-12 | Managed FAQ categorized by domain | Static content/CMS behavior not proven | Partial/Unknown | CMS-backed localized FAQ and publication workflow |
| PUB-13 | Contact/consultation form protected from spam | No complete backend submission flow evidenced | Not evidenced | Server validation, anti-abuse, consent, retention and audit |
| PUB-14 | About page with factual company history/values/experience | Static content exists | Partial | Owner-verified claims and CMS control |
| PUB-15 | Published privacy/terms versions and effective dates | No legal publication workflow evidenced | Not evidenced | Approved content version, effective date and release gate |
| PUB-16 | 404, maintenance, loading, error and forbidden states | Generic framework behavior only; complete UX not verified | Unknown | Route/state tests and no fabricated fallback metrics |

## 2. Administration and access control

| Requirement ID | Requirement from v2.0 | Baseline evidence | Status | Acceptance evidence required |
|---|---|---|---|---|
| ADM-01 | Role-aware dashboard, metrics and alerts | Dashboard scaffold explicitly reports unconnected data | Scaffold | Live authorized metrics, freshness, alert routing and no fake zero values |
| ADM-02 | Manage pages, blocks and content | Planned module shell only | Scaffold | CRUD, validation, localization and audit |
| ADM-03 | Draft, preview, publish and restore | No complete publish lifecycle evidenced | Not evidenced | Versioned drafts, preview, approval, publish and restore tests |
| ADM-04 | Media/assets management | Not evidenced end-to-end | Not evidenced | Safe upload, validation, storage permissions, alt text and audit |
| ADM-05 | Categories and translations | Schema foundation; no connected API evidenced | Schema only | CRUD, locale fallback and publication tests |
| ADM-06 | Services, scope and deliverables | Static catalog; admin CRUD not evidenced | Partial | Versioned service management and public API consistency |
| ADM-07 | Options, constraints and compatibility | Schema foundation only | Schema only | Server-side option compatibility validation |
| ADM-08 | Pricing rules and versions | Schema foundation only | Schema only | Versioned deterministic pricing engine and regression tests |
| ADM-09 | Currency, recurring charges and approved tax | Business decisions remain open | Decision pending | Owner-approved currency/tax/rounding policy and tests |
| ADM-10 | Support-only cart inspection | No connected feature evidenced | Not evidenced | Limited support access; immutable historical price evidence |
| ADM-11 | Order list/search/filters | Request screen scaffold; data disconnected | Scaffold | Authorized paginated API, filters and tests |
| ADM-12 | Order detail, events and notes | Request detail says it does not fetch a DB record; actions disabled | Scaffold | Event history, notes, RBAC and allowed state transitions |
| ADM-13 | Quote creation under delegation limits | Quote models exist; workflow not evidenced | Schema only | Immutable quote version, delegated limits and audit |
| ADM-14 | Quote versions and approvals | Version schema exists; customer decision flow not evidenced | Schema only | Approval bound to exact quote version |
| ADM-15 | Customers and data requests | Customer screen says DB unconnected; actions disabled | Scaffold | Customer profile, consent/data requests, least-privilege access |
| ADM-16 | Forms and submissions | Schema foundation only | Schema only | Form builder, protected submission and retention controls |
| ADM-17 | Discounts and conditions | Discount schema exists; enforcement not evidenced | Schema only | Limits, eligibility, redemption race tests and audit |
| ADM-18 | Users and roles; owner-only administration | Permission guard primitive exists; auth/session establishment not evidenced | Partial | Working identity provider/session, role assignment and negative RBAC tests |
| ADM-19 | Settings/integrations; secrets hidden after save | Integration schema exists; secure secret-reference lifecycle not verified | Schema only/Unknown | Secret manager reference, masked readback, connection test and audit |
| ADM-20 | Audit, reports and backup evidence | Audit/backup schema exists; operational evidence not verified | Schema only/Unknown | Append-only audit, report permissions and actual restore evidence |

## 3. Roles and authorization requirements

| Role | Required boundary from v2.0 | Baseline status |
|---|---|---|
| Owner | All authorized capabilities, user administration and sensitive settings | Not end-to-end verified |
| Site Manager | Pages, content, media and publishing within delegated scope | Not end-to-end verified |
| Catalog/Pricing Manager | Services, options, pricing rules and charges | Not end-to-end verified |
| Sales | Orders, customers and quotes; no infrastructure permissions | Not end-to-end verified |
| Operations/Support | Delivery-stage updates and communication; cannot alter approved prices | Not end-to-end verified |
| Reports Only | Read only explicitly permitted reports | Not end-to-end verified |

Authorization must be enforced server-side for every record and action. Direct URL access, cross-customer identifiers, export, approval, publish and privileged mutations require negative tests. A UI-hidden button is not authorization.

## 4. Order lifecycle and commercial APIs

| Requirement ID | Requirement | Contract/guardrail from v2.0 | Baseline status |
|---|---|---|---|
| API-CAT-01 | `GET /api/catalog/categories`, `GET /api/catalog/services` | Published items only; locale and filters | Not evidenced |
| API-CAT-02 | `GET /api/catalog/services/{slug}` | Valid options only; no secrets | Not evidenced |
| API-PRICE-01 | `POST /api/pricing/quote-preview` | Estimate only; must not create official quote | Not evidenced |
| API-CART-01 | `POST/PATCH/DELETE /api/cart/items` | Server validation | Not evidenced |
| API-ORDER-01 | `POST /api/orders` | Recalculate server-side, idempotency key and immutable snapshot | Not evidenced |
| API-TRACK-01 | `POST /api/orders/track` | Secret token, rate limit, never log raw token | Not evidenced |
| API-ADMIN-01 | `GET/PATCH /api/admin/orders/{id}` | RBAC, allowed transitions and audit events | Not evidenced |
| API-QUOTE-01 | Quote create/accept endpoints | Immutable versions; acceptance bound to exact version | Not evidenced |
| API-CMS-01 | Page version and publish endpoints | Permission, preview and validation | Not evidenced |

Required order states are exactly: `submitted`, `pricing_pending`, `quote_sent`, `awaiting_customer`, `approved`, `in_progress`, `awaiting_review`, `completed`, `rejected`, `cancelled`. Transitions require server-side policy, actor, reason where applicable, and an audit event. Approval must refer to a specific quote version.

## 5. Data entities and integrity

The v2.0 reference groups logical entities into identity, catalog, cart, orders, quotes, tracking, finance, content, forms and operations. The existing Prisma schema is a foundation only; do not infer production deployment or database compatibility from schema presence.

Mandatory integrity rules:
- Preserve historical order-item, option and price snapshots.
- Store only hashes of tracking tokens; raw tokens are returned once and never logged.
- Sent/accepted quote versions are immutable.
- Published page pointer must reference a published version.
- Pricing rule JSON must have a versioned schema.
- Order submission uses idempotency protection.
- Currency, tax, rounding, payment and invoice policies remain disabled/unfinalized until approved.
- Database compatibility and migrations require Phase 0/1 inspection and staging validation. Never apply draft SQL directly to core-db.

## 6. HAI product modules from the parent scope

The parent HAI reference and detailed administration specification expand beyond the public request funnel. The following are product-level requirement families; detailed screen IDs are retained where present in the source documents.

| Family | Source identifiers / scope | Current evidence boundary |
|---|---|---|
| CRM | CRM-01…CRM-04: customer center, list, profile, communications | Not end-to-end verified |
| Sales | SAL-01…SAL-07: orders, detail, carts, quotes, quote versions, contracts/approvals, pipeline | Scaffold/schema only |
| Projects | Project overview, plan, stages/tasks, team, QA, files, preview/releases, approvals, change requests, delivery, audit | Not end-to-end verified |
| Workflow | WF-01…WF-12: workflow center, templates, visual designer, stage/task editors, assignment, gates, escalations, monitoring, audit, simulation, versions | Engine has durable job primitives; product workflow designer/lifecycle not evidenced |
| AI team | AI-01…AI-10: AI leadership, agent directory/factory, tasks, providers, tools, collaboration, QA, logs, cost | Partial engine foundation only; no complete admin product |
| Team/security | TEAM-01…TEAM-10: employees, invitations, roles, permission editor, project permissions, delegation, sessions, permission audit | Authorization primitive only; full identity/admin flows not evidenced |
| Design/CMS | DSN-01…DSN-10: design center, brand editor, page/section editor, media, components, admin theme, device preview, publishing, versions/restore | Not evidenced end-to-end |
| Customer portal | CP-01…CP-06 and CPS-01…CPS-05: portal configuration, members, entitlements, product spaces and versions | Not evidenced end-to-end |
| Customer AI | CAI-01…CAI-04: requirements assistant, customer portal assistant, knowledge management, quality/escalation | Not evidenced |
| Support | SUP-01…SUP-06: ticket center, queue, ticket, assignment/escalation, SLA, knowledge base | Not evidenced |
| Hosting | HST-01…HST-08: hosting center, accounts, domains/DNS, plans/capacity, backup/restore, migration, renewals, incidents/cancellation | Not evidenced end-to-end |
| Finance | FIN-01…FIN-06: contract schedules, project installments, reconciliation, invoices, receivables, financial reports | Not evidenced end-to-end |
| Reviews | REV-01…REV-06: review center, feedback packs, classification, remediation, two revision rounds, final approval | Not evidenced end-to-end |
| Reports | Sales, projects, team, AI quality/cost, finance, website analytics | Not evidenced end-to-end |
| Settings/security | Company settings, integrations, backup, audit, release/version governance | Not evidenced end-to-end |

**Important:** the parent reference's scope is not permission to invent unresolved business policies. Payment provider, tax/invoice policy, contract e-signature, payment schedules, communications providers, privacy retention, financial delegation limits and final role matrix remain decisions requiring approval.

## 7. Production-line requirements (architecture v1.1)

| Requirement ID | Required behavior | Baseline status |
|---|---|---|
| PL-INTAKE-01 | Immutable HAI/specification source with version and hash | Not implemented |
| PL-ANALYZE-01 | Extract functional/nonfunctional requirements, screens, roles, rules, integrations and acceptance criteria; log open questions | Not implemented |
| PL-PLAN-01 | Produce versioned plan, dependencies, risks and estimated budget; require plan approval before execution | Partial planning primitives; no full lifecycle |
| PL-GIT-01 | Create governed work branches/PRs with restricted token; no engine merge to main | Read-only GitHub integration only |
| PL-SANDBOX-01 | Real isolated build/test runtime; non-root, no host/core-db access, resource bounds, cancellation and explicit network policy | Contract only; no runtime backend |
| PL-TEST-01 | Unit, integration, UI, security and specification-conformance tests; stop on repeated failure | Not implemented end-to-end |
| PL-PREVIEW-01 | Non-production preview without secrets or unauthorized production data | Not implemented |
| PL-CHANGE-01 | Classify feedback as defect, scope change or improvement; estimate impact and update plan | Not implemented |
| PL-APPROVAL-01 | Persist approvals bound to exact version/commit, approver, timestamp and scope | Not implemented/unknown in live DB |
| PL-RELEASE-01 | Deploy only with same-version approval, recent backup, restore evidence, rollback plan and health checks | Not implemented |
| PL-HANDOVER-01 | Secure handover of access, release/environment records, backup and support instructions | Not implemented |
| PL-ORCH-01 | n8n coordinates triggers/integrations/notifications; durable business state stays in engine DB | Partial draft adapter only |
| PL-AUDIT-01 | Record decisions, actor, model/tool, inputs/outputs, cost, status and reason with redaction | Partial engine event foundation; coverage incomplete |
| PL-SPEND-01 | Per-task budgets, retry caps, alerts and stop on budget exhaustion | Not verified end-to-end |
| PL-DB-01 | Read-only inventory of existing services/databases and safe mapping before integration | Not verified; live Phase 1 incomplete |
| PL-CORE-01 | Protect existing core-db; no Build Worker network/credentials; staging copy for compatibility testing | Policy documented; live network enforcement unknown |

## 8. Cross-cutting acceptance gates

1. **Identity and isolation:** authenticate users and enforce server-side authorization; prove customer-to-customer isolation and deny direct-ID access.
2. **Data correctness:** server-side validation/calculation, immutable commercial snapshots, idempotency and safe state transitions.
3. **Publication:** draft/preview/review/publish/version/restore; publishing requires the appropriate role and recorded approval.
4. **Customer trust:** no fabricated claims, prices, metrics, SLA, taxes, legal text or hosting status. Undecided values remain visibly pending and are not presented as active offers.
5. **Security:** secrets outside source/logs, masked integration settings, token hashing, rate limiting, upload controls and audit.
6. **Resilience:** explicit loading/empty/error/forbidden/stale states; bounded retries and safe cancellation.
7. **Release:** preview and test evidence tied to commit; production approval tied to exact release SHA; backup/restore and rollback evidence.
8. **Traceability:** every requirement ID links to implementation paths, API/schema, roles, automated test and evidence. Missing links remain open.

## 9. Immediate execution boundary

The production-line architecture v1.1 mandates Phase 0 protection and Phase 1 environment inspection, and explicitly prohibits build/architecture execution changes before the Phase 1 report is reviewed and approved. The current Phase 1 evidence report is partial and the phase is **INCOMPLETE — NOT READY**.

Therefore, this traceability baseline is a safe documentation deliverable only. Do not begin the customer-product vertical slice, real sandbox backend, production database integration, migrations, or deployment until the required phase gate is satisfied. Continue safe repository/documentation review only. Owner-confirmed readiness is not a substitute for independent live evidence where the architecture requires verification.

## 10. Next task

**GATE-01 — Complete and review Phase 0/1 evidence.** Required evidence includes current backup integrity and restore test, sanitized staging availability, actual Coolify service inventory, worker/n8n runtime configuration, database inventory and ownership/permissions, GitHub rules/CI state, secret presence/scope without revealing values, network isolation, and approvals table/schema status. No secret values should be requested or recorded. If the connected environment cannot expose read-only evidence, record the exact evidence gap and the safe owner action needed.

