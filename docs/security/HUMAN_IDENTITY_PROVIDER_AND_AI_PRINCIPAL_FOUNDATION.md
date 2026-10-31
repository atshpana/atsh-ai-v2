# Human Identity Provider Evaluation and AI-First Principal Foundation — Draft v1.0

- Date: 31 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Scope: internal ATSH human staff sign-in only, plus provider-neutral design guidance for workload and AI-agent identities
- Status: **Evaluation and conceptual design only. No vendor selected, no schema or runtime implementation approved.**
- Research basis: official vendor pricing and technical documentation checked on 31 October 2026. Prices are USD list prices and may change.

## 1. Executive recommendation

Do not select one identity vendor as the identity authority for all ATSH actors.

Evaluate the managed identity provider only for human staff authentication. Keep authorization, principal registry, agent capabilities, workload identity, approval evidence and audit policy inside ATSH's provider-neutral architecture.

**Owner-approved provider for internal staff sign-in: Amazon Cognito.** The owner approved the vendor and selected **Cognito Lite** on 31 October 2026 as the no-fixed-monthly-fee starting feature plan. Use TOTP MFA. Reconsider Essentials only if a required login or security capability cannot be met on Lite. The reasons are:
- No minimum monthly fee or upfront commitment.
- Lite and Essentials each include 10,000 direct/social monthly active users per AWS account/organization at no charge, indefinitely, subject to AWS region/product terms.
- Lite includes authenticator-app MFA (TOTP) and SMS MFA.
- A small human workforce is unlikely to exceed the free MAU allowance.
- It avoids paying a recurring per-seat or fixed SaaS fee solely to authenticate a small internal team.

Trade-offs:
- AWS setup and operations are more involved than Clerk's prebuilt Next.js experience.
- Lite uses the classic hosted UI, which is less customizable than Cognito Managed Login in Essentials.
- Email MFA, passkeys and Managed Login visual editor require Essentials or Plus.
- SMS delivery is separately charged through SNS; prefer TOTP to avoid SMS dependence/cost.
- Cognito's machine-to-machine client-credentials usage has separate pricing and no 10,000-MAU free tier for token requests. Do not route every agent or worker through Cognito M2M by default.

The provider is now owner-approved; the feature plan and implementation configuration are not.

## 2. Provider comparison for the human workforce

| Criterion | Amazon Cognito Lite | Supabase Auth | Clerk |
|---|---|---|---|
| Pricing unit | MAU | MAU | MRU (monthly retained users) |
| Entry cost | $0; no minimum fee | $0 Free; Pro starts at $25/month | Hobby $0; Pro shown at $20/month billed annually |
| Free allowance | 10,000 direct/social MAU/month for Lite or Essentials | 50,000 MAU on Free | 50,000 MRU per app on Hobby |
| MFA for staff | Authenticator app/TOTP and SMS available on Lite | TOTP authenticator and phone factor documented | MFA not included on Hobby; included on Pro |
| Hosted sign-in experience | Classic hosted UI on Lite; Managed Login visual editor on Essentials/Plus | Build Next.js SSR experience using Supabase Auth and `@supabase/ssr` | Prebuilt sign-in/sign-up/profile UI and Next.js integration |
| Main operational consideration | AWS configuration and integration complexity | Adds Supabase platform dependency; Free projects pause after 1 week inactivity | Pro recurring fee for MFA and custom session settings |
| Suitability for ATSH staff | Strong cost fit if TOTP and basic hosted UI suffice | Viable if ATSH deliberately adopts Supabase Auth/platform | Strong developer experience; higher fixed cost than Cognito Lite |

### 2.1 Amazon Cognito Lite

Official pricing states no minimum fees or upfront commitments. Lite and Essentials have a non-expiring 10,000 direct/social MAU free tier per AWS account or organization. Above the free tier, Essentials direct/social MAUs are listed at $0.015 per MAU; check the current Lite table and selected region before any budget commitment. SMS messages for MFA and account verification are charged separately through SNS; email verification/recovery uses SES.

