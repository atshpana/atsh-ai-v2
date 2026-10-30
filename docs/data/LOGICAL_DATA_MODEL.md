# New Application Logical Data Model — Draft v0.1

- Status: **Design draft — not a Prisma schema and not a migration**
- Authority: Executive Reference v2.0 plus explicit greenfield decision.
- Database engine: PostgreSQL approved.
- Legacy database: explicitly excluded. No legacy schema reuse, connection or import.

## 1. Modeling principles

1. Model the business domains in the new system, not the legacy application's tables.
2. PostgreSQL is the new source of truth. Browser state, n8n executions and AI conversation context are not authoritative business records.
3. Use UUID primary keys for internal entities; use separate high-entropy public references/tokens for customer-facing tracking.
4. Use NUMERIC/DECIMAL for all money. Never use floating-point values for financial calculations.
5. Store timestamps in UTC; localize only at presentation boundaries.
6. Use explicit status enums/state machines and append-only event history for important lifecycle changes.
7. Preserve snapshots for prices, service names, options, quote contents, contract scope and approved deliverable versions.
8. Soft-archive catalog/configuration records that are referenced by historical transactions; do not silently erase history.
9. Every tenant/customer/project-owned record must have an explicit ownership path and server-side authorization rule.
10. Keep credentials and provider secrets outside ordinary application tables; store only secret-manager references and non-sensitive metadata.

## 2. Identity and access control

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| User | Human account identity | Unique normalized email; status; auth subject; no plaintext password |
| UserProfile | Optional profile fields | One-to-one with User; collect minimum necessary data |
| Role | Named role template | Unique key; system or custom |
| Permission | Atomic permission definition | Unique key, module + action |
| RolePermission | Role-to-permission grant | Unique pair |
| UserRole | User role assignment | Supports scoped assignment and effective dates |
| AccessGrant | Project/account/unit scoped grant | Grantor, grantee, scope, expiry, revocation |
| Session | Active session metadata | Hashed/session identifier; expiry and revocation |
| MFAFactor | MFA enrollment metadata | Secret material protected; never exposed to application logs |
| AuditEvent | Security/business audit trail | Actor, action, entity, before/after summary, timestamp, request correlation |

Permission evaluation is deny-by-default and server-side. A project grant cannot exceed the user's base role or owner-defined ceiling. Temporary grants expire automatically.

## 3. Customer and organization domain

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| Customer | Customer profile | Optional User link; minimal contact/company details |
| Organization | Customer company/account grouping | May own multiple customer users and projects |
| OrganizationMember | User membership and role in organization | Unique organization/user membership |
| ContactPreference | Preferred communication channel and consent | Versioned/dated consent evidence |
| CustomerAddress | Billing/service address if required | Collect only when commercial/legal process requires |

Customer portal queries must always scope by authenticated customer/organization membership and explicit project/product access.

## 4. Public content and localization

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| ContentPage | Stable page identity/slug | Unique slug; current published version pointer |
| ContentPageVersion | Immutable page revision | Draft/published state, author, publication timestamp |
| ContentSection | Structured page section identity | Ordered within page version |
| ContentTranslation | Locale-specific text/content | Unique page/version/locale |
| NavigationMenu | Named navigation structure | Versioned and locale-aware |
| NavigationItem | Ordered link in a menu | Parent/child optional; internal or approved external target |
| MediaAsset | File metadata and storage reference | MIME/size/checksum/alt text/owner; private/public classification |
| DesignTokenSet | Theme version | Draft/approved/published states |
| DesignToken | Token key/value per theme version | Validated schema; no arbitrary executable content |
| SeoMetadata | Title, description, canonical and alternate locale links | Versioned with page publication |

The public website supports Arabic and English with RTL/LTR. Internal administration is Arabic-only in the current scope. Customer portal language remains open.

