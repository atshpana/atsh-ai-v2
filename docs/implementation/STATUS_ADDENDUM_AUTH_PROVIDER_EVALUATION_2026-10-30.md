# Implementation Status Addendum — Authentication Provider Evaluation

- Date: 30 October 2026
- Repository: `atshpana/atsh-ai-v2`
- Branch: `implementation/bootstrap`
- Evaluation: `docs/security/AUTH_PROVIDER_EVALUATION_2026-10-30.md`

## Research completed

- Compared WorkOS AuthKit, Clerk, Amazon Cognito, Supabase Auth and Auth0 using public vendor pricing and documentation available on 30 October 2026.
- Evaluated Next.js fit, NestJS API integration boundary, B2B organization/member support, MFA/passkeys, pricing model, operational complexity and migration considerations.
- Recommended WorkOS, Clerk and Cognito for a consistent technical proof of concept.
- Recorded WorkOS as the provisional B2B candidate, Clerk as the developer-experience candidate, and Cognito as the AWS/cost-control candidate.
- Preserved the distinction between MAU and Clerk MRU pricing and documented important add-on costs.

## Current decision status

- Customer account model Option A remains approved.
- Authentication strategy remains Compare; no provider or plan has been selected.
- Hybrid/provider-backed authentication with ATSH-owned identity and authorization remains an architecture recommendation only.
- Provider comparison and shortlist do not authorize purchase, connection, SDK installation, schema changes, login implementation, session implementation or production rollout.

## Not implemented

- No Prisma schema or migration change.
- No database provisioned or migrated.
- No authentication provider account or connection created.
- No login/session/MFA/invitation/recovery runtime implemented.
- No protected customer API enabled.
- No production or staging deployment.

## Next step

Run the same controlled proof of concept against WorkOS AuthKit, Clerk and Amazon Cognito. Before implementation, the owner must approve the provider/plan, session and BFF/cookie design, canonical membership schema and security test results.