# Quote Customer Decision Contract

Status: Designed — pending authentication and owner approval of the open implementation choices.
Authority: `docs/IMPLEMENTATION_BASELINE.md` and the approved Executive Reference v2.0. This document is an implementation contract proposal; it does not approve an authentication provider, signature method, payment/tax rule, or customer-portal language.

## Security invariants

1. A quote UUID or URL is an identifier, never an authorization credential.
2. A customer may read or decide only on a quote whose service request belongs to the authenticated customer account. Resolve ownership on the server from the authenticated principal; never accept a customer ID from the request body as proof.
3. Do not expose internal review notes, staff-only checklist items, audit internals, or other customers' records in customer DTOs.
4. The server is authoritative for quote status, version, expiry, totals, currency and item snapshots. The browser submits neither trusted totals nor a trusted customer identity.
5. A decision applies to one immutable quote version. Editing commercial terms creates a new version; it must not mutate the version already accepted.
6. Every successful decision is recorded with actor, quote ID, exact version, decision, timestamp and request/audit correlation. No self-approval by an AI agent.
7. Fail closed when identity, ownership, quote state, version or expiry cannot be verified.

## Proposed API surface

| Method and route | Purpose | Access |
|---|---|---|
| GET `/api/customer/quotes/:quoteId` | Return a customer-safe DTO for an authorized quote version | Authenticated customer; ownership check |
| POST `/api/customer/quotes/:quoteId/decision` | Record accept or decline against a specified version | Authenticated customer; ownership check; CSRF protection for cookie sessions |
| POST `/api/customer/quotes/:quoteId/change-requests` | Record a request for changes without silently accepting/declining | Authenticated customer; ownership check |

These routes are proposed, not implemented. Do not mark them public. All routes must require an authenticated principal and an explicit customer permission.

## Decision request

The decision command should contain only:
- `expectedVersion`: the version the customer reviewed.
- `decision`: `ACCEPT` or `DECLINE`.
- `idempotencyKey`: unique opaque key for retry safety.
- `comment`: optional bounded customer comment, subject to approved retention rules.

A change request is a separate command and must not be represented as acceptance. Its exact payload and lifecycle require product approval.

## Required transaction behavior

Within one database transaction, with concurrency protection:
1. Resolve the authenticated user to exactly one active customer profile.
2. Load the quote and request with customer ownership enforced in the query.
3. Verify the quote is still `SENT`, the expected version equals the stored version, the quote is not expired, and no conflicting terminal decision exists.
4. Verify that the quote version and its line items are immutable after sending. If the current schema cannot prove immutability, block the decision until version snapshot enforcement is implemented.
5. Persist the decision and audit event atomically. A repeated request with the same idempotency key returns the original outcome; a conflicting replay is rejected.
6. Update quote/request lifecycle state only according to the approved state machine. Do not send notifications or trigger delivery work until the committed result is known.

Use a conditional update or row lock to prevent two concurrent decisions from winning. A stale version must fail with a conflict response and must never be silently redirected to the latest version.

## Customer-safe response

Return only the authorized quote version's customer-facing description, line items, totals, currency, validity, terms and decision state. Exclude staff notes, internal approval checklist, private audit payloads and unrelated request/customer fields. Use explicit response DTOs; do not serialize Prisma models directly.

## Schema gaps identified

- The Prisma draft now models one terminal `QuoteDecision` per quote (`ACCEPT` or `DECLINE`) with a unique idempotency key, plus separately persisted `QuoteChangeRequest` records. These models are schema-only until a baseline migration and persistence services exist.
- `Quote` has a version number and unique request/version pair, but the schema alone does not enforce immutability of sent quote rows/items.
- The existing `AuditEvent` model can represent decision events, but append-only enforcement and a transactional write path are not implemented.
- `User.authSubject` exists, but authentication, session validation and population of `request.user` are not implemented. The global permissions guard currently denies protected routes without an injected principal.
- Customer-to-user linkage exists as an optional unique relation; account-linking and verification rules are not implemented.
- Idempotency keys are represented in the draft decision/change-request models; request fingerprinting, replay semantics and service enforcement are not implemented.

## Acceptance criteria before enabling customer decisions

- Authentication/session threat model and provider decision approved.
- Verified customer-account linking and server-populated principal.
- Customer ownership and permission integration tests, including cross-customer denial.
- Version immutability and concurrent-decision tests.
- Idempotent retry tests and atomic decision/audit persistence tests.
- Expiry, stale-version, duplicate-decision and already-terminal-state tests.
- Customer DTO tests proving internal fields are excluded.
- Reviewed migration applied to a new isolated test database and tested from empty state.
- Playwright coverage for review, accept, decline, change request, expired quote and unauthorized access.
- Explicit human acceptance before staging/production enablement.

Until these gates pass, customer decision controls remain disabled and no quote decision is accepted through the UI.


## Schema update (30 October 2026)

The Prisma schema now replaces the acceptance-only record with `QuoteDecision` and adds `QuoteChangeRequest`. Each terminal decision is unique per quote and each command key is unique. This does not implement API behavior or authentication. A migration was not generated because the repository has no initial Prisma migration yet; adding an incremental migration that assumes the core tables already exist would be unsafe. First generate and review a complete baseline migration from the full schema, then apply these structures in that baseline (or a correctly ordered follow-up migration).
