# Prisma Schema Status

- Database engine: PostgreSQL (approved).
- ORM: Prisma 7.10.x (stable line selected).
- Schema path: `apps/api/prisma/schema.prisma`.
- Prisma config: `apps/api/prisma.config.ts`.
- Current scope: identity/RBAC foundation, customer profile, bilingual service catalog/options, pricing versions/rules, service request snapshots/events, quotes/acceptance and audit events.

## Important limits
- This is the initial schema baseline, not the complete domain model.
- Project execution, workflow templates, AI workforce, customer portal product modules, support, hosting, finance, content publishing, media and notification models remain to be designed and added.
- No database provider has been selected or provisioned.
- No database connection has been made.
- No migration has been generated or applied.
- Do not run `prisma migrate dev`, `migrate deploy`, `db push` or seed commands until the new database provider, environment isolation, schema review and backup plan are ready.

## Prisma 7 notes
- Uses the new `prisma-client` generator with an explicit generated-code output directory.
- Uses `prisma.config.ts` for the datasource URL.
- PostgreSQL driver adapter is `@prisma/adapter-pg`; it is installed but no live connection is configured.
- Generated client code is build output and should not be committed.
