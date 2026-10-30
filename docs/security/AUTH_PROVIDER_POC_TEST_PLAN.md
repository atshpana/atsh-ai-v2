# Authentication Provider Proof of Concept Plan — ATSH AI

- Date: 30 October 2026
- Base branch: implementation/bootstrap
- Working branch: docs/auth-provider-poc-plan
- Status: **Plan only. No provider account, SDK, credentials, schema, migration, runtime authentication, or deployment is created by this document.**
- Related decisions:
  - docs/security/CUSTOMER_ACCOUNT_AND_AUTH_OPTIONS.md
  - docs/security/AUTH_PROVIDER_EVALUATION_2026-10-30.md
  - docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md

## 1. Purpose and decision boundary

Run a controlled, like-for-like technical evaluation of:

1. WorkOS AuthKit
2. Clerk
3. Amazon Cognito

The objective is to determine which provider best supports ATSH AI's customer identity requirements while preserving ATSH ownership of its business accounts, memberships, authorization, and audit records.

This plan does **not** select a provider. The owner decision remains **Compare**. A provider must not be purchased, connected to production, or adopted in the application until the owner approves the evaluation results and the associated architecture decisions.

## 2. Fixed ATSH invariants

Every candidate must be evaluated against the same application-owned model and rules:

- Customer is the single commercial ownership root for requests, quotes, contracts, projects, invoices, and customer-owned products.
- Organization is an optional company profile attached to a Customer; it is not a second commercial owner.
- OrganizationMember represents company-side people, but the canonical effective membership relation for each User–Customer pair must be decided before implementation. No competing authorization paths are permitted.
- Individual Customer accounts must work without an Organization profile.
- Customer identities, roles, sessions, and permissions are separate from internal ATSH staff identities and permissions.
- Provider organization IDs, metadata, email addresses, and browser-supplied IDs are never proof of ATSH account ownership.
- External identities map to an internal User using a stable provider issuer + subject pair, not email as the identity key.
- NestJS remains the enforcement point for API authorization. Hiding a button or route in the browser is not an authorization control.
- Project/product grants can narrow account access but cannot exceed the user's account membership or permission ceiling.
- Pending invitations grant no access. Membership changes and sensitive decisions must be auditable.
- No provider may independently approve quotes, contracts, payments, deployment, or other ATSH business gates.

## 3. Controlled test environment

### 3.1 Isolation

- Use a disposable development/test environment for each provider.
- Use synthetic identities and synthetic company data only (for example, Al Noor Demo LLC).
- Do not use real customer information, production domains, production email lists, or production credentials.
- Do not place secrets, API keys, client secrets, signing keys, or tokens in this public repository, commits, issues, screenshots, or chat messages.
- If credentials are later authorized, keep them in local untracked environment files or an approved secret manager. Provide only redacted evidence in test reports.
- Do not connect a provider to the production application or enable customer-facing authentication during the POC.

### 3.2 Equal conditions

- Use the same user journeys, role expectations, browser matrix, API contract, and pass/fail definitions for all three providers.
- Record the exact provider plan/tier, feature flags, region, SDK versions, test date, and relevant quotas.
- Do not compare Clerk MRU directly with another vendor's MAU. Record the vendor's actual billing metric and calculate costs separately.
- Separate provider capabilities from capabilities ATSH must implement itself.
- A feature that requires an add-on or a higher tier must be recorded with that dependency and its incremental cost.

### 3.3 POC boundary

The POC may use a small isolated Next.js/NestJS test harness only after explicit owner authorization to implement it. Until that authorization, this document defines tests and expected evidence only.

## 4. Test personas and synthetic fixtures

| Persona | Fixture | Expected boundary |
|---|---|---|
| Individual customer owner | individual.owner@example.test | Access to their individual Customer account |
| Individual assistant | individual.assistant@example.test | Access only after an explicit active membership/grant |
| Company owner/admin | owner@alnoor.example.test | Admin actions only inside Al Noor Customer |
| Company project member | developer@alnoor.example.test | Only assigned project scope and permitted actions |
| Company read-only member | viewer@alnoor.example.test | Read-only access within assigned scope |
| Removed company member | former@alnoor.example.test | No new access after removal/revocation |
| Second-company owner | owner@otherco.example.test | Access only to OtherCo Customer |
| Internal ATSH employee | staff@example.test | Separate staff identity and policy domain; no implicit customer membership |
| Uninvited external user | outsider@example.test | No account or resource access |

All addresses are reserved example/test domains. Use synthetic names and data only.

## 5. Mandatory test matrix

Each scenario is run against every candidate. Capture setup steps, expected result, actual result, evidence, plan dependency, and issue severity.

