# HAI → Software Production Line Gap Matrix

**Status:** evidence-based engineering assessment; review required  
**Assessment date:** 2026-11-07  
**Specification source:** `ATSH AI — المرجع الأم الشامل والمستقل للمشروع v1.0` (uploaded source, 7,308 non-empty paragraphs and 57 tables)  
**Architecture source:** `مرجع معمارية خط الإنتاج والعقل المركزي v1.1`  
**Repository:** `atshpana/atsh-ai-v2`  
**Scope:** ability of the production-line engine to ingest the HAI master, build the ATSH AI application, safely integrate existing server systems, verify, preview, revise, and prepare a controlled release.

> This matrix assesses the production-line capability, not the feature completeness of the ATSH AI customer-facing application. The repository already contains application workspaces and product documentation. Their feature-by-feature conformance to all HAI screens, workflows, permissions, and business rules requires a separate traceability audit; this document does not label that application work absent.

## 1. Source hierarchy and constraints

1. The fixed execution reference v2.0 governs technical, data, security, migration, testing, and release rules.
2. The HAI master v1.0 consolidates the product requirements, customer experience, central administration, operations, data, security, tests, and governance. It explicitly says that being a requirements document does not prove implementation.
3. Production-line architecture v1.1 defines the operational lifecycle and makes Phase 0 (protection) and Phase 1 (environment inspection) mandatory. No build or architectural implementation may begin before a documented Phase 1 report is reviewed and approved.
4. Missing commercial, legal, payment, hosting, support, and policy decisions must remain unresolved; the engine must not invent them.
5. Existing production data is protected. `core-db` must not be replaced or reinitialized; Build Worker must not have direct network access or unrestricted credentials. `agent-db` is separate engine state. Application runtime data access must be separately controlled.
6. Production merge, migrations, and deployment remain version-bound human approval gates.

## 2. Evidence labels

- **Implemented (verified in source):** relevant code is present; runtime operation may still require separate evidence.
- **Partial:** a limited primitive, design, or documentation exists, but the required end-to-end capability is not established.
- **Missing (not found in inspected implementation):** no implementation evidence was found in the inspected repository paths and records.
- **Blocked:** must not be enabled until a prerequisite or safety gate is satisfied.
- **Unverified:** requires evidence from the actual Coolify/server/database environment; code or owner confirmation alone is insufficient.

## 3. Production-line capability matrix

