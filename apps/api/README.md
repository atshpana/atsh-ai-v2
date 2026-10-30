# ATSH AI API

NestJS modular-monolith backend.

## Rules
- Every domain capability belongs to a bounded module with controller, application service, domain logic and persistence boundary.
- Controllers validate transport input and delegate; they must not contain business rules.
- Protected routes must use server-side authorization guards and deny by default.
- Customer/project ownership checks must be performed in the service/data-access boundary, not trusted from client-supplied identifiers.
- Sensitive operations emit audit events.
- Retried commands and incoming webhooks must be idempotent.
- Never return secrets or private storage keys in API responses.
- No database provider or credentials are configured yet; do not add a connection until the new database design and provider are approved.
