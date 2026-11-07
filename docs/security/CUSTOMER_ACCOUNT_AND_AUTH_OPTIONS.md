# Customer Account Model and Authentication Options — Draft v1.1

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Authority: Executive Reference v2.0, approved owner decisions, and `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md`
- Status: **Customer account model A is owner-approved. Authentication strategy remains open; comparison only. No schema, migration, provider, or runtime authentication change is made here.**

## 1. Owner decisions

### 1.1 Customer account model — approved Option A

The commercial customer is the account owner represented by one `Customer` account. A company account may have multiple authorized customer-side users. The company profile is represented by `Organization`. All people who can access an individual or business Customer account are represented through the single canonical `CustomerMembership` relation.

Conceptual relationship:

```text
Customer account (commercial owner)
  ├── Organization profile (for business customers)
  │     └── (profile only; no separate membership authority)
  ├── ServiceRequests
  ├── Quotes
  ├── Contracts
  ├── Projects
  └── Customer-owned products (hosting, domains, etc.)

User
  ├── CustomerMembership[] (canonical customer-account access)
  └── Customer-side role / scoped permissions
```

The Customer account remains the single commercial ownership anchor. Organization is the company profile and membership container; it does not become a second competing owner of requests, projects, contracts, invoices, or products.

For an individual customer, a Customer account may exist without an Organization profile. The account may have one or more authorized users (for example, the customer and an assistant), subject to explicit membership policy. For a company, the Organization profile is attached to its Customer account; authorized employees are linked through the same canonical CustomerMembership relation.

### 1.2 Authentication strategy — compare only

The owner selected **Compare**. This authorizes an architecture and options comparison, not selection of a vendor or implementation strategy. Keep the application identity model provider-neutral until a separate decision is made.

## 2. Account and membership rules

1. Every commercial record has exactly one authoritative Customer account owner.
2. Organization is optional and is used for business identity/profile and company membership; it is not an alternative owner key.
3. A User gains customer-account access only through an active, verified membership or a separately authorized, valid scoped grant.
4. Membership is account-scoped. Project/product grants may narrow access further; they cannot expand access beyond the account or the user's permission ceiling.
5. A company employee leaving the company is removed/suspended from membership; historical actions and approvals remain attributable to the original User.
6. A user may be invited before accepting; pending invitations do not grant access.
7. Membership removal, suspension, role change, invitation acceptance, and grant/revocation are audited.
8. Customer roles are separate from internal ATSH staff roles. A customer administrator can manage only eligible customer-side users and cannot create staff identities, assign internal permissions, or bypass owner-controlled gates.
9. Email address, company name, a URL identifier, or a client-supplied Customer/Organization ID is never proof of account ownership.
10. Customer-facing APIs resolve Customer ownership from trusted persisted membership and resource relationships on the server.

## 3. Conceptual data model to implement after authentication decision

| Concept | Responsibility | Key constraints |
|---|---|---|
| User | Human identity and account status | Unique internal identity; no password/provider assumptions embedded in the customer domain |
| Customer | Commercial account and ownership root | One stable account ID; owns requests, quotes, contracts, projects and products |
| Organization | Optional company/legal/business profile | Belongs to one Customer account in this model; cannot independently own commercial records |
| CustomerMembership | Canonical link between User and Customer | Unique `(customer_id, user_id)`; status, invitation/activation timestamps, customer-side role and audit |

| CustomerRole / CustomerPermission | Customer-side role model | Separate namespace and policy from internal staff RBAC |
| AccessGrant | Narrow, temporary delegation to a project/product/unit | Validated resource ownership, explicit actions, start/expiry/revocation, grantor ceiling |
| IdentityLink | Provider-neutral external identity mapping | Issuer + subject uniqueness; support provider migration/multiple issuers |
| Session | Only if ATSH owns session persistence | Hashed/verifier-only token material, expiry, revocation and minimal metadata; never raw bearer tokens |

**Owner-approved modeling decision (31 October 2026):** `CustomerMembership` is the one universal and authoritative relation for all customer accounts, individual and business. Do not create a separate authoritative `OrganizationMember` table. The optional `Organization` is a company profile attached to Customer; company member lists are resolved through CustomerMembership for that Customer.

