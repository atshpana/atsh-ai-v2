import test from "node:test";
import assert from "node:assert/strict";
import { HealthService } from "./health.service.js";

test("database readiness fails closed when DATABASE_URL is missing", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    assert.equal(await new HealthService().checkDatabase(), false);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