Feature documentation states that Lite supports authenticator-app and SMS MFA. Essentials adds email MFA, passkeys, passwordless options and the Managed Login visual editor. New user pools default to Essentials unless the tier is explicitly set; therefore implementation must explicitly verify the selected tier rather than assume Lite.

Official sources:
- https://aws.amazon.com/cognito/pricing/
- https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-sign-in-feature-plans.html

### 2.2 Supabase Auth

Official pricing lists:
- Free: $0, 50,000 MAU, with Free projects paused after one week of inactivity and a limit of two active projects.
- Pro: starts at $25/month; includes 100,000 MAU, then $0.00325 per additional MAU.

Supabase Auth supports TOTP MFA, and its documentation describes using the JWT assurance-level claim to enforce MFA on server-side APIs. Next.js SSR uses `@supabase/ssr`; NestJS bearer-token verification can use the server-side package documented for NestJS.

Trade-off for ATSH: the repository currently specifies an independently provisioned PostgreSQL database and does not approve Supabase as the database/hosting platform. Supabase Auth can be considered separately, but doing so creates an additional platform dependency and must be deliberately isolated from ATSH's application database and authorization source of truth.

Official sources:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/reference/server

### 2.3 Clerk

The official pricing page currently lists:
- Hobby: $0, up to 3 dashboard seats and 50,000 monthly retained users per app; MFA is not included.
- Pro: $20/month billed annually, includes 50,000 MRU and MFA; the monthly billing selector may show a different rate.
- Pro also includes custom session lifetime and removes Clerk branding.

Clerk provides prebuilt sign-in/sign-up UI and a Next.js integration, which can reduce implementation time. It also advertises machine authentication features, but M2M token and API-key usage is separately metered. Its documented M2M token feature is not a reason to centralize all ATSH workload identity in Clerk.

Trade-off for ATSH: pay a fixed Pro subscription to obtain production MFA and custom session behavior, even if only a few humans sign in. That may be justified if faster integration and polished UI outweigh the recurring cost.

Official sources:
- https://clerk.com/pricing
- https://clerk.com/docs/guides/development/machine-auth/overview
- https://clerk.com/docs/guides/development/machine-auth/m2m-tokens

## 3. Decision matrix and recommendation

| Decision factor | Weight for ATSH | Cognito Lite | Supabase Auth | Clerk Pro |
|---|---:|---|---|---|
| Low fixed cost for few humans | High | Strong | Medium (Free has inactivity caveat; Pro $25) | Medium ($20 annual billing) |
| TOTP MFA | Mandatory | Available | Available | Pro required |
| Next.js implementation speed | Medium | Moderate effort | Good | Strong |
| NestJS token verification | Mandatory | OIDC/JWT verification required | Documented server package | SDK/JWT verification |
| Vendor/platform independence | High | AWS dependency | Supabase dependency | Clerk dependency |
| AI workload identity as one shared plane | Not desired | Not recommended | Not recommended | Not recommended |

**Approved provider boundary:** Amazon Cognito is approved for human staff sign-in only. Start technical validation with Cognito Lite and TOTP MFA; compare Essentials only if a required feature cannot be delivered on Lite. The AWS region, pool configuration and integration/session settings remain open. Keep a provider adapter so the application does not spread Cognito-specific claims or SDK objects through domain services.

If the Cognito Lite hosted UI or integration effort proves unacceptable, compare Clerk Pro as the developer-experience alternative. Consider Supabase Auth only if there is a separate owner decision to adopt Supabase as an intentional platform dependency.

## 4. Cost boundary: humans versus automation

Do not estimate human identity cost by counting agent runs, workflow executions, tool calls, or background jobs. Those are not human MAUs.

Keep separate budgets and controls for:
- Human identity provider MAU and MFA delivery.
- Workload identity federation or secret manager.
- AI model/API consumption.
- n8n execution and worker compute.
- External provider API usage.
- Audit/log storage.

Cognito M2M token requests have no 10,000-MAU free tier. Clerk M2M tokens/API keys have usage-based pricing. Neither fact makes these products unsuitable for human sign-in; it means ATSH should not automatically use their machine-authentication product for every internal worker/agent.

## 5. Provider-neutral principal and capability data design

