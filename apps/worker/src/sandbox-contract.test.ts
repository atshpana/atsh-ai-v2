import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  executeSandboxCommand,
  type SandboxBackend,
  type SandboxCapabilities,
  type SandboxCommandRequest,
} from "./sandbox-contract.js";

const capabilities: SandboxCapabilities = {
  isolation: "container",
  nonRoot: true,
  noHostNetwork: true,
  noCoreDbNetwork: true,
  noHostSockets: true,
  readOnlyRootFilesystem: true,
  workspaceOnlyWritable: true,
  cpuLimit: true,
  memoryLimit: true,
  processLimit: true,
  timeoutLimit: true,
  outputLimit: true,
  networkPolicy: "disabled",
};

const request: SandboxCommandRequest = {
  jobId: "c03bb714-4c31-4c31-b8f0-cca21c3df1c5",
  workspace: "/var/lib/atsh-agent/jobs/c03bb714-4c31-4c31-b8f0-cca21c3df1c5",
  command: ["npm", "test"],
  environment: { NODE_ENV: "test" },
  timeoutMs: 60_000,
  maxOutputBytes: 100_000,
};

function backend(overrides: Partial<SandboxCapabilities> = {}): SandboxBackend {
  return {
    name: "test-sandbox",
    getCapabilities: async () => ({ ...capabilities, ...overrides }),
    execute: async () => ({ exitCode: 0, stdout: "ok", stderr: "", durationMs: 12 }),
  };
}

test("refuses to execute when no sandbox backend is configured", async () => {
  let launched = false;
  await assert.rejects(
    executeSandboxCommand(null, request),
    /no approved sandbox backend is configured/,
  );
  assert.equal(launched, false);
});

test("refuses a backend without core-db network isolation before execution", async () => {
  let launched = false;
  const unsafe: SandboxBackend = {
    name: "unsafe",
    getCapabilities: async () => ({ ...capabilities, noCoreDbNetwork: false }),
    execute: async () => {
      launched = true;
      return { exitCode: 0, stdout: "", stderr: "", durationMs: 0 };
    },
  };
  await assert.rejects(executeSandboxCommand(unsafe, request), /noCoreDbNetwork/);
  assert.equal(launched, false);
});

test("rejects shell strings and unbounded command requests before execution", async () => {
  const safe = backend();
  await assert.rejects(
    executeSandboxCommand(safe, { ...request, command: ["sh", "-c", "npm test"] }),
    /Shell interpreters/,
  );
  await assert.rejects(
    executeSandboxCommand(safe, { ...request, timeoutMs: 999_999_999 }),
    /timeout/,
  );
  await assert.rejects(
    executeSandboxCommand(safe, { ...request, maxOutputBytes: 999_999_999 }),
    /output limit/,
  );
});

test("calls a capability-complete backend with a bounded argument-array request", async () => {
  let calls = 0;
  const safe: SandboxBackend = {
    name: "safe-test",
    getCapabilities: async () => capabilities,
    execute: async (input) => {
      calls += 1;
      assert.deepEqual(input, request);
      return { exitCode: 0, stdout: "ok", stderr: "", durationMs: 12 };
    },
  };
  const result = await executeSandboxCommand(safe, request);
  assert.equal(calls, 1);
  assert.equal(result.exitCode, 0);
});
