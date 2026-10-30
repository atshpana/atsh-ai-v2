# Prisma Model Gap Analysis — Draft v1.0

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Compared sources:
  - `docs/data/LOGICAL_DATA_MODEL.md` (logical domain inventory)
  - `apps/api/prisma/schema.prisma` (current Prisma draft)
  - `docs/requirements/SCREEN_AND_FLOW_CATALOG.md` (screen/flow inventory)
  - `docs/domains/DOMAIN_MANAGEMENT_SPEC.md` (approved domain requirements)
- Status: **Analysis only. No schema, migration, database, or runtime behavior is changed by this document.**

## 1. Executive finding

The current Prisma schema is a narrow first slice for identity/RBAC, customer contact, service catalogue/options, pricing versions/rules, request snapshots/events, quotes, quote decisions/change requests, and audit events.

It is not yet the data model for the complete ATSH operating system. The logical model already names many additional domains, but the Prisma draft does not yet implement them. Therefore, generating and applying a durable `0_init` migration now would freeze an incomplete foundation and create avoidable follow-up migration complexity.

## 2. Existing Prisma coverage

| Domain | Current Prisma coverage | Assessment |
|---|---|---|
| User identity | `User` | Partial; authentication/session lifecycle not implemented |
| RBAC | `Role`, `Permission`, `RolePermission`, `UserRole` | Partial; scoped grants and effective permissions need full authorization design |
| Customer | `Customer` | Partial; no Organization, members, address, consent/preferences |
| Service catalogue | Category, Service, translations, options | Partial; Package/PackageItem and immutable configurator versions/fields absent |
| Pricing | PricingVersion, PricingRule | Partial; discount/tax policy and price-calculation record absent |
| Request/cart | ServiceRequest, item/option/price snapshots, RequestEvent | Partial; Cart, CartItem, RequestAnswer absent |
| Quotes | Quote, QuoteItem, QuoteDecision, QuoteChangeRequest | Partial; formal immutable acceptance evidence, contract conversion and amendments incomplete |
| Audit | AuditEvent | Initial; retention, actor/resource context and append-only enforcement need definition |

## 3. Missing logical domains that block a complete baseline

### 3.1 Identity, organization and security
- UserProfile, Session, MFAFactor.
- AccessGrant for project/account/unit-scoped delegation with grantor, grantee, expiry and revocation.
- Organization, OrganizationMember, ContactPreference and CustomerAddress.
- Explicit customer-user and organization membership ownership paths.
- Approval evidence and security-event details beyond the initial generic audit record.

**Design rule:** do not add password or raw MFA secrets to ordinary tables. Session identifiers must be protected/hashed as appropriate. Authorization remains server-side and deny-by-default.

### 3.2 Website content and visual administration
- ContentPage, immutable ContentPageVersion, ContentSection and ContentTranslation.
- NavigationMenu and NavigationItem.
- MediaAsset with storage reference, classification, checksum and access metadata.
- DesignTokenSet and DesignToken with validated, non-executable values.
- SeoMetadata tied to a specific page/version/locale.
- Separate publication/revision/rollback evidence for public site content and admin appearance.

These entities support PUB-01/PUB-08..PUB-15 and ADM-03..ADM-05/ADM-14/ADM-15/ADM-19. Existing homepage/service catalogue UI does not imply that CMS persistence or visual editing is implemented.

### 3.3 Catalogue, configurator, cart and commercial history
- Package and PackageItem, including versioned composition and entitlement snapshots.
- ConfiguratorVersion, ConfiguratorStep and ConfiguratorField with declarative validation/conditional rules.
- Cart, CartItem and CartItemOption with user/session ownership, expiry and server revalidation.
- RequestAnswer tied to the exact configurator version/field definition.
- Discount and PriceCalculation records.
- TaxPolicy as an inactive structural record only, pending explicit commercial/legal approval.
- Immutable snapshots for package composition, configurator answers and pricing rule version.

The server remains the only pricing authority. No live pricing, tax, discount, currency or payment assumptions are introduced here.