The current Prisma draft has `User`, RBAC tables, optional `User.authSubject`, and generic scoped `UserRole`. That is not enough to represent the AI-first workforce safely.

The following is a conceptual minimum, to reconcile with the existing Prisma schema and logical data model before implementation. It is not an approved physical schema.

### 5.1 Principal

Represents an actor that can be authenticated and authorized.

Candidate fields:
- `id`
- `principalType`: HUMAN, SERVICE, AGENT, CUSTOMER (controlled enum)
- `status`: ACTIVE, SUSPENDED, REVOKED
- `displayName`
- `createdAt`, `updatedAt`, `disabledAt`

Human principals should map to the existing User identity rather than create a duplicate human account table. The final model must decide whether `User` remains the human principal row or references a shared Principal record.

### 5.2 ExternalIdentity

Maps a verified external subject to an internal human principal.

Candidate fields:
- `id`, `principalId`
- `issuer` (OIDC issuer URL)
- `subject` (provider subject)
- `providerKey` (configured provider identifier)
- `createdAt`, `lastSeenAt`, `revokedAt`

Constraints:
- Unique on (`issuer`, `subject`), not a bare globally unique subject.
- Never accept issuer/subject values from an unverified request body.
- Store no password, bearer token, refresh token or MFA seed.

### 5.3 WorkloadIdentity

Represents a service/runtime, not a human login.

Candidate fields:
- `id`, `principalId`
- `workloadKey`, `environment`
- `issuer`, `subject`, `audience`
- `status`, `validFrom`, `expiresAt`, `revokedAt`
- `secretReference` (opaque secret-manager reference only, never the secret itself)

Examples: API, worker, n8n, CI runner, deployment broker. Each independently privileged workload/environment gets a separate identity.

### 5.4 AgentDefinition and AgentRun

AgentDefinition:
- `id`, `agentKey`, `displayName`, `purpose`
- `status`, `policyVersion`, `createdAt`, `retiredAt`

AgentRun:
- `id`, `agentDefinitionId`, `workloadIdentityId`
- `initiatingPrincipalId` (nullable only for explicitly scheduled/system-origin runs)
- `workflowRunId`, `correlationId`
- `inputReference`, `outputReference` (references, not unrestricted raw customer content)
- `status`, `startedAt`, `completedAt`

An agent role is not a model name or prompt. Each execution has a distinct run record.

### 5.5 Capability and CapabilityGrant

Capability:
- `id`, `capabilityKey`, `description`, `riskClass`

CapabilityGrant:
- `id`, `principalId`
- `capabilityId`
- `resourceType`, `resourceId` (validated ownership scope)
- `environment`
- `constraintsJson` (strictly validated schema, never executable code)
- `validFrom`, `expiresAt`, `revokedAt`
- `grantedByPrincipalId`, `reason`, `policyVersion`

Rules:
- Grants are explicit and narrow.
- An agent cannot grant itself capabilities.
- A workload cannot mint authority above its own ceiling.
- Expiry/revocation is enforced at every policy decision.
- Broad wildcard grants are disallowed except for explicitly reviewed platform-level operations.

### 5.6 ApprovalRequest and ApprovalDecision

Candidate fields:
- ApprovalRequest: `id`, `actionKey`, `targetReference`, `environment`, `payloadDigest`, `impactSummary`, `requestedByPrincipalId`, `status`, `expiresAt`
- ApprovalDecision: `id`, `approvalRequestId`, `approverPrincipalId`, `decision`, `decidedAt`, `payloadDigest`, `reason`

The approval is bound to the exact payload digest, target and environment. Any material payload change invalidates the approval. The requester/agent cannot approve its own action where separation of duties applies.

### 5.7 ToolInvocation and AuditEvent extension

ToolInvocation candidate fields:
- `id`, `agentRunId`, `workloadIdentityId`
- `toolKey`, `actionKey`, `targetReference`
- `policyDecision`, `approvalRequestId`
- `idempotencyKey`, `correlationId`
- `startedAt`, `completedAt`, `outcomeCode`

Extend the existing AuditEvent with verified actor/principal class, workload, agent/run, action, target, environment, decision, approval reference and outcome. Do not log credentials, raw prompts containing secrets, tokens or unnecessary customer content.

