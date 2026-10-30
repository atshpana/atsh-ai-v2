# Domain Management Module — Approved Functional Specification v1.0

- Product: ATSH AI
- Module key: `domains`
- Status: **Owner decisions approved; functional/technical specification baseline. Implementation not yet verified.**
- Repository: `atshpana/atsh-ai-v2`
- Target branch: `implementation/bootstrap`
- Architecture: Next.js + NestJS modular monolith + PostgreSQL/Prisma + n8n orchestration.
- Authority: Executive Reference v2.0, Implementation Continuity Guide v1.0, and the owner's explicit decisions recorded on 30 October 2026.
- Scope: customer domain selection, registration, transfer, DNS connection, renewals, customer ownership and administration.

## 1. Binding owner decisions

| Decision | Approved value | Binding rule |
|---|---|---|
| Package domain policy | `both` | Some packages may include an eligible domain entitlement; other packages offer domain registration as a separately priced add-on. The package configuration, not frontend assumptions, determines eligibility. |
| Ownership and management | `client` | The customer is the registrant and legal owner. ATSH may place/manage the order and administer DNS/renewals only under recorded customer authorization. The customer must retain the ability to access, transfer and recover the domain. |

### 1.1 Rules that follow from these decisions

1. Domain ownership is never transferred to ATSH merely because ATSH paid the registrar or operates the hosting.
2. Registrant/legal-contact data must be the customer's accurate data, subject to the applicable registry's rules.
3. Where technically possible, use a customer-owned registrar account or registrar-supported delegated/sub-account access. If an ATSH reseller account is necessary, the provider arrangement must preserve customer registrant ownership and a documented transfer-out process.
4. Do not collect registrar account passwords in ATSH. Store provider credential references in a secret manager, never in normal database columns or logs.
5. Package inclusion is represented as an explicit entitlement snapshot on the request/contract. It must not be inferred later from the current package configuration.
6. The initial free/included registration period, renewal responsibility, eligible TLDs, and any premium-domain exclusions must be disclosed before acceptance. **Whether renewals are included is a commercial policy still requiring explicit owner approval; do not silently promise free renewals.**
7. TLD availability and eligibility are provider- and registry-dependent. An extension appearing in the UI does not imply it can be registered through the selected provider.
8. No domain is marked registered, owned, connected, or renewed until the registrar/provider confirms the corresponding operation and ATSH persists the verified result.

## 2. Module boundaries and source of truth

- NestJS `DomainsModule` owns domain rules, provider adapters, authorization, state transitions and persistence.
- PostgreSQL is the source of truth for domain orders, customer ownership, entitlements, registration status, expiry, renewal history and audit evidence.
- n8n coordinates notifications and approved external workflow steps through signed webhooks. It is not the domain database and must not independently decide eligibility, price, ownership or lifecycle state.
- Registrar integrations are isolated behind a provider adapter interface. The provider is not selected by this specification.
- Hosting is a related but separate module. A domain may point to a hosting service, but domain registration and hosting subscription remain separately itemized and renewable.
- No live registrar API, DNS mutation, renewal charge or production operation is enabled by this document.

## 3. Screen inventory and interaction requirements

### 3.1 Public configurator — step 5/8: Hosting and domain

Add a domain section to the existing step; do not create a ninth step.

**Fields and states**
- Domain choice: `NEW_REGISTRATION`, `PACKAGE_INCLUDED`, `USE_EXISTING`, `TRANSFER_IN`, `DECIDE_LATER`.
- Requested second-level label and TLD selector for new/included registration.
- Existing domain field for connection or transfer.
- Availability-check action for new registration, with loading, available, unavailable, premium/restricted, provider-error and timeout states.
- Result card showing exact domain, TLD, provider availability timestamp, registration term, first-term price, renewal price, currency, included/paid status and important exclusions.
- Customer registrant/contact confirmation before order submission.
- Separate explanation of domain charges and hosting charges; never merge recurring hosting and domain line items into development fees.

**Package entitlement behavior**
- If the selected package has a valid included-domain entitlement, show the eligible TLDs and included term. The user may choose a paid alternative; show the price delta.
- If the package has no entitlement, show the separately priced domain option.
- If a multi-package cart contains multiple packages, apply the entitlement rules deterministically and prevent accidental duplicate included-domain claims. One domain entitlement is consumed per eligible project/order unless a future explicit rule allows more.
- A domain entitlement must be revalidated by the server at submission; client-side display is not authoritative.

