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
