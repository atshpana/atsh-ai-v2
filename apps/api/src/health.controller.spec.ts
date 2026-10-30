import test from "node:test";
import assert from "node:assert/strict";
import { HealthController } from "./health.controller.js";

test("health endpoint returns a non-sensitive service status", () => {
  const result = new HealthController().check();
  assert.deepEqual(result, {
    status: "ok",
    service: "atsh-api",
    phase: "bootstrap"
  });
});
