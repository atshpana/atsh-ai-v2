# Open Decisions — Must Not Be Guessed

These items remain open until evidence is collected and/or the owner approves them.

| Decision | Current status | Required evidence or approval |
|---|---|---|
| Application stack for the isolated rebuild | Not approved | Phase 0 inventory, maintainability, security, deployment and database compatibility review |
| Frontend/backend framework | Not approved | Same as above; do not assume Next.js/NestJS or copy the legacy stack by default |
| Database provider/engine/version | Not verified against live production | Read-only deployment and database inventory |
| Database schema mapping | Not approved | Live schema, constraints, triggers, views, data and code-use analysis |
| Authentication/session strategy | Not approved for the new build | Security design and current account/data compatibility |
| File/object storage | Open | Existing provider, data ownership, privacy and cost review |
| Email/notification provider | Open | Existing configuration and owner approval |
| AI provider/model and cost limits | Open | Workload tests, data policy, provider capabilities and budget |
| n8n deployment and license boundary | Open | Internal-only use versus customer-facing workflow service |
| Staging environment | Not verified | Existing resources and sanitized database restore |
| Repository visibility | Current isolated repository is public | Owner decision before placing proprietary implementation details or code here |
| Commercial prices, tax, payments and contract rules | Not approved unless separately recorded | Owner/commercial/legal approval |

## Approval rule
A technical recommendation is not an approved decision. Record each approval with date, scope, impact and affected requirements before implementation depends on it.