**Validation**
- Normalize domain input to IDNA/Punycode for provider operations while preserving a safe display form.
- Validate label/TLD syntax, prohibited names, registry restrictions and contact requirements.
- Do not reserve a domain during a read-only availability check.
- Recheck availability and price immediately before order creation/registration.
- If price or availability changes, require the customer to review and accept the new result; never silently charge a different amount.
- `DECIDE_LATER` preserves the fact that the customer deferred the decision and does not create a domain order.

### 3.2 Customer portal — Domains

Route proposal: `/portal/domains` (actual portal locale remains governed by the global portal-language decision).

Screens/sections:
1. **Domain list:** domain name, lifecycle status, registrant/owner label, linked project/hosting service, registrar, expiry date, auto-renew status, next action.
2. **Domain detail:** registration facts, ownership/registrant evidence, term, registrar reference, nameservers, linked hosting, renewal history and audit-visible customer actions.
3. **Renewal review:** amount, currency, term, due date, payment/invoice reference and explicit customer confirmation where required.
4. **DNS view:** current records and connection status; show read-only by default until safe delegated DNS management is implemented.
5. **Transfer-out / authorization:** customer request, identity/ownership checks, registrar lock/EPP requirements, status and completion evidence.
6. **Contact correction:** request changes to registrant contact details; apply only after registry/provider verification and required customer confirmation.

Customer portal must not expose another customer's domain even if an identifier is guessed or changed in a URL.

### 3.3 Administration — Domains workspace

Route proposal: `/domains` with the following tabs/pages:

| Screen | Main content | Actions and controls |
|---|---|---|
| Domain overview | Active, pending, expiring, expired, transfer and failed-operation counts; upcoming renewals; provider health | Filter by period/status/provider; open exception queues |
| Domain orders | Registration, transfer-in, connect-existing and cancellation requests | Review, request information, verify payment/authorization, retry safe checks, assign operator |
| Domain registry | All managed domain assets and their lifecycle | Search by domain/customer/project; inspect ownership and registrar evidence |
| Domain detail | Customer, registrant, registrar reference, term, nameservers, hosting link, events and invoices | Controlled operations; no direct status editing |
| Extensions | TLD catalogue, registry rules, supported provider, eligibility and availability | Enable/archive extension; configure validation and required contacts |
| Domain pricing | Registration, renewal, transfer and premium pricing by term/currency/provider | Draft, simulate, approve, schedule and publish immutable price versions |
| Package entitlements | Which packages include a domain and allowed TLDs/term/quantity | Configure entitlement; preview impact; version changes |
| Providers | Provider adapter, supported operations/TLDs, health, limits and secret reference | Test connection; enable/disable; rotate secret reference; inspect failures |
| Renewals | Due, awaiting customer, awaiting payment, submitted, succeeded and failed renewals | Remind, reconcile, approve/retry per policy; escalate failures |
| DNS & connections | Nameservers, records, linked hosting target and verification state | View; propose/apply authorized changes; run DNS verification |
| Transfers | Incoming/outgoing transfer queue, auth-code handoff state and registry locks | Validate authorization; track provider status; never expose auth codes in logs |
| Audit & reports | Actor, action, before/after metadata, provider event and correlation IDs | Filter/export according to permissions |

**Overview metrics must be query-backed.** Until domain data exists, show an honest empty state rather than synthetic counts.

### 3.4 Shared screen states

Every list/detail/form must define: loading, empty, filtered-empty, validation error, permission denied, provider unavailable, network timeout, stale data, success, partial success and retryable/non-retryable failure. Destructive or financially consequential actions require confirmation and an audit reason.

## 4. Logical data model — additive domain entities

The following are proposed domain models to add to the existing greenfield logical model. They must be reconciled with the current Prisma schema before migration generation; do not create a parallel customer, package, contract, invoice or audit model.

