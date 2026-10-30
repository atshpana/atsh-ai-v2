# Dependency Baseline — 30 October 2026

This records the initial dependency baseline chosen from release information available on 30 October 2026. Recheck official release/security notes before updates and commit a lockfile after a clean install.

| Package | Selected baseline | Reason |
|---|---|---|
| Node.js | 22.22.3 | Meets Nest 12 CLI/schematics and runtime requirements |
| Next.js | 16.4.3 | Stable release; October 2026 security fixes included |
| React / React DOM | 19.3.1 | Current stable React release line |
| NestJS core packages | 12.3.0 | Current stable NestJS 12 release |
| Nest CLI / schematics | 12.0.11 | Nest 12-compatible tooling |
| TypeScript | 6.0.3 | Required by Nest 12 schematics |
| Prisma CLI / Client / PostgreSQL adapter | 7.10.1 | Stable Prisma 7 line; Prisma 8 remains release-candidate status |

## Compatibility notes
- NestJS 12 core packages are ESM-only. This new API workspace is configured as ESM using NodeNext module resolution and explicit .js relative imports.
- NestJS 12 CLI/schematics require Node 22.22.3 or later on the Node 22 line. CI pins 22.22.3.
- Prisma 7 uses the prisma-client generator with an explicit output path, prisma.config.ts for the datasource URL, and a PostgreSQL driver adapter. The API workspace is ESM-compatible.
- Prisma 8 is not selected while it remains a release candidate.
- The PostgreSQL provider/host remains open. The pg adapter is a driver choice, not a hosting-provider decision.
- Exact dependency resolution must be frozen in package-lock.json after a successful clean install. No lockfile has been committed yet.

## Official sources checked
- Next.js release history: https://nextjs-changelog.vercel.app/
- Next.js GitHub releases: https://github.com/vercel/next.js/releases/
- NestJS releases: https://github.com/nestjs/nest/releases
- NestJS v12 migration guide: https://docs.nestjs.com/migration-guide
- React versions: https://react.dev/versions
- Prisma ORM release status: https://www.prisma.io/docs/orm/release-status
- Prisma ORM v7 generators: https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators
- Prisma ORM v7 client setup: https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/introduction

## Verification status
Dependency ranges are recorded in the workspace manifests. Package installation, dependency resolution, Prisma schema validation, code generation, compilation and runtime/browser tests have not yet been executed in a clean environment. Do not label the stack verified until CI passes.
