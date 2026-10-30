# ADR: Customer Membership and Web-to-API Session Boundary

- Date: 31 October 2026
- Status: **Proposed architecture for owner review; no runtime or schema implementation.**
- Related owner decision: Customer account model Option A is approved.
- Related POC plan: docs/security/AUTH_PROVIDER_POC_TEST_PLAN.md
- Applies to: Next.js App Router, NestJS Modular Monolith, PostgreSQL + Prisma, managed identity provider candidates (WorkOS AuthKit, Clerk, Amazon Cognito).

## 1. Decisions proposed

This ADR proposes two concrete architectural decisions for review:

1. **Canonical customer membership:** introduce one universal `CustomerMembership` relation between `User` and `Customer`. It is the only authoritative relation that grants a human access to a commercial Customer account. For a company account, the optional `Organization` profile belongs to that Customer; company membership is represented by the same CustomerMembership rows. Do not create a second independently authorizing `OrganizationMember` table.
2. **Browser/API session boundary:** use a Next.js Backend-for-Frontend (BFF) with an opaque, HttpOnly browser session cookie. Keep provider credentials server-side. Next.js forwards authenticated application requests to NestJS using a short-lived, ATSH-issued internal access assertion. NestJS validates that assertion and independently resolves membership, resource ownership, and permissions from PostgreSQL.

These are recommendations, not implementation authorization. Owner confirmation is required before schema, SDK, session, or runtime changes.

## 2. Canonical membership model

### 2.1 Why one relation

The approved account model makes Customer the commercial owner. An individual Customer may have no Organization; a business Customer has an Organization profile and multiple authorized people. If OrganizationMember independently grants access while CustomerMembership also grants access, the same User–Customer pair can have conflicting active/inactive status, roles, invitation state, or revocation state.

A single CustomerMembership relation removes that ambiguity and makes the authorization question consistent:

**Does this authenticated User have an active membership in this Customer, and what customer-side permissions does that membership grant?**

### 2.2 Proposed logical shape

```text
Customer
  ├── optional Organization (company profile; 0..1)
  ├── CustomerMembership[] (canonical account access)
  ├── ServiceRequests
  ├── Quotes / Contracts / Invoices
  ├── Projects
  └── Customer-owned Products (hosting / domains / etc.)

User
  ├── CustomerMembership[] (customer-side identities)
  ├── UserRole[] (internal ATSH staff roles only)
  └── IdentityLink[] (external authentication identities)

CustomerMembership
  ├── Customer
  ├── User
  ├── customer-side role / constrained permission set
  ├── status and invitation lifecycle
  └── audit history
```

### 2.3 Required constraints and lifecycle

- Unique pair: one canonical membership record per `(customer_id, user_id)`. Re-invitation reuses or safely reactivates the same logical membership; it must not create a second active authorization path.
- Status vocabulary should distinguish at least `INVITED`, `ACTIVE`, `SUSPENDED`, and `REVOKED` (final enum names subject to schema conventions).
- Pending invitation does not grant access.
- Activation requires verified identity and a valid invitation acceptance bound to the intended Customer and User.
- Membership role is customer-side only; it cannot grant internal ATSH staff permissions.
- Membership role changes, invitation, acceptance, suspension, revocation, and reactivation are audited.
- Removing a member revokes their access to all Customer-owned resources unless a separately approved, explicitly scoped grant exists.
- A user may be a member of multiple Customer accounts only through separate explicit memberships.
- Organization profile is optional and has a unique one-to-one relationship with Customer in this account model. Company member listing is obtained by querying CustomerMembership for that Customer; no duplicate OrganizationMember authorization table is needed.
- If a future requirement needs organization-specific metadata for a member, store it as non-authoritative profile data keyed to the canonical membership; it must never grant access independently.
- Customer account owner/administrator authority is represented by a customer-side role on the membership and constrained by ATSH policy. It cannot bypass commercial gates or owner-controlled actions.

### 2.4 Implications for current draft schema

The current schema has `Customer.userId` as a unique optional relation, which supports at most one linked user per Customer. It is insufficient for the approved multi-member company account model.

The future schema phase should:
- Replace the single-user ownership shortcut with CustomerMembership.
- Add Organization as a company profile attached to Customer (if not already present in the approved full schema).
- Remove or repurpose `Customer.userId` only through a reviewed migration plan; do not silently drop historical links.
- Keep `UserRole` for internal staff authorization. Do not mix customer membership roles into staff RBAC.
- Resolve customer access through CustomerMembership in a single authorization service.
- Add database uniqueness, foreign keys, indexes, and temporal constraints appropriate to the final migration.

No schema changes are made by this ADR.

## 3. Provider-neutral identity mapping

A provider authenticates a human; ATSH determines which internal User and Customer account that human may access.