| Entity | Important fields | Relationships / constraints |
|---|---|---|
| `DomainProvider` | id, key, displayName, adapterKey, status, capabilitiesJson, secretRef, healthCheckedAt | Provider key unique; secret reference only, never secret value |
| `DomainExtension` | id, tld, registryLabel, status, idnAllowed, min/max term, registryRulesJson | TLD unique; registry-specific restrictions validated server-side |
| `DomainProviderExtension` | providerId, extensionId, supportedOperations, providerProductCode, status | Unique provider/extension; provider-specific support and product mapping |
| `DomainPriceVersion` | id, providerId, extensionId, operation, termMonths, amount Decimal, currency, effectiveFrom/To, version, status | Immutable when published; operation = registration/renewal/transfer; preserve provider cost and customer sell price as separate fields where commercially approved |
| `PackageDomainEntitlement` | id, packageId, allowedExtensionIds, includedTermMonths, quantity, eligibilityRules, renewalPolicyKey, version, status | Versioned package rule; no implicit inheritance across package revisions |
| `DomainOrder` | id, publicReference, customerId, projectId?, contractId?, requestId?, type, status, requestedDomain, idempotencyKey, priceSnapshotJson, entitlementSnapshotJson, authorizationAt | Customer owner required; unique public reference and scoped idempotency key |
| `DomainRegistration` | id, domainOrderId, customerId, providerId, extensionId, fqdnNormalized, registrantContactId, registrarDomainRef, registeredAt, expiresAt, autoRenewState, status, nameserverSnapshot | FQDN unique while active under defined normalization; customer remains registrant/owner |
| `DomainRegistrantContact` | id, customerId, contactType, encryptedContactRef or protected field set, verificationState, verifiedAt | Customer-owned; data minimization; do not expose private registry contact data publicly |
| `DomainAuthorization` | id, domainRegistrationId/domainOrderId, customerId, action, termsVersion, consentAt, evidenceRef, revokedAt | Explicit authorization for registration, renewal, transfer or DNS changes; immutable evidence |
| `DomainRenewal` | id, domainRegistrationId, dueAt, termMonths, amount Decimal, currency, status, invoiceId?, providerRenewalRef, idempotencyKey | One active renewal attempt per domain/term window; no duplicate charge |
| `DomainTransfer` | id, domainRegistrationId?, domainOrderId, direction, source/destination provider, status, authCodeSecretRef, requestedAt, completedAt | EPP/auth code is secret-manager reference only; never log or return after one-time secure handoff |
| `DomainDnsZone` | id, domainRegistrationId, providerZoneRef, status, verifiedAt | One managed zone per domain/provider scope; optional until DNS provider selected |
| `DomainDnsRecord` | id, zoneId, type, name, valueProtected?, ttl, priority?, proxied?, status | Validate type/value/TTL; sensitive TXT values masked where appropriate |
| `DomainConnection` | id, domainRegistrationId, hostedServiceId, target, connectionMode, status, lastCheckedAt | Domain-to-hosting relation; no assumption that hosting provider is same as registrar |
| `DomainOperation` | id, domainRegistrationId/orderId, operation, status, providerRequestRef, correlationId, idempotencyKey, startedAt, completedAt, safeErrorCode | Append operation attempts; safe error metadata only |
| `DomainEvent` | id, aggregateType, aggregateId, eventType, actorType/id, payloadSafeJson, occurredAt | Append-only lifecycle/provider event record |
| `DomainOutboxEvent` | id, eventKey, aggregateId, payloadVersion, payloadSafeJson, status, attempts, nextAttemptAt, deliveredAt | Transactional outbox; unique event key; reliable dispatch to n8n |

### 4.1 Required relationships to existing entities

- DomainOrder → existing Customer; optional ServiceRequest, Project and Contract.
- DomainOrder → existing Invoice/InvoiceLine when a commercial invoice is actually issued.
- DomainRegistration → Customer, DomainProvider, DomainExtension, DomainRegistrantContact.
- DomainConnection → existing HostedService/HostingAccount, not a duplicated hosting entity.
- PackageDomainEntitlement → existing Package and Package version.
- All mutations → existing AuditEvent and permission model.
- Domain events → existing Notification/CommunicationLog where available.

### 4.2 Critical database invariants

- Customer ownership path must be explicit and indexed.
- Normalize FQDN with IDNA rules before uniqueness checks.
- Use PostgreSQL `NUMERIC/DECIMAL` for money; currency is explicit.
- Store all timestamps in UTC.
- Preserve immutable order, entitlement and price snapshots.
- Unique constraints for provider key, TLD, provider/TLD mapping, public references, idempotency scopes and active domain identity.
- Use transactions for order + snapshot + outbox creation and for state transition + event + audit.
- Optimistic concurrency/version column for contested updates.
- Provider secrets, EPP codes and registrar passwords never enter ordinary tables, logs, analytics or browser payloads.
- Do not provision the database or generate/apply migrations until the schema reconciliation and migration review are complete.

