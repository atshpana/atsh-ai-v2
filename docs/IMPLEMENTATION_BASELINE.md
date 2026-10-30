# ATSH AI — Implementation Baseline

## Authority
The authoritative product and technical requirements are the user's Executive Reference v2.0. This file records execution controls; it does not replace or silently amend that reference.

## Product scope
- Public Arabic-first service website and bilingual experience.
- Service catalog, configurable options, multi-service cart and guided project intake.
- Server-authoritative estimates, immutable request/quote snapshots and secure tracking.
- Central administration with content, service/pricing, customer, request, quote, project, team, permission, notification, reporting and audit capabilities.
- One customer account and unified portal for project delivery and post-delivery product operations, limited by contract and permissions.
- Hybrid project workflow: protected lifecycle gates with configurable execution stages and tasks.
- Central AI manager coordinating specialized agents, with human review and approval at sensitive gates.
- n8n orchestration, GitHub-based development workflow, isolated execution environments and independent testing.
- Hosting/domain inventory and operations, support, finance and reporting modules.

## Approved language scope (owner decision, 30 October 2026)
- Public website only: Arabic and English.
- The visitor can switch between Arabic and English.
- Arabic layout uses RTL; English layout uses LTR.
- Language switching must preserve the current page/context where feasible, with localized navigation, content, validation messages, metadata and SEO alternate-language relationships.
- Internal administration dashboard: Arabic only for the current scope. Do not build an English translation of the admin dashboard unless the owner later requests it.
- This decision does not automatically define the customer portal language. Keep that scope open rather than assuming it is bilingual or Arabic-only.

## System boundaries
- Public visitor: public catalog and intake only.
- Customer: own account, requests, projects, files, approvals and contracted product modules only.
- Staff: role- and assignment-scoped operations.
- Owner: full governance, with sensitive actions audited.
- AI agents: narrowly scoped identities, tools and permissions; no self-approval.
- n8n: workflow orchestration, not the system of record or an unrestricted code executor.

## Data and release safety
1. The existing database remains the system of record unless the owner explicitly approves a separate decision.
2. Read-only inventory comes before schema design or data writes.
3. Staging must use a restored, sanitized copy of the current database.
4. Any schema change must be additive/backward-compatible where possible, reviewed, tested and reversible.
5. No DROP, TRUNCATE, destructive reset or implicit database replacement.
6. Production deployment requires staging acceptance, a tested backup/restore, an approved release window and explicit owner approval.
7. Never place credentials, tokens, customer data or private connection strings in Git, issues or chat.

## Completion evidence
Every feature must have requirement traceability, UI/API/data implementation, authorization and tenant-isolation tests where relevant, automated/manual test results tied to a commit SHA, known limitations and required human acceptance.

## Status vocabulary
- Not started
- In discovery
- Designed
- In implementation
- Implemented — unverified
- Verified in local test
- Verified in staging
- Accepted
- Blocked

Never describe an item as accepted or production-ready based only on code presence.
