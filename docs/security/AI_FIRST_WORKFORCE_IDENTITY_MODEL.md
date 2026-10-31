# AI-First Workforce Identity Model — Draft v1.0

- Date: 31 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Authority: Executive Reference v2.0, approved owner decisions, `docs/IMPLEMENTATION_BASELINE.md`, and `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md`
- Status: **Architecture proposal only. No provider, schema, credential, workflow, API, or runtime behavior is selected or implemented by this document.**

## 1. Operating premise

ATSH AI is being designed as an AI-first company. The operating assumption is that approximately 90% of routine execution will be automated or AI-assisted, while humans retain ownership, governance, exception handling, and approval of designated high-impact actions.

This is an operating-design assumption, not a measured production statistic or a promise that every workflow can be automated safely.

Identity architecture must therefore not treat every automation as a human employee, nor assume that a small human headcount means the system has few identities. It must distinguish:
- Human identities.
- Workload/service identities.
- AI-agent identities and individual execution instances.
- External customer identities.
- External provider identities and delegated integrations.

A managed sign-in provider for humans is only one component of this model. It is not the identity authority for every worker, agent, workflow, or customer.

## 2. Identity classes and trust boundaries

### 2.1 Human identities

Examples: owner, internal staff, temporary specialist, and authorized customer users.

Requirements:
- Managed sign-in for internal staff is an approved direction; vendor selection remains open.
- Human authentication is separate from application authorization.
- Human privileges are assigned in ATSH's authorization layer and are not inferred from email domain, provider group, or UI visibility.
- MFA policy, recovery, session duration, device controls, and emergency access remain explicit security decisions.
- Customer portal identities are a separate unresolved boundary; do not assume they share the staff tenant.

### 2.2 Workload and service identities

Examples: API service, background worker, n8n instance, deployment runner, scheduled task, and provider integration.

Requirements:
- Each independently deployable or independently privileged workload receives a distinct identity; do not share one universal automation credential.
- Prefer platform/workload identity federation and short-lived credentials where the selected runtime supports them.
- Where federation is unavailable, use narrowly scoped, rotated secrets held in an approved secret manager; never commit them to Git or place them in ordinary application records.
- Separate development, CI, staging, and production identities and credentials.
- Bind permissions to a workload, environment, resource scope, and allowed operation.
- Revoke or rotate credentials when a workload is retired, compromised, or materially reconfigured.

### 2.3 AI-agent identities

An agent is a non-human actor with a named role and an explicit capability boundary. Examples may include requirements analysis, software implementation, code review, testing, customer-support drafting, content preparation, and operational research. These are examples of possible roles, not an approved final agent roster.

Requirements:
- Give each agent role a stable identity distinct from the model provider, model name, prompt, and execution instance.
- Record each run with a unique execution/run identifier linked to the initiating workflow and, where applicable, the human requester.
- An agent may act only through approved tools/capabilities and a server-side policy decision.
- Tool access is task-scoped, resource-scoped, environment-scoped, and time-bounded.
- Do not give an agent a general-purpose administrator account, unrestricted shell, unrestricted network, or a shared human session.
- Agent output is untrusted input until validated by the receiving service or an authorized reviewer.
- An agent cannot approve its own work, elevate its own permissions, alter its policy, or satisfy a human-approval gate by claiming approval in generated text.
- Model/API credentials belong to the integration/workload boundary, not to the agent as a reusable plaintext secret.

### 2.4 Customer and external identities

Customer users, registrars, payment providers, hosting providers, GitHub, and other external systems remain distinct principals or counterparties. Their credentials and tokens must not be confused with internal user identities. Customer ownership and account semantics remain subject to the existing open decision.

## 3. Authorization architecture

Use a layered model:

