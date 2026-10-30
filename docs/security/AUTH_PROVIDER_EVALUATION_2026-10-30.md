# Authentication Provider Evaluation — ATSH AI — Draft v1.0

- Evaluation date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Related decision: `docs/security/CUSTOMER_ACCOUNT_AND_AUTH_OPTIONS.md`
- Status: **Research comparison only. No provider or session architecture has been selected. Prices are public list prices observed on the evaluation date and must be rechecked before purchase.**

## 1. Evaluation context

ATSH AI is a TypeScript monorepo using Next.js App Router for the web surfaces and NestJS as the API Modular Monolith. PostgreSQL and Prisma are intended to remain the application data layer. Customer Option A is approved: each commercial customer has one Customer account as the ownership root; a business Customer may have one Organization profile and multiple customer-side members. Internal ATSH staff identities and permissions remain separate from customer identities and permissions.

The identity provider must authenticate a human and provide verifiable identity/session evidence. It must not become the source of truth for ATSH customer ownership, project access, financial permissions, staff roles, or workflow approvals.

## 2. Evaluation criteria

1. Next.js App Router compatibility and practical integration with a separate NestJS API.
2. Stable OIDC/OAuth identity, server-side token/session verification, key rotation and revocation.
3. Customer organization/member support without confusing provider organizations with ATSH's commercial Customer record.
4. MFA/passkeys, account recovery, email verification, abuse protection and session controls.
5. Provider-neutral identity mapping and migration path.
6. Transparent cost at launch and at growth.
7. Operational maturity, support, audit capability and relevant security/compliance evidence.
8. Avoidance of unnecessary dependency on a specific database or cloud.

## 3. Shortlisted providers

### 3.1 WorkOS AuthKit

**What it offers:** User management/authentication with email/password, social login, magic auth, MFA, passkeys, organizations, RBAC and enterprise features including SAML/OIDC SSO and SCIM/Directory Sync.

**Published pricing observed:**
- AuthKit user management: free up to 1 million monthly active users; $2,500/month per additional 1 million MAU.
- Enterprise SSO: $125 per connection for the first 1–15 connections; volume discounts apply.
- Directory Sync: $125 per connection for the first 1–15 connections; volume discounts apply.
- Custom domain: $99/month.
- Audit log streaming and event retention may add charges.

**Strengths for ATSH:**
- Strong B2B orientation: organizations, per-organization authentication policy, SSO and directory provisioning.
- Attractive published user-management price at scale.
- Supports hosted pages, drop-in UI and headless API, which leaves room for ATSH-branded Arabic/English experiences.
- Could support a future enterprise customer who requires corporate SSO.

**Risks / trade-offs:**
- WorkOS organization IDs and memberships must still map to ATSH Customer/Organization records; never use WorkOS organization membership as the sole commercial ownership proof.
- SSO and Directory Sync are separately charged per enterprise connection.
- Need a technical proof of concept for NestJS token verification, session handling and the exact Arabic/RTL UI needs.
- Its value proposition is strongest when B2B organization management and enterprise SSO matter; ATSH must confirm which features are actually needed at launch.

**Assessment:** Strong candidate for ATSH's B2B direction and cost profile. Requires integration proof before selection.

Official sources:
- https://workos.com/pricing
- https://workos.com/authkit
- https://workos.com/user-management

### 3.2 Clerk

**What it offers:** Hosted and prebuilt sign-up/sign-in/profile UI, Next.js SDK, user management, organizations and enterprise-oriented features.

**Published pricing observed:**
- Hobby: $0, up to 50,000 monthly retained users (MRU) per app; 7-day fixed session lifetime; limited dashboard seats and log retention.
- Pro: $20/month when billed annually (the pricing page also offers monthly billing); includes 50,000 MRU, MFA, custom session lifetime, no Clerk branding and one SSO connection. Additional retained users are metered at $0.02 per month each on the displayed tier.
- Business: $250/month billed annually.
- Additional SSO connections: $75/month each.
- Additional satellite domains: $10/month each.
- Directory Sync pricing is subject to the published plan terms and scheduled pricing changes.

**Strengths for ATSH:**
- Very direct Next.js App Router integration and mature ready-made React components.
- Fastest route to a polished authentication experience.
- Organization features are relevant to company accounts with multiple members.
- Clear early-stage pricing and easy developer onboarding.

