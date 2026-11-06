import assert from "node:assert/strict";
import test from "node:test";
import { planTools } from "./tool-orchestrator.js";

test("selects project-appropriate capabilities and reports unknown costs", () => {
  const plan = planTools({
    kind: "web_app",
    requirements: ["database", "AI chatbot", "browser testing"],
  });
  assert.equal(plan.projectKind, "web_app");
  assert.ok(plan.decisions.some((item) => item.capabilityId === "postgres.database"));
  assert.ok(plan.decisions.some((item) => item.capabilityId === "openai.models"));
  assert.ok(plan.decisions.some((item) => item.capabilityId === "playwright.qa"));
  assert.equal(plan.estimatedMonthlyUsd, null);
  assert.equal(plan.executionAllowed, false);
  assert.equal(plan.requiresHumanApproval, true);
});

test("does not silently select disabled payment providers", () => {
  const plan = planTools({ kind: "ecommerce", requirements: ["checkout"] });
  assert.ok(plan.decisions.some((item) => item.capabilityId === "unresolved:payments"));
  assert.equal(plan.executionAllowed, false);
});

test("flags providers outside the project allowlist", () => {
  const plan = planTools({
    kind: "web_app",
    requirements: ["database"],
    constraints: { approvedProviders: ["OnlyOtherProvider"] },
  });
  assert.ok(plan.decisions.some((item) => item.capabilityId === "unresolved:relational_database"));
});

test("flags regulated-data projects for security review", () => {
  const plan = planTools({
    kind: "ai_assistant",
    requirements: ["AI chatbot"],
    constraints: { dataSensitivity: "regulated" },
  });
  assert.equal(plan.requiresHumanApproval, true);
  assert.ok(plan.approvalReasons.some((reason) => reason.includes("regulated")));
});