### 3.4 Quote, contract and customer approval
- Quote revision immutability and explicit sent-version snapshot.
- A customer acceptance record that captures exact quote version, actor, timestamp and evidence.
- Contract and versioned ContractAmendment.
- Explicit separation between quote decline, quote change request, contractual change request and specification nonconformance.
- Transactional state transition and audit evidence.

The current `QuoteDecision` and `QuoteChangeRequest` are useful foundations but do not by themselves establish complete contract execution or immutable acceptance semantics.

### 3.5 Project delivery and release governance
- Project linked to customer and accepted contract.
- ProjectPlan with version/status/approval and immutable template-version reference.
- ProjectStage, ProjectTask, TaskDependency, TaskEvidence and ProjectMilestone.
- ChangeRequest with impact estimate, customer approval and resulting amendment.
- ReviewRound, DeliveryArtifact, CustomerApproval, ReleaseRecord and HandoverRecord.
- Exact artifact/build/version references for customer approvals and production release.
- Protected lifecycle gates distinct from configurable execution stages.

The approved workflow model requires a project-specific copy of a template, manager approval before execution, versioned material plan changes, two customer revision rounds, a final approval round, and no production release without the required gates.

### 3.6 Staff, workflows and AI workforce
- StaffProfile, Team and scoped Assignment.
- WorkflowDefinition, WorkflowInstance and WorkflowStep; template updates must not mutate existing project instances.
- ApprovalRequest for protected human decision gates.
- AgentDefinition, AgentToolGrant, AgentRun, AgentTask, AgentReview and AgentBudget.
- WorkflowExecution correlation to n8n, including idempotency/retry metadata.
- Transactional outbox event model for reliable asynchronous dispatch.

The central AI manager must not grant capabilities beyond an agent's explicit permissions. Agent output must be independently reviewed; an agent cannot approve its own work. Model/provider selection, budgets and tool grants remain governed by owner policy.

### 3.7 Support and communications
- SupportTicket, TicketMessage with internal/customer visibility boundary.
- NotificationTemplate with locale/version/approval.
- Notification and NotificationAttempt.
- CommunicationLog with safe metadata and references.
- Event idempotency to prevent duplicate notifications.

Customer-visible conversation content must be separated from internal notes and AI/employee execution logs.

### 3.8 Hosting, domains and backup
- HostingAccount and HostedService with contract/customer linkage, plan/limits and lifecycle.
- DomainAsset, domain order/registration/transfer records, package entitlement snapshot, registrar/provider operation references, registrant authorization evidence, renewal history and DNS state.
- BackupRecord and HostingEvent.
- Provider secret references only; no credentials in application tables.
- Explicit customer registrant ownership and auditable authorization for ATSH management.

The domain specification is approved functionally, but registrar, supported TLDs, payment, renewal commercial policy and DNS provider remain open. The schema must represent provider-neutral states and must not imply that live registration is already integrated.

### 3.9 Finance
- Invoice and immutable InvoiceLine.
- PaymentRecord containing provider references/status only; never raw card data.
- RefundRecord and approval evidence.
- LedgerEntry with balanced-posting invariants.
- ReconciliationRun and exception records.
- Explicit links from invoice lines to contract/project/hosting/domain source events.

These are structural candidates only. Do not activate billing, tax, payment, refund or accounting rules before owner approval.

### 3.10 Reporting, integration and operations
- Report definitions/snapshots only where durable report history is required.
- Integration/provider configuration metadata with secret-manager references.
- Webhook delivery attempts and idempotency records.
- Background job/outbox state and operational correlation IDs.
- Data export requests/records with separate permission and audit evidence.

## 4. Existing schema findings to resolve before baseline

1. Add database-level CHECK constraints for positive quantities and applicable non-negative monetary fields. Decide discount sign semantics explicitly before constraining discounts.
2. Decide whether `PricingVersion.approvedById` is a relation to `User` or an intentionally immutable actor identifier; document delete behavior.
3. Enforce temporal invariants such as `effectiveTo > effectiveFrom` and `expiresAt > startsAt` where applicable.
4. Keep quote version/status/ownership validation inside the same transaction as terminal decision persistence.
5. Ensure idempotency keys are scoped to actor/operation and that replay returns the original safe result.
6. Define immutable sent quote, accepted quote and request snapshot rules at both service and database boundary where possible.
7. Add explicit customer/organization ownership indexes and test cross-customer isolation.
8. Review delete behavior for historical/financial/audit records; prefer restricted deletion or archival where evidence must remain.
9. Add indexes from actual list/filter/search workloads rather than speculative indexes.
10. Define retention, redaction and export controls before storing registrant/contact/financial/communication data.