## 4. Authentication approaches compared

### Option 1 — Managed identity provider

A specialist identity service handles credential verification and usually hosted login, password reset, MFA, suspicious-login controls and session/token lifecycle. ATSH integrates it through a provider adapter and maps the verified external identity to an internal User.

**Advantages**
- Less security-sensitive authentication code to build and maintain.
- Faster path to secure login, recovery and MFA.
- Provider-managed operational controls and security updates.
- Can support social/enterprise identity options if actually needed.

**Trade-offs**
- Recurring vendor cost may grow with monthly active users, enterprise features or authentication methods.
- Dependency on provider availability, policy and pricing.
- Data residency, support, exportability and migration terms require review.
- Provider configuration and token verification still need correct implementation in ATSH.

**ATSH responsibility remains:** account ownership, customer membership, staff/customer separation, roles, permissions, resource authorization, audit, business workflows and customer-safe data boundaries.

### Option 2 — First-party authentication built by ATSH

ATSH operates credential storage, password verification, recovery, MFA, login throttling, session issuance/revocation and security operations itself.

**Advantages**
- Maximum control over user experience, data flow and deployment.
- No per-user identity-provider pricing dependency.
- Direct control over identity lifecycle and integration behavior.

**Trade-offs**
- Highest engineering and security burden.
- ATSH becomes responsible for password hashing policy, recovery abuse, MFA, brute-force defenses, session theft/revocation, email verification, incident response and security maintenance.
- More testing and ongoing operational work before the login system is safe for customer use.
- Easy to underestimate edge cases and account-recovery risks.

This option is not recommended for the initial release unless a concrete legal, operational or product requirement makes managed identity unsuitable and the company funds specialist security engineering and review.

### Option 3 — Hybrid / provider-backed authentication with ATSH-owned application identity

An identity provider performs authentication, while ATSH owns the canonical User, Customer, Organization, membership, role, permission, ownership and audit model. A provider adapter isolates vendor-specific token/session details.

**Advantages**
- Keeps the security-sensitive credential lifecycle with a specialist provider.
- Preserves ATSH ownership of business identity and authorization.
- Reduces lock-in through a stable internal identity and adapter boundary.
- Allows a provider to be replaced without rewriting Customer, Project, Contract or Product ownership.
- Supports future staff/customer separation through distinct application audiences and policies.

**Trade-offs**
- Requires a deliberate integration boundary and mapping lifecycle.
- Provider and ATSH user statuses must be reconciled safely.
- More design than a direct one-off SDK integration.
- Some provider-specific features may not map perfectly across vendors.

## 5. Comparison summary

| Criterion | Managed provider | First-party ATSH | Hybrid |
|---|---|---|---|
| Initial delivery speed | High | Low | Medium–high |
| Security engineering burden on ATSH | Lower, not zero | Very high | Lower, not zero |
| Control over business authorization | ATSH-owned | ATSH-owned | ATSH-owned |
| Credential/session control | Provider | ATSH | Provider for authentication; ATSH owns business identity |
| Vendor dependency | High | Low | Medium, isolated by adapter |
| Ongoing operational burden | Lower | Highest | Medium |
| Provider migration flexibility | Depends on data/export | Not applicable | Better if adapter and identity mapping are designed correctly |
| Initial recommendation | Viable | Not preferred | **Preferred architecture pattern** |

## 6. Recommended direction — architecture recommendation, not vendor approval

Use **Option 3 (hybrid)** as the target architecture pattern, while keeping the final provider unselected.

- Define an internal `IdentityProviderAdapter` contract for login callback/token verification, identity lookup, logout/revocation hooks and provider metadata.
- Map verified `issuer + subject` to an internal User through an `IdentityLink`; do not use email as the stable external identity key.
- Keep Customer, Organization, memberships, customer roles, internal staff roles, AccessGrant, resource ownership and AuditEvent entirely under ATSH domain control.
- Use separate application audiences/policies for internal staff and customer portal identities. A shared provider does not mean shared authorization.
- Do not let a provider role claim directly grant ATSH owner/staff permissions. Map only explicitly approved claims and validate them against ATSH policy.
- Keep session strategy explicit: provider-managed secure session where supported, or a carefully designed ATSH application session/BFF. Do not casually mix bearer tokens in browser storage with server sessions.
- Provider selection must evaluate MFA/passkeys, account recovery, session revocation, organization membership support, API/SDK maturity, regional/data-processing terms, export/deletion, support, uptime, pricing at projected monthly active users, and migration path.

