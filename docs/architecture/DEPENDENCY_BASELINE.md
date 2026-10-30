# Dependency Baseline — 30 October 2026

This document records the versions selected for the first implementation bootstrap. Recheck official release/security notes before each dependency update and commit a lockfile after a clean install.

| Package | Selected baseline | Reason |
|---|---|---|
| Node.js | 22.22.3 | Meets Nest 12 application and CLI/schematics requirements |
| Next.js | 16.4.3 | Stable release; includes security fixes published in October 2026 |
| React / React DOM | 19.3.1 | Current stable React line |
| NestJS core packages | 12.3.0 | Current stable NestJS 12 release |
| Nest CLI / schematics | 12.0.11 | Nest 12-compatible tooling |
| TypeScript | 6.0.3 | Nest 12 schematics require TypeScript 6 |
| Prisma ORM | 7.10.1 planned | Stable Prisma 7 line; Prisma 8 is still release-candidate status on this date |

## Compatibility notes
- NestJS 12 core packages are ESM-only. CommonJS applications can still consume them through Node's `require(esm)` support, provided the supported Node version is used. The current API bootstrap remains CommonJS for now; switching to ESM is optional and can be done deliberately.
- NestJS 12's CLI/schematics require a newer Node 22 patch line than the framework runtime alone. CI therefore pins Node 22.22.3.
- Prisma 8 is not selected while it remains a release candidate. The planned Prisma integration will use the stable Prisma 7 client/CLI pair and follow the Prisma 7 setup model.
- Exact dependency resolution must be frozen in `package-lock.json` after a successful clean install. No lockfile has been committed yet.

## Official sources checked
- Next.js release history: https://nextjs-changelog.vercel.app/
- Next.js GitHub releases: https://github.com/vercel/next.js/releases/
- NestJS releases: https://github.com/nestjs/nest/releases
- NestJS migration guide: https://docs.nestjs.com/migration-guide
- React version/release information: https://react.dev/versions
- Prisma ORM release status: https://www.prisma.io/docs/orm/release-status
- Prisma ORM changelog: https://www.prisma.io/changelog

## Verification status
These versions were selected from published release information, but package installation, dependency resolution, compilation and runtime tests have not yet been executed in a clean environment. Do not label them verified until CI passes.