| HAI / architecture need | Required outcome | Repository evidence reviewed | Assessment | Gap / acceptance evidence |
|---|---|---|---|---|
| Immutable HAI intake | Store original file unchanged with version, source, hash, and durable intake record | No HAI intake endpoint, immutable object store, or intake record was identified in the inspected engine implementation | Missing | Intake API/storage, SHA-256, version/source metadata, access policy, replay test, immutable-source test |
| Requirement extraction | Extract modules, screens, journeys, roles, permissions, rules, integrations, entities, acceptance criteria, and unresolved questions | Product requirement docs and catalogs exist; no automated HAI parser/extraction pipeline was identified | Partial (manual documentation only) | Versioned extraction schema, parser, validation, unresolved-question register, repeatability and source-location tests |
| Requirement traceability | Map each requirement to plan item, code artifact, test, result, and release | `docs/requirements/TRACEABILITY.md` and related catalogs exist | Partial | Trace records must be generated/maintained from a specific HAI hash and linked to commits/tests/results |
| Specification conflict handling | Preserve source authority; identify conflicts and do not invent decisions | Reference hierarchy and open-decision documents exist | Partial | Machine-readable conflict register, blocking questions, approval flow, tests proving unresolved decisions block affected work |
| Build planning | Produce a reviewable dependency-aware plan and retain version in engine DB | Worker persists versioned tool-plan metadata/events | Partial | HAI-derived module/API/UI/data/test plan; plan approval/versioning; evidence of mapping each work item to requirements |
| Task graph / dispatch | Parent-child tasks, dependencies, bounded parallelism, cancellation, aggregation | Durable queue/lease/retry/checkpoint foundation exists; one job per worker process and no verified durable parent-child dispatcher/aggregator | Partial | Durable DAG schema, dependency scheduler, concurrency caps, idempotency, cancellation and aggregation tests |
| Isolated implementation workspace | Create governed per-job workspace and guarded writes | Per-job workspace and create-only workspace writer merged; workspace-write tool-loop integration merged | Implemented (limited) | Prove path isolation, cleanup/quotas, concurrent job separation, and persistence/retention policy |
| Real build sandbox | Execute untrusted generated code only in a real isolated container/microVM | PR #32 defines a capability contract and fail-closed policy; no concrete backend exists | Blocked | Concrete backend; non-root; no host/core-db network or sockets; read-only root; bounded writable mounts; CPU/memory/PID/time/output; cancellation; integration tests proving denial and limits |
| GitHub implementation lifecycle | Create feature branches, commit source, open draft PRs, retain review evidence; no self-merge | Worker GitHub inspection is read-only; workspace writes are local to the worker | Partial | Restricted write credential, branch/commit/PR APIs, audit trail, idempotency, tests; no merge permission |
| Existing server discovery | Read-only inventory of services, databases, schemas, tables, views, relations, ownership, network and backup state | Architecture describes required discovery; no verified live inventory or discovery workflow was found | Unverified / missing evidence | Phase 1 report with evidence; read-only metadata-only collector; access and ownership map; no production writes |
| HAI-to-existing-data mapping | Map requirements to existing DB/API structures and least-privilege application access | Logical data model and Prisma design docs exist; no verified mapping to the live server schema | Partial (design only) | Compare approved HAI entities with discovered metadata; owner/system mapping; API/view/role proposal; staging validation |
| `agent-db` separation | Durable engine jobs, plans, checkpoints, approvals, audit state separate from business data | PostgreSQL/Prisma worker job and tool-plan schema/migrations are present in repository | Implemented (source foundation); runtime unverified | Verify actual deployed DB identity, backup, access, migrations, network, and runtime connection in Phase 1 |
| Model/provider and spend controls | Use existing OpenAI key at runtime only; task scope, redaction, usage and hard budgets | Model integration exists; no verified complete per-task spend ledger/hard-stop evidence was identified in the inspected baseline | Partial | Secret injection evidence without exposing values; usage/cost records, budgets, alerts, stop-on-limit and tests |
| n8n orchestration | Triggers, integrations, notifications; engine DB remains source of truth | n8n client/integration code and documentation exist | Partial / runtime unverified | Verify actual workflows, credentials, webhook authentication, idempotency, retry policy, and live connectivity |
| Build/test evidence | Install, codegen, build, lint, unit, API, integration, E2E, migration validation in isolated runtime | GitHub CI validates repository code; worker does not yet orchestrate customer-project builds/tests in a proven sandbox | Partial | Pipeline execution in isolated backend; results/artifacts tied to HAI hash and commit SHA; acceptance matrix |
| Preview / staging | Non-production preview with safe data/config and requirement evidence | No complete preview artifact/provisioning workflow identified | Missing | Preview environment lifecycle, expiry, auth, safe data, URL, smoke/E2E evidence, cleanup |
| Revisions | Versioned feedback; classify defect vs scope change; rerun impacted tests | No end-to-end revision workflow identified in engine | Missing | Change request schema, impact analysis, branch/commit linkage, regression evidence |
| Approval ledger | Persist approver, scope, timestamp, status, exact release/commit SHA | Architecture requires an approvals record; repository evidence does not yet establish the full version-bound approval lifecycle | Missing / unverified | Inspect existing schema first; implement only after Phase 1; negative tests for stale/mismatched approval |
| Release package | Commit, artifact, tests, migration, target, rollback, approval manifest | No complete release candidate manifest identified | Missing | Immutable release manifest and verification tests |
| Deployment | Explicit target, version-bound approval, backup/rollback, health/TLS/domain/data checks | No controlled deployment pipeline evidence identified | Missing / blocked | Non-production rehearsal first; explicit approval; rollback and post-deploy evidence; no autonomous production release |
| Handover | Deliver the accepted ATSH AI platform with operations/support documentation | Product requirements define handover and post-delivery modules; engine handover workflow not established | Missing | Handover package, environment inventory, operator guide, backup/restore and support ownership |