## 5. Suggested implementation sequence

This sequence is a technical recommendation, not an approval to activate commercial integrations:

1. **Foundation and authorization:** User/session principal, organization/customer ownership, roles, permissions, scoped grants, audit and approval records.
2. **Commercial intake:** package/configurator versioning, cart, request answers/snapshots, server-side price calculation, quote versioning and acceptance evidence.
3. **Contract and delivery:** contracts/amendments, projects, plan versions, stages/tasks/dependencies, review rounds, artifacts, approvals, releases and handover.
4. **AI/workflow operations:** teams/assignments, workflow templates/instances, agents/runs/tasks/reviews/budgets, outbox and n8n execution references.
5. **Customer product operations:** portal access, support, hosting, domain, DNS and backup entities, with provider adapters remaining disabled until approved.
6. **Finance and communications:** invoices, payments/refunds, ledger/reconciliation, notifications and communication history after commercial/provider decisions.
7. **CMS and analytics:** page/version/section/media/theme/SEO persistence, publication workflow, reports and controlled exports.

Each phase must include Prisma validation, generated-client checks, unit/API integration tests, ownership/permission tests and a clean PostgreSQL migration test. Do not create the first durable baseline until the agreed initial scope and constraints are complete.

## 6. Explicit non-decisions

This analysis does not select or approve:
- PostgreSQL hosting, application hosting or object storage provider.
- Authentication vendor, email provider, payment gateway or registrar.
- AI model/provider, agent tool access or n8n deployment model.
- Currency, prices, tax, discounts, payment schedule, invoice rules or renewal terms.
- Supported TLDs, DNS provider, registrar account model or domain renewal charging policy.
- Customer portal language or any new data-retention/legal policy.

## 7. Acceptance gate for the first baseline

The first durable migration is not ready until:
- the logical entities required by the agreed first delivery scope are mapped to Prisma models and relationships;
- all customer/project/organization ownership paths are explicit;
- lifecycle and financial invariants have database/application enforcement and tests;
- delete/archive semantics preserve contractual, financial, approval and audit evidence;
- domain entities reflect the approved customer-ownership model without assuming an unselected provider;
- CI applies the migration from an empty ephemeral PostgreSQL database and verifies the resulting status;
- the generated SQL has been reviewed and the owner approves the migration boundary.

**Current decision: keep the baseline uncommitted and unapplied.**


## 8. Screen/flow-to-data traceability checkpoint

This matrix maps the source catalogue identifiers to the durable records required by each flow. It is a coverage analysis, not a claim that the listed APIs, screens or models are implemented.