**Risks / trade-offs:**
- Pricing uses MRU (monthly retained users), not MAU; these are different billing metrics and must not be compared as if identical.
- Some B2B organization capabilities and limits may require an add-on/plan; verify member limits, custom roles, invitations and organization features against the current contract before selection.
- Provider-specific components can create UI and migration coupling if domain logic is placed inside Clerk metadata or organization claims.
- Need to prove clean NestJS API verification and secure server-side session/BFF design rather than trusting browser UI state.

**Assessment:** Best developer experience and fastest Next.js implementation candidate. Strong contender if the cost and B2B organization feature matrix remains suitable.

Official sources:
- https://clerk.com/pricing
- https://clerk.com/docs/nextjs/getting-started/quickstart
- https://clerk.com/docs

### 3.3 Amazon Cognito

**What it offers:** AWS-managed user pools, password and social login, SAML/OIDC federation, MFA, managed login, passkeys/passwordless options depending on tier, Lambda triggers and AWS ecosystem integration.

**Published pricing observed:**
- Lite and Essentials: first 10,000 direct/social MAU per month free (published ongoing free tier).
- Essentials direct/social MAU above the free tier: $0.015 per MAU in the published example.
- Lite pricing is tiered; the published large-scale example shows $0.0055 for the first 90,000 billed MAUs and $0.0046 for the next 850,000 in that example.
- Plus: no free tier; published example rate $0.020 per MAU.
- SAML/OIDC-federated MAU: first 50 free, then $0.015 per MAU.
- SMS for MFA, registration and recovery is billed separately through SNS; email verification/recovery is billed separately through SES.
- M2M token requests and optional security/availability add-ons can create additional charges.

**Strengths for ATSH:**
- Low-cost path at modest usage, particularly if ATSH already chooses AWS for its infrastructure.
- Standard identity protocols and broad scale.
- Less dependence on a small specialist authentication vendor.
- Supports a provider-neutral OIDC integration approach.

**Risks / trade-offs:**
- More AWS configuration and integration work than Clerk.
- Hosted login customization and organization/member management are less turnkey for ATSH's product experience; ATSH must own the business account/member model and likely build more UI and lifecycle workflows.
- Costs are split across Cognito, SMS/SNS, email/SES and optional features.
- AWS is not currently the approved hosting/database platform for ATSH; selecting Cognito alone should not force the entire infrastructure onto AWS.

**Assessment:** Strong cost-oriented and infrastructure-oriented candidate, but not the simplest path for a polished B2B customer portal.

Official sources:
- https://aws.amazon.com/cognito/pricing/
- https://docs.aws.amazon.com/cognito/

### 3.4 Supabase Auth

**What it offers:** Password, magic link/OTP, social login, SSO, MFA, JWT-based authentication and integration with Supabase Postgres and Row Level Security.

**Published pricing observed:**
- Supabase Free quota: 50,000 MAU.
- Supabase Pro/Team quota: 100,000 MAU included, then $0.00325 per additional MAU.
- SSO MAU is separately metered; Pro/Team includes 50 SSO MAU and then $0.015 per MAU.
- The platform subscription itself is separate from the authentication usage quota; Pro billing and any database/compute/storage usage must be considered separately.

**Strengths for ATSH:**
- Standard OIDC/JWT model and useful authentication methods.
- Attractive MAU allowance.
- Can be used as a standalone Auth product, although it is designed to integrate with the Supabase ecosystem.
- Next.js SSR guidance and established SDKs.

**Risks / trade-offs:**
- ATSH's target data layer is independently hosted PostgreSQL + Prisma, not yet an approved Supabase project. Supabase Auth stores its own records in a Supabase-managed Postgres project; this creates a second data platform unless ATSH deliberately adopts Supabase for more than authentication.
- Supabase Auth JWT integration does not automatically authorize access to NestJS/Prisma resources; NestJS must still verify tokens and enforce ATSH ownership and permissions.
- SSO and advanced MFA have separate usage/pricing considerations.
- Choosing Supabase Auth could create operational coupling to a second Postgres service while ATSH is already planning its own PostgreSQL data layer.

**Assessment:** Attractive price and developer experience, but less aligned with the current infrastructure decision unless ATSH intentionally adopts Supabase as a platform.

