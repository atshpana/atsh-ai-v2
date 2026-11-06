import assert from "node:assert/strict";
import test from "node:test";
import { N8nClient, validateWorkflow, type N8nNodeCatalogSnapshot, type WorkflowDefinition } from "./n8n-client.js";

const catalog: N8nNodeCatalogSnapshot = {
  instanceVersion: "1.0.0",
  capturedAt: "2026-11-06T00:00:00.000Z",
  source: "instance_export",
  nodes: [{ type: "n8n-nodes-base.manualTrigger", supportedVersions: [1] }],
};
const workflowNode = { id: "node-1", name: "Manual Trigger", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: [0, 0] as [number, number], parameters: {} };
const workflow: WorkflowDefinition = {
  name: "ATSH draft test",
  nodes: [workflowNode],
  connections: {},
};

test("validates node types and versions against a dated instance catalog", () => {
  assert.doesNotThrow(() => validateWorkflow(workflow, catalog));
  assert.throws(() => validateWorkflow({ ...workflow, nodes: [{ ...workflowNode, typeVersion: 2 }] }, catalog), /Unsupported version/);
  assert.throws(() => validateWorkflow({ ...workflow, nodes: [{ ...workflowNode, type: "unknown" }] }, catalog), /not in the verified instance catalog/);
});

test("createDraft sends no activation flag and records an audit event", async () => {
  let sentBody: Record<string, unknown> | undefined;
  const events: string[] = [];
  const fakeFetch: typeof fetch = async (_input, init) => {
    sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ id: "wf-1", name: "ATSH draft test", active: false }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const client = new N8nClient({ baseUrl: "https://n8n.example.com", apiKey: "test-key", fetchImpl: fakeFetch, audit: (event) => { events.push(event.action); } });
  const result = await client.createDraft(workflow, catalog);
  assert.equal(result.active, false);
  assert.equal("active" in (sentBody ?? {}), false);
  assert.deepEqual(events, ["workflow.draft.create"]);
});

test("refuses to update an active workflow", async () => {
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ id: "wf-2", active: true }), { status: 200, headers: { "content-type": "application/json" } });
  const client = new N8nClient({ baseUrl: "https://n8n.example.com/api/v1", apiKey: "test-key", fetchImpl: fakeFetch });
  await assert.rejects(() => client.updateDraft("wf-2", workflow, catalog), /active workflow/);
});

test("rejects non-HTTPS remote endpoints", () => {
  assert.throws(() => new N8nClient({ baseUrl: "http://n8n.example.com", apiKey: "test-key" }), /HTTPS/);
});
