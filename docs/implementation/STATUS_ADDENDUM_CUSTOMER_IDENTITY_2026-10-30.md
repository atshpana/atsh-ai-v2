# Implementation Status Addendum — Customer Account and Authentication Decision

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Decision document: `docs/security/CUSTOMER_ACCOUNT_AND_AUTH_OPTIONS.md`
- Related design: `docs/security/IDENTITY_OWNERSHIP_AUTHORIZATION_DESIGN.md`

## Owner decisions recorded

- **Approved:** Customer account model Option A. Customer is the single commercial ownership root. A business Customer may have one Organization profile and multiple authorized User members. Individual Customer accounts may exist without an Organization.
- **Selected for analysis, not implementation:** Authentication strategy = Compare. No identity provider, session ownership strategy, or authentication implementation has been selected.
- **Architecture recommendation only:** Hybrid/provider-backed authentication with ATSH-owned application identity and authorization is recommended for further evaluation. This is not a vendor approval.

## Design completed

- Defined Customer/Organization/OrganizationMember responsibilities and the requirement for one canonical effective User–Customer membership path.
- Separated customer-side roles/memberships from internal ATSH staff RBAC.
- Compared managed identity provider, first-party ATSH authentication, and hybrid provider-backed authentication.
- Defined provider-neutral identity mapping, authentication/authorization boundaries, security requirements, implementation sequence and acceptance tests.
- Recorded remaining account-membership, provider, session, MFA, invitation and legal/data-retention decisions.

## Not implemented / not authorized

- No Prisma schema or logical data model change.
- No migration SQL committed or applied.
- No database provisioned or connected.
- No authentication provider selected or connected.
- No login, session, password, MFA, invitation or recovery runtime implemented.
- No protected customer API enabled and no production/staging deployment.

## Next step

Conduct a separate evidence-based vendor shortlist and current cost/security comparison, then request explicit owner approval for provider and session ownership. Only after that, finalize the canonical membership schema and implement it in a dedicated reviewed change.