# ATSH AI Intelligent Tool & Integration Orchestrator — first implementation slice

## Purpose
For every client project, the central brain should infer required capabilities from the approved brief, compare verified entries in a capability registry, produce a transparent tool/integration plan, estimate cost where evidence exists, and identify approval gates.

## Implemented in this slice
- Typed project brief, capability registry, cost/risk classifications and tool decision contracts.
- Deterministic capability matching for common requirements.
- Explicit unresolved-capability reporting instead of inventing a provider.
- Approval flags for disabled/critical capabilities, unknown usage costs, unapproved providers, disallowed cost classes and regulated-data risk.
- A hard execution boundary: planning output always sets executionAllowed=false.

## Not implemented yet
This module is not wired into the worker's model tool loop, admin dashboard, n8n, provider APIs or secret manager. It does not discover providers live, create vendor accounts, accept terms, buy subscriptions, create credentials, or run integrations. Those require subsequent reviewed implementation and real runtime access.

## Required next phases
1. Persist versioned provider/capability records and evidence (pricing URL, terms, regions, status, last verified time).
2. Add project intake/classification and invoke planTools before task decomposition.
3. Add a human-review screen for provider, cost, data residency, terms and permissions.
4. Add integration adapters with least-privilege scopes, health checks, secret references and audit events.
5. Add execution policies: existing approved tools may be invoked within budgets; new spend/contracts and production/destructive actions remain approval-gated.
6. Add tests for matching, unknown requirements, cost ceilings, disabled providers and regulated-data restrictions.
7. Connect approved plans to n8n workflows and task-specific agents only after adapter and security review.

## Non-negotiable invariants
- Never expose secret values to the model or browser; pass scoped secret references to adapters.
- Never infer a vendor price or contract term without a dated source.
- Prefer existing company subscriptions and reusable internal capabilities.
- Compare at least two viable providers for material new spend when possible.
- Persist why a tool was selected and the evidence used.
- Preserve project-specific allowlists, budget ceilings and approval history.
- A client project cannot authorize company-wide spending or production access by itself.
