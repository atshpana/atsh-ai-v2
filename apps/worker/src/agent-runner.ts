import { createHash, randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { planTools, type CostClass, type ProjectBrief, type ProjectKind } from "./tool-orchestrator.js";

type Job = {
  id: string;
  input: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  last_response_id: string | null;
};

type Decision =
  | { kind: "continue"; note: string; responseId: string | null }
  | { kind: "complete"; result: { summary: string; evidence: string[] }; responseId: string | null }
  | { kind: "approval"; reason: string; responseId: string | null };

function positiveInteger(name: string, fallback: number, maximum: number): number {
  const raw = process.env[name];
  const value = raw === undefined || raw.trim() === "" ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Invalid ${name}: expected an integer from 1 to ${maximum}.`);
  }
  return value;
}

const pollMs = positiveInteger("AGENT_POLL_INTERVAL_MS", 3000, 60000);
const leaseMs = positiveInteger("AGENT_LEASE_MS", 120000, 3600000);
const maxTurns = positiveInteger("AGENT_MAX_TURNS_PER_CLAIM", 8, 30);
const maxOutputTokens = positiveInteger("AGENT_MAX_OUTPUT_TOKENS", 1800, 8000);
const dbPoolSize = positiveInteger("AGENT_DB_POOL_SIZE", 4, 20);
const model = process.env.OPENAI_MODEL?.trim();
if (!model) throw new Error("OPENAI_MODEL is required.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");
const workerId = process.env.AGENT_WORKER_ID ?? `worker-${randomUUID()}`;
function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, workerId, ...fields }) + "\n";
  (level === "error" ? process.stderr : process.stdout).write(line);
}
const githubRef = process.env.ATSH_GITHUB_REF ?? "implementation/bootstrap";
if (process.env.GITHUB_TOKEN && process.env.ATSH_GITHUB_REPOSITORY !== "atshpana/atsh-ai-v2") {
  throw new Error("GITHUB_TOKEN requires ATSH_GITHUB_REPOSITORY=atshpana/atsh-ai-v2.");
}
if (!/^[A-Za-z0-9._/-]{1,200}$/.test(githubRef) || githubRef.includes("..")) {
  throw new Error("Invalid ATSH_GITHUB_REF.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: dbPoolSize,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

const githubRepository = process.env.ATSH_GITHUB_REPOSITORY ?? "";
const githubToken = process.env.GITHUB_TOKEN;

async function githubContents(path: string): Promise<string> {
  if (!githubToken) throw new Error("GITHUB_TOKEN is required for repository inspection.");
  if (githubRepository !== "atshpana/atsh-ai-v2") throw new Error("Repository is not in the worker allowlist.");
    const normalized = path.replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) throw new Error("Invalid repository path.");
  const response = await fetch(`https://api.github.com/repos/${githubRepository}/contents/${normalized}?ref=${encodeURIComponent(githubRef)}`, {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GitHub read failed with status ${response.status}.`);
  const payload = await response.json() as { type?: string; name?: string; path?: string; content?: string; encoding?: string; size?: number; download_url?: string | null } | Array<{ type?: string; name?: string; path?: string; size?: number }>;
  if (Array.isArray(payload)) return JSON.stringify(payload.map(({ type, name, path: itemPath, size }) => ({ type, name, path: itemPath, size }))).slice(0, 12000);
  if (payload.type !== "file" || payload.encoding !== "base64" || typeof payload.content !== "string") throw new Error("Requested path is not a readable text file.");
    return Buffer.from(payload.content.replace(/\s/g, ""), "base64").toString("utf8").slice(0, 12000);
}

const tools = [
  {
    type: "function",
    name: "plan_project_tools",
    description: "Analyze a project brief and return a deterministic tool, integration, risk and cost plan. Planning only; never provisions or spends.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["website", "web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"] },
        requirements: { type: "array", items: { type: "string" } },
        constraints: {
          type: "object",
          properties: {
            maxMonthlySpendUsd: { type: ["number", "null"] },
            approvedProviders: { type: ["array", "null"], items: { type: "string" } },
            allowedCostClasses: { type: ["array", "null"], items: { type: "string", enum: ["free", "existing_subscription", "usage_based", "new_subscription", "contract"] } },
            dataSensitivity: { type: ["string", "null"], enum: ["public", "internal", "confidential", "regulated", null] }
          },
          required: ["maxMonthlySpendUsd", "approvedProviders", "allowedCostClasses", "dataSensitivity"],
          additionalProperties: false
        }
      },
      required: ["kind", "requirements", "constraints"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "github_read_file",
    description: "Read a text file or list a directory in the allowlisted ATSH AI repository. Read-only.",
    strict: true,
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
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
      properties: { result: { type: "object", properties: { summary: { type: "string" }, evidence: { type: "array", items: { type: "string" } } }, required: ["summary", "evidence"], additionalProperties: false } },
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
    await client.query(
      "UPDATE agent_jobs SET status='failed', last_error='Worker lease expired after maximum attempts', completed_at=NOW(), lease_owner=NULL, lease_expires_at=NULL, updated_at=NOW() WHERE status='running' AND lease_expires_at < NOW() AND attempts >= max_attempts",
    );
    const found = await client.query<Job>(
      `SELECT id, input, attempts, max_attempts, last_response_id
         FROM agent_jobs
        WHERE ((status = 'queued' AND available_at <= NOW())
           OR (status = 'running' AND lease_expires_at < NOW()))
          AND attempts < max_attempts
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
              lease_expires_at = NOW() + ($3::double precision * INTERVAL '1 millisecond'),
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
       lease_expires_at = NOW() + ($3::double precision * INTERVAL '1 millisecond'), updated_at = NOW()
      WHERE id = $1 AND status = 'running' AND lease_owner = $2`,
    [jobId, workerId, leaseMs],
  );
  if (result.rowCount !== 1) throw new Error("Job lease was lost; refusing to continue.");
}

async function persistToolPlan(job: Job, brief: ProjectBrief, plan: ReturnType<typeof planTools>): Promise<{ id: string; version: number; status: string }> {
  const registryVersion = "capability-registry-v1";
  const canonical = JSON.stringify({ registryVersion, brief, plan });
  const fingerprint = createHash("sha256").update(canonical).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id: string; version: number; status: string }>(
      "SELECT id, version, status FROM agent_tool_plans WHERE job_id = $1 AND fingerprint = $2",
      [job.id, fingerprint],
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return existing.rows[0];
    }
    await client.query("SELECT id FROM agent_jobs WHERE id = $1 FOR UPDATE", [job.id]);
    const versionResult = await client.query<{ version: number }>(
      "SELECT COALESCE(MAX(version), 0) + 1 AS version FROM agent_tool_plans WHERE job_id = $1",
      [job.id],
    );
    const versionRow = versionResult.rows[0];
    if (!versionRow) throw new Error("Unable to determine the next tool plan version.");
    const version = versionRow.version;
    const inserted = await client.query<{ id: string; version: number; status: string }>(
      `INSERT INTO agent_tool_plans
        (job_id, version, registry_version, brief, plan, status, estimated_monthly_usd,
         requires_human_approval, fingerprint)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, 'draft', $6, $7, $8)
       ON CONFLICT (job_id, fingerprint) DO UPDATE SET fingerprint = EXCLUDED.fingerprint
       RETURNING id, version, status`,
      [job.id, version, registryVersion, JSON.stringify(brief), JSON.stringify(plan),
        plan.estimatedMonthlyUsd, plan.requiresHumanApproval, fingerprint],
    );
    const saved = inserted.rows[0];
    if (!saved) {
      const reused = await client.query<{ id: string; version: number; status: string }>(
        "SELECT id, version, status FROM agent_tool_plans WHERE job_id = $1 AND fingerprint = $2", [job.id, fingerprint]);
      if (!reused.rows[0]) throw new Error("Tool plan insert returned no row and no idempotent record exists.");
      await client.query("COMMIT");
      return reused.rows[0];
    }
    await client.query(
      "INSERT INTO agent_tool_plan_events (plan_id, event_type, payload) VALUES ($1, 'plan.created', $2::jsonb)",
      [saved.id, JSON.stringify({ version: saved.version, registryVersion, fingerprint })],
    );
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function askModel(job: Job, checkpoint: string, signal?: AbortSignal): Promise<Decision> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required; no model call was attempted.");
  if (!model) throw new Error("OPENAI_MODEL must be explicitly configured; no model call was attempted.");
  const alreadyReadGitHub = checkpoint.includes("GitHub read result for ");
  const availableTools = alreadyReadGitHub ? tools.filter((tool) => tool.name !== "github_read_file") : tools;
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
      "This worker exposes read-only GitHub inspection only when configured. It cannot edit repositories, run tests, or deploy.",
      "When the task contains a project brief or asks which tools/integrations are needed, call plan_project_tools first. Explain its plan and approval gates; never claim tools were provisioned or connected.",
      ...(alreadyReadGitHub ? ["A GitHub file has already been read and its complete available content is included in previousCheckpoint. Do not inspect GitHub again; use that evidence and call complete_job with a concise summary and evidence."] : []),
    ].join(" "),
    input: JSON.stringify({ task: job.input, previousCheckpoint: checkpoint }),
    tools: availableTools,
    tool_choice: "required",
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000),
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/(?:sk-[A-Za-z0-9_-]{12,}|Bearer\\s+\\S+)/g, "[REDACTED]").slice(0, 1200);
    log("error", "openai.http_error", { jobId: job.id, status: response.status, detail });
    throw new Error(`OpenAI Responses API returned HTTP ${response.status}.`);
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
  if (call.name === "plan_project_tools") {
    const brief = args as unknown as ProjectBrief;
    const kinds: ProjectKind[] = ["website", "web_app", "mobile_app", "ecommerce", "ai_assistant", "automation", "custom_software"];
    if (!kinds.includes(brief.kind) || !Array.isArray(brief.requirements) || brief.requirements.some((item: unknown) => typeof item !== "string") || !brief.constraints || typeof brief.constraints !== "object" || Array.isArray(brief.constraints)) {
      throw new Error("Invalid project brief supplied to tool planner.");
    }
    const rawConstraints = brief.constraints as unknown as Record<string, unknown>;
    const constraints: ProjectBrief["constraints"] = {};
    if (rawConstraints.maxMonthlySpendUsd !== null && rawConstraints.maxMonthlySpendUsd !== undefined) {
      if (typeof rawConstraints.maxMonthlySpendUsd !== "number" || !Number.isFinite(rawConstraints.maxMonthlySpendUsd) || rawConstraints.maxMonthlySpendUsd < 0) {
        throw new Error("Invalid maxMonthlySpendUsd in project brief.");
      }
      constraints.maxMonthlySpendUsd = rawConstraints.maxMonthlySpendUsd;
    }
    if (rawConstraints.approvedProviders !== null && rawConstraints.approvedProviders !== undefined) {
      if (!Array.isArray(rawConstraints.approvedProviders) || rawConstraints.approvedProviders.some((item) => typeof item !== "string")) {
        throw new Error("Invalid approvedProviders in project brief.");
      }
      constraints.approvedProviders = rawConstraints.approvedProviders as string[];
    }
    if (rawConstraints.allowedCostClasses !== null && rawConstraints.allowedCostClasses !== undefined) {
      const allowed = ["free", "existing_subscription", "usage_based", "new_subscription", "contract"];
      if (!Array.isArray(rawConstraints.allowedCostClasses) || rawConstraints.allowedCostClasses.some((item) => typeof item !== "string" || !allowed.includes(item))) {
        throw new Error("Invalid allowedCostClasses in project brief.");
      }
      constraints.allowedCostClasses = rawConstraints.allowedCostClasses as CostClass[];
    }
    if (rawConstraints.dataSensitivity !== null && rawConstraints.dataSensitivity !== undefined) {
      const sensitivity = ["public", "internal", "confidential", "regulated"];
      if (typeof rawConstraints.dataSensitivity !== "string" || !sensitivity.includes(rawConstraints.dataSensitivity)) {
        throw new Error("Invalid dataSensitivity in project brief.");
      }
      constraints.dataSensitivity = rawConstraints.dataSensitivity as "public" | "internal" | "confidential" | "regulated";
    }
    const plan = planTools({ kind: brief.kind, requirements: brief.requirements, constraints });
    return { kind: "continue", note: "Project tool plan (planning only):\n" + JSON.stringify(plan), responseId };
  }
  if (call.name === "github_read_file" && typeof args.path === "string") {
    const content = await githubContents(args.path);
    return { kind: "continue", note: `GitHub read result for ${args.path}:
${content}`, responseId };
  }
  if (call.name === "record_progress" && typeof args.note === "string") {
    return { kind: "continue", note: args.note, responseId };
  }
  if (call.name === "complete_job" && args.result && typeof args.result === "object") {
    if (typeof (args.result as { summary?: unknown }).summary !== "string" || !Array.isArray((args.result as { evidence?: unknown }).evidence) || (args.result as { evidence: unknown[] }).evidence.length === 0) throw new Error("Completion requires a summary and non-empty evidence list.");
    return { kind: "complete", result: args.result as { summary: string; evidence: string[] }, responseId };
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
      `UPDATE agent_jobs SET status = $3::varchar,
         result = CASE WHEN $3::varchar = 'succeeded' THEN $4::jsonb ELSE result END,
         approval_reason = CASE WHEN $3::varchar = 'waiting_approval' THEN $5::text ELSE approval_reason END,
         last_response_id = COALESCE($6::varchar, last_response_id),
         completed_at = CASE WHEN $3::varchar = 'succeeded' THEN NOW() ELSE NULL END,
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
  // Update and append the event atomically. A worker whose lease was stolen
  // must not emit a retry event or overwrite the new owner's state.
  const result = await pool.query(
    `WITH changed AS (
       UPDATE agent_jobs SET status = $3::varchar, last_error = $4::text,
         available_at = NOW() + (LEAST(300, POWER(2, attempts)) * INTERVAL '1 second'),
         lease_owner = NULL, lease_expires_at = NULL, updated_at = NOW(),
         completed_at = CASE WHEN $3::varchar = 'failed' THEN NOW() ELSE NULL END
       WHERE id = $1 AND lease_owner = $2 AND status = 'running'
       RETURNING id
     )
     INSERT INTO agent_job_events (id, job_id, event_type, payload)
     SELECT $5, id, 'job.retry_scheduled', $6::jsonb FROM changed
     RETURNING job_id`,
    [job.id, workerId, terminal ? "failed" : "queued", reason.slice(0, 2000),
      randomUUID(), JSON.stringify({ terminal, reason: reason.slice(0, 500) })],
  );
  if (result.rowCount !== 1) {
    process.stderr.write(`Skipped stale retry for job ${job.id}: lease no longer owned.
`);
  }
}

async function processJob(job: Job) {
  log("info", "job.started", { jobId: job.id, attempt: job.attempts, maxAttempts: job.max_attempts });
  let checkpoint = "";
  const current = await pool.query<{ checkpoint: string | null }>(
    "SELECT checkpoint FROM agent_jobs WHERE id = $1",
    [job.id],
  );
  checkpoint = current.rows[0]?.checkpoint ?? "";
  try {
    for (let turn = 0; turn < maxTurns; turn += 1) {
      log("info", "job.turn.started", { jobId: job.id, turn: turn + 1, maxTurns });
      await heartbeat(job.id);
      const controller = new AbortController();
      const heartbeatIntervalMs = Math.max(1000, Math.floor(leaseMs / 3));
      let heartbeatFailure: Error | null = null;
      let heartbeatInFlight = false;
      const heartbeatTimer = setInterval(() => {
        if (heartbeatInFlight || heartbeatFailure) return;
        heartbeatInFlight = true;
        void heartbeat(job.id)
          .catch((error: unknown) => {
            heartbeatFailure = error instanceof Error ? error : new Error("Heartbeat failed.");
            controller.abort(heartbeatFailure);
          })
          .finally(() => { heartbeatInFlight = false; });
      }, heartbeatIntervalMs);
      let decision: Decision;
      try {
        log("info", "openai.request.started", { jobId: job.id, turn: turn + 1, model });
        decision = await askModel(job, checkpoint, controller.signal);
        log("info", "openai.request.completed", { jobId: job.id, turn: turn + 1, decision: decision.kind });
        if (heartbeatFailure) throw heartbeatFailure;
      } finally {
        clearInterval(heartbeatTimer);
      }
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
      "UPDATE agent_jobs SET status=CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END, lease_owner=NULL, lease_expires_at=NULL, available_at=NOW(), completed_at=CASE WHEN attempts >= max_attempts THEN NOW() ELSE NULL END, updated_at=NOW() WHERE id=$1 AND lease_owner=$2 AND status='running'",
      [job.id, workerId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    log("error", "job.processing_failed", { jobId: job.id, attempt: job.attempts, message, stack: error instanceof Error ? error.stack?.slice(0, 3000) : undefined });
    await requeue(job, message);
    log("warn", "job.retry_or_failed", { jobId: job.id, attempt: job.attempts, terminal: job.attempts >= job.max_attempts });
  }
}

async function main() {
  process.stdout.write(`ATSH AI agent worker started: ${workerId}
`);
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  while (!stopping) {
    try {
      const job = await claimJob();
      if (job) {
        log("info", "job.claimed", { jobId: job.id, attempt: job.attempts, maxAttempts: job.max_attempts });
        await processJob(job);
      }
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
