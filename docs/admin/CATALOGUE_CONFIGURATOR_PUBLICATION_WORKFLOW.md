# Catalogue and Configurator Administration Workflow — Draft v1.0

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Source: Executive Reference v2.0 as indexed in `docs/requirements/SCREEN_AND_FLOW_CATALOG.md`
- Related designs: `docs/data/COMMERCIAL_INTAKE_DATA_DESIGN.md`, `docs/api/PUBLIC_CONFIGURATOR_CART_CONTRACT.md`, `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md`
- Status: **Workflow and screen design only. No UI, API, schema, permission seed, publication, pricing or runtime behavior is implemented by this document.**

## 1. Purpose and scope

Define an auditable administration workflow for service catalogue, packages, service options, configurator forms, pricing versions and publication. It maps directly to:
- ADM-06 Categories.
- ADM-07 Services.
- ADM-08 Service options.
- ADM-09 Pricing rules.
- ADM-13 Forms.
- ADM-15 Languages.
- ADM-19 Preview/publish.

It also supports the public screens PUB-02..PUB-05 by ensuring only valid published catalogue/configurator revisions are served.

The administration workspace should feel like one coherent product-management area, but the underlying records and approvals remain separated by domain. A single “Publish all” action must not silently activate unrelated pricing, tax, content or integration settings.

## 2. Navigation and workspace information architecture

Recommended left navigation grouping (labels are proposed UI language, not source requirements):

1. **Catalogue**
   - Categories
   - Services
   - Options and dependencies
   - Packages
2. **Customer journey**
   - Configurator forms
   - Form preview and test cases
   - Localizations
3. **Commercial rules**
   - Pricing versions
   - Pricing test scenarios
   - Pricing approval
4. **Publication**
   - Pending reviews
   - Preview / comparison
   - Publication history
   - Rollback history

Each list screen should provide search, relevant filters, status, last modified, owner/editor, current published version and a clear draft-vs-live distinction. Avoid exposing internal database IDs in ordinary operator workflows.

## 3. Editorial lifecycle and state machines

### 3.1 Versioned artefact lifecycle

For service/package/configurator/pricing artefacts, use this conceptual lifecycle:

`Draft → In review → Changes requested → Approved → Published → Superseded`

Additional terminal/administrative states may include `Archived` and `Rejected`, subject to the final domain state machine.

Rules:
- A draft is editable by authorized editors.
- An in-review revision is frozen for review; subsequent edits create a new draft revision or return the item to draft with an audit event.
- A reviewer may approve or request changes but cannot edit the submitted revision as if they were its author.
- Approval identifies the exact immutable revision, reviewer, timestamp and decision evidence.
- Publication is a separate protected operation. Approval does not imply publication unless a separately approved policy explicitly says so.
- Publishing creates an immutable published revision or pointer to one; it never mutates an existing published revision.
- A new published revision supersedes the previous current revision without rewriting historical requests or quotes.
- Rollback republishes a previously approved immutable revision through a new publication event; it does not delete or rewrite publication history.

### 3.2 Separate publication domains

Do not collapse all content and commercial records into one state machine:
- Catalogue publication controls category/service/package visibility.
- Configurator publication controls the exact form schema used by new customer sessions.
- Pricing activation controls which approved pricing version is used for new calculations.
- CMS publication controls public editorial pages.
- Settings/integration changes use their own protected review and test procedures.

A service may be visible but unavailable for purchase if its required configurator or pricing dependency is not valid. The public API must return an explicit unavailable/quote-required/configuration-error state rather than silently fall back to an unrelated revision.

## 4. End-to-end workflow

### Step 1 — Create or edit catalogue draft (ADM-06/07/08)

Operator creates/edits category, service or option draft:
- Category: slug, localized names/descriptions, media reference, order and publication intent.
- Service: category, stable slug, localized content, delivery scope, deliverables, pricing mode, media and active/archive intent.
- Option: selection cardinality, quantity behavior, allowed values, dependencies, conflicts, visibility conditions and pricing kind.

Validation before review:
- Required locale fields for intended publication are complete.
- Slugs are unique and stable.
- Referenced category/media/option records exist and are eligible.
- Dependencies and conflicts do not reference missing or incompatible options.
- Rule conditions conform to the allow-listed declarative grammar.
- No executable scripts, arbitrary SQL, raw HTML execution or untrusted code are stored as rules.

### Step 2 — Compose package draft

Operator creates a package and selects an immutable package version:
- Select service components and quantities.
- Define included vs separately selected components.
- Define package-level presentation and localized descriptions.
- Represent a domain entitlement only where the approved package policy permits it; do not imply domain renewal is included because initial entitlement exists.
- Run compatibility validation against component services and options.

A package version is not published until all component references resolve to eligible catalogue records. Changes after publication create a new package version.

### Step 3 — Build configurator draft (ADM-13)