## 6. API and tool-broker boundary

Candidate server-side operations (contracts only):
- `POST /internal/agent-runs` — create a run from an authenticated workflow context.
- `POST /internal/agent-runs/:runId/tool-invocations` — request a named tool/action; server resolves principal, capability, resource ownership and approval gate.
- `POST /internal/approvals/:approvalId/decision` — human-only approval/decline bound to exact payload digest.
- `POST /internal/workload/token-exchange` — only if selected runtime requires an ATSH token exchange; requires verified workload attestation and short TTL.
- `POST /internal/capability-grants` and revoke equivalent — owner/authorized-human gated, fully audited.

These are not implemented routes. Do not expose a generic unrestricted `execute` endpoint. Every tool must have a typed allowlisted operation, schema-validated arguments, resource scope, environment restriction and idempotency behavior.

## 7. Implementation sequence

1. Owner approves or rejects Cognito Lite as the human staff identity provider after the proof-of-concept criteria below.
2. Keep customer portal identity and Customer-vs-Organization account semantics separate and unresolved.
3. Reconcile the conceptual entities above with existing User/RBAC/AuditEvent models and the logical data model; remove duplication and settle principal/user relationship.
4. Define exact OIDC issuer, audience, signing-key rotation, token lifetime, session and logout/revocation behavior for the selected provider.
5. Implement trusted principal verification in NestJS before business controllers.
6. Implement workload identity for the selected deployment runtime; do not create long-lived shared tokens as a shortcut.
7. Add agent definition/run and capability grants initially with read-only/draft-only capabilities.
8. Add a typed tool broker and exact-payload human approvals before any write-capable or external-action agent.
9. Add positive, negative, cross-resource, cross-account, replay, revocation and audit tests.
10. Only then connect n8n and agent workflows to protected business APIs.

## 8. Human sign-in proof-of-concept acceptance criteria

A small Cognito Lite proof of concept must demonstrate:
- Explicit Lite tier selection (new pools default to Essentials unless configured otherwise).
- OIDC issuer/audience and signature validation in NestJS using rotating JWKS.
- Login/logout and refresh behavior with secure cookie/session boundaries appropriate to Next.js App Router.
- TOTP enrollment, challenge and recovery process.
- Staff invitation/provisioning and immediate disable/revocation path.
- Provider subject mapped to ATSH User without using provider groups as ATSH permissions.
- Unauthorized, wrong-issuer, wrong-audience, expired-token and disabled-user requests denied.
- No auth tokens or secrets in logs, browser local storage, Git, or ordinary database columns.
- Branded sign-in UX acceptable to the owner.
- No customer portal sign-in or machine identity is included in this proof of concept.

## 9. Open decisions

- Owner selection of human identity provider: Cognito Lite (recommended to test), Clerk Pro, or Supabase Auth.
- Whether branded login requires Cognito Essentials Managed Login rather than Lite classic hosted UI.
- Customer portal identity provider/tenant and MFA/recovery.
- Customer account model and membership cardinality.
- Hosting runtime and workload identity federation.
- Secret manager and rotation/revocation process.
- Final agent roster, capability catalogue, and approval matrix.
- Audit retention/redaction and data-protection requirements.

## 10. Sources

All sources below are official vendor documentation/pricing:
- Amazon Cognito pricing: https://aws.amazon.com/cognito/pricing/
- Cognito feature plans: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-sign-in-feature-plans.html
- Supabase pricing: https://supabase.com/pricing
- Supabase Auth MFA: https://supabase.com/docs/guides/auth/auth-mfa
- Supabase server-side auth: https://supabase.com/docs/guides/auth/server-side
- Supabase server package / NestJS: https://supabase.com/docs/reference/server
- Clerk pricing: https://clerk.com/pricing
- Clerk machine authentication: https://clerk.com/docs/guides/development/machine-auth/overview
- Clerk M2M token pricing: https://clerk.com/docs/guides/development/machine-auth/m2m-tokens

**Current status:** provider evaluation and conceptual principal/capability/tool-broker design complete as a proposal. No provider, schema, route, integration, credential, or agent permission has been approved or implemented.