Official sources:
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/pricing

### 3.5 Auth0

**What it offers:** Mature CIAM platform, Universal Login, social/passwordless authentication, MFA, organization-aware B2B options, attack protection, audit log streaming and enterprise capabilities.

**Published pricing observed:**
- Free: up to 25,000 MAU, subject to plan limits.
- Essentials: $35/month for up to 500 MAU on the displayed price configuration.
- Professional: $240/month for up to 500 MAU on the displayed price configuration.
- Enterprise: custom quote.
- Feature availability differs between B2C and B2B plans; B2B organization, SSO and SCIM entitlements require careful plan selection.

**Strengths for ATSH:**
- Mature identity platform and extensive enterprise feature set.
- Strong documentation and broad integration ecosystem.
- Useful where enterprise identity requirements, risk controls and compliance needs justify the cost.

**Risks / trade-offs:**
- Production pricing and feature packaging can become materially more expensive than simpler alternatives.
- The pricing page presents distinct B2C/B2B and plan feature boundaries; do not assume the Free plan includes every B2B feature.
- Need a clear commercial quote at the expected MAU and B2B feature level before budgeting.

**Assessment:** Technically capable, but not the first cost-conscious choice for ATSH's initial launch unless enterprise requirements justify it.

Official sources:
- https://auth0.com/pricing
- https://auth0.com/docs

## 4. Comparison matrix

| Criterion | WorkOS AuthKit | Clerk | Cognito | Supabase Auth | Auth0 |
|---|---|---|---|---|---|
| Next.js developer experience | Good | Excellent | Moderate | Good | Good |
| B2B organizations | Strong | Strong; verify plan/add-ons | More custom work | More custom work | Strong; plan-dependent |
| Ready-made UI | Hosted, widgets, headless | Excellent prebuilt UI | Managed login; more customization work | SDK-based UI; build/customize | Universal Login / SDKs |
| NestJS API integration | OIDC/JWT proof needed | JWT/session proof needed | OIDC/JWT standard | JWT verification needed | JWT/OIDC standard |
| Provider-neutral internal identity | Yes, if adapter implemented | Yes, if adapter implemented | Yes | Yes | Yes |
| Published entry pricing | $0 to 1M MAU for AuthKit user management | $0 Hobby / Pro $20 annual-billed monthly price | 10K free for Lite/Essentials direct/social | 50K free quota; Pro includes 100K MAU | Free up to 25K MAU; paid features start at $35 |
| B2B SSO economics | $125 per connection | 1 included in Pro; extra $75/month | MAU-based federation pricing | SSO MAU-based pricing | Plan/connection-dependent |
| Operational complexity for ATSH | Medium | Low–medium | Medium–high | Medium | Medium |
| Current alignment with ATSH architecture | High | High | Medium–high | Medium | Medium |

**Pricing caution:** MAU and MRU are not equivalent. Pricing plans bundle different features, and vendor prices may vary by region, billing cycle, add-ons and contract. The table is not a direct apples-to-apples quote.

## 5. Cost illustrations

These examples are not a forecast of ATSH usage. They illustrate published pricing structures only.

- At early scale, Clerk Pro is $20/month when billed annually, before overages/add-ons; Supabase Pro has a platform subscription with 100,000 MAU included; Cognito Lite/Essentials has a 10,000 direct/social MAU free tier.
- WorkOS AuthKit user management is published as free up to 1 million MAU, but enterprise SSO and Directory Sync connections are charged separately.
- Auth0's published Essentials price is $35/month for the displayed 500 MAU tier, while its Free tier offers up to 25,000 MAU with a narrower feature set.
- At enterprise scale, compare full feature bundles and connection charges, not just the base authentication user count.

Before a purchase decision, ATSH must supply a working forecast for monthly active customer users, internal staff users, expected enterprise SSO customers, SMS usage, MFA policy and support requirements. Do not count registered accounts as MAU without applying each vendor's own definition.

## 6. Recommendation for ATSH

### Recommended shortlist for proof of concept

1. **WorkOS AuthKit** — first candidate to test for B2B organizations, multiple members, and future enterprise SSO, with attractive published user-management pricing.
2. **Clerk** — second candidate to test for the fastest polished Next.js experience and straightforward early implementation.
3. **Amazon Cognito** — cost/control alternative if ATSH chooses AWS infrastructure or accepts more integration and UI work.

