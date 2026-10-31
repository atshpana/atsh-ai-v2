# ATSH AI Authentication POC Harness

Status: isolated provider-neutral test harness; synthetic fixtures only.

## Run
From this directory: `npm test`. Requires Node.js 22 or later. Uses Node's built-in test runner and crypto module; no external packages or provider SDKs are required.

## Included
- ARCH-01–ARCH-12: architecture boundary model tests.
- Provider adapter contract: callback validation, profile normalization, stable issuer + subject identity mapping.
- Three **synthetic contract fixtures** named WorkOS, Clerk and Cognito. These are not vendor SDKs, provider tenants, live integrations, or proof of vendor capabilities.
- A single contract test suite is run against each fixture to ensure all candidates face the same interface and security expectations.

## Critical distinction
Passing the synthetic fixtures proves only that the common adapter contract and local test doubles behave as expected. It does **not** count any of the 24 provider/application scenarios as passed for WorkOS, Clerk, or Cognito. Those remain BLOCKED until separate owner approval for disposable provider test tenants/connections and any external or paid activity, followed by real provider-specific execution.

## Security and scope
All identities are synthetic. No provider SDK, external network flow, email/SMS, secret, paid service, production application import, Prisma change, database migration, production login, or deployment is used. This is not production-ready Next.js/NestJS authentication.

Provider credentials must never be committed. Keep any later authorized credentials in an approved secret manager or local untracked environment files, and publish only redacted evidence.