1. **Authentication / workload attestation:** establish who or what is making the request, using a verifiable issuer, credential, or runtime identity.
2. **Principal resolution:** map the verified subject to an internal principal record and principal class. Never accept a caller-supplied `actorType`, `userId`, `agentId`, or permission list as proof.
3. **Policy decision:** evaluate role/capability, environment, resource ownership, task context, grant expiry, and protected-gate rules.
4. **Tool/action broker:** expose only the approved operation and validated arguments. Agents and n8n must not bypass this layer by holding broad provider credentials.
5. **Execution:** perform the operation in a constrained service/worker with an idempotency key and correlation identifiers where applicable.
6. **Audit:** record verified actor, principal class, agent/workflow/run IDs when applicable, requested action, target, policy result, approval evidence, timestamp, and outcome without logging secrets.

NestJS/domain services remain the server-side authorization enforcement point. n8n is orchestration, not the system of record, identity authority, policy engine, or unrestricted executor.

## 4. Capability model and permission ceilings

Prefer explicit capabilities over broad labels such as "AI admin".

Illustrative capability boundaries:
- Read a specific project specification.
- Create or update files in one assigned repository branch.
- Run tests in an isolated workspace.
- Prepare a staging deployment request.
- Draft a customer response without sending it.
- Read a defined subset of operational metrics.

A capability grant should identify:
- Principal and principal class.
- Allowed action/capability.
- Resource or resource pattern with validated ownership.
- Environment.
- Validity window and revocation state.
- Grantor/policy source and reason.
- Applicable constraints (for example, maximum spend, allowed domain, repository, or deployment target).
- Audit correlation.

Enforce a permission ceiling:
- Agent capabilities cannot exceed the authority delegated by the initiating workflow and the granting human/system policy.
- A workload cannot mint stronger credentials or grants for itself or an agent.
- A customer or agent cannot grant internal staff privileges.
- A lower-trust execution context cannot authorize a higher-impact action.
- Missing, ambiguous, expired, or unverifiable authority results in deny.

## 5. Human approval gates

Automation should proceed without routine human intervention inside its approved envelope. Human approval is required at explicitly protected gates, including where the product/reference requires it:
- Production deployment or release.
- External customer communication or commitment where approval is required by workflow policy.
- Payment, refund, purchase, or other financial commitment.
- DNS/domain/hosting changes with material customer impact.
- Access grants, role changes, secret rotation exceptions, or policy changes.
- Destructive, irreversible, or broad-scope data operations.
- Any action outside the agent's declared capability envelope.

Approval requirements:
- Approval is a separate authenticated action by an authorized human principal.
- The approval binds to the exact action payload/version, target, environment, and relevant cost/impact summary.
- Material changes invalidate the prior approval and require a new one.
- The executing agent cannot approve; the workflow cannot fabricate approval evidence.
- Approval is time-bounded and single-purpose where practical.
- Record approver, decision, timestamp, payload/version digest or equivalent immutable reference, and execution result.
- If a gate is not satisfied, the workflow pauses safely and reports the required decision; it must not silently downgrade or bypass the gate.

## 6. n8n, workers, agents, and tool execution

- n8n coordinates workflow state and calls narrowly scoped ATSH APIs.
- Business state and authorization decisions live in ATSH services/database, not only in n8n workflow JSON or execution history.
- Dedicated workers execute code/build/test tasks in isolated, disposable workspaces.
- Each workflow run carries a correlation ID and explicit initiating principal/context.
- Each agent/tool invocation receives only the minimum input and capability needed for that step.
- Credentials are injected at execution time from a secret manager or workload identity mechanism; they are not embedded in prompts, workflow exports, repository files, or logs.
- Tool calls validate target repository, branch, project, customer ownership, environment, and operation before execution.
- Retry and replay must be idempotent for state-changing actions; replay must not duplicate purchases, deployments, messages, or grants.
- Human approval gates must survive retries and workflow restarts without becoming reusable blanket authorization.

## 7. Audit and observability

For security-relevant operations, retain an attributable event containing:
- Actor/principal ID and class.
- Human initiator, if any.
- Agent role and run ID, if any.
- Workload/service identity.
- Workflow and correlation IDs.
- Action, target resource, environment, and policy decision.
- Approval reference and approver, if required.
- Result, timestamp, and reason code.

Do not log passwords, bearer tokens, API keys, raw session secrets, MFA seeds, or unnecessary customer content. Define retention and redaction policy before production rollout.

## 8. Initial architecture recommendation

For the initial release:
- Keep managed identity provider selection limited to human sign-in.
- Keep ATSH's own principal registry, RBAC, resource ownership, capability grants, approval records, and audit policy provider-neutral.
- Start with a small number of distinct service identities for API, worker, and n8n rather than creating a complex agent identity platform prematurely.
- Represent agent role and run attribution explicitly in the application policy/audit model before granting agents write or external-action capabilities.
- Use read-only and draft-only agent capabilities first. Add narrowly scoped write capabilities after negative authorization tests and audit evidence exist.
- Add approval-gated actions only after the approval is bound to exact payload/version and enforced server-side.
- Expand workload identity federation and short-lived credentials as deployment infrastructure is selected.

This is a staged recommendation, not approval to add models or dependencies now.

## 9. Provider evaluation implications

The human sign-in provider must be evaluated for the actual small human workforce, not as the identity platform for all automated actors. Compare:
- Cost at a small number of human monthly active users and minimum subscription commitments.
- MFA and recovery controls.
- Next.js integration and standards-based OIDC/OAuth support.
- Session verification and revocation behavior.
- Staff lifecycle, auditability, and administrative controls.
- Regional availability, data processing, and operational dependencies.
- Integration effort with NestJS and provider-neutral ATSH authorization.

Separately evaluate workload identity and secret-management capabilities against the eventual hosting/CI runtime. Do not add all service accounts or AI agents to a per-human-MAU billing model unless the provider's documented model explicitly requires it.

No vendor recommendation is finalized in this document.

## 10. Required security tests

- A caller cannot impersonate a human, service, or agent by supplying an ID or actor type.
- Invalid, expired, revoked, wrong-issuer, or wrong-audience credentials are denied.
- A workload identity cannot use another environment's credential.
- Agent A cannot invoke capabilities assigned only to Agent B.
- An agent cannot access an unassigned customer/project/repository.
- An agent cannot expand its own capabilities or create a stronger grant.
- n8n cannot directly perform an operation blocked by the ATSH policy layer.
- A tool rejects an unapproved target, branch, environment, or operation.
- A human approval is bound to the exact action/version and cannot authorize a materially changed payload.
- Agent/workflow retries do not duplicate state-changing external actions.
- Production deployment, financial commitment, and destructive operations remain blocked without the required human approval.
- Audit records identify the actual actor, workload, agent run, approval, and outcome without secrets.
- Revoked workload/agent grants stop authorizing subsequent actions.
- Customer ownership isolation is enforced independently of agent identity.

## 11. Decisions deliberately left open

- Human identity provider/vendor and exact session integration.
- Customer portal identity provider, tenant boundary, and MFA/recovery policy.
- Customer-account semantics and membership cardinality.
- Final agent roster, agent lifecycle, and capability catalogue.
- Hosting/runtime platform and workload identity federation mechanism.
- Secret manager and credential rotation policy.
- Whether a dedicated policy-decision service is warranted or NestJS policy modules suffice initially.
- Audit retention, redaction, and compliance requirements.
- Exact approval matrix and financial/deployment thresholds.

## 12. Acceptance gate

Do not grant AI agents or workloads access to protected customer/business data or state-changing external tools until:
- The principal is cryptographically/verifiably established.
- Server-side authorization binds principal, capability, resource ownership, and environment.
- Permission ceilings and revocation are enforced.
- Human approval gates are enforced against the exact action/version.
- Secrets are delivered securely and absent from code, prompts, and logs.
- Positive, negative, replay, cross-account, and audit tests pass.
- The owner approves the relevant implementation and operational boundary.

**Current status: AI-first identity and workforce architecture designed; provider, schema, integrations, and runtime controls remain unselected/unimplemented.**
