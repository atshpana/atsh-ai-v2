# Identity Schema Reconciliation — Phase 1

- Date: 31 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Status: **Reconciliation complete; physical schema changes intentionally blocked pending owner decisions.**
- Inputs: `apps/api/prisma/schema.prisma`, `docs/data/LOGICAL_DATA_MODEL.md`, `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md`, `docs/security/AI_FIRST_WORKFORCE_IDENTITY_MODEL.md`, and `docs/security/HUMAN_IDENTITY_PROVIDER_AND_AI_PRINCIPAL_FOUNDATION.md`.

## 1. Current schema facts

The current Prisma draft has:

- `User`: unique email, display name, optional globally unique `authSubject`, lifecycle status.
- `Role`, `Permission`, `RolePermission`: role-to-permission RBAC.
- `UserRole`: user/role assignment with generic optional `scopeType`/`scopeId`, grantor, start, expiry and revocation.
- `Customer`: contact/account-like record with optional unique `userId`, contact details and free-text `company`.
- `AuditEvent`: actor enum `USER | SYSTEM | AGENT`, optional `actorUserId`, action, entity, before/after JSON and request ID.
- `RequestEvent`: optional `actorUserId` relation to User.
- Quote creator, quote decision actor and quote change requester are all represented as User relations.

## 2. Reconciliation findings

| Concern | Existing representation | Gap / risk | Required direction |
|---|---|---|---|
| Human principal | User | Reasonable human account anchor; authentication is not implemented | Retain User as the human principal unless a concrete shared-principal need is approved |
| External login identity | User.authSubject | Bare subject lacks issuer/provider namespace; globally unique subject can collide across issuers | Replace/normalize as ExternalIdentity with provider key + issuer + subject; accept only verified claims |
| Staff authorization | Role/Permission/UserRole | Generic scope strings do not validate ownership or resource existence | Keep RBAC for base permissions; add typed resource grants only after scope vocabulary and account model are approved |
| Customer membership | Customer.userId unique | Cannot represent multiple users per customer account | Block protected customer APIs until Customer/Organization/account semantics and membership cardinality are approved |
| Service/workload identity | Audit actor SYSTEM only | No cryptographically verified workload principal, environment boundary or revocation model | Add separate workload identity after runtime and credential-delivery mechanism are selected |
| AI agent identity | Audit actor AGENT only | No agent definition, individual run attribution or capability boundary | Model AgentDefinition/AgentRun separately; do not infer identity from model name or prompt |
| Capabilities | Role permissions only | No agent-specific resource/environment-scoped capability grants or permission ceilings | Add typed capability catalogue/grants after workflows and tool allowlists are approved |
| Human approvals | No general approval model | Cannot bind approvals to exact action payload, target and environment | Design ApprovalRequest/Decision with payload digest and separation-of-duties rules before write-capable agents |
| Tool execution | No tool broker | n8n/workers could otherwise become unrestricted executors | Enforce typed server-side action broker; n8n remains orchestration only |
| Audit attribution | User/System/Agent + optional User FK | Cannot attribute workload, agent run, initiator, approval, environment or policy decision reliably | Extend audit attribution without logging secrets; preserve historical actor references |

## 3. Recommended target model (provider-neutral)

This is a design recommendation, not a schema authorization:

1. Keep `User` as the human account/principal record; avoid duplicating human rows in a generic Principal table without a demonstrated need.
2. Add `ExternalIdentity` as a one-to-many relation from User, uniquely keyed by (`issuer`, `subject`) and linked to a configured provider key. Do not store tokens or MFA secrets.
3. Represent non-human actors independently:
   - `WorkloadIdentity`: workload key, environment, verified issuer/subject/audience, lifecycle and opaque secret reference.
   - `AgentDefinition`: stable agent role and policy version.
   - `AgentRun`: one record per execution, linked to the initiating principal and workload where applicable.
4. Keep human RBAC distinct from agent `Capability` / `CapabilityGrant`. Capability grants must be resource- and environment-scoped, time-bounded, revocable and bounded by the grantor's authority.
5. Add `ApprovalRequest` / `ApprovalDecision` only with exact payload digest, target, environment, expiry and separation-of-duties enforcement.
6. Extend audit attribution to identify actor class, verified principal, workload, agent/run, initiator, action, target, environment, policy decision, approval and outcome.
7. Do not use a generic `Principal` table merely to make all actors look identical if it creates nullable polymorphic relations and weak foreign-key integrity. Revisit a shared principal supertype only if implementation needs prove it is warranted.

## 4. Decisions required before physical schema work

### Blocking decision A — customer account semantics

The owner approved **Option A: Customer is the commercial account**. An individual or business customer has one Customer account; a business account may have an Organization profile and multiple OrganizationMember rows. Requests, projects and contracts belong to Customer; active membership grants customer-side access. The two unselected alternatives are retained in the ownership design for historical context only.

- **Option A:** Customer is the commercial account; a business Customer may have an Organization profile and multiple OrganizationMember rows.
- **Option B:** Organization is the business account, while individuals use Customer, requiring a consistent shared ownership abstraction.
- **Option C:** Customer is a person/contact and Organization is the owning business account.

The current unique `Customer.userId` is insufficient for multi-user business accounts. The account-model blocker is resolved, and the next schema change should replace this one-to-one link with explicit membership while preserving Customer as the owner of commercial records.

### Blocking decision B — staff identity provider

Managed identity for internal staff is approved as a direction. Cognito Lite is only the leading candidate to test, not an approved vendor. The staff-only proof of concept must validate TOTP, OIDC issuer/audience/signature, JWKS rotation, session/logout/revocation, disabled-user denial and acceptable branded login before provider selection.

### Separate unresolved decisions

- Customer portal identity provider, tenant boundary, MFA and recovery.
- Workload runtime, federation mechanism and secret manager.
- Initial agent roster, tools, resource scopes and approval matrix.
- Audit retention and redaction policy.

## 5. Safe implementation order

1. Owner resolves customer account semantics; record the decision.
2. Run staff-only identity-provider proof of concept; owner selects the provider.
3. Finalize the provider-neutral human identity mapping and session boundary.
4. Implement trusted token/session verification in NestJS; derive request principal only from verified credentials.
5. Implement and test customer membership/ownership boundary before customer business APIs.
6. Implement workload identity and audit attribution for the selected runtime.
7. Introduce read-only/draft-only agent runs and capabilities.
8. Implement the typed tool broker and exact-payload human approval gates before any write-capable or external-action agent.
9. Run positive, negative, cross-account, wrong-issuer/audience, expiry, revocation, replay and audit tests.

## 6. Current implementation status

- Reconciliation: **Designed / documented**.
- Prisma schema changes: **Not started**.
- Migrations and database: **Not started**.
- Authentication provider and sessions: **Not started**.
- Runtime principal verification: **Not started**.
- Customer membership and tenant isolation: **Blocked on account-model decision**.
- Workload/agent runtime identity and tool broker: **Not started; runtime/provider decisions remain open**.

No authentication, authorization, customer isolation, workload identity or agent execution capability should be described as implemented or production-ready on the basis of this document.