## 5. Service catalog and pricing

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| ServiceCategory | Catalog grouping | Unique slug; publication state/order |
| CategoryTranslation | Localized category fields | Unique category/locale |
| Service | Service identity and commercial type | Category; stable slug; active/archive |
| ServiceTranslation | Localized service content | Unique service/locale |
| Package | Reusable service/package offer | May include service components; versioned |
| PackageItem | Service/package composition | Quantity, inclusion and constraints |
| ServiceOption | Optional add-on or configurable choice | Type, price effect, billing period, required/active |
| OptionTranslation | Localized option labels/help | Unique option/locale |
| ConfiguratorVersion | Published request-form schema | Immutable version, schema validation |
| ConfiguratorStep | Ordered step in configurator version | Required/optional and visibility rules |
| ConfiguratorField | Field definition | Type, validation, options, help, conditional logic |
| PricingVersion | Versioned pricing ruleset | Effective dates, approval and activation |
| PricingRule | Declarative pricing rule | Priority, conditions, action, validity; never arbitrary code |
| Discount | Discount/coupon definition | Validity, usage limits, eligibility |
| TaxPolicy | Tax policy reference | Inactive until owner/legal approval |
| PriceCalculation | Calculation record | Input snapshot, pricing version, line breakdown, expiry |

All pricing calculations are repeated and validated on the server. The pricing engine must return line-level one-time and recurring charges, currency, rule version and a clear explanation of the result. The UI total is indicative only until the server confirms it.

## 6. Cart, request and quote domain

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| Cart | Temporary customer selection | User/session ownership, expiry, currency |
| CartItem | Selected service/package | Positive quantity; options validated server-side |
| CartItemOption | Selected option snapshot | Must reference allowed option version |
| ServiceRequest | Submitted request/lead | Unique unpredictable public reference, owner, status |
| RequestAnswer | Submitted configurator answer | Keyed by configurator version/field; validated payload |
| RequestItemSnapshot | Immutable selected line | Service/package name, quantity, unit and line totals |
| RequestOptionSnapshot | Immutable selected option | Label, price effect, billing period |
| RequestPriceSnapshot | Immutable totals and rule version | Subtotal, discount, tax, recurring totals, currency |
| RequestEvent | Append-only lifecycle history | Actor, from/to status, note and timestamp |
| Quote | Versioned formal offer | Request, version, status, expiry, totals |
| QuoteItem | Immutable quote line | Description, quantity, unit price, line total |
| QuoteAcceptance | Customer's explicit acceptance | Actor, timestamp, accepted quote version, evidence |
| Contract | Accepted scope and terms | Linked quote/request and signed/versioned artifact |
| ContractAmendment | Approved scope change | New version, approval evidence and effective date |

Creating a request and its financial snapshot must be atomic. Idempotency prevents duplicate requests on retries. A revised quote creates a new version and never overwrites the old offer. Commercial tax/payment/legal behavior remains disabled until explicitly approved.

## 7. Project delivery and change management

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| Project | Delivery engagement | Contract/customer; status; project owner |
| ProjectPlan | Versioned execution plan | Draft/pending/approved/active/superseded states |
| ProjectStage | Protected lifecycle or configurable execution stage | Stage category; gate metadata |
| ProjectTask | Assignable unit of work | Owner/assignee, due date, status, dependencies |
| TaskDependency | Directed dependency | No cycles; validated on write |
| TaskEvidence | Proof of completion/review | Artifact, test report, link or review record |
| ProjectMilestone | Delivery milestone | Planned/actual dates and acceptance status |
| ChangeRequest | Out-of-scope change proposal | Impact, estimate, approval and resulting amendment |
| ReviewRound | Customer review cycle | Round number and submitted version |
| DeliveryArtifact | Build/release/deliverable | Immutable version identifier, storage/link, checksum |
| CustomerApproval | Explicit customer approval | Approval type, exact version, actor, timestamp |
| ReleaseRecord | Deployment event | Target, commit/build, approver, verification, rollback reference |
| HandoverRecord | Final delivery handover | Included materials, access transfer evidence, acceptance |

Defect/nonconformance against the agreed specification is not a paid change request. Scope changes require separate impact assessment and customer approval. Customer approval must bind to a specific artifact/version. Production release is blocked until all required gates pass.

