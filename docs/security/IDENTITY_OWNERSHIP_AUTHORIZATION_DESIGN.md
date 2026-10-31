# Identity, Customer Ownership and Authorization Design — Draft v1.0

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Authority: Executive Reference v2.0, approved owner decisions, and `docs/data/LOGICAL_DATA_MODEL.md`
- Status: **Design proposal only. No Prisma schema, migration, authentication provider, or runtime authorization behavior is changed by this document.**

## 1. Purpose

Define the identity and ownership boundary that must exist before protected customer, project, portal, finance, hosting, and administrative APIs are implemented.

The design must support:
- Internal ATSH users and owner-controlled staff roles.
- Individual customers.
- Company customers with multiple customer-side users.
- One customer user having only the explicitly granted account/project/product access.
- Temporary project-level delegation.
- Server-side, deny-by-default authorization.
- Auditable grant, revoke, approval, and access decisions.

## 2. Current implementation baseline

The current Prisma draft contains:
- `User` with unique email, optional unique `authSubject`, and status.
- `Role`, `Permission`, `RolePermission`, and `UserRole`.
- `UserRole` supports optional generic `scopeType/scopeId`, start, expiry, revocation and grantor.
- `Customer` has an optional unique `userId`, contact fields and a free-text `company` field.
- Existing requests link optionally to `Customer`.

This is a useful starting point but not a complete authorization model. In particular:
- A single unique `Customer.userId` does not represent multiple customer-side members.
- A free-text company field is not an organization identity or membership relationship.
- Generic role scope strings do not alone guarantee valid resource ownership or safe authorization.
- `authSubject` does not implement authentication, sessions, account recovery, MFA, or request-principal verification.

## 3. Target conceptual relationship

The logical data model names `Customer`, `Organization`, and `OrganizationMember` separately. It does not yet fully define whether Organization is the customer account itself, a legal entity beneath a customer account, or a grouping of multiple customer records. This is a blocking domain decision; do not silently encode one interpretation in Prisma.

The following is the recommended conceptual shape, subject to that decision:

```text
User
 ├── UserProfile
 ├── UserRole ── Role ── RolePermission ── Permission
 ├── AccessGrant (grantor / grantee / explicit scope / expiry / revocation)
 ├── Session (opaque provider-neutral session metadata)
 └── OrganizationMember ── Organization

Customer account (account model to be confirmed)
 ├── individual customer identity OR organization relationship
 ├── authorized user/member relationships
 ├── ServiceRequest
 ├── Project
 ├── Contract
 └── customer-owned products (hosting/domain/etc.)

AuditEvent
 ├── actor user/system/agent
 ├── action and target
 ├── decision context and request correlation
 └── timestamp
```

Do not use email address, company name, route parameter, public reference, or a client-supplied customer ID as proof of ownership.

## 4. Required authorization invariants

1. Deny by default. Every protected API operation requires an explicit server-side permission decision.
2. Authenticate before authorizing. The request principal must be derived from a verified authentication/session mechanism, never from request body or query fields.
3. Resolve ownership from persisted relationships. A customer/project/product ID supplied by the client is only a lookup key.
4. Enforce account membership. A customer-side user can access an organization account only through an active membership or explicit valid grant.
5. Enforce resource scope. Project/product access must be checked against the resource's persisted customer/account ownership and the user's active membership/grant.
6. Permission ceiling. A scoped grant can narrow or delegate permitted actions but cannot exceed the user's base role or owner-defined maximum.
7. Expiry and revocation. Expired or revoked grants must stop authorizing access immediately at the policy boundary.
8. No privilege escalation. Customer members cannot grant internal ATSH permissions or alter owner-controlled roles.
9. Separate staff and customer principals by policy and audience; do not infer internal status from an email domain.
10. Audit sensitive access and every role/grant lifecycle mutation without recording secrets or unnecessary personal data.
11. Customer-facing DTOs must exclude internal notes, staff assignments, AI execution logs, provider credentials, and internal-only audit metadata.
12. Cross-account isolation must be tested at API/service/database query boundaries.

## 5. Proposed authorization evaluation order

For each protected operation:

1. Verify the authentication credential/session and account status.
2. Resolve the principal and principal class (internal staff, customer user, service/agent).
3. Load the target resource from the database.
4. Resolve its authoritative ownership chain (customer/account → project/product → unit).
5. Resolve active base role permissions.
6. Resolve applicable active scoped grants, if any.
7. Apply explicit owner policy ceilings and protected-gate restrictions.
8. Evaluate the requested action against both permission and resource scope.
9. Deny if any required ownership, membership, scope, or policy fact is missing or ambiguous.
10. Emit an audit/security event for sensitive decisions and mutations.

Authorization must live in NestJS guards/policies and domain services, not only in the frontend. Query services must scope records before returning data; filtering a broad result after retrieval is not sufficient.

## 6. Scoped grant requirements

A future `AccessGrant` must represent at least:
- Grantor user.
- Grantee user.
- Scope type from a controlled domain vocabulary.
- Scope resource identifier with validated resource existence and ownership.
- Explicit permitted role/actions or a constrained permission set.
- Start timestamp.
- Expiry timestamp.
- Revocation timestamp and actor.
- Reason/reference where policy requires.
- Audit correlation.

The application must validate that:
- Grantor is authorized to delegate the exact grant.
- Grantee's base permission ceiling allows the delegated actions.
- Resource belongs to the grantor's delegable scope.
- Customer grants cannot cross customer-account boundaries.
- Expiry is after start.
- Revocation is idempotent and immediately effective.
- Delegation cannot mutate protected workflow gates or owner-only controls.

The current generic `UserRole.scopeType/scopeId` should not be treated as a complete substitute for this model without a documented decision on whether role assignments and temporary resource grants are distinct concepts.