| Source ID / flow | Durable records required | Current Prisma coverage | Gap / control that blocks acceptance |
|---|---|---|---|
| PUB-01, PUB-08, PUB-09..PUB-15 | ContentPage, ContentPageVersion, ContentSection, ContentTranslation, MediaAsset, SeoMetadata, Contact/Lead submission and consent evidence | Service translations only; no CMS persistence | Draft/published version separation, approved policy version, media access classification, consent and anti-abuse controls absent |
| PUB-02..PUB-03 | Service, ServiceTranslation, ServiceCategory, ServiceOption, OptionTranslation, Package/PackageItem, catalogue publication version | Service/category/options and translations exist | Package composition/versioning and immutable published catalogue/configurator revision absent |
| PUB-04 | Cart, CartItem, CartItemOption, ownership/session, expiry, price calculation snapshot | None; request snapshots are post-submission only | Cart ownership, stale price detection, option compatibility, expiry and idempotent mutation absent |
| PUB-05..PUB-07 | ServiceRequest, RequestAnswer, request line/option/price snapshots, verification challenge/token, RequestEvent | Request and financial snapshots/events exist | No Cart-to-request atomic submit service, answer schema/version, safe tracking verification or rate-limit record |
| PUB conditional pricing flow | ConfiguratorVersion/Step/Field, PricingVersion/Rule, PriceCalculation, Discount; TaxPolicy inactive | PricingVersion/Rule and partial service pricing exist | No versioned configurator, persisted calculation evidence, discount model or approved tax semantics; server-only pricing and price-change confirmation unimplemented |
| ADM-01, ADM-16 | User, Session, MFAFactor, Role, Permission, RolePermission, UserRole, AccessGrant, security events | User and basic RBAC exist | Authentication/session lifecycle, MFA, scoped delegation, principal population and effective permission resolution absent |
| ADM-02, ADM-17, ADM-20 | Query-backed operational projections, AuditEvent, export request/evidence | Generic AuditEvent exists | Metrics must derive from real domain sources; export authorization/audit and audit retention/append-only controls absent |
| ADM-03..ADM-05, ADM-14..ADM-15, ADM-19; content publication flow | ContentPage/Version/Section/Translation, NavigationMenu/Item, MediaAsset, DesignTokenSet/Token, SeoMetadata, ApprovalRequest, publication/release event | No persistence models | Immutable draft/live revisions, approval, preview, rollback and locale publication controls absent |
| ADM-06..ADM-09 | ServiceCategory, Service, ServiceOption, Package/PackageItem, ConfiguratorVersion, PricingVersion/Rule, Discount, PriceCalculation | Category/service/option and partial pricing exist | Package and configurator versioning, test scenarios, approval/activation history and commercial-rule decisions absent |
| ADM-10..ADM-11; administration request-review flow | ServiceRequest, immutable request snapshots, RequestEvent, internal note/contact log, Quote/QuoteItem versions, AuditEvent | Requests, snapshots, events and quote models exist | Internal notes/contact logs and protected state-transition service absent; sent quote immutability and transactional audit need enforcement |
| ADM-12 | Customer, Organization, OrganizationMember, CustomerAddress, ContactPreference, customer access links | Customer only | Organization membership, explicit customer-user ownership, preferences/consent, address and privacy workflows absent |
| Quote review / customer acceptance | Quote immutable sent version, QuoteAcceptance evidence, QuoteDecision, QuoteChangeRequest, Contract, ContractAmendment | Quote, items, decision and change request exist | Exact accepted quote-version evidence, transaction/ownership checks, contract conversion and amendment history absent |
| Project delivery lifecycle | Project, ProjectPlan versions, ProjectStage, ProjectTask, TaskDependency, TaskEvidence, Milestone, ChangeRequest, ReviewRound, DeliveryArtifact, CustomerApproval, ReleaseRecord, HandoverRecord | None | All project execution records and protected approval/release gates absent |
| Software delivery automation | Project specification/artifact refs, RepositoryLink, Build/Preview evidence, Review/QA result, CustomerRevision, CustomerApproval, Deployment/ReleaseRecord, WorkflowExecution, AuditEvent | None | Must bind every preview, revision, approval and deployment to immutable commit/build/artifact identifiers; n8n is orchestration only |
| Customer portal contracted operations | Customer/Organization ownership, Project membership, product entitlements, portal access grants, files/artifacts, CustomerApproval | Partial Customer only | No authenticated principal or per-resource customer scope; portal access cannot be enabled |
| Support and communication | SupportTicket, TicketMessage, NotificationTemplate/Notification/Attempt, CommunicationLog | None | Customer-visible messages must be separated from internal notes and agent logs; delivery idempotency and privacy controls absent |
| Workflows, teams and AI workforce | StaffProfile, Team, Assignment, WorkflowDefinition/Instance/Step, ApprovalRequest, AgentDefinition/ToolGrant/Run/Task/Review/Budget, WorkflowExecution, Outbox | None | No scoped tool grants, independent review, human approval gate, run-cost enforcement, retries/idempotency or transactional outbox |
| Hosting operations | HostingAccount, HostedService, BackupRecord, HostingEvent, provider operation references | None | No hosting inventory, client allocation, lifecycle, backup verification or provider boundary |
| Domain configurator / portal / admin | DomainProvider, Extension, provider-extension map, price versions, package entitlement, order, registration, registrant contact, authorization, renewal, transfer, DNS, connection, operation/event/outbox | None | Must reuse Customer/Package/Contract/Invoice/HostedService/AuditEvent; customer remains registrant; provider/payment/TLD/DNS/renewal commercial decisions remain open |
| Finance and reconciliation | Invoice/InvoiceLine, PaymentRecord, RefundRecord, LedgerEntry, ReconciliationRun/Exception, approval/audit | None | Commercial/legal policy and payment provider open; balanced ledger and immutable financial evidence required before activation |
| ADM-18 settings/integrations | Provider/integration metadata, capability registry, secret references, configuration versions, health checks, audit | None | Secret values must remain outside DB; changes require permission, safe connection tests, versioning and audit |

