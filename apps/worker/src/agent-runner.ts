import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";

type Job = {
  id: string;
  input: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  last_response_id: string | null;
};

type Decision =
  | { kind: "continue"; note: string; responseId: string | null }
  | { kind: "complete"; result: unknown; responseId: string | null; callId: string }
  | { kind: "approval"; reason: string; responseId: string | null; callId: string };

const pollMs = Number(process.env.AGENT_POLL_INTERVAL_MS ?? 3000);
const leaseMs = Number(process.env.AGENT_LEASE_MS ?? 120000);
const maxTurns = Number(process.env.AGENT_MAX_TURNS_PER_CLAIM ?? 8);
const maxOutputTokens = Number(process.env.AGENT_MAX_OUTPUT_TOKENS ?? 1800);
const model = process.env.OPENAI_MODEL;
const workerId = process.env.AGENT_WORKER_ID ?? `worker-${randomUUID()}`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.AGENT_DB_POOL_SIZE ?? 4),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

const tools = [
  {
    type: "function",
    name: "record_progress",
    description: "Record a concise checkpoint and continue working. Do not claim completion.",
    strict: true,
    parameters: {
      type: "object",
      properties: { note: { type: "string" } },
      required: ["note"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "complete_job",
    description: "Mark the job complete only when every acceptance criterion in the input is satisfied and evidence is available.",
    strict: true,
    parameters: {
      type: "object",
      properties: { result: { type: "object", additionalProperties: true } },
      required: ["result"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "request_human_approval",
    description: "Pause for a human decision before production deployment, destructive changes, external spending, or an undocumented business decision.",
    strict: true,
    parameters: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
      additionalProperties: false,
    },
  },
] as const;

async function claimJob(): Promise<Job | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query<Job>(
      `SELECT id, input, attempts, max_attempts, last_response_id
         FROM agent_jobs
        WHERE (status = 'queued' AND available_at <= NOW())
           OR (status = 'running' AND lease_expires_at < NOW())
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1`,
    );
    const job = found.rows[0];
    if (!job) {
      await client.query("COMMIT");
      return null;
    }
    await client.query(
      `UPDATE agent_jobs
          SET status = 'running', lease_owner = $2,
              lease_expires_at = NOW() + ($3 * INTERVAL '1 millisecond'),
              heartbeat_at = NOW(), started_at = COALESCE(started_at, NOW()),
              attempts = attempts + 1, updated_at = NOW()
        WHERE id = $1`,
      [job.id, workerId, leaseMs],
    );
    await event(client, job.id, "job.claimed", { workerId, attempt: job.attempts + 1 });
    await client.query("COMMIT");
    return { ...job, attempts: job.attempts + 1 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function event(client: PoolClient, jobId: string, type: string, payload: unknown) {
  await client.query(
    "INSERT INTO agent_job_events (id, job_id, event_type, payload) VALUES ($1, $2, $3, $4::jsonb)",
    [randomUUID(), jobId, type, JSON.stringify(payload)],
  );
}

async function heartbeat(jobId: string) {
  const result = await pool.query(
    `UPDATE agent_jobs SET heartbeat_at = NOW(),
       lease_expires_at = NOW() + ($3 * INTERVAL '1 millisecond'), updated_at = NOW()
      WHERE id = $1 AND status = 'running' AND lease_owner = $2`,
    [jobId, workerId, leaseMs],
  );
  if (result.rowCount !== 1) throw new Error("Job lease was lost; refusing to continue.");
}

async function askModel(job: Job, checkpoint: string): Promise<Decision> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required; no model call was attempted.");
  if (!model) throw new Error("OPENAI_MODEL must be explicitly configured; no model call was attempted.");
  const body: Record<string, unknown> = {
    model,
    store: false,
    max_output_tokens: maxOutputTokens,
    instructions: [
      "You are the ATSH AI autonomous engineering task manager.",
      "Work only within the supplied task scope and acceptance criteria.",
      "Be truthful: do not claim code changes, tests, deployments, or external actions unless tools actually performed them.",
      "Use record_progress to checkpoint and continue. Use complete_job only when acceptance evidence is present.",
      "Request human approval before production deployment, destructive changes, spending, or undocumented decisions.",
      "This worker currently exposes progress, completion, and approval tools only; it cannot edit repositories or deploy.",
    ].join(" "),
    input: JSON.stringify({ task: job.input, previousCheckpoint: checkpoint }),
    tools,
    tool_choice: "required",
  };
  if (job.last_response_id) body.previous_response_id = job.last_response_id;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) {
    const safeBody = (await response.text()).slice(0, 1000);
    throw new Error(`OpenAI Responses API returned ${response.status}: ${safeBody}`);
  }
  const payload = await response.json() as {
    id?: string;
    output?: Array<{ type?: string; name?: string; arguments?: string; call_id?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const call = payload.output?.find((item) => item.type === "function_call");
  if (!call?.name || !call.arguments || !call.call_id) throw new Error("Model response did not contain a supported function call.");
  const args = JSON.parse(call.arguments) as Record<string, unknown>;
  const responseId = payload.id ?? null;
  if (call.name === "record_progress" && typeof args.note === "string") {
    return { kind: "continue", note: args.note, responseId };
  }
  if (call.name === "complete_job" && args.result && typeof args.result === "object") {
    return { kind: "complete", result: args.result, responseId };
  }
  if (call.name === "request_human_approval" && typeof args.reason === "string") {
    return { kind: "approval", reason: args.reason, responseId };
  }
  throw new Error(`Unsupported or invalid model tool call: ${call.name}`);
}

async function saveCheckpoint(jobId: string, responseId: string | null, note: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const update = await client.query(
      `UPDATE agent_jobs SET checkpoint = $3, last_response_id = COALESCE($4, last_response_id),
         updated_at = NOW()
       WHERE id = $1 AND status = 'running' AND lease_owner = $2`,
      [jobId, workerId, note, responseId],
    );
    if (update.rowCount !== 1) throw new Error("Job lease was lost while saving checkpoint.");
    await event(client, jobId, "job.checkpoint", { note, responseId });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function finish(jobId: string, status: "succeeded" | "waiting_approval", data: unknown, responseId: string | null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const update = await client.query(
      `UPDATE agent_jobs SET status = $3,
         result = CASE WHEN $3 = 'succeeded' THEN $4::jsonb ELSE result END,
         approval_reason = CASE WHEN $3 = 'waiting_approval' THEN $5 ELSE approval_reason END,
         last_response_id = COALESCE($6, last_response_id),
         completed_at = CASE WHEN $3 = 'succeeded' THEN NOW() ELSE NULL END,
         lease_owner = NULL, lease_expires_at = NULL, updated_at = NOW()
       WHERE id = $1 AND lease_owner = $2 AND status = 'running'`,
      [jobId, workerId, status, JSON.stringify(data), status === "waiting_approval" ? String(data) : null, responseId],
    );
    if (update.rowCount !== 1) throw new Error("Job lease was lost before finalizing.");
    await event(client, jobId, status === "succeeded" ? "job.completed" : "job.approval_requested", data);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function requeue(job: Job, reason: string) {
  const terminal = job.attempts >= job.max_attempts;
  await pool.query(
    `UPDATE agent_jobs SET status = $3, last_error = $4,
       available_at = NOW() + (LEAST(300, POWER(2, attempts)) * INTERVAL '1 second'),
       lease_owner = NULL, lease_expires_at = NULL, updated_at = NOW(),
       completed_at = CASE WHEN $3 = 'failed' THEN NOW() ELSE NULL END
      WHERE id = $1 AND lease_owner = $2 AND status = 'running'`,
    [job.id, workerId, terminal ? "failed" : "queued", reason.slice(0, 2000)],
  );
  await pool.query(
    "INSERT INTO agent_job_events (id, job_id, event_type, payload) VALUES ($1, $2, 'job.retry_scheduled', $3::jsonb)",
    [randomUUID(), job.id, JSON.stringify({ terminal, reason: reason.slice(0, 500) })],
  );
}

async function processJob(job: Job) {
  let checkpoint = "";
  const current = await pool.query<{ checkpoint: string | null }>(
    "SELECT checkpoint FROM agent_jobs WHERE id = $1",
    [job.id],
  );
  checkpoint = current.rows[0]?.checkpoint ?? "";
  try {
    for (let turn = 0; turn < maxTurns; turn += 1) {
      await heartbeat(job.id);
      const decision = await askModel(job, checkpoint);
      if (decision.kind === "continue") {
        checkpoint = decision.note;
        await saveCheckpoint(job.id, decision.responseId, checkpoint);
        job.last_response_id = decision.responseId;
        continue;
      }
      if (decision.kind === "complete") {
        await finish(job.id, "succeeded", decision.result, decision.responseId);
        return;
      }
      await finish(job.id, "waiting_approval", decision.reason, decision.responseId);
      return;
    }
    await saveCheckpoint(job.id, job.last_response_id, "Turn limit reached; safely yielding for the next worker claim.");
    await pool.query(
      "UPDATE agent_jobs SET status='queued', lease_owner=NULL, lease_expires_at=NULL, available_at=NOW(), updated_at=NOW() WHERE id=$1 AND lease_owner=$2 AND status='running'",
      [job.id, workerId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await requeue(job, message);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  process.stdout.write(`ATSH AI agent worker started: ${workerId}\n`);
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  while (!stopping) {
    try {
      const job = await claimJob();
      if (job) await processJob(job);
      else await new Promise((resolve) => setTimeout(resolve, pollMs));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown polling error";
      process.stderr.write(`Worker loop error: ${message}\n`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(pollMs * 2, 15000)));
    }
  }
  await pool.end();
  process.stdout.write("ATSH AI agent worker stopped cleanly.\n");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Worker startup failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