Form editor:
- Add ordered steps and fields.
- Choose only supported field types.
- Set requiredness, helper text, validation bounds and choice lists.
- Define conditional visibility/dependencies with constrained declarative rules.
- Associate the form with the exact service/package context.
- Add Arabic and English labels/help text separately.
- Preview desktop/mobile, RTL/LTR, validation errors, empty states and conditional paths.

The form builder must show an explicit version number and status. Published form versions are immutable. An in-progress customer cart/session remains bound to its original version; a new version applies to new sessions after publication.

### Step 4 — Test scenarios

Before review, editor runs a saved test matrix:
- Minimum valid submission.
- Maximum permitted values.
- Missing required field.
- Invalid data type and out-of-range value.
- Each conditional visibility branch.
- Each option dependency and conflict.
- Each supported locale and direction.
- Service unavailable/archived.
- Configurator version mismatch.
- Custom-quote path where applicable.
- Pricing unavailable or stale.
- Package composition compatibility.

Each test stores input fixture, expected validation/result code, actual result, test-run timestamp and tester. Fixtures must contain synthetic data only. A test pass is evidence for the exact revision tested; changing the revision invalidates its prior pass.

### Step 5 — Pricing version testing and approval (ADM-09)

Pricing is reviewed independently from catalogue and form publication:
- Create a new version from an existing approved version or an empty draft.
- Define only supported declarative rules (fixed, per-unit, tiered, recurring, custom quote) as permitted by the approved API contract.
- Run representative examples and edge cases.
- Compare output line-by-line against the prior approved version.
- Display one-time and recurring charges separately.
- Show rule explanation and rounding output for internal review.
- Keep discounts, tax and currency behavior inactive unless their owner/legal decisions and configuration are approved.
- Never expose internal pricing rule details to public clients.

Activation requires exact version approval and a protected activation event. A calculation records the version used. Existing requests/quotes retain their original snapshots.

### Step 6 — Submit for review

Submission package contains:
- Artefact type and stable identifier.
- Exact draft revision/version.
- Summary of changes vs current published revision.
- Dependency list (category/service/package/options/configurator/pricing).
- Localization completeness report.
- Validation and test-run evidence.
- Requested publication intent and effective time if supported.
- Risk/impact note for changes affecting active customer journeys.

Reviewer sees the exact immutable candidate and a before/after comparison. Missing dependencies, failed tests, incomplete required locales or unresolved approval gates block approval.

### Step 7 — Approve and publish (ADM-19)

Approval:
- Reviewer is authorized for the artefact type and environment.
- Reviewer cannot approve their own change for high-impact commercial artefacts; separation-of-duties policy must be owner-approved and enforced server-side.
- Decision is bound to candidate revision hash/ID.
- Request-changes decision includes structured reasons and returns candidate to the editor.

Publication:
- Re-check all dependencies and approval status inside the publication transaction.
- Verify no newer revision has superseded the reviewed candidate.
- Publish the exact approved version.
- Record actor, timestamp, revision ID/hash, dependency versions, publication result and correlation ID.
- Update public read model/cache only after transaction success.
- If downstream cache invalidation fails, retain publication record and retry safely; do not publish duplicate revisions.
- Public endpoints expose only current eligible published versions.

### Step 8 — Monitor and rollback

Publication history shows:
- Version, author, reviewer, publisher and timestamps.
- Change summary and dependency versions.
- Test evidence.
- Publication result and any retry.
- Current/superseded status.
- Rollback events and reason.

Rollback requires authorization and a reason, and creates a new publication event referencing the restored immutable version. If a restored version has incompatible dependencies, block rollback and require a compatible revision.

## 5. Screen-level behavior and key controls

| Screen ID | Workspace behavior | Required states / acceptance |
|---|---|---|
| ADM-06 Categories | Search/list, localized editing, media/order, archive and publication status | Draft/published/archived; locale incomplete; duplicate slug; dependency in use |
| ADM-07 Services | Service editor with scope/deliverables/pricing mode/locales and linked options/forms | Draft; review; published; unavailable; archived; dependency errors |
| ADM-08 Options | Dependency/conflict graph, cardinality, quantity and visibility test | Cyclic/invalid dependency; conflicting selection; invalid rule; test failure |
| ADM-09 Pricing | Version editor, scenario runner, before/after diff and approval | Draft; test failure; approval pending; approved inactive; active; superseded; config error |
| ADM-13 Forms | Step/field editor, localized labels, preview and scenario test | Draft; invalid schema; locale incomplete; test failure; in review; published |
| ADM-15 Languages | Translation completeness and per-locale review | Missing translation; stale translation; ready for review; published locale |
| ADM-19 Preview/publish | Immutable candidate preview, diff, dependency checklist, approval, publish and rollback | Permission denied; stale candidate; dependency changed; approval required; publish failed; published; rollback blocked |

Global workspace requirements:
- Show unsaved changes and prevent accidental navigation loss.
- Use explicit confirmation for archive, supersede, publish, rollback and irreversible actions.
- Provide loading, empty, validation, permission-denied, conflict and retry states.
- Preserve Arabic RTL and English LTR previews.
- Keep preview clearly marked as non-public and do not expose draft content through public routes.
- Keyboard navigation and accessible labels are part of acceptance.