| ID | Scenario | Pass criteria |
|---|---|---|
| ID-01 | Individual registration | Creates/authenticates a human identity without requiring an Organization record; application mapping resolves exactly one intended Customer account. |
| ID-02 | Company registration | Company profile is attached to one Customer; provider organization data does not become the commercial ownership key. |
| ID-03 | Invite company member | Invitation is pending until accepted and verified; pending invitation grants no application access. |
| ID-04 | Accept invitation | Accepted member maps to the intended internal User and canonical Customer membership; no duplicate active membership is created. |
| ID-05 | Reject/expire invitation | Expired, cancelled, or rejected invitation cannot be used to gain access. |
| ID-06 | Change member role | Role changes are reflected in server-side authorization; stale sessions/claims cannot retain revoked privileges beyond the defined revocation window. |
| ID-07 | Remove/suspend member | Removed member loses access to all account resources and cannot regain it through an old session or provider organization claim. |
| ID-08 | Cross-customer isolation | Al Noor user cannot read, mutate, enumerate, or infer OtherCo requests, quotes, files, projects, or products by changing IDs or replaying requests. |
| ID-09 | Individual-account isolation | Individual customer can access their account without an Organization; another individual cannot access it. |
| ID-10 | Staff/customer separation | Customer login cannot be treated as staff login; staff permissions are never inferred from customer roles or provider organization membership. |
| ID-11 | API token/session verification | NestJS rejects missing, malformed, expired, wrong-issuer, wrong-audience, invalid-signature, and otherwise untrusted credentials. |
| ID-12 | Key rotation | Valid tokens signed by the active key work; invalid/retired keys are rejected according to the documented rotation policy without unsafe fallback. |
| ID-13 | Logout and revocation | Logout/revocation behavior is documented and tested across browser session and API access; residual access window is measured. |
| ID-14 | MFA enrollment | MFA can be enabled and enforced for the intended account policy; recovery behavior is documented and tested. |
| ID-15 | Account recovery | Recovery flow resists account enumeration and does not permit takeover through an unverified email or weak recovery path. |
| ID-16 | Email verification | Unverified identities cannot perform actions that require a verified address; changing email requires re-verification. |
| ID-17 | Arabic/English UX | Required customer-facing screens support Arabic RTL and English LTR, with understandable validation, recovery, MFA, invitation, and error states. |
| ID-18 | Session controls | Session lifetime, refresh, revocation, secure cookie or token handling, CSRF protection where applicable, and concurrent sessions are documented and tested. |
| ID-19 | Abuse controls | Rate limits, brute-force protections, suspicious sign-in controls, and relevant alerting are evaluated. |
| ID-20 | Auditability | Sign-in, invitation, membership, role, recovery, MFA, and administrative events can be correlated to an internal User and recorded in ATSH audit records where required. |
| ID-21 | Provider outage/degradation | User-facing behavior is safe during provider outage; no fail-open access is possible; recovery and operational dependencies are documented. |
| ID-22 | Data export/deletion | Export, account closure, identity unlinking, and deletion behavior are understood without deleting ATSH financial or contractual records that must be retained. |
| ID-23 | Migration portability | Provider-specific identifiers and claims are isolated behind an adapter; internal User and Customer IDs remain stable if the provider changes. |
| ID-24 | Cost verification | Launch and growth costs include plan minimums, MAU/MRU metric, MFA/SMS/email, SSO, domains, audit, support, and any required add-ons. |

**Hard-fail security cases:** ID-07, ID-08, ID-10, and ID-11 must pass. Any cross-customer data exposure, privilege escalation, fail-open behavior, or staff/customer identity confusion disqualifies the candidate until corrected and independently retested.

## 6. Architecture checks common to all candidates

The POC must validate the same proposed separation:

1. Next.js provides the customer-facing login experience and a secure server-side session/BFF boundary.
2. The identity provider authenticates the human and supplies verifiable identity/session evidence.
3. A provider adapter validates the provider-specific evidence and maps (issuer, subject) to an internal ATSH User.
4. NestJS resolves the canonical Customer membership and resource ownership from trusted application data.
5. NestJS authorization guards enforce customer, project, product, and action permissions on every protected API operation.
6. ATSH records relevant security and membership events in its own audit model.
7. Provider organization membership is an input to an invitation/membership workflow only; it is not an independent authorization grant.

Do not finalize cookie names, token storage, session persistence, refresh strategy, BFF route layout, or membership schema based on assumptions. Document and review those designs before implementation.

## 7. Provider-specific evaluation notes

### WorkOS AuthKit

- Validate Next.js App Router integration and the selected hosted/headless UI mode.
- Validate organization invitation and membership lifecycle, including synchronization with ATSH Customer/Organization records.
- Validate server-side verification in the separate NestJS API, audience/issuer configuration, key rotation, and logout/revocation behavior.
- Verify Arabic RTL customization, branding, recovery and MFA journeys.
- Record which capabilities are included in user management and which require SSO, Directory Sync, custom domain, audit, or other paid features.

### Clerk

