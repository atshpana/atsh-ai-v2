# Commercial Intake Data Design — Draft v1.0

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Authority: Executive Reference v2.0, `docs/data/LOGICAL_DATA_MODEL.md`, `docs/api/PUBLIC_CONFIGURATOR_CART_CONTRACT.md`, `docs/data/PRISMA_MODEL_GAP_ANALYSIS.md`
- Status: **Design proposal only. No Prisma schema, migration, API, pricing behavior, or customer-facing checkout behavior is changed by this document.**

## 1. Scope and boundary

This design specifies the first commercial-intake records between the existing service catalogue and submitted service request:

1. Versioned package composition.
2. Immutable configurator definition and field revisions.
3. Customer answers tied to the exact configurator version.
4. Server-authoritative price-calculation evidence.
5. Cart lifecycle and atomic conversion to a service request.
6. Snapshot and idempotency requirements.

It deliberately does not choose a payment provider, tax treatment, currency policy, discount policy, authentication provider, customer account model, or commercial price list. It does not activate online payment or imply that a displayed estimate is a binding offer.

## 2. Existing implementation to preserve

The current Prisma draft already contains:
- `Service`, `ServiceOption`, localized service/option records.
- `PricingVersion` and declarative `PricingRule`.
- `ServiceRequest`, request item/option snapshots, `RequestPriceSnapshot`, and `RequestEvent`.
- `Quote`, `QuoteItem`, `QuoteDecision`, and `QuoteChangeRequest`.

Do not duplicate these entities. The new design extends the catalogue and pre-submission journey, then connects atomically to the existing request records.

## 3. Proposed entities and fields

### 3.1 Package and package composition

**Package**
- `id`: UUID primary key.
- `slug`: stable unique public identifier.
- `status`: existing catalogue lifecycle vocabulary where applicable (draft/published/archived).
- `createdAt`, `updatedAt`.
- Relations: translations, immutable package versions, and package-item revisions.

**PackageTranslation**
- `packageVersionId`, `locale`, `name`, `shortDescription`, optional `body`.
- Unique: (`packageVersionId`, `locale`).

**PackageVersion**
- `id`, `packageId`, `version` (positive integer), `status`, `createdAt`, optional `publishedAt`, `publishedById`.
- Unique: (`packageId`, `version`).
- A published version is immutable. A change creates a new version.
- A package may have at most one current published version; enforce with a PostgreSQL partial unique index or a transactionally maintained pointer, after choosing the migration strategy.

**PackageItem**
- `id`, `packageVersionId`, `serviceId`, `quantity`, `isIncluded`, `sortOrder`, optional declarative constraints.
- Unique: (`packageVersionId`, `serviceId`) unless the approved catalogue explicitly permits the same service more than once with distinct roles.
- CHECK: quantity > 0.
- Restrict deletion of referenced service versions or preserve service identity through immutable snapshots.

**Package entitlement** is not inferred from the package label. Domain entitlement is a separate explicit item/policy snapshot and must follow the approved domain policy: some eligible packages may include an entitlement; other domains are separately priced. Renewal coverage remains an open commercial decision.

### 3.2 Configurator definition

**ConfiguratorVersion**
- `id`, stable `key`, `version` (positive integer), `status`, `createdAt`, optional publication metadata.
- Unique: (`key`, `version`).
- Published versions are immutable and addressable by exact ID/version.
- A configured service/package references one exact published version, never a mutable “latest” definition during an in-flight cart.

**ConfiguratorStep**
- `id`, `configuratorVersionId`, `key`, `sortOrder`, `isRequired`, optional declarative visibility rule.
- Unique: (`configuratorVersionId`, `key`); unique order within a version if product requirements require deterministic step positions.

**ConfiguratorField**
- `id`, `stepId`, `key`, `fieldType`, `isRequired`, `sortOrder`, optional `helpKey`, optional `validationSchema` JSON, optional `visibilityRule` JSON.
- Unique: (`stepId`, `key`).
- Field types and JSON rule grammar must be controlled by application code; never evaluate arbitrary code, SQL, expressions, or scripts from stored JSON.
- A field definition is immutable after publication. Validation is version-specific.

**ConfiguratorOption**
- `id`, `fieldId`, `key`, `sortOrder`, optional translation key, optional stable catalogue reference.
- Unique: (`fieldId`, `key`).
- Option availability and pricing are revalidated by the server against the published definition and current allowed catalogue state.

### 3.3 Request answers

**RequestAnswer**
- `id`, `requestId`, `configuratorVersionId`, `fieldId`, `fieldKeySnapshot`, `answerJson`, `createdAt`.
- Unique: (`requestId`, `configuratorVersionId`, `fieldId`).
- FK to request is restrictive/cascading only according to the final evidence-retention policy; do not erase submitted commercial evidence through routine customer deletion.
- Validate answer shape, field type, requiredness, visibility conditions and option membership on the server at submission.
- Preserve a safe human-readable answer snapshot for future rendering if a field definition is later archived. Never trust a client-supplied field label or price.

The answer JSON is data, not executable configuration. Apply size limits and reject unknown field IDs or fields from another configurator version.

### 3.4 Price calculation evidence

**PriceCalculation**
- `id`, `pricingVersionId`, optional `configuratorVersionId`, `currency` (ISO-style 3-character code only after currency policy approval), `status`, `calculatedAt`, `expiresAt`.
- `inputSnapshot` JSONB: canonical validated package/service selections and normalized answers.
- `lineSnapshot` JSONB: server-generated line identity, quantity, unit/line amounts, billing period and explanation codes.
- `subtotal`, `discountTotal`, `taxTotal`, `grandTotal`, `recurringTotal`: DECIMAL/NUMERIC, never floating point.
- Optional `supersedesCalculationId` to represent recalculation lineage.
- Index: (`expiresAt`, `status`), (`pricingVersionId`, `calculatedAt`).
- Monetary non-negativity CHECKs must wait until discount sign semantics are explicitly decided. Always enforce arithmetic consistency in a single server-side calculation transaction and test rounding rules once approved.

