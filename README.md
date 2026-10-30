# ATSH AI — Implementation Repository

This repository is the isolated implementation track for ATSH AI, governed by the approved Executive Reference v2.0.

## Non-negotiable constraints
- This implementation repository is intentionally **public**, as explicitly approved by the owner on 30 October 2026. Never commit secrets, credentials, private customer data, production connection strings or sensitive operational data.
- Build independently; do not use the legacy application as the design/code foundation.
- Preserve the existing production database. Discover its actual engine, schema, data, permissions and deployment connection before designing migrations or enabling writes.
- Never run destructive database operations or unreviewed migrations.
- Keep the old repository and production deployment recoverable until staging acceptance is complete.
- All authorization is enforced server-side.
- Pricing is calculated and revalidated on the server; each submitted request retains an immutable financial snapshot.
- No production release or irreversible AI action without the required human approval.
- A feature is complete only after implementation, automated/manual verification and recorded acceptance evidence.

## Language scope
- Public marketing/service website: Arabic and English, with a user-selectable language.
- Internal administration dashboard: Arabic only; do not add an English dashboard translation as part of the current scope.
- Customer portal language scope is not inferred from this decision and remains open for explicit confirmation.

## Delivery method
1. Phase 0: inventory the legacy repository, deployed runtime, database and release process without modifying them.
2. Architecture decision: select the application stack only after the inventory and compatibility review.
3. Build the new system feature-by-feature in this repository.
4. Test against a sanitized staging copy of the current database.
5. Complete staging acceptance and a rehearsed rollback plan.
6. Only then prepare a reviewed transfer/replacement of code in the legacy repository.

## Current status
- Isolated implementation branch initialized.
- Technology stack: **not yet approved**.
- Existing production database: **not yet inspected directly**.
- No database connection, migration, deployment or production change has been performed.

See `docs/IMPLEMENTATION_BASELINE.md`, `docs/PHASE_0_AUDIT.md` and `docs/OPEN_DECISIONS.md`.
