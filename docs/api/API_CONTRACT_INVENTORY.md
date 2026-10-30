# API Contract Inventory — Draft v0.1

- Status: logical route inventory only; request/response schemas are not finalized.
- Backend: NestJS modular monolith.
- Prefix: `/api`.
- All privileged operations require server-side authorization.
- This contract must be versioned and tested before external integrations rely on it.

## 1. Public read APIs

| Method | Route | Purpose | Security / behavior |
|---|---|---|---|
| GET | `/api/public/categories` | Published categories | Return published records only; locale-aware |
| GET | `/api/public/services` | Published service catalog | Search, category filters and pagination |
| GET | `/api/public/services/:slug` | Service detail | Localized content and currently available options only |
| GET | `/api/public/pages/:slug` | Published page content | Return published version only; locale-aware |
| GET | `/api/public/configurator/:serviceSlug` | Published configurator definition | Expose only public schema and valid options |

## 2. Pricing and cart APIs

| Method | Route | Purpose | Security / behavior |
|---|---|---|---|
| POST | `/api/pricing/quote` | Calculate indicative price | Validate options/quantities; return line breakdown and pricing version; does not create an order |
| POST | `/api/cart` | Create or initialize cart | Bind to authenticated user or secure anonymous session |
| GET | `/api/cart/:id` | Read cart | Verify ownership/session |
| PATCH | `/api/cart/:id/items/:itemId` | Update line | Revalidate selected options and quantity |
| DELETE | `/api/cart/:id/items/:itemId` | Remove line | Verify cart ownership |
| DELETE | `/api/cart/:id` | Clear cart | Confirm destructive UI action; verify ownership |

The browser never supplies a trusted total. Every cart update and final submission recalculates on the server.

## 3. Request and quote APIs

| Method | Route | Purpose | Security / behavior |
|---|---|---|---|
| POST | `/api/orders` | Submit service request | Revalidate service/options/price; idempotency; atomic request + snapshot creation |
| POST | `/api/public/order-tracking` | Track by reference | Additional access token/proof; do not expose private customer data |
| GET | `/api/customer/requests` | Customer's requests | Authenticated ownership scope |
| GET | `/api/customer/requests/:id` | Request detail | Ownership and contract scope |
| GET | `/api/customer/quotes/:id` | Quote detail | Customer ownership; immutable quote version |
| POST | `/api/customer/quotes/:id/accept` | Accept exact quote version | Explicit authenticated acceptance and audit evidence |

## 4. Administration APIs

| Method | Route | Purpose | Security / behavior |
|---|---|---|---|
| CRUD | `/api/admin/categories` | Category management | Permission per action; audit changes |
| CRUD | `/api/admin/services` | Service management | Archive rather than destructive deletion of referenced items |
| CRUD | `/api/admin/options` | Option management | Validate rules and dependencies |
| CRUD | `/api/admin/pricing-rules` | Pricing version/rule management | Test, approve, version and activate |
| GET | `/api/admin/orders` | Request search/list | Filter, pagination and permission scope |
| GET | `/api/admin/orders/:id` | Request detail | Original snapshot and event history |
| POST | `/api/admin/orders/:id/information-request` | Request more information | Audited; customer communication policy |
| POST | `/api/admin/orders/:id/quotes` | Create revised quote | New immutable quote version |
| POST | `/api/admin/orders/:id/transitions` | Change request state | State-machine and permission validation |
| CRUD | `/api/admin/pages` | Content page management | Draft/publish workflow |
| CRUD | `/api/admin/pages/:id/versions` | Page version operations | Immutable published versions; approval and rollback |
| CRUD | `/api/admin/users` | User administration | High-privilege access; protect last owner |
| CRUD | `/api/admin/roles` | Role/permission management | Prevent privilege escalation |
| GET | `/api/admin/audit-logs` | Audit search | Restricted read-only access |

## 5. Project and delivery APIs (to be decomposed)

- `/api/admin/projects` — project creation and administration.
- `/api/admin/projects/:id/plans` — versioned project plans.
- `/api/admin/projects/:id/stages` — protected lifecycle and configurable execution stages.
- `/api/admin/tasks` — task assignment, status and evidence.
- `/api/admin/change-requests` — scope changes and impact assessment.
- `/api/customer/projects` — customer's own project views.
- `/api/customer/approvals` — customer review and version-bound approvals.
- `/api/admin/releases` — controlled preview/production release records.

## 6. AI and workflow integration APIs (to be decomposed)

- Agent registry and tool grants.
- Agent task creation, assignment, run status and result submission.
- Independent review and escalation.
- Human approval requests for sensitive actions.
- Signed n8n event/webhook ingress with replay protection and idempotency.
- Workflow execution status callbacks and retry metadata.

Agents and n8n may not bypass the same domain services and authorization gates used by human users.

## 7. API-wide requirements

- Validate all input with explicit DTO/schema contracts.
- Use consistent error envelopes and safe error messages.
- Use pagination and bounded filters for list APIs.
- Enforce authentication, authorization, ownership and tenant isolation on the server.
- Apply rate limits to public forms, tracking and authentication.
- Use idempotency keys for order submission, payment callbacks and retried side effects.
- Use signed webhooks, timestamp/replay checks and secret rotation.
- Never expose internal storage keys, credentials, stack traces or secret values.
- Audit privileged changes and sensitive state transitions.
- Document request/response examples and error codes before marking routes stable.