Proposed identity mapping:
- `IdentityLink` contains internal `user_id`, normalized `issuer`, external `subject`, provider key, and lifecycle timestamps.
- Unique constraint on `(issuer, subject)`; do not assume external subject values are globally unique across issuers.
- Email is a verified contact/communication attribute, not the stable identity key.
- Provider organization IDs and provider-side roles are not commercial ownership or ATSH authorization keys.
- Provider migration adds/replaces IdentityLink rows while preserving internal User and Customer IDs.

## 4. Proposed browser-to-API session architecture

### 4.1 Request flow

1. Browser navigates to the Next.js customer portal.
2. User is redirected to the selected provider using Authorization Code flow with PKCE, state, and nonce (exact supported flow to be verified per provider).
3. Provider returns an authorization response to a server-side Next.js callback.
4. Next.js validates the response and exchanges the code server-to-server. Provider client secrets and tokens never enter browser JavaScript.
5. Next.js resolves the external `(issuer, subject)` through the ATSH identity adapter and checks that the internal User is active.
6. ATSH creates an opaque random session identifier. The browser receives only the opaque identifier in a cookie configured `Secure`, `HttpOnly`, and an appropriate `SameSite` policy, with a narrow path and host-only scope where feasible.
7. The session verifier/hash and minimal session metadata are stored server-side. Raw session bearer material is not stored in the database.
8. Browser requests go to Next.js BFF routes. Next.js validates the session and creates a short-lived, audience-restricted ATSH internal assertion for the target NestJS API.
9. NestJS verifies signature, issuer, audience, expiry, key ID/rotation, and required principal/session claims. It then loads the active User, CustomerMembership, and resource ownership from PostgreSQL and authorizes the requested action.
10. NestJS never trusts Customer IDs, roles, permission lists, or organization identifiers supplied by browser request bodies or query parameters.

### 4.2 Why BFF + opaque cookie is proposed

- Browser JavaScript does not need access to provider access or refresh tokens.
- The application has one controlled browser session boundary.
- Provider-specific SDK/session behavior remains behind the Next.js adapter.
- NestJS can verify a narrow ATSH-issued assertion without accepting provider-specific tokens from arbitrary browser clients.
- ATSH can revoke its own session and membership independently of provider state.
- Customer ownership and permissions remain database-backed and provider-neutral.

### 4.3 Session persistence

Proposed initial approach: persist ATSH sessions in PostgreSQL, not Redis, unless measured load or operational requirements justify a separate session store.

A future Session record should contain only what is necessary, such as:
- Internal session ID.
- User ID.
- Hash/verifier of opaque browser session secret.
- Created, last-used, idle-expiry, absolute-expiry, and revoked timestamps.
- Minimal device/session metadata and security correlation IDs.
- Optional provider session reference only if needed for coordinated logout.

Never store raw browser session secrets, provider bearer tokens, refresh tokens, passwords, or MFA secrets in plaintext. If a provider refresh token must be retained for a specific capability, separately design encryption-at-rest, access restrictions, rotation, and revocation; do not assume it is needed for the initial portal.

### 4.4 Internal assertion

The BFF-to-NestJS assertion should be:
- Signed by an ATSH-controlled key held outside the public repository.
- Short-lived (initial design target: 1–2 minutes; confirm against actual request/refresh behavior).
- Audience-restricted to the intended NestJS API.
- Issuer-restricted to the ATSH BFF/session service.
- Bound to internal User ID, session ID, principal class, issued-at, expiry, and unique token ID.
- Free of authoritative Customer IDs, role arrays, or permission snapshots unless a separately reviewed design proves a need. NestJS must resolve those from current persisted records.
- Rotatable through key IDs and a documented overlap/revocation policy.

The signing mechanism and key-management service are open decisions. Do not put a shared signing secret in source control or expose it to browser code.

### 4.5 CSRF, origin, and cookie controls

- Use a host-only Secure + HttpOnly cookie, with SameSite selected based on the final provider callback and cross-site navigation requirements.
- Protect state-changing BFF routes with strict Origin/Referer validation and a CSRF token strategy appropriate to the cookie policy.
- Validate content type and request method; do not allow state changes through GET.
- Apply restrictive CORS. The browser should call the same-origin BFF rather than the NestJS API directly.
- Use TLS for browser, BFF, and API traffic.
- Apply CSP and standard security headers to the portal.
- Rotate the opaque session secret on login and privilege elevation; invalidate the previous session identifier.
- Avoid leaking session identifiers in URLs, logs, analytics, error traces, or referrers.

### 4.6 Logout and revocation

Logout must:
1. Revoke the ATSH session server-side.
2. Clear the browser cookie.
3. Attempt provider logout/end-session where supported and configured.
4. Ensure subsequent BFF requests fail even if the provider session remains active.