## 8. Team, workflow and AI workforce

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| StaffProfile | Internal team member profile | Linked User, employment/availability status |
| Team | Department or operational group | Members and manager |
| Assignment | User/agent assignment to project/task | Scope, role, start/end |
| WorkflowDefinition | Versioned workflow template | Protected gates and configurable steps |
| WorkflowInstance | Project/request-specific workflow copy | Immutable template version reference |
| WorkflowStep | Step instance and state | Dependency and transition rules |
| ApprovalRequest | Human approval gate | Requested action, scope, evidence, decision |
| AgentDefinition | AI agent identity/specialty | Model policy, tools, scopes and limits |
| AgentToolGrant | Allowed tool for agent | Explicit capability and resource scope |
| AgentRun | One execution | Input/output references, model, cost, token usage, state |
| AgentTask | Assigned work item | Owner, requester, status, deadline, result |
| AgentReview | Independent quality review | Reviewer must differ from producing agent |
| AgentBudget | Cost/token/time limit | Enforced before and during execution |
| WorkflowExecution | n8n/external workflow reference | Correlation ID, status, retry/idempotency metadata |
| DomainOutboxEvent | Reliable event dispatch | Transactional outbox with delivery state |

The central AI manager coordinates specialized agents but cannot exceed their grants. No agent approves its own work. Financial, contractual, security-sensitive and production actions require designated human approval.

## 9. Support, communications and notifications

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| SupportTicket | Customer support case | Customer, project/product, priority and state |
| TicketMessage | Conversation entry | Author type, visibility, attachment references |
| NotificationTemplate | Versioned message template | Channel, locale and approval state |
| Notification | Intended outbound message | Recipient, event, template version |
| NotificationAttempt | Delivery attempt | Provider reference, status, safe error metadata |
| CommunicationLog | Auditable communication event | Channel, actor, customer, related entity |

Prevent duplicate notifications through event idempotency. Do not store full secrets, payment data or unnecessary sensitive content in logs.

## 10. Hosting, domains and finance

| Entity | Purpose | Key relationships / constraints |
|---|---|---|
| HostingAccount | Internal/reseller hosting inventory | Provider reference, plan, status, owner/customer mapping |
| HostedService | Customer hosting allocation | Contract, account, limits and lifecycle |
| DomainAsset | Domain registration/management record | Registrar reference, expiry, renewal status |
| BackupRecord | Backup/restore evidence | Target, timestamp, provider status and verification |
| HostingEvent | Renewal/suspension/incident event | Actor, event, timestamp |
| Invoice | Financial document | Customer/contract, currency, totals and status |
| InvoiceLine | Immutable billed item | Description, quantity, amount, tax category |
| PaymentRecord | Payment provider reference and status | No raw card details |
| RefundRecord | Refund record | Linked payment and approval |
| LedgerEntry | Financial posting | Balanced entries and source reference |
| ReconciliationRun | Reconciliation process | Provider statement and exceptions |

Finance, payment and tax entities are structural design candidates only; they must not be activated until commercial policies and providers are approved.

## 11. Shared invariants and database constraints

- Unique normalized user email; unique public request reference; unique stable slugs within their scope.
- Foreign keys and appropriate unique constraints for all join tables.
- Positive quantities and non-negative money amounts where the business rule requires.
- Decimal precision/scale selected explicitly for supported currencies.
- Request creation, quote versioning and state transitions use transactions.
- Idempotency key scoped to actor/operation and retained for a documented period.
- Published page/configurator/pricing versions are immutable.
- Audit and lifecycle events are append-only by application policy.
- Customer-owned rows have indexes supporting ownership scoping.
- Sensitive fields are classified; retention and deletion policies are defined before production use.
- Database migrations are versioned, tested from an empty database and reversible where practical.
- No database is provisioned and no migration is generated by this draft.

## 12. Next design outputs

1. ERD with cardinality and ownership paths.
2. Prisma model draft split by domain files or clear model sections.
3. Permission matrix mapping roles, permissions and entity scopes.
4. State-machine tables for requests, quotes, projects, plans, tasks, approvals and releases.
5. Data classification/retention matrix.
6. Migration strategy and seed policy for the new database.
7. Test fixtures that contain synthetic data only.

These outputs must be reviewed before creating the first database migration.