## 5. Domain lifecycle and state machines

### 5.1 Domain order

`DRAFT → AVAILABILITY_CHECKED → AWAITING_CUSTOMER_CONFIRMATION → AWAITING_COMMERCIAL_GATE → READY_TO_REGISTER → SUBMITTING → REGISTERED`

Alternative/terminal paths:
- `UNAVAILABLE`, `PRICE_CHANGED`, `NEEDS_INFORMATION`, `FAILED_RETRYABLE`, `FAILED_FINAL`, `CANCELLED`, `EXPIRED`.
- A failed provider response is not equivalent to unavailable.
- Registration success requires provider confirmation and a persisted registrar reference/expiry date.
- Registration must be idempotent; retries must not create a second registration or charge.

### 5.2 Domain registration lifecycle

`PENDING_VERIFICATION → ACTIVE → EXPIRING → EXPIRED`

Other states: `SUSPENDED`, `TRANSFER_PENDING`, `REDEMPTION` (only where supported/verified), `CANCELLED`, `UNKNOWN_PROVIDER_STATE`.

Never allow staff to manually set `ACTIVE` without provider evidence. Reconciliation can correct local state only with recorded source evidence.

### 5.3 Renewal lifecycle

`SCHEDULED → CUSTOMER_NOTICE_DUE → AWAITING_CUSTOMER_CONFIRMATION` (where policy requires) `→ AWAITING_PAYMENT → READY_TO_RENEW → SUBMITTING → RENEWED`.

Failure branches: `PAYMENT_FAILED`, `PROVIDER_FAILED_RETRYABLE`, `PROVIDER_FAILED_FINAL`, `EXPIRED`, `CANCELLED`, `MANUAL_REVIEW`.

Renewal policy and reminder schedule are configurable and must be approved. Do not infer a fixed number of reminder days from this specification.

### 5.4 Transfer lifecycle

Incoming: `REQUESTED → ELIGIBILITY_CHECK → AUTHORIZATION_PENDING → PROVIDER_SUBMITTED → IN_PROGRESS → COMPLETED`.

Outgoing: `REQUESTED → OWNERSHIP_VERIFIED → CUSTOMER_AUTHORIZATION → AUTH_CODE_READY → CUSTOMER_HANDOFF → PROVIDER_TRANSFER_PENDING → COMPLETED`.

Branches: `REJECTED`, `EXPIRED`, `CANCELLED`, `FAILED`, `MANUAL_REVIEW`. Never show an EPP/auth code in ordinary support or audit views.

### 5.5 DNS connection lifecycle

`NOT_CONFIGURED → CHANGE_PROPOSED → CUSTOMER/OWNER_AUTHORIZED → APPLYING → PROPAGATION_CHECK → VERIFIED`.

Failure branches: `INVALID_RECORD`, `PROVIDER_ERROR`, `TIMEOUT`, `VERIFICATION_FAILED`, `ROLLED_BACK`. DNS edits must be validated and audited; high-risk changes require confirmation and rollback data.

## 6. API contract — NestJS

Base prefix: `/api`. Routes below are contract proposals, not currently live endpoints. Use DTO validation, stable error envelopes, pagination, server-side authorization and OpenAPI documentation.

### 6.1 Public/configurator APIs

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/public/domains/extensions` | List published, currently supported TLDs and public requirements |
| POST | `/api/public/domains/availability` | Check normalized FQDN availability; rate-limited; no reservation |
| POST | `/api/public/domains/price-preview` | Return registration/renewal price and package entitlement preview |
| POST | `/api/public/domains/validate-selection` | Validate domain choice against cart/package snapshot |

Availability request: `{ label, tld, termMonths, packageItemId? }`.

Availability response: `{ fqdn, normalizedFqdn, status, checkedAt, expiresAt, providerKey, pricePreview, entitlementPreview, restrictions[] }`. Never return provider credentials or internal provider diagnostics.

### 6.2 Customer APIs

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/customer/domains` | List only domains owned by authenticated customer |
| GET | `/api/customer/domains/:domainId` | Customer-safe domain details |
| POST | `/api/customer/domain-orders` | Create authorized registration/connection/transfer request |
| POST | `/api/customer/domain-orders/:id/confirm` | Confirm current price, term, registrant data and authorization |
| POST | `/api/customer/domains/:id/renewals` | Request renewal quote/confirmation |
| POST | `/api/customer/domains/:id/transfer-out` | Initiate verified transfer-out request |
| POST | `/api/customer/domains/:id/contact-change` | Request registrant contact correction |
| GET | `/api/customer/domains/:id/events` | Customer-safe lifecycle timeline |
| GET | `/api/customer/domains/:id/dns` | Read authorized DNS/connection status |