Membership suspension/revocation and User disablement must invalidate or deny existing sessions at the NestJS authorization boundary. Do not rely only on a provider token expiry or stale role claim. Define and test the maximum revocation propagation delay; for sensitive actions, re-check current membership and account status on every request.

## 5. API access policy

- Customer browser traffic: Browser → Next.js BFF → NestJS API.
- Do not expose provider access/refresh tokens to browser JavaScript.
- Do not let customer browsers call protected NestJS endpoints directly in the initial architecture.
- NestJS verifies only the ATSH internal assertion for BFF-originated customer requests.
- Any future mobile application or third-party API client requires a separate explicit client architecture and audience, not reuse of the browser cookie flow.
- Internal staff authentication must use a separate principal class/audience and staff policy. A customer session cannot be promoted to staff by email domain or provider organization membership.
- Service/AI agents use distinct workload identities and narrowly scoped credentials; they do not impersonate a human user.

## 6. Provider POC checks added by this architecture

Add these implementation checks to the existing 24-case matrix:

| ID | Scenario | Pass criteria |
|---|---|---|
| ARCH-01 | Provider callback | State, nonce, PKCE, issuer, audience, signature, and redirect URI validation are correct; replay is rejected. |
| ARCH-02 | Browser token exposure | No provider access/refresh token or ATSH internal assertion is readable by browser JavaScript. |
| ARCH-03 | Cookie security | Cookie is Secure, HttpOnly, appropriately SameSite, narrowly scoped, and absent from URLs/logs. |
| ARCH-04 | CSRF | Cross-site state-changing request is rejected; legitimate same-origin action succeeds. |
| ARCH-05 | BFF assertion | NestJS rejects wrong issuer/audience, expired, malformed, invalid-signature, replayed where applicable, or wrong-principal assertions. |
| ARCH-06 | Membership freshness | Membership revocation or User suspension blocks the next protected API request within the defined policy window. |
| ARCH-07 | Session logout | ATSH session revocation blocks BFF/API access even if the provider session remains active. |
| ARCH-08 | Key rotation | BFF signing key rotation works with a bounded overlap and no acceptance of revoked keys beyond policy. |
| ARCH-09 | Duplicate membership | Repeated invite/accept events cannot create two effective User–Customer memberships. |
| ARCH-10 | No Organization individual | Individual Customer authorization works with no Organization row. |
| ARCH-11 | Company members | All company members resolve through the same canonical CustomerMembership relation. |
| ARCH-12 | Staff/customer audience | A customer assertion cannot authorize staff endpoints and vice versa. |

## 7. Decisions still open

These items require owner/product/security review and are not silently decided by this ADR:

1. Approve or reject CustomerMembership as the canonical relation and the decision not to use a separate authoritative OrganizationMember table.
2. Approve or reject the Next.js BFF + opaque cookie + ATSH internal assertion architecture.
3. Exact cookie SameSite setting and callback topology after the selected provider is known.
4. Session idle and absolute lifetime; concurrent-session policy.
5. Signing algorithm, key custody, rotation and emergency revocation.
6. Whether provider refresh tokens are needed at all.
7. Whether mobile applications will require a separate direct OIDC client flow.
8. Customer MFA policy and whether staff MFA is mandatory.
9. Whether the POC may create disposable provider tenants and send test emails/SMS, and the maximum allowed test spend.
10. Final provider and plan selection.

## 8. Implementation sequence after approval

1. Approve this ADR and resolve the remaining policy choices.
2. Update the logical data model and perform schema gap analysis.
3. Design a migration that preserves existing User–Customer links and audit history.
4. Implement provider-neutral identity adapter interfaces and session contracts in an isolated POC only.
5. Implement one provider adapter at a time against the same test harness.
6. Implement NestJS assertion verification and database-backed CustomerMembership authorization.
7. Complete all mandatory and ARCH tests; independent review of hard-fail security tests.
8. Compare cost and operational evidence; owner selects provider/plan.
9. Only then authorize production schema, login, and portal implementation as separate gates.

## 9. Current status

- [x] Customer account Option A is owner-approved.
- [x] Current schema gap identified: Customer.userId supports only one linked user.
- [x] Proposed one canonical User–Customer membership relation documented.
- [x] Proposed Next.js BFF and opaque-cookie session boundary documented.
- [x] Additional 12 architecture tests documented.
- [ ] Owner approval of canonical membership relation.
- [ ] Owner approval of BFF/session architecture.
- [ ] Session policy and key-management decisions.
- [ ] Authorization to create isolated POC harness and provider test tenants.
- [ ] Provider POC execution and evidence.
- [ ] Provider selection.

**Conclusion:** The recommended design is one canonical CustomerMembership relation plus a Next.js BFF session boundary. Both remain proposed until owner approval. No application code, Prisma schema, migration, provider SDK, credentials, or deployment is changed by this ADR.
