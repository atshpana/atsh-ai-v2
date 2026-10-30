# Open Decisions

Only decisions not explicitly made by the owner remain open. A technical recommendation is not an approval unless the owner accepts it.

## Decisions already made
| Decision | Approved scope | Date |
|---|---|---|
| Implementation approach | Fully greenfield; rebuild the entire system independently | 30 October 2026 |
| Legacy application | Excluded as code/design foundation and runtime dependency | 30 October 2026 |
| Application database | New independent database; no legacy DB connection, schema reuse or data import | 30 October 2026 |
| Repository visibility | Public | 30 October 2026 |
| Public website languages | Arabic and English; visitor language switcher; RTL Arabic and LTR English | 30 October 2026 |
| Internal administration dashboard language | Arabic only in the current scope | 30 October 2026 |
| Frontend framework | Next.js App Router | 30 October 2026 |
| Backend framework | NestJS | 30 October 2026 |
| Application language | TypeScript | 30 October 2026 |
| Monorepo approach | TypeScript monorepo | 30 October 2026 |
| Backend topology | Modular monolith first; no premature microservices | 30 October 2026 |
| New database engine | PostgreSQL, independently provisioned | 30 October 2026 |
| ORM/data access | Prisma with reviewed SQL when needed | 30 October 2026 |
| Background work | Dedicated worker process; Redis/BullMQ only when justified | 30 October 2026 |
| Test approach | Unit, API integration and Playwright E2E | 30 October 2026 |
| CI/CD | GitHub Actions | 30 October 2026 |
| Domain package policy | `both`: some eligible packages may include a domain entitlement; other domains are separately priced add-ons | 30 October 2026 |
| Domain ownership and management | `client`: customer is the registrant/legal owner; ATSH manages registration, DNS and renewals only under recorded customer authorization | 30 October 2026 |

## Still open
| Decision | Current status | Required evidence or approval |
|---|---|---|
| PostgreSQL hosting provider/region | Open | Availability, backup, security, latency and cost assessment |
| Application hosting and runtime topology | Open | Capacity, isolation, deployment and operating-cost assessment |
| Authentication/session implementation | Open | Threat model, provider/session design and server-populated principal |
| Quote customer decision persistence | Design proposed; implementation blocked | Review decision/change-request schema, generate a complete initial migration, implement idempotency, immutable sent-version enforcement and transactional audit path |
| File/object storage provider | Open | Privacy, durability, access controls and cost |
| Email/notification provider | Open | Deliverability, regional support and owner approval |
| AI providers/models and budgets | Open | Workload tests, data policy, limits and cost controls |
| n8n deployment/license boundary | Open | Internal orchestration versus customer-facing workflow service |
| Redis/BullMQ activation | Conditional / not yet required | Demonstrated queue, retry or scheduling workload |
| Customer portal language | Open | Explicit owner decision |
| Payment provider, tax, prices and contract rules | Open | Commercial/legal approval |
| Exact production rollout timing | Open | Explicit owner approval after staging acceptance |
| Monorepo package manager/build orchestration | Implementation detail to settle during bootstrap | CI compatibility and maintainability review |
| Registrar/reseller provider and supported API | Open | Provider capability, ownership model, security, registry coverage and cost review |
| Registrar account/delegation model | Open | Must preserve customer registrant ownership, customer access and transfer-out rights |
| Package-included domain renewal treatment | Open | Explicitly define whether the package covers first registration term only or renewals too |
| Domain reminder schedule and renewal authorization/payment gates | Open | Commercial policy and customer-consent approval |
| Supported TLD catalogue and registry eligibility | Open | Selected provider and registry rules |
| DNS provider and permitted automation level | Open | Provider capability, security and owner approval |
| Domain-specific registrant data retention/redaction | Open | Applicable registry/legal review |

## Approval rule
Record every newly approved decision with date, scope, impact and affected requirements. Do not infer an open decision from a technical recommendation.

## Quote decision implementation boundary

The proposed customer decision API, security invariants, transaction behavior and current schema gaps are documented in `docs/quotes/QUOTE_CUSTOMER_DECISION_CONTRACT.md`. This is a design artifact, not approval to enable acceptance or decline. The existing schema persists acceptance only; decline/change-request persistence, quote immutability enforcement, authentication and idempotency remain unresolved.

## Domain module implementation boundary

The approved domain decisions and complete functional/technical specification are documented in `docs/domains/DOMAIN_MANAGEMENT_SPEC.md`. This document is a design baseline only: no domain Prisma models, migrations, UI routes, business APIs, registrar integration, DNS mutation or n8n workflows are implemented or verified by this decision. Provider, renewal-commercial policy, TLD coverage, DNS provider and customer registrant-data retention remain open as listed above.