### 6.3 Administration APIs

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/domains/overview` | Query-backed domain KPIs and exception counts |
| GET/POST | `/api/admin/domain-orders` | Search/create managed order records |
| GET | `/api/admin/domain-orders/:id` | Order detail and event timeline |
| POST | `/api/admin/domain-orders/:id/review` | Review/request information/approve operational readiness |
| POST | `/api/admin/domain-orders/:id/retry` | Retry only retryable, idempotent operation |
| GET/POST/PATCH | `/api/admin/domain-extensions` | Manage TLD catalogue |
| GET/POST/PATCH | `/api/admin/domain-providers` | Manage provider metadata and adapter status |
| POST | `/api/admin/domain-providers/:id/test` | Test provider connectivity/capabilities |
| GET/POST | `/api/admin/domain-prices` | Create draft price versions and simulate |
| POST | `/api/admin/domain-prices/:id/approve` | Approve price version with required separation of duties |
| POST | `/api/admin/domain-prices/:id/publish` | Publish approved version with effective date |
| GET/POST/PATCH | `/api/admin/package-domain-entitlements` | Configure package inclusion rules |
| GET | `/api/admin/domains` | Search/filter managed registrations |
| GET | `/api/admin/domains/:id` | Full authorized domain detail |
| POST | `/api/admin/domains/:id/connect-hosting` | Link to existing HostedService after validation |
| POST | `/api/admin/domains/:id/dns/changes` | Propose/apply authorized DNS change |
| POST | `/api/admin/domains/:id/reconcile` | Request provider-state reconciliation |
| GET | `/api/admin/domain-renewals` | Renewal queue and exceptions |
| POST | `/api/admin/domain-renewals/:id/retry` | Retry safe renewal operation |
| GET | `/api/admin/domains/:id/audit` | Authorized audit history |

### 6.4 Provider webhook/API ingress

- `POST /api/integrations/domain-providers/:providerKey/webhooks`
- Verify signature, timestamp, provider identity, replay window and event schema.
- Persist provider event safely, deduplicate by provider event ID, enqueue reconciliation, return quickly.
- Provider callbacks must not directly mark a domain active without validating the event against the provider adapter and stored order.

### 6.5 Common API rules

- Every customer route derives customer identity from the authenticated principal; never trust a customerId supplied by the browser.
- Domain ownership and organization/project access are checked on every read and mutation (IDOR prevention).
- Use idempotency keys for order creation, registration, renewal, transfer submission, DNS apply and webhook handling.
- Return `409 PRICE_CHANGED` when the quoted price/entitlement changed and require a new customer confirmation.
- Return safe error codes such as `DOMAIN_UNAVAILABLE`, `TLD_UNSUPPORTED`, `PROVIDER_TIMEOUT`, `AUTHORIZATION_REQUIRED`, `PRICE_CHANGED`, `REGISTRY_RESTRICTION`, `RETRY_NOT_ALLOWED`.
- Never expose auth codes, provider secrets, raw provider payloads, internal stack traces or another customer's registrant data.
- Admin actions require atomic state transition + audit event + outbox event.
- No payment provider, tax behavior, currency or commercial price is activated by this specification.

## 7. n8n workflows

n8n is an orchestrator. Each workflow receives a signed event with `eventId`, `eventType`, `aggregateId`, `occurredAt`, `schemaVersion`, `correlationId` and a safe payload. It calls authenticated NestJS commands; it does not write directly to PostgreSQL.

| Workflow ID | Trigger | Main steps | Success/failure behavior |
|---|---|---|---|
| `DOM-01-ORDER-ORCHESTRATION` | `domain.order.ready` | Fetch order → revalidate entitlement/price/authorization → call provider adapter via API → persist provider result → notify customer/admin | Idempotent; provider timeout enters retryable/manual-review state |
| `DOM-02-AVAILABILITY-CHECK` | API command | Normalize FQDN → select eligible provider → availability check → persist short-lived result/expiry → return response | No reservation; rate limit; short cache only |
| `DOM-03-REGISTRATION-RESULT` | Provider webhook or poll result | Verify signature/source → deduplicate → reconcile provider record → persist registration/expiry → create customer event | Never infer success from HTTP 200 alone |
| `DOM-04-RENEWAL-SCHEDULER` | Scheduled daily scan | Ask API for due renewals → create notification jobs → check policy/consent/payment gate → request renewal only when authorized | No charge or renewal without required gates; retry policy bounded |
| `DOM-05-RENEWAL-RESULT` | Provider callback/poll | Verify event → reconcile renewal → update expiry → create invoice/payment reference as permitted → notify | Escalate failed/uncertain outcomes; no duplicate renewal |
| `DOM-06-TRANSFER-IN` | Approved transfer-in order | Validate TLD/provider support → obtain secure auth handoff → submit transfer → poll/webhook → reconcile | Auth code handled via secure secret reference, never ordinary node logs |
| `DOM-07-TRANSFER-OUT` | Customer request | Verify customer ownership → check locks/registry eligibility → obtain authorization → secure one-time auth-code handoff → track transfer | Human review for ownership conflict or exceptional registry condition |
| `DOM-08-DNS-CONNECTION` | Authorized DNS change | Fetch proposed change → validate target/records → verify authorization → apply via adapter → DNS check → persist result | Rollback or manual review on verification failure |
| `DOM-09-EXPIRY-ALERTS` | Scheduled daily scan | Query due/overdue domains → deduplicate reminders by domain/date/policy → dispatch enabled channel → log delivery | Respect consent, rate limits, retry and delivery audit |
| `DOM-10-PROVIDER-HEALTH` | Scheduled health check | Test provider capabilities → report latency/errors/rate-limit state → alert admin on degradation | Health status is observational; no automatic provider switch without policy |
| `DOM-11-RECONCILIATION` | Scheduled/manual | Compare provider records with ATSH records → create discrepancy cases → human review where ownership/financial status differs | Never silently overwrite authoritative customer or financial data |

### 7.1 n8n reliability and security

- Prefer transactional outbox from NestJS; n8n receives only committed events.
- Signed webhook, timestamp validation, replay protection, allowlisted event types and schema versioning.
- Every workflow has a stable idempotency key and correlation ID.
- Bounded retries with exponential backoff and dead-letter/manual-review path.
- Separate test and production credentials; credentials live in n8n credential vault/secret manager.
- Redact registrant PII, auth codes and provider payloads from execution logs.
- Provide kill switch per workflow/provider and safe pause/resume.
- n8n cannot independently approve commercial, legal, ownership or irreversible operations.

## 8. Permissions and audit

Proposed permission keys (to be reconciled with the repository's central permission catalogue):

- `domains.read`, `domains.read_sensitive`
- `domains.orders.read`, `domains.orders.review`, `domains.orders.manage`
- `domains.providers.read`, `domains.providers.manage`, `domains.providers.test`
- `domains.extensions.manage`, `domains.pricing.manage`, `domains.pricing.approve`, `domains.pricing.publish`
- `domains.entitlements.manage`
- `domains.registrations.manage`, `domains.renewals.manage`, `domains.transfers.manage`
- `domains.dns.read`, `domains.dns.propose`, `domains.dns.apply`
- `domains.audit.read`

Role boundaries:
- Owner: full access; sensitive and irreversible actions require explicit confirmation and audit.
- Admin/operations: only delegated domain operations.
- Sales: read order/price status and request information; cannot change registrant ownership, publish prices or apply DNS.
- Support: customer-safe read and ticket-linked actions only.
- Customer: only own domains and authorized actions.
- AI agents: read/prepare drafts within grants; cannot approve price, authorize transfer, change registrant, renew/charge, or apply production DNS by default.

Audit every price/entitlement change, ownership/contact change, registration/renewal/transfer submission, DNS mutation, provider configuration change, secret-reference rotation, manual reconciliation and permission denial involving sensitive resources.

## 9. Test plan and acceptance criteria

### 9.1 Unit tests
- FQDN normalization, IDNA/Punycode, TLD syntax and registry rule validation.
- Package entitlement evaluation, quantity limits, allowed TLDs and paid alternative calculation.
- Price version selection by effective date/term/currency; first-term vs renewal distinction.
- State-machine allowed/forbidden transitions for orders, registrations, renewals, transfers and DNS.
- Provider adapter mapping and safe error classification.
- Idempotency key scope and duplicate command handling.
- Customer-safe DTO redaction and secret/PII masking.

### 9.2 API integration tests
- Availability check does not reserve or create an order.
- Unsupported TLD/provider capability returns safe error.
- Customer can read only owned domain; cross-customer ID substitution returns 404/403 without leakage.
- Registration order requires customer ownership data and recorded authorization.
- Server rejects client-tampered price, entitlement, customerId, provider cost or status.
- Package entitlement snapshot remains unchanged after package revision.
- Price change returns 409 and requires renewed customer confirmation.
- Registration and renewal commands are idempotent under retries/concurrency.
- Provider webhook rejects invalid signature, stale timestamp and replay; duplicate event is processed once.
- No provider secret/auth code appears in API responses or logs.
- DNS changes require permission and authorization and record before/after evidence.
- Admin pricing publish requires approval and preserves prior versions.

### 9.3 End-to-end Playwright tests
- Configurator: included-domain package, paid-domain package, eligible/ineligible TLD, paid alternative, unavailable domain, provider timeout and decide-later.
- Customer portal: domain list/detail, renewal review, transfer-out request, contact-change request and ownership isolation.
- Admin: overview empty state, order review, extension/pricing/entitlement screens, provider health, renewal queue and audit timeline.
- Responsive widths: 360, 390, 768, 1024, 1280 and 1440 px.
- Arabic RTL for public/admin where applicable; customer portal language follows its separately approved decision.
- Keyboard-only navigation, focus visibility, labels, validation announcements and reduced motion.
- Loading, empty, filtered-empty, stale, permission-denied, network-failure and retry states.
- No synthetic operational values or successful states without API evidence.

### 9.4 Provider contract tests
- Adapter contract tests with deterministic sandbox fixtures.
- Provider timeout, rate limit, malformed response, duplicate callback and partial success.
- Registration response includes provider reference and expiry.
- Renewal response changes expiry only after verified provider confirmation.
- Transfer and DNS operations enforce required authorization.
- Sandbox/contract tests must not create real paid registrations.

### 9.5 Release acceptance gates

The module is not complete until:
1. Requirement IDs are mapped to screens, data models, API routes, workflows and tests.
2. Prisma schema is reconciled with existing models and migration is reviewed.
3. Unit/API/E2E/provider contract tests pass in CI and are linked to commit SHA.
4. Authorization, tenant isolation, secrets handling and audit review pass.
5. Responsive/RTL/accessibility checks pass.
6. Provider sandbox integration is verified for the selected provider.
7. Staging review is accepted by the owner.
8. Any live registration, renewal charge, transfer, DNS production change or production release receives the required explicit human authorization.

## 10. Open decisions — do not infer

| Decision | Current status | Required before |
|---|---|---|
| Registrar/reseller provider and supported API | Open | Live availability/registration |
| Registrar account model (customer-owned account vs delegated reseller sub-account) | Open; must preserve customer registrant ownership and exit rights | Live registration |
| Renewal inclusion in packages and renewal reminder schedule | Open | Publish package terms and renewal automation |
| Currency, taxes, payment provider and charge timing | Open | Any live commercial transaction |
| TLD catalogue and registry-specific eligibility | Open; provider-dependent | Publish actual options |
| DNS provider and whether ATSH may mutate DNS automatically | Open | Live DNS writes |
| Customer portal language | Open globally | Final localized portal UI |
| Registrant privacy/redaction and retention details by TLD | Open; legal/registry review required | Live collection/registration |
| Provider failover policy | Open | Multi-provider automation |

## 11. Traceability to the executive reference

- Configurator step 5/8 requires hosting/domain choices, billing duration, renewals, backups, SSL and separation of free vs paid options.
- Hosting/domain records must connect to customer, product/contract, invoices and renewals without conflating customer hosting with ATSH's own infrastructure.
- Customer owns the domain and account/data rights must be documented.
- Domain renewal follows the same notice → verify status/payment/renewal → record result → failure follow-up pattern as subscription renewal.
- Production publishing/domain connection is gated by successful tests, required approvals and approved deployment data.
- Prices are versioned, source-attributed and snapshotted; historical orders do not change when new prices are published.
- No passwords, API keys or registrar secrets are displayed in administration screens.

## 12. Change log

- v1.0 — Owner approved `both` package policy and `client` ownership/management policy. Added screen inventory, logical data model, API contract, lifecycle state machines, n8n workflow map, permissions, tests, acceptance gates and unresolved commercial/provider decisions.