This recommendation does **not** approve Clerk, Auth0, Supabase Auth, Amazon Cognito, Auth.js, or any other named vendor/library. A vendor shortlist and current pricing review must be a separate evidence-based decision.

## 7. Authentication and authorization boundaries

Authentication answers: **Who is this user, and is the presented identity/session valid?**

Authorization answers: **What may this user do, on which Customer account and which resources?**

For every protected request:
1. Verify issuer, signature/session, audience, expiry, revocation/status and required authentication assurance.
2. Resolve the external identity to the internal User.
3. Determine principal class: customer user, internal ATSH staff, or trusted service/agent.
4. Resolve the target resource and its Customer ownership from the database.
5. Resolve the canonical active User–Customer membership (and organization membership where applicable).
6. Resolve role permissions and any narrower valid resource grant.
7. Apply deny-by-default, permission ceilings and protected workflow gates.
8. Return only the DTO appropriate to the principal and operation.
9. Audit sensitive decisions and mutations.

## 8. Migration and implementation sequence

1. Preserve the current Prisma draft and do not generate/apply a durable migration.
2. Finalize the single canonical User–Customer membership relation and Organization cardinality.
3. Select the authentication provider/session ownership after the vendor comparison and cost/security review.
4. Add User identity-link mapping, Customer, optional Organization, canonical membership, customer role/permission, AccessGrant and audit relations to the logical model.
5. Keep internal staff RBAC distinct from customer-side RBAC.
6. Add NestJS authentication adapter/guards and domain authorization policies.
7. Add cross-account and cross-audience integration tests before exposing protected APIs.
8. Generate SQL preview, review constraints/indexes, test on disposable PostgreSQL, and request explicit owner approval before any persistent database migration.

## 9. Required security and acceptance tests

- Individual Customer account works without an Organization.
- Business Customer account has one Organization profile and multiple authorized members.
- No commercial record can be owned by both Customer and Organization independently.
- A pending invitation grants no access.
- An active member accesses only the Customer account and resources allowed by membership and role.
- A removed/suspended member immediately loses access, including existing sessions according to the revocation policy.
- A member of Customer A cannot read or mutate Customer B data by changing IDs, routes, filters, exports, downloads or background-job payloads.
- Customer administrator cannot create internal ATSH staff or grant internal permissions.
- Internal staff access is governed by internal RBAC, not customer membership.
- Provider subject collisions across issuers cannot merge accounts.
- Email changes do not silently change identity ownership or merge accounts.
- Provider outage/failure denies protected access safely; it does not bypass authorization.
- Provider migration preserves internal User and Customer ownership identifiers.
- Audit records preserve actor identity after membership removal or account closure.

## 10. Open decisions retained

- Authentication provider/vendor and final shortlist.
- Exact cookie/BFF settings, session lifetime, signing algorithm and key custody (the high-level Next.js BFF + opaque cookie + ATSH assertion architecture is owner-approved).
- MFA/passkey policy for customers and staff.
- Whether one human may belong to multiple Customer accounts and how account switching is presented.
- Customer role catalogue and who can invite/remove members.
- Whether Organization profile represents a legal entity, trading name, or both; required verification evidence.
- Invitation expiry and recovery rules.
- Data retention, consent and account deletion policy.
- Provider region, data-processing terms, service-level and projected cost.

**Current state:** Customer account model A, canonical CustomerMembership, and the high-level Next.js BFF + opaque cookie + ATSH internal assertion architecture are owner-approved. Authentication provider remains in comparison; hybrid is the recommended provider pattern only. No provider, schema, migration, authentication runtime or database change is approved by this document.
