# ATSH AI Engine — DECISIONS

## Governing decisions

### D-001 — Reference hierarchy
**Status:** Binding  
1. ATSH AI المرجع التنفيذي الثابت الشامل v2.0  
2. ATSH AI المرجع الأم الشامل  
3. ATSH AI مرجع معمارية خط الإنتاج والعقل المركزي v1.1  
Higher-priority references prevail in any conflict.

### D-002 — Infrastructure preparation status
**Status:** Owner-confirmed complete — 2026-11-07  
The owner confirms Coolify, GitHub repository/branches/permissions, core-db/data/backup, and OpenAI key preparation are complete and saved in project records. Do not repeat broad readiness checks. This is an owner attestation, not an independent retest by this commit.

### D-003 — Initial model provider
**Status:** Binding for initial implementation; provider choice remains open  
Start with the owner's existing OpenAI key. Do not assume Anthropic or another provider. Inject the key only at runtime through Coolify environment variables, with task-scoped access and redacted logs. Never store the key in Git, source files, chat, or logs.

### D-004 — Model evaluation
**Status:** Open / evidence collection  
Record model quality, specification adherence, latency, reliability, and cost per representative task. Any provider comparison or switch requires a documented decision based on evidence.

### D-005 — Production database boundary
**Status:** Binding  
The existing `core-db` remains production business data. Build Worker must not have production core-db access. No destructive database operation or production deployment without the safeguards and approvals in the governing references.

### D-006 — Approval traceability
**Status:** Binding  
Every consequential approval must be recorded in `approvals` and tied to the exact project release/version or commit SHA. A generic chat confirmation is insufficient for production deployment.

### D-007 — Execution cadence
**Status:** Binding  
One task at a time. Do not repeat completed tasks without specific evidence and a separately scoped corrective task.

## Open decisions
- Currency/payment-provider implementation details, only when required by the approved product scope.
- Backup implementation details, only if a concrete implementation dependency remains after the owner's completed preparation.
- Exact agent-db schema and migration plan, to be designed from the engine domain model without touching core-db.
- Model-provider long-term selection after OpenAI evaluation evidence.

## Change log
- 2026-11-07: Transferred execution baseline into the existing engine repository so review and continuation happen in the correct codebase.