A calculation is a quote/estimate snapshot, not proof of customer acceptance and not a payment. The server must recalculate on every material cart mutation and submission. If the price changes, require explicit customer confirmation before submission; do not silently replace the displayed total.

### 3.5 Cart and cart items

**Cart** (schema blocked on account/identity decision)
- `id`, `status`, `createdAt`, `updatedAt`, `expiresAt`, optional `submittedRequestId`, optional `lastPriceCalculationId`.
- Exactly one authenticated owner or anonymous-session owner is required. Do not implement a polymorphic `ownerType/ownerId` pair without referential integrity.
- The account model and session ownership must be decided before adding the owner foreign keys.
- Unique active-cart rule must be defined per owner and currency only after the ownership/session model is approved.

**CartItem**
- `id`, `cartId`, optional `packageVersionId`, optional `serviceId`, `quantity`, `createdAt`, `updatedAt`.
- CHECK: quantity > 0.
- Enforce exactly one of package or service selection with a database CHECK constraint in reviewed SQL, if both forms remain supported.
- Keep selected option IDs and normalized answers linked to exact published configurator versions.

**CartItemOption**
- `id`, `cartItemId`, `serviceOptionId`, `optionKeySnapshot`, `labelSnapshot`, optional validated value snapshot.
- Unique selection rule must follow option cardinality (single vs multi-select); this is a product-rule decision, not a generic assumption.

Cart reads and mutations must verify authenticated/session ownership before loading sensitive content. A cart ID is never an access credential.

## 4. Submission transaction

The following operations must succeed or fail as one database transaction:

1. Resolve and verify the authenticated customer/session principal.
2. Lock the cart and verify it is active, unexpired and owned by that principal.
3. Re-load current package/service/configurator/pricing versions.
4. Revalidate all item/option/answer combinations and quantity constraints.
5. Recalculate prices on the server.
6. If the confirmed calculation differs from the cart's accepted calculation, return a price-change response and require explicit confirmation; do not create a request yet.
7. Validate the idempotency key in its defined actor + operation scope.
8. Create `ServiceRequest`, `RequestAnswer`, request item/option snapshots, `RequestPriceSnapshot`, and initial `RequestEvent`.
9. Mark the cart submitted and bind it to the resulting request.
10. Persist the idempotent result and commit.

A retry with the same valid idempotency key must return the original safe result, not create another request. Concurrent submissions of the same cart must produce at most one request.

## 5. Authorization and data-integrity invariants

- No owner/customer ID supplied by the browser can override the authenticated principal.
- No cross-customer cart read, update, deletion or submission.
- A cart cannot reference a draft, archived, superseded or incompatible configurator version.
- A submitted request preserves the exact package/configurator/price/answer snapshot used at submission.
- A later catalogue or pricing change must not mutate historical request or quote evidence.
- A request's price snapshot and line snapshots must reconcile exactly under the approved rounding policy.
- A customer-facing response must not expose internal pricing rules, staff notes, provider secrets or internal audit metadata.
- Important commercial records are restricted from hard deletion; retention/redaction policy remains open.
- n8n may orchestrate downstream notifications/work but is not the source of truth for cart ownership, price calculation, submission or acceptance.

## 6. Index and constraint plan

Initial candidate indexes, to be validated against actual query plans:
- Package: unique slug; PackageVersion unique (package, version), status/publication lookup.
- ConfiguratorVersion: unique (key, version), status lookup; steps ordered by (version, sortOrder); fields unique by (step, key).
- RequestAnswer: unique (request, version, field); request lookup.
- PriceCalculation: (status, expiresAt), (pricingVersion, calculatedAt).
- Cart: owner lookup and expiry cleanup index after owner FK design; submittedRequestId unique.
- CartItem: (cartId, createdAt); options by cart item.
- Request submission idempotency: unique scoped key/actor/operation record, not a globally unique unqualified string.

Database CHECK constraints are required for positive version numbers and quantities. Add partial unique indexes and cross-row constraints in reviewed SQL where Prisma cannot express them; document every raw SQL object in migration review.

## 7. Decisions still required

These remain open and must not be inferred:
1. Customer account model: Customer-as-account, Organization-as-account, or Customer-contact/Organization-account.
2. Authentication provider and whether ATSH persists sessions.
3. Anonymous cart policy: supported or authenticated-only.
4. Customer portal language.
5. Currency and rounding policy.
6. Whether prices shown are indicative estimates or binding offers at each stage.
7. Discount eligibility and sign semantics.
8. Tax policy and legal approval.
9. Package renewal/recurring billing terms, including domain renewal coverage.
10. Retention/redaction rules for submitted answers and pricing evidence.

## 8. Implementation gates

Do not implement the cart owner FK or cart APIs until decisions 1–3 are approved. Do not activate pricing until decisions 5–9 are approved. The package/configurator definition can be implemented independently only after its publication/versioning behavior and catalogue ownership are accepted.

Before a migration is eligible for review:
- Prisma schema validation and generated-client checks pass.
- CHECK/partial unique constraints are represented in reviewed SQL where needed.
- Unit and API integration tests cover version immutability, invalid answers, price changes, idempotency and concurrent submit.
- Cross-account isolation tests cover list/detail/mutation/submission.
- A disposable empty PostgreSQL CI database accepts the migration and reports up to date.
- The complete generated SQL is reviewed; no durable database is touched without explicit owner approval.

**Current decision: design proposal only; no Prisma schema or migration changes.**