## 6. Proposed permission catalogue (not yet approved)

These are candidate atomic permission keys for authorization design; they must be reconciled with the owner-approved RBAC policy before seeding or enforcement:

| Candidate key | Purpose |
|---|---|
| `catalog.category.read` / `catalog.category.write` | Read and edit category drafts |
| `catalog.service.read` / `catalog.service.write` | Read and edit service drafts |
| `catalog.option.read` / `catalog.option.write` | Read and edit option definitions |
| `catalog.package.read` / `catalog.package.write` | Read and edit package revisions |
| `configurator.read` / `configurator.write` | Read and edit form revisions |
| `configurator.test` | Execute validation/test scenarios |
| `pricing.read` / `pricing.write` | Read and edit pricing drafts |
| `pricing.test` | Execute pricing scenarios |
| `catalog.review` | Review catalogue/package/configurator revisions |
| `pricing.review` | Review pricing revisions |
| `catalog.publish` | Publish approved catalogue/configurator/package revisions |
| `pricing.activate` | Activate approved pricing revision |
| `catalog.rollback` | Restore an earlier approved catalogue/configurator/package revision |
| `audit.read` | Read publication and review audit history |

Important:
- Read, write, review, publish, activate and rollback are distinct capabilities.
- A frontend-hidden button is not authorization; every operation is checked server-side.
- A permission does not grant access to all customers or all business data by itself; resource/environment scope is separately enforced.
- Do not assign these keys to roles until the owner-approved role matrix is available.

## 7. Audit and evidence contract

Every meaningful lifecycle action records:
- Actor identity and principal class.
- Action and artefact type.
- Artefact ID and immutable revision ID/hash.
- Previous and resulting state.
- Timestamp and request/correlation ID.
- Decision reason or change-request note where applicable.
- Dependency version references.
- Test evidence references for approval/publication.
- Result or failure code.

Do not store passwords, bearer tokens, MFA secrets, provider credentials, or full sensitive customer answers in audit payloads. Audit records are not editable through ordinary admin UI.

## 8. Failure and concurrency controls

- Two editors cannot silently overwrite one another: use optimistic concurrency/version checks.
- A review decision for revision N cannot approve revision N+1.
- A publish request must fail safely if a dependency changed after review.
- A failed publish must not mark a candidate as current published.
- Retrying a publish request with the same idempotency scope returns the original publication result.
- Cache invalidation is retryable and observable; the database publication record remains authoritative.
- An active public configurator cannot be mutated in place.
- Pricing calculation must bind to the exact approved pricing version used.
- Archive is blocked when active dependencies exist unless an explicit replacement/migration path is completed.
- Rollback cannot violate current dependency compatibility or erase audit evidence.

## 9. Proposed acceptance tests

1. Unauthorized editor cannot create/update a draft.
2. Editor cannot approve or publish without the corresponding capability.
3. Author cannot approve own high-impact pricing revision when separation-of-duties is enabled.
4. Draft service/category/form is never returned by public API.
5. Published configurator response is stable for a given version.
6. Existing request/cart evidence remains bound to its original configurator and pricing versions.
7. Invalid dependency/conflict graph cannot be published.
8. Failed required-locale validation blocks publication.
9. Pricing test failure blocks activation.
10. Changed dependency after approval invalidates the pending publish attempt.
11. Concurrent edits cause a conflict response rather than lost update.
12. Duplicate publish retry does not create duplicate publication history.
13. Rollback restores an earlier immutable revision through a new event and is fully audited.
14. Archive of a referenced service is blocked or requires an approved replacement path.
15. Public response never includes draft/internal pricing rule metadata.
16. All ADM-06..09/13/15/19 screens expose loading, empty, validation, denied and failure states.
17. RTL/LTR and responsive previews match the selected locale and viewport.

## 10. Data model dependencies and unresolved decisions

This workflow depends on the future versioned Package/Configurator/PriceCalculation design. It does not require the cart owner model to be resolved for the editorial workflow, but public purchase activation still does.

Still open:
- Exact role matrix and separation-of-duties rules.
- Whether one user may author and approve low-risk catalogue content.
- Publication scheduling/time-zone policy.
- Whether published catalogue revisions are globally shared or scoped by locale/market.
- Localization fallback policy (do not assume fallback is allowed for legally/commercially material fields).
- Price-effective date and overlap resolution.
- Currency, rounding, discount and tax decisions.
- Required package renewal/entitlement disclosure.
- Final archive/retention semantics.

## 11. Acceptance boundary

This is not a claim that ADM-06..09/13/15/19 are implemented. Before implementation is accepted, each screen and API operation must map to the approved requirement IDs, permission matrix, schema constraints, test cases and evidence commit. No publication, pricing activation or production customer journey is enabled by this design.

**Current decision: design only; no schema, UI, API, RBAC seed, publication or commercial activation changes.**
