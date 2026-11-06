# Deploying the ATSH AI worker on Coolify

This is a background process. It does not serve HTTP and must not be assigned a public domain.

## Coolify application settings

- Create a separate Application resource inside the existing ATSH AI Factory project/environment.
- Source repository: `atshpana/atsh-ai-v2`.
- Deployment branch: `feature/agent-worker-deployable` for review/testing only. Use the approved release branch after PR review and merge.
- Build pack: Dockerfile.
- Dockerfile location: `/Dockerfile.worker` (repository root).
- Base directory: repository root (`/`).
- No public domain and no exposed ports.
- Do not configure an HTTP health check; this worker is a queue consumer, not a web server.

## Required runtime environment variables

- `DATABASE_URL`: connection string for the dedicated ATSH agent PostgreSQL database.
- `OPENAI_API_KEY`: OpenAI API key, entered as a secret in Coolify.
- `OPENAI_MODEL`: an API model identifier enabled for the OpenAI project.

Optional:
- `AGENT_POLL_INTERVAL_MS=3000`
- `AGENT_LEASE_MS=120000`
- `AGENT_MAX_TURNS_PER_CLAIM=8`
- `AGENT_MAX_OUTPUT_TOKENS=1800`
- `AGENT_DB_POOL_SIZE=4`
- `AGENT_WORKER_ID`: omit to generate a unique worker identity.

GitHub inspection is optional and read-only in this version:
- `GITHUB_TOKEN`: fine-grained token with read-only Contents permission for the allowlisted repository.
- `ATSH_GITHUB_REPOSITORY=atshpana/atsh-ai-v2`.

Never put secrets in Git, Docker build arguments, image layers, or chat messages.

## Database safety

Do not point this worker at the public website's production database. Provision a dedicated PostgreSQL database for the agent runtime, then review and apply the migration at:

`apps/api/prisma/migrations/20261106000000_agent_jobs/migration.sql`

The worker does not run migrations automatically. Do not deploy until the dedicated database exists and the migration has been applied successfully.

## First-run verification

1. Deploy with the required environment variables.
2. Confirm the container logs show `ATSH AI agent worker started`.
3. Insert a controlled test row into `agent_jobs` with a narrow task and explicit acceptance criteria.
4. Verify the row transitions and corresponding `agent_job_events` are written.
5. Verify the worker can be stopped and restarted without losing queued work.

## Current capability boundary

This worker supports durable queue processing, OpenAI Responses API calls, progress checkpoints, retry/backoff, human-approval pauses, and read-only GitHub inspection. It does not yet create branches, edit code, run tests, call n8n, or deploy software. Production deployment and destructive operations remain outside its permissions.
