import test from "node:test";
import assert from "node:assert/strict";
import { ServiceUnavailableException } from "@nestjs/common";
import { HealthController } from "./health.controller.js";

test("liveness endpoint returns a non-sensitive service status", () => {
  const controller = new HealthController({ checkDatabase: async () => true });
  assert.deepEqual(controller.live(), {
    status: "ok",
    service: "atsh-api",
    phase: "bootstrap"
  });
});

test("readiness reports ready only when the database is reachable", async () => {
  const controller = new HealthController({ checkDatabase: async () => true });
  assert.deepEqual(await controller.readiness(), {
    status: "ready",
    service: "atsh-api",
    dependencies: { database: "ok" }
  });
});

test("readiness fails closed and does not expose connection details", async () => {
  const controller = new HealthController({ checkDatabase: async () => false });
  await assert.rejects(
    () => controller.readiness(),
    (error: unknown) => {
      assert.ok(error instanceof ServiceUnavailableException);
      assert.deepEqual(error.getResponse(), {
        status: "not_ready",
        service: "atsh-api",
        dependencies: { database: "unavailable" }
      });
      return true;
    }
  );
});