Keep Supabase Auth as a conditional alternative only if the company deliberately adopts Supabase as part of its data platform. Keep Auth0 as an enterprise alternative if later requirements or a commercial quote justify its higher published entry price.

This is a shortlist, not a provider selection. No provider is authorized for implementation yet.

## 7. Mandatory proof-of-concept checks

Run the same test plan against WorkOS, Clerk and Cognito:

1. Register and sign in an individual customer without an Organization profile.
2. Create one ATSH Customer account with an Organization profile.
3. Invite two additional users to that company; pending invite must not grant access.
4. Accept invitation, remove a member and verify access revocation.
5. Confirm one user can belong to multiple ATSH Customer accounts only through explicit membership and switch account context safely.
6. Verify issuer, audience, signature, expiry and signing-key rotation in NestJS.
7. Ensure the browser never supplies a trusted Customer ID or role claim as proof of authorization.
8. Verify that Customer A cannot read or mutate Customer B requests, quotes, files, projects, domains or hosting resources by changing identifiers.
9. Verify staff and customer audiences are separated and customer roles cannot grant internal ATSH permissions.
10. Test password reset, email verification, MFA/passkeys, logout, global session revocation, throttling and suspicious-login behavior.
11. Verify Arabic/RTL and English/LTR login flows, emails, errors and hosted pages; confirm branding/custom domain support.
12. Simulate provider outage and key rotation; protected APIs must fail closed.
13. Verify export/deletion, support, region/data-processing terms, audit events and account migration options.
14. Integrate Next.js and NestJS without adding provider-specific business logic to domain modules.

## 8. Target integration boundary

Regardless of selected provider:

- Next.js handles the browser-facing login experience and secure server-side session/BFF boundary.
- NestJS validates provider-issued credentials or a trusted application session; it never trusts a user ID, email, Customer ID or role sent by the browser.
- A provider adapter maps `issuer + subject` to an internal ATSH User.
- ATSH PostgreSQL remains the source of truth for Customer, Organization, canonical membership, customer-side roles, internal staff roles, AccessGrant, ownership and AuditEvent.
- Provider organization IDs are external references only; ATSH Customer IDs remain authoritative for commercial ownership.
- Separate staff/customer principal classes and authorization policies remain mandatory.
- No raw access tokens, refresh tokens, passwords or MFA secrets are written to ordinary application logs or repository files.
- All provider secrets belong in deployment secret management, never in the public GitHub repository.

## 9. Open decisions before implementation

- Final provider and commercial plan.
- Browser session owner and exact BFF/cookie design.
- Customer and staff MFA/passkey requirements.
- Whether internal staff and customer users share a provider tenant or use separate applications/tenants.
- Projected MAU and enterprise SSO customer count.
- Email and SMS delivery provider/cost.
- Required data residency, DPA, retention, deletion and support commitments.
- Whether provider-managed organization features will be used only as convenience/UI or not used at all; they must not replace ATSH membership authorization.

## 10. Decision gate

No production identity provider, auth SDK, schema migration, login UI wiring, session runtime or protected customer API may be implemented until the owner approves:
1. The selected provider and plan.
2. The session ownership and BFF/cookie architecture.
3. The canonical membership schema.
4. The required security test results and migration boundary.

**Current result:** WorkOS, Clerk and Cognito should proceed to technical proof of concept. WorkOS is the leading B2B candidate; Clerk is the leading developer-experience candidate; Cognito is the leading AWS/cost-control candidate. This ranking is provisional and does not authorize a purchase or integration.

## 11. Public references checked on 30 October 2026

- Next.js authentication concepts and supported auth-library ecosystem: https://nextjs.org/docs/app/guides/authentication
- Clerk pricing: https://clerk.com/pricing
- Clerk Next.js App Router quickstart: https://clerk.com/docs/nextjs/getting-started/quickstart
- WorkOS pricing: https://workos.com/pricing
- WorkOS AuthKit capabilities: https://workos.com/authkit
- Amazon Cognito pricing: https://aws.amazon.com/cognito/pricing/
- Supabase Auth documentation: https://supabase.com/docs/guides/auth
- Supabase platform billing and MAU quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Auth0 pricing: https://auth0.com/pricing
