import test from "node:test";
import assert from "node:assert/strict";
import { appendToolOutput, parseCheckpoint, rememberFile, serializeCheckpoint } from "./checkpoint-state.js";

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
