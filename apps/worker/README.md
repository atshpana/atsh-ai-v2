# ATSH AI persistent agent worker (MVP)

This worker is a durable execution foundation, not yet an autonomous coding/deployment agent.

## What it does
- Claims PostgreSQL jobs atomically using row locks and `SKIP LOCKED`.
- Maintains a lease and heartbeat so another worker can reclaim work after a crash.
- Calls the OpenAI Responses API using a configurable model.
- Saves checkpoints and response IDs after each progress step.
- Retries transient failures with exponential backoff and a bounded attempt count.
- Pauses jobs in `waiting_approval` when the model requests a human decision.
- Requires explicit completion tool call; a text-only model answer cannot complete a job.

## Current boundary
The only model tools are `record_progress`, `complete_job`, and `request_human_approval`. This MVP cannot edit GitHub repositories, run tests, invoke n8n, or deploy. Those capabilities must be added as narrowly-scoped, audited tools and verified against CI evidence. Production deployment, destructive operations, spending, and undocumented business decisions must remain approval-gated.

## Prerequisites
- Node.js version required by the repository.
- New independent PostgreSQL database and `DATABASE_URL`.
- OpenAI API key supplied through the runtime secret manager as `OPENAI_API_KEY`.
- A model identifier enabled for the OpenAI API account, configured explicitly with `OPENAI_MODEL`.

Never commit API keys or database credentials.

## Setup
1. Review `apps/api/prisma/migrations/20261106000000_agent_jobs/migration.sql` and apply it manually to the new ATSH AI PostgreSQL database.
2. Install workspace dependencies from the repository root.
3. Set `DATABASE_URL`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
4. Run `npm run build --workspace @atsh/worker` then `npm run start --workspace @atsh/worker`.

## Queue contract
Insert a row into `agent_jobs` with a JSON `input` containing a task description and explicit acceptance criteria. Jobs start as `queued`. The worker transitions them to `running`, then `succeeded`, `waiting_approval`, `queued` for retry/yield, or `failed`. A human approval workflow/API is not included yet; an authorized operator must review the event and explicitly requeue or cancel the job after recording the decision.

## Limits
- `AGENT_MAX_TURNS_PER_CLAIM` bounds each claim so a worker can yield and resume instead of monopolizing a process.
- `AGENT_MAX_OUTPUT_TOKENS` bounds each model response.
- `max_attempts` bounds retries per job.
- A bounded retry/turn policy prevents accidental infinite API spend. “Continue until completion” means durable resumability, not an unlimited or unmetered loop.
