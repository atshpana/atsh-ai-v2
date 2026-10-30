# Prisma Baseline SQL Review — Static Review v1.0

- Reviewed artifact: `prisma-baseline-migration-preview`
- Workflow run: `41132485355`
- Artifact ID: `13012818964`
- Source commit: `dc08f488bfe53c29073a0127f95056c46ec535b0`
- Review date: 30 October 2026
- Scope: generated SQL artifact and matching Prisma draft only. No database connection or migration execution was performed.

## Artifact integrity

- ZIP contains one file: `migration.sql`.
- Extracted SQL is 21,182 bytes and 575 lines.
- The file begins with PostgreSQL DDL (`CREATE SCHEMA` / `CREATE TYPE`) and contains no npm lifecycle banner or command output.
- Static counts: 10 enum types, 24 tables, 42 indexes (including unique indexes), and 30 foreign-key constraints.
- No `DROP`, `TRUNCATE`, or `DELETE` statements were found.
- This is a generated baseline preview, not an applied migration and not proof of runtime behavior against a PostgreSQL server.

## Positive findings

- PostgreSQL-native `UUID`, `TIMESTAMPTZ(6)`, `DECIMAL(14,2)`, `JSONB`, and enum types are used consistently with the Prisma schema.
- Monetary values are represented as fixed-precision decimals rather than floating-point columns.
- Translation tables enforce one translation per locale per category/service/option.
- Request references, quote versions, role-permission assignments, and quote decision idempotency keys have uniqueness constraints.
- Foreign keys are generated for the declared Prisma relations, with explicit delete behavior.
- Historical request item/option snapshots retain descriptive and price snapshots independently of nullable links to current catalogue records.

## Issues to resolve before treating this as a production-ready baseline

1. **Missing database CHECK constraints:** positive quantities and non-negative monetary amounts are not enforced at the database layer for request/quote line items and totals. Add reviewed SQL constraints (or equivalent supported schema-level rules) for quantity > 0 and applicable monetary values >= 0. Confirm whether discounts may be negative/positive by model semantics before constraining them.
2. **Pricing approver reference:** `pricing_versions.approved_by_id` is a UUID scalar without a foreign key to `users`. Decide whether this should be a formal relation with `ON DELETE SET NULL`/restrict semantics, or intentionally remain an immutable actor identifier.
3. **Temporal and lifecycle invariants:** no database constraint enforces `effective_to > effective_from`, `expires_at > starts_at`, or consistency between quote decision `expected_version` and the quote version. Enforce these transactionally and add DB constraints where stable and appropriate.
4. **Quote decision semantics:** uniqueness on `quote_decisions.quote_id` correctly permits at most one terminal decision per quote. The application must still verify current quote status/version and customer ownership in the same transaction; the schema alone does not enforce those rules.
5. **Customer and authorization isolation:** the schema does not itself enforce customer-to-user ownership for all request/quote access. This remains a mandatory server-side authorization and integration-test responsibility; never rely on UUID opacity.
6. **Scope completeness:** the current baseline intentionally does not include the approved domain module entities, projects, contracts, invoices, hosted services, workflow plans/tasks, AI agents, support, finance, content, or notifications. Reconcile and extend the model before creating a first durable baseline migration.

## Decision

**Do not commit this generated SQL as `0_init` yet and do not apply it.** First reconcile the logical model with the approved screen/flow and domain requirements, resolve the findings above, and then regenerate/review a fresh baseline artifact. Run an isolated PostgreSQL migration test in CI before any shared database is considered.

