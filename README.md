# ATSH AI — Greenfield Implementation

This repository is the independent, greenfield implementation of ATSH AI, governed by the approved Executive Reference v2.0 and subsequent explicit owner decisions.

## Greenfield mandate
- Build the entire ATSH AI system from zero: application code, application architecture, database schema, migrations, authentication, authorization, APIs, interfaces, workflows and tests.
- The legacy application and its database are out of scope as implementation foundations. Do not copy, extend, connect to, migrate from or depend on them.
- Do not import legacy data. Any future data import requires a separate, explicit owner decision and a reviewed migration plan.
- Keep this repository public as explicitly approved. Never commit secrets, credentials, private customer data, production connection strings or sensitive operational data.
- Enforce all authorization on the server. Pricing is calculated and revalidated server-side; submitted requests retain immutable financial snapshots.
- No production release, payment activation, irreversible AI action or external customer communication without the required configuration and human approval.
- A feature is complete only after implementation, automated/manual verification and recorded acceptance evidence.

## Language scope
- Public website: Arabic and English, selectable by the visitor, with RTL Arabic and LTR English.
- Internal administration dashboard: Arabic only for the current scope.
- Customer portal language remains an explicit open decision.

## Delivery principles
1. Translate the Executive Reference v2.0 into traceable requirements and acceptance tests.
2. Establish and test the new architecture, data model, security boundaries and design system.
3. Implement in vertical slices: UI, API, persistence, authorization and tests together.
4. Use isolated development and staging environments; production is a separate gated release.
5. Keep every phase reviewable through commits, tests, evidence and explicit acceptance.

## Current status
- Greenfield implementation branch: `implementation/bootstrap`.
- Legacy code and legacy database: explicitly excluded from the new build.
- New application database: to be designed and provisioned independently; no connection or migration to the old database.
- Technology architecture: initial recommendation documented separately; final stack selection is recorded as an explicit decision.
- No production deployment or database provisioning has been performed.

See `docs/IMPLEMENTATION_BASELINE.md`, `docs/OPEN_DECISIONS.md`, `docs/architecture/ADR-0001-greenfield-stack.md` and `docs/implementation/DELIVERY_PLAN.md`.
