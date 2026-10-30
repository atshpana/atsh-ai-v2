# Prisma Baseline Migration Preview Review — 2026-10-30

- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Reviewed source commit: `d2ea28245e609facec36e93b2f28b6fa2feedb4f`
- CI run: [41131274685](https://github.com/atshpana/atsh-ai-v2/actions/runs/41131274685) — passed.
- Artifact: `prisma-baseline-migration-preview` (3,093-byte ZIP; SQL payload 21,299 bytes).
- Scope: static review of generated `from-empty` SQL. It was not applied to PostgreSQL.

## What the preview confirms

- Prisma generated PostgreSQL enums, tables, indexes, primary/unique constraints and foreign keys for the current schema.
- UUID identifiers, `TIMESTAMPTZ(6)`, `JSONB` and `DECIMAL(14,2)` are represented in the generated SQL.
- Foreign-key ordering is emitted after table/index creation; the preview contains no destructive `DROP` statements.
- CI validates Prisma, generates the client, generates this preview, typechecks, builds and runs unit tests successfully on the reviewed commit.

## Review findings — design gaps, not SQL-generation failures

1. **This is not yet a complete domain baseline.** The current schema covers identity/RBAC, customers, basic services/options, pricing versions/rules, requests/snapshots/events, quotes/decisions/change requests and audit events. Projects, workflow plans/tasks/approvals, staff/agents, support, hosting, finance, content/media and notifications remain absent.
2. **Configurator schema is not persisted as a first-class versioned entity.** The API contract requires immutable configurator versions, steps, fields, choices, visibility/dependency rules and publication validation. These need an explicit data design before migration approval.
3. **Option relationships are under-modeled.** `ServiceOption` currently stores a free-form `optionType` and `priceDelta`, but the contract needs structured selection modes, dependency/conflict relationships, bounded quantity, conditional visibility and rule validation.
4. **Package composition is not represented.** The contract allows multiple compatible ready-priced package/service lines, but no package entity or immutable package-component composition exists in the current Prisma schema.
5. **Cart persistence is absent by design.** Cart/session ownership, revisioning, expiry, calculation references and idempotent mutation records must be designed together with authentication/session boundaries before cart endpoints are enabled.
6. **Pricing persistence needs a detailed rule-model review.** `conditions` and `action` are JSONB. Before activation, define a versioned, allow-listed rule grammar and validate it at publication time; do not execute arbitrary expressions. Define how recurring and one-time lines, tiers, rounding and unsupported tax/discount configuration are represented.
7. **Commercial totals must not be mistaken for approved policy.** Current request/quote models contain currency and tax/total fields, but no currency, tax, discount, payment or billing policy has been approved. No seed prices or tax assumptions should be added.
8. **Integrity constraints need explicit review.** Add database/application validation for positive quantities, non-negative monetary values where applicable, valid currency codes, effective-date windows, one active pricing version per scope, and immutable published versions. Some are cross-row invariants and may require transactional service logic or reviewed SQL constraints.
9. **Quote decision idempotency scope needs confirmation.** The current unique idempotency key is global; decide whether the intended key is globally unique or scoped to actor/operation, and ensure retry payload matching is enforced by the service layer.
10. **Audit and lifecycle immutability are application policies today.** Append-only behavior, retention, deletion and actor attribution need explicit enforcement and tests; ordinary foreign keys do not provide those guarantees by themselves.

## Decision

**Do not commit or apply `0_init` yet.** The generated SQL is a useful reproducible preview, and the reviewed CI pipeline passes, but the current schema is intentionally incomplete relative to the approved product scope. Approve the domain model and integrity rules first, then regenerate and review a new baseline from the expanded schema.

No database was provisioned, connected, migrated or modified during this review.