## 4. Phase 0 / Phase 1 gate — mandatory before build work

Architecture v1.1 requires:

### Phase 0 — protection
- Verify current `core-db` backup, create a fresh backup, and test restoration.
- Prepare a sanitized staging copy for compatibility testing.
- Verify that the existing OpenAI key is stored in Coolify without exposing its value.
- Record evidence, timestamps, and any exceptions.

The owner previously confirmed that server database/backup preparation and OpenAI key preparation are complete. This is **owner-confirmed preparation**, not independent evidence of backup integrity, successful restore, staging sanitization, or secret scoping. Do not repeat broad readiness checks; request only missing evidence if needed.

### Phase 1 — actual environment inspection
- Coolify services, versions, status, networks, and bindings.
- Worker and n8n deployment/runtime state.
- Actual databases, schemas, tables, relations, roles, grants, and ownership (metadata-only).
- GitHub repositories, branches, protection, Actions and CI/CD.
- Secret-variable presence and scope without reading or printing secret values.
- Firewall, ports, routes, service-to-service network isolation.
- Backup/restore evidence and `approvals` table/schema status if present.
- Risks, unknowns, recommendations, and readiness decision.

**Gate:** No build or architectural implementation until the Phase 1 report exists and is reviewed/approved. Repository-only tasks that do not alter runtime architecture may continue if they do not violate the gate.

## 5. Immediate task order

1. **GAP-01 — this assessment:** record production-line gaps and evidence.
2. **ENG-03 — sandbox contract CI repair and real backend selection:** repair PR checks; contract acceptance is not sandbox completion. Validate a concrete supported isolation runtime before enabling execution.
3. **PHASE-0/1 — environment evidence report:** collect only missing, safe evidence from owner-confirmed infrastructure readiness; no production writes.
4. **ENG-04 — HAI immutable intake and extraction:** hash/version, structured requirements, unresolved questions, source traceability.
5. **ENG-05 — live database inventory and integration map:** metadata-only discovery, ownership, least-privilege boundary, staging/migration/rollback plan.
6. **ENG-06/07/08 — task graph, GitHub write lifecycle, model spend controls.**
7. **ENG-09 — isolated build/test and requirement evidence.**
8. **ENG-10 — preview, revisions, version-bound approvals.**
9. **ENG-11/12/13 — n8n operationalization, controlled deployment, security and non-production pilot.**

## 6. Separate ATSH AI product audit still required

The HAI master contains extensive product scope beyond the production-line engine, including:
- public site, packages/catalogue, configurator, dynamic pricing, intake and quote/order flows;
- one unified customer account/portal for requests, projects, contracts, payments, files, previews, reviews and approvals;
- central administration and owner command center, employee workspaces, decisions, notifications, CRM/sales, projects, workflow, AI team, human team, catalogue/pricing, finance, CMS, analytics, system/security/integrations;
- post-delivery customer product modules, support, hosting/domains, and financial workflows;
- bilingual/RTL-LTR, responsive/accessibility, authorization, audit, privacy, backup, testing and acceptance criteria.

The repository contains corresponding application workspaces and product documents. A separate HAI-to-product implementation audit must inspect every screen, flow, API, entity, permission, business rule, test and integration against the actual code. Do not infer feature completeness from folder names, route existence, mock data, or design documents.

## 7. Completion rule

A row changes to **Implemented** only when source implementation, automated tests, and relevant runtime/environment evidence support the claim. A mock, interface, policy contract, document, or green unit test alone is not proof of an end-to-end capability. Keep unknown live-environment facts explicitly **Unverified**.
