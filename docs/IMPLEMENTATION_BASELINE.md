# ATSH AI — Greenfield Implementation Baseline

## Authority
The approved Executive Reference v2.0 is the authoritative product and technical requirements source. This baseline records explicit implementation boundaries and does not silently replace the reference.

## Owner's greenfield decision
The owner explicitly rejected the existing implementation and directed that the complete system be created anew. Therefore:
- No legacy application code, framework, UI, API, database schema or deployment configuration is an implementation foundation.
- The new system receives a newly designed and independently provisioned application database.
- No legacy database connection, schema reuse, data import or migration is in scope.
- The old system is treated as a separate, failed system. It is not a dependency of the new product.
- Reconsidering legacy data import or coexistence requires a separate explicit owner decision.

## Product scope
- Public Arabic/English service website, service catalog, configurable options, multi-service selection and guided project intake.
- Server-authoritative estimates, immutable request/quote snapshots and secure tracking.
- Central administration for content, service/pricing, customers, requests, quotes, projects, team, permissions, notifications, reporting and audit.
- Unified customer account and portal for project delivery and contracted post-delivery product operations.
- Hybrid project workflow with protected lifecycle gates and configurable execution stages/tasks.
- Central AI manager coordinating specialized agents, with human review and approval at sensitive gates.
- n8n orchestration, GitHub-based development workflow, isolated execution environments and independent testing.
- Hosting/domain operations, support, finance and reporting modules.

## Approved language scope (owner decision, 30 October 2026)
- Public website: Arabic and English, visitor-selectable; RTL Arabic and LTR English.
- Language switching preserves the current page/context where feasible.
- Localize navigation, service/package content, forms, validation, metadata and alternate-language SEO relationships.
- Internal administration dashboard: Arabic only in the current scope.
- Customer portal language is not inferred from the public-site decision; it remains open.

## System boundaries
- Public visitor: public catalog and intake only.
- Customer: own account, requests, projects, files, approvals and contracted product modules only.
- Staff: role- and assignment-scoped operations.
- Owner: governance authority, with sensitive actions audited.
- AI agents: narrowly scoped identities, tools and permissions; no self-approval.
- n8n: workflow orchestration, not the system of record or an unrestricted code executor.

## Greenfield data and release safety
1. Design a new schema from the approved requirements; do not inspect or reuse the legacy schema as a dependency.
2. Provision a new, isolated development database and a separate staging database.
3. Use versioned, reviewed migrations against only the new application database.
4. Test migrations from an empty database and test backup/restore before staging acceptance.
5. No destructive production database operation or production deployment without explicit approval.
6. Never place credentials, tokens, customer data or private connection strings in Git, issues or chat.

## Completion evidence
Every feature requires requirement traceability, UI/API/data implementation, server-side authorization and tenant-isolation tests where relevant, automated/manual results tied to a commit SHA, known limitations and human acceptance.

## Status vocabulary
- Not started
- Designed
- In implementation
- Implemented — unverified
- Verified in local test
- Verified in staging
- Accepted
- Blocked

Never describe a feature as accepted or production-ready based only on code presence.