## 7. Authentication and session boundary

**Owner decision (31 October 2026):** Internal ATSH staff sign-in will use a managed identity/sign-in service; ATSH will not build and operate its own staff password-authentication system. The specific provider/vendor and exact integration/session configuration remain open. This approval is limited to internal staff authentication and does not decide customer-portal identity, MFA policy, or whether staff and customers share a tenant.

The data model must remain provider-neutral until the provider is selected. In either case:
- Store provider subject identifiers with issuer/provider context and uniqueness scoped correctly; a globally unique bare subject may not be sufficient across issuers.
- Never store plaintext passwords, raw bearer tokens, or raw MFA secrets in ordinary tables.
- Session records, if persisted by ATSH, should contain a non-reversible token verifier/hash, expiry, revocation and minimal device/session metadata.
- Password reset, recovery, MFA enrollment, login throttling, credential rotation and session invalidation need explicit security design and tests.
- No authentication implementation is authorized by this design note.

## 8. Customer account model — blocking decision

The logical model establishes that organizations can group customer users and projects, but the exact cardinality and account semantics are not sufficiently specified.

Choose and document one of these models before Prisma changes:

### Option A — Customer is the account
- Every commercial customer has one Customer account.
- Individual accounts have one or more authorized User links.
- Business accounts additionally have an Organization profile and OrganizationMember rows.
- Projects/requests/contracts belong to Customer; organization membership grants account access.
- Avoids duplicating commercial ownership between Customer and Organization.

### Option B — Organization is the business account
- Individual customers use Customer directly.
- Business accounts use Organization directly.
- A shared account abstraction or explicit dual ownership is needed for consistent request/project/contract APIs.
- Requires careful prevention of ambiguous ownership and duplicated customer records.

### Option C — Customer is a person/contact; Organization is the account
- Customer represents a person/contact record.
- Organization is the owning commercial account for company work.
- Requests/projects/contracts must distinguish personal customer ownership from organization ownership.
- Requires a defined model for sole traders, multiple contacts, and personal customers.

**Recommendation:** Option A is the least disruptive extension of the existing request model, but it is not an owner-approved decision. Do not implement it without explicit confirmation.

## 9. Schema work blocked until decisions

After the account model and authentication boundary are approved, implement in a dedicated schema phase:
- UserProfile (if required fields are confirmed).
- Organization and OrganizationMember, with uniqueness and lifecycle constraints.
- A normalized customer-account membership relation consistent with the chosen option.
- AccessGrant with controlled scope and grantor/grantee relations.
- Session only if ATSH owns session persistence.
- Authentication identity mapping if multiple issuers/providers are possible.
- Explicit relations from audit/approval records to actors, without cascading deletion of historical evidence.
- Ownership foreign keys and indexes for request/project/product query patterns.

Do not add unused generic JSON permission blobs or arbitrary string-based scope types as a shortcut.

## 10. Required tests before protected APIs

- Anonymous request is denied.
- Suspended/disabled user is denied.
- Internal staff cannot access another staff-only module without permission.
- Customer A cannot read or mutate Customer B's request, quote, project, files, domain, or hosting.
- Organization member can access only the account and resources granted by active membership.
- Removed member loses access.
- Expired/revoked project grant loses access.
- Grantor cannot delegate permissions above their own ceiling.
- Customer member cannot grant internal ATSH permissions.
- Client-supplied owner/customer IDs cannot override database ownership.
- List, detail, download, mutation, export, and background-job paths enforce the same ownership boundary.
- Audit records contain actor/action/target/time but no credentials or raw secrets.
- Customer DTOs never expose internal notes, agent logs, staff-only comments, or credentials.

## 11. Non-decisions preserved

This document does not select:
- The managed identity provider/vendor for internal staff.
- Exact staff session integration/configuration.
- Customer-portal authentication provider or whether it shares the staff tenant.
- Session ownership model for customer identities.
- MFA requirement or provider.
- Customer account semantics (Option A/B/C).
- Legal/KYC or customer verification requirements.
- Data retention, consent, or deletion periods.
- Production hosting, secret manager, or security vendor.

## 12. Acceptance gate

No protected customer portal or business API should be considered production-ready until:
- The account model is explicitly approved.
- Identity and session trust boundaries are implemented.
- Ownership paths are explicit in the database.
- Scoped grants and permission ceilings are enforced server-side.
- Cross-customer isolation tests pass.
- Audit and customer-safe DTO boundaries are verified.
- The resulting schema has passed Prisma validation, generated-client checks, and an empty ephemeral PostgreSQL migration test.
- The owner approves the migration boundary before any persistent database is provisioned or migrated.

**Current decision: staff authentication direction approved (managed identity); provider selection and customer-account model remain open. Design only; no schema or migration changes.**


## 13. AI-first workforce architecture addendum — 31 October 2026

The owner clarified that ATSH AI expects approximately 90% of routine operations to be automated or AI-assisted. Identity design must therefore model a small human workforce alongside distinct workload/service and AI-agent identities; a managed human sign-in provider is not the identity authority for automation.

The detailed provider-neutral model is documented in `docs/security/AI_FIRST_WORKFORCE_IDENTITY_MODEL.md`. It defines principal classes, verifiable workload identity, agent run attribution, least-privilege capabilities, permission ceilings, a server-side tool/action broker, n8n and worker boundaries, human approval gates for protected actions, audit requirements, provider evaluation implications, and security tests.

This clarification does not approve a particular human identity vendor, customer identity design, agent roster, schema, secret manager, runtime platform, or policy service. It does not authorize credentials, integrations, API endpoints, migrations, or agent tool access. Human authentication remains a distinct concern from workload/agent authentication and ATSH authorization.