- Validate App Router integration without placing ATSH ownership or permission logic in Clerk metadata.
- Validate organization invitations, member removal, role limitations, and the exact plan/add-ons required.
- Validate secure server-side session verification from NestJS and the effect of revoking a user/session or organization membership.
- Verify Arabic RTL customization and whether prebuilt components can meet ATSH UX requirements without excessive coupling.
- Record MRU usage precisely and distinguish it from MAU in all cost projections.

### Amazon Cognito

- Validate User Pool configuration, app clients, OAuth/OIDC flows, token issuer/audience checks, JWKS rotation, and logout/revocation behavior.
- Validate the amount of custom UI and application lifecycle logic ATSH must build for company invitations and membership administration.
- Verify MFA, passkey/passwordless availability, recovery, email/SMS delivery and the associated AWS services/costs.
- Record region, tier, free-tier assumptions, MAU categories, SMS/SES charges, and operational complexity.
- Do not assume that choosing Cognito requires choosing AWS for PostgreSQL or the rest of ATSH hosting.

## 8. Evidence package

For each provider, produce:

- A completed copy of the mandatory test matrix with pass/fail/blocked status.
- Redacted screenshots or short recordings of the synthetic user journeys.
- Sanitized request/response examples and relevant server-side verification logs.
- Exact SDK/package versions and integration notes.
- A list of provider-specific code and application-owned code.
- Security findings with severity, reproduction steps, mitigation, and retest result.
- Pricing worksheet for launch, expected growth, and enterprise features.
- Operational notes: support, outage behavior, export, deletion, migration, and vendor lock-in.
- A concise recommendation with unresolved risks and confidence level.

Never include raw access tokens, refresh tokens, secrets, signing keys, passwords, personal customer data, or production identifiers in the evidence package.

## 9. Scoring and decision gates

Score each provider from 1 (poor) to 5 (excellent), with evidence for every score.

| Dimension | Weight |
|---|---:|
| Security and session/revocation behavior | 25% |
| Customer organization and membership lifecycle | 20% |
| Next.js + NestJS integration quality | 15% |
| Arabic/English UX and customization | 10% |
| Operational resilience, audit and support | 10% |
| Cost transparency and projected total cost | 10% |
| Portability and migration effort | 10% |

Scoring does not override hard-fail security cases. A candidate with a hard-fail result cannot be recommended for adoption until the defect is fixed and independently retested.

Decision gates:

1. **Gate 0 — Owner authorization:** approve building an isolated POC harness and specify an allowed test budget. No provider connection before this gate.
2. **Gate 1 — Architecture review:** approve the session/BFF design and canonical membership model before integrating application code.
3. **Gate 2 — Technical evaluation:** complete the same test matrix for all candidates; hard-fail security cases must pass.
4. **Gate 3 — Commercial review:** recheck current vendor pricing, terms, data processing, region, support and exit/export provisions.
5. **Gate 4 — Owner selection:** owner explicitly selects provider and plan. Comparison scores alone do not authorize selection.
6. **Gate 5 — Implementation authorization:** separately approve SDK installation, schema/migration changes, login/session implementation, protected API enablement, and any deployment.

## 10. Current non-goals

This POC does not authorize or include:

- Production authentication or customer login.
- Internal ATSH staff SSO or staff identity migration.
- Provider purchase, paid-plan upgrade, or production tenant creation.
- Prisma schema changes or migrations.
- Real customer invitations or emails.
- Payment, contract, quote, or deployment workflow integration.
- Enabling protected customer APIs.
- Production or public staging deployment.
- Storing secrets or customer data in this public repository.

## 11. Current status

- [x] Customer account model Option A recorded as owner-approved.
- [x] Provider comparison completed for WorkOS, Clerk, Cognito, Supabase Auth and Auth0.
- [x] POC shortlist identified: WorkOS, Clerk and Cognito.
- [x] Controlled test plan and hard-fail security criteria documented.
- [ ] Owner authorization to build isolated POC harness.
- [ ] Session/BFF design approved.
- [ ] Canonical User–Customer membership model approved.
- [ ] Provider test environments authorized and configured.
- [ ] Test matrix executed for all three providers.
- [ ] Commercial terms and costs revalidated.
- [ ] Owner selects provider and plan.
- [ ] Separate implementation authorization granted.

**Current conclusion:** Continue with a documentation-first, isolated evaluation. No provider is selected. WorkOS, Clerk and Cognito remain candidates only.


## 12. Additional architecture test cases

The companion ADR, `docs/security/ADR_CUSTOMER_MEMBERSHIP_AND_BFF_SESSION.md`, proposes a canonical CustomerMembership relation and a Next.js BFF session boundary. If the owner approves that design, add these cases to the same provider evaluation. They are architecture requirements, not provider-only features.

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

The combined evaluation therefore contains 36 scenarios: 24 provider/application cases plus 12 architecture-boundary cases. ARCH cases must be included if the proposed ADR is approved; otherwise record them as unresolved architecture blockers rather than silently treating them as passed.