### 8.1 Cross-cutting ownership and evidence paths

The following paths are mandatory before protected business operations can be enabled:

1. **Customer-owned records:** authenticated User → Customer and/or OrganizationMember → Customer/Organization → Request/Quote/Contract/Project/Product records. Every customer-facing query must resolve and enforce this path server-side; a URL identifier is never authorization.
2. **Staff authority:** User → effective base Role/Permission plus time-bounded AccessGrant/Assignment scope → allowed action on a specific resource. A project assignment cannot grant permissions above the user's owner-approved ceiling.
3. **AI authority:** AgentDefinition → explicit AgentToolGrant and resource scope → AgentRun/AgentTask → independent AgentReview. The producing agent cannot approve its own result; protected transitions require ApprovalRequest and a human actor.
4. **Commercial evidence:** versioned Package/Configurator/Pricing → PriceCalculation → immutable Request/Quote snapshot → exact QuoteAcceptance → Contract/Amendment → Invoice/Payment references only when the commercial policy is approved.
5. **Delivery evidence:** Contract scope → ProjectPlan version → Stage/Task/Evidence → ReviewRound → immutable DeliveryArtifact → CustomerApproval bound to exact artifact/version → ReleaseRecord with commit/build/target/approver/verification → HandoverRecord.
6. **External operation evidence:** business transaction + Outbox event → WorkflowExecution/provider operation with idempotency/correlation → verified provider result → domain event + audit. n8n or provider callbacks must not directly mutate authoritative status without signature, validation and state-transition checks.

### 8.2 Source-derived flow gates that must become test cases

- Public request: server revalidates catalogue/options/prices; a changed price requires explicit confirmation; request and snapshots persist atomically; confirmation appears only after commit.
- Administration review: original request snapshot is immutable; each status transition validates the state machine and permission and writes event/audit evidence in one transaction.
- Quote: every revision is a new version; customer acceptance binds to the exact sent version; duplicate submission is idempotent; cross-customer access is denied.
- Project: no work starts before approved plan and contractual gates; plan revisions are versioned; defect/nonconformance is distinguished from paid scope change.
- Software release: preview and revisions remain traceable; final customer approval binds to exact artifact/build; production deployment requires explicit human approval and verified post-deploy checks.
- Content: draft never mutates the live version; publish/rollback records actor, version and time; locale and media states are validated.
- Domain: live availability is provider-backed and timestamped; no availability result reserves a name; price/availability are rechecked; registrant ownership remains with customer; registration is not marked successful before provider confirmation.
- Finance: no payment, tax, refund or ledger operation is activated from a UI-only state; each financial mutation requires approved policy, idempotency and audit evidence.

### 8.3 Recommended next schema slice

Do not add every future module in one large Prisma change. The first model-design slice should be **identity/ownership and commercial intake**, because all customer-facing and staff workflows depend on them:

1. Resolve User ↔ Customer ↔ Organization membership and scoped AccessGrant.
2. Define Session/MFA storage boundaries without selecting an authentication vendor.
3. Add Package/PackageItem and immutable catalogue/configurator version structures.
4. Add Cart/CartItem/CartItemOption and RequestAnswer with ownership and expiry.
5. Add PriceCalculation and immutable request/quote version/acceptance evidence.
6. Add DB constraints and tests for quantities, money, temporal validity, idempotency scope and ownership.
7. Only then proceed to Contract/Project delivery and downstream operational modules.

This ordering is a dependency recommendation, not approval of a payment, tax, currency, authentication or provider policy.
