# Phase 0 — Read-only Current-State Audit

## Purpose
Identify the real legacy code, deployed application, database and release process before choosing the new stack or making changes.

## Known GitHub observations (30 October 2026)
- Legacy repository identified: `BOB-Security/atsh-ai-website`.
- Default branch observed: `main`.
- The repository contains a root-level legacy application and separate `greenfield/` and `platform/` application trees.
- The repository has multiple rebuild/feature branches, including `rebuild/atsh-ai-from-scratch`, `rebuild/atsh-ai-clean-v2` and `rebuild/atsh-ai-greenfield`.
- The `platform/` tree is a Node.js/Express application using PostgreSQL (`pg`), with routes for public intake, administration, team, operations, assistant and customer portal.
- The `greenfield/` tree is another Express-based implementation with its own server and database compatibility notes.
- The current repository documentation describes Azure App Service deployment workflows and PostgreSQL connection settings.
- The repository also contains SQL migrations/schema files. Their presence is not proof that they match the live database or have been applied.

## Critical interpretation
There are multiple competing implementation tracks in the legacy repository. None is automatically selected as the new design foundation. The new build is to be developed independently in this repository, as required by Executive Reference v2.0.

## Audit checklist — no writes
### Repository and deployment
- [ ] Record exact legacy commit SHA and branch intended for production.
- [ ] Identify the actual production deployment workflow and its trigger conditions.
- [ ] Identify the deployed application root, runtime version, build command and startup command.
- [ ] Identify Azure App Service/resource group and deployment target without changing settings.
- [ ] Inventory environment variable names only; never retrieve or expose secret values.
- [ ] Identify DNS/traffic routing and the currently deployed commit.

### Database
- [ ] Confirm actual provider, engine and version from the deployment configuration.
- [ ] Confirm the live database identity without exposing credentials.
- [ ] Obtain a read-only schema inventory: tables, columns, types, indexes, constraints, foreign keys, triggers, views, extensions and row counts where permitted.
- [ ] Compare live schema with every relevant migration history and the code paths that use it.
- [ ] Determine backup mechanism, retention and last successful restore rehearsal.
- [ ] Do not run migrations, bootstrap scripts, seed scripts or data-changing queries.

### Product and behavior
- [ ] Map existing public pages and customer-facing routes.
- [ ] Map admin and customer portal routes and server-side permission enforcement.
- [ ] Inventory existing APIs, integrations, AI providers and workflow automations.
- [ ] Record known production defects and incomplete modules.
- [ ] Separate verified behavior from code-only or documentation-only claims.

## Exit criteria
Phase 0 is complete only when the production branch/runtime and live database have been identified, the schema has been inspected read-only, and a compatibility/risk report exists. Stack selection and implementation decisions that depend on this evidence remain open until then.
