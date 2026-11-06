# Persistent agent orchestrator — implementation boundary

## Decision alignment
The repository architecture already calls for a dedicated worker process, independent PostgreSQL system of record, TypeScript monorepo, and n8n as workflow orchestrator rather than system of record. Redis/BullMQ is deferred until workload evidence justifies it. This implementation starts with PostgreSQL row-lock queueing and does not introduce Redis.

## MVP delivered in this branch
- Durable `agent_jobs` queue and append-only `agent_job_events` log.
- Atomic claim with `FOR UPDATE SKIP LOCKED`, owner lease, heartbeat, crash recovery, bounded attempts and exponential retry.
- Model calls through OpenAI Responses API; `store:false`; explicit model configuration.
- Checkpoint persistence after each progress tool call, allowing a later worker process to resume from the latest checkpoint.
- Explicit `succeeded`, `waiting_approval`, `queued`, and `failed` outcomes.
- Per-claim turn cap and output-token cap to avoid an unbounded API-spend loop.
- No automatic migration execution; migration is reviewed and applied separately.

## Important limitation
This is the durable job-control foundation, not yet the complete autonomous software-development team. The current tool surface can checkpoint, request approval, or report completion; it cannot yet read/write GitHub, execute shell commands/tests, open PRs, call n8n, or deploy. Those tools must be implemented behind narrow allowlists with audit events, isolated workspaces, per-job budgets, and CI-derived evidence before the agent can autonomously deliver software.

## Safety invariants
1. Never commit credentials or customer data to Git.
2. No direct writes to protected branches; future repository changes must use isolated branches and pull requests.
3. No production deployment, destructive database operation, external spending, or undocumented business decision without human approval.
4. A model-generated completion claim is not proof. The eventual completion gate must verify acceptance criteria against repository diff, test output, CI status, and deployment evidence.
5. A bounded worker can keep resuming queued work, but no finite process can promise zero interruptions or unlimited execution. Recovery and retry are explicit.

## Deployment prerequisites (not yet available/configured)
- Independent ATSH AI PostgreSQL database.
- `DATABASE_URL`, `OPENAI_API_KEY`, and an API-supported `OPENAI_MODEL` in a secret manager.
- Worker process manager/container and monitoring.
- Human approval/requeue API and authenticated operator controls.
- GitHub App/token with minimum repository permissions for future coding tools.
- n8n credentials and workflow contracts where required.

## Apply and run
Review `apps/worker/apps/api/prisma/migrations/20261106000000_agent_jobs/migration.sql`, apply it manually to the new database, configure secrets, install workspace dependencies, build `@atsh/worker`, and run it under a process supervisor. Do not point it at a legacy database.
