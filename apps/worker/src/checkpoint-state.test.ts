import test from "node:test";
import assert from "node:assert/strict";
import { appendToolOutput, ensureTaskContext, parseCheckpoint, rememberFile, requiredFilePaths, serializeCheckpoint } from "./checkpoint-state.js";

test("checkpoint preserves Responses API history and read files across serialization", () => {
  const state = parseCheckpoint("");
  state.history.push({ role: "user", content: "Inspect three files." });
  assert.equal(rememberFile(state, "README.md", "readme contents"), true);
  assert.equal(rememberFile(state, "apps/worker/src/agent-runner.ts", "runner contents"), true);
  assert.equal(rememberFile(state, "README.md", "different contents"), false);
  appendToolOutput(state, "call-1", { path: "README.md", content: state.files["README.md"] });

  const resumed = parseCheckpoint(serializeCheckpoint(state));
  assert.equal(resumed.files["README.md"], "readme contents");
  assert.equal(resumed.files["apps/worker/src/agent-runner.ts"], "runner contents");
  assert.equal(resumed.history.length, 2);
  assert.equal(resumed.history[1]?.type, "function_call_output");
});

test("legacy text checkpoints migrate without discarding their content", () => {
  const resumed = parseCheckpoint("previous inspection note");
  assert.match(String(resumed.history[0]?.content), /previous inspection note/);
  assert.deepEqual(resumed.files, {});
});

test("extracts explicit required file paths for completion gating", () => {
  const required = requiredFilePaths({
    task: "Read README.md, apps/worker/src/agent-runner.ts and apps/api/prisma/migrations/20261106000000_agent_jobs/migration.sql",
    acceptanceCriteria: ["Inspect package.json"]
  });
  assert.deepEqual(required.sort(), [
    "README.md",
    "apps/api/prisma/migrations/20261106000000_agent_jobs/migration.sql",
    "apps/worker/src/agent-runner.ts",
    "package.json"
  ].sort());
});

test("legacy turn-limit checkpoint restores the original task instead of replacing it", () => {
  const taskInput = {
    task: "Inspect all requested files and produce an evidence-based report.",
    files: ["README.md", "apps/worker/src/agent-runner.ts"],
    acceptanceCriteria: ["Read every requested file", "Preserve checkpoint across resume"]
  };
  const resumed = parseCheckpoint("Turn limit reached; safely yielding for the next worker claim.", taskInput);
  ensureTaskContext(resumed, taskInput);

  assert.equal(resumed.version, 2);
  assert.deepEqual(resumed.taskInput, taskInput);
  assert.deepEqual(Object.keys(resumed.files), []);
  assert.equal(resumed.legacyNotes.length, 1);
  assert.equal(resumed.history[0]?.role, "user");
  assert.match(String(resumed.history[0]?.content), /Inspect all requested files/);

  const roundTrip = parseCheckpoint(serializeCheckpoint(resumed), taskInput);
  assert.deepEqual(roundTrip.taskInput, taskInput);
  assert.equal(roundTrip.history.length, 1);
  assert.equal(roundTrip.legacyNotes.length, 1);
});

test("turn-limit checkpoint round-trip retains task history and all previously read files", () => {
  const taskInput = { task: "Read README.md and package.json", files: ["README.md", "package.json"] };
  const state = parseCheckpoint("", taskInput);
  ensureTaskContext(state, taskInput);
  rememberFile(state, "README.md", "readme");
  rememberFile(state, "package.json", "package");
  state.history.push({ type: "function_call_output", call_id: "read-1", output: "{\\"path\\":\\"README.md\\"}" });

  const yielded = serializeCheckpoint(state);
  const resumed = parseCheckpoint(yielded, taskInput);
  ensureTaskContext(resumed, taskInput);
  assert.deepEqual(Object.keys(resumed.files).sort(), ["README.md", "package.json"]);
  assert.equal(resumed.history.length, 2);
  assert.match(String(resumed.history[0]?.content), /Read README.md and package.json/);
});
