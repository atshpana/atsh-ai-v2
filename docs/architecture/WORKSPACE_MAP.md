# Workspace Map

| Workspace | Responsibility | Current maturity |
|---|---|---|
| `apps/public-web` | Public bilingual marketing and service-intake experience | Initial UI shell only |
| `apps/admin` | Internal Arabic administration workspace | Placeholder shell only |
| `apps/customer-portal` | Unified customer portal | Placeholder shell only; language open |
| `apps/api` | NestJS modular-monolith API | Bootstrap and health endpoint only |
| `apps/worker` | Background job process boundary | Placeholder; no queue transport |
| `packages/ui` | Shared design tokens and future accessible components | Initial token file |
| `packages/contracts` | Reserved for shared API/domain contracts | Not initialized |

## Boundary rules
- Web applications do not connect directly to PostgreSQL.
- All protected data access goes through the API and server-side authorization.
- The API owns domain rules and persistence.
- The worker consumes explicitly registered jobs and uses scoped service interfaces; it is not an unrestricted script runner.
- n8n integrates through authenticated, signed and idempotent endpoints.
- Shared packages must not import application-specific business logic.
- Do not add Redis/BullMQ until a documented workload requires durable queues, retries or scheduling.
