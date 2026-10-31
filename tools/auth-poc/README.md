# ATSH AI Authentication POC Harness

Status: isolated provider-neutral test harness; synthetic fixtures only.

## Run

From this directory:

```bash
npm test
```

Requires Node.js 22 or later. Uses Node's built-in test runner and crypto module; no external packages or provider SDKs are required.

## Scope

This harness tests the approved architecture boundary in isolation:
- canonical User–Customer membership and account/resource authorization;
- optional Organization profile (not an authorization authority);
- opaque browser session cookie policy;
- CSRF origin enforcement;
- short-lived ATSH internal assertions, including issuer/audience/expiry/signature checks;
- session revocation and key rotation.

All identities and resources are synthetic. The implementation is a deterministic security model for architecture tests, not a production-ready Next.js BFF, NestJS guard, database adapter, or identity provider integration.

## Deliberate exclusions

- No WorkOS, Clerk, Cognito, or other provider tenant/account.
- No provider SDK, OAuth callback network flow, real email/SMS, secrets, or paid service.
- No production application imports, Prisma changes, database migration, production login, or deployment.
- No real customer data.

Provider-specific cases remain blocked until separate authorization for disposable provider test tenants/connections and any associated cost. Do not mark provider scenarios as passed based on this local harness.

## Test mapping

The architecture tests are named ARCH-01 through ARCH-12 and map to the approved test plan. A passing local model test is evidence only for this isolated model; it does not establish production integration correctness.
