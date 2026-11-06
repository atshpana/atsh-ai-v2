export type N8nNodeCatalogEntry = {
  type: string;
  supportedVersions: number[];
  credentialTypes?: string[];
};

export type N8nNodeCatalogSnapshot = {
  instanceVersion: string;
  capturedAt: string;
  source: "instance_export" | "verified_package_manifest";
  nodes: N8nNodeCatalogEntry[];
};

export type WorkflowNode = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name?: string }>;
};

export type WorkflowDefinition = {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type N8nAuditEvent = {
  action: "workflow.draft.create" | "workflow.draft.update" | "workflow.read" | "execution.list";
  workflowId?: string;
  occurredAt: string;
  outcome: "success" | "failure";
  detail?: string;
};

export type N8nClientOptions = {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  audit?: (event: N8nAuditEvent) => Promise<void> | void;
};

export class N8nApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "N8nApiError";
  }
}

export class N8nClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly audit?: N8nClientOptions["audit"];

  constructor(private readonly options: N8nClientOptions) {
    const parsed = new URL(options.baseUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error("n8n base URL must use HTTPS except for localhost.");
    }
    if (!options.apiKey.trim()) throw new Error("n8n API key is required.");
    this.baseUrl = parsed.toString().replace(/\/$/, "") + (parsed.pathname.replace(/\/$/, "").endsWith("/api/v1") ? "" : "/api/v1");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.audit = options.audit;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(new URL(path.replace(/^\//, ""), this.baseUrl + "/"), {
      ...init,
      headers: {
        Accept: "application/json",
        "X-N8N-API-KEY": this.options.apiKey,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      // Never include provider response bodies: they may contain workflow or credential metadata.
      throw new N8nApiError(response.status, `n8n API request failed with HTTP ${response.status}.`);
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  private async record(event: Omit<N8nAuditEvent, "occurredAt">): Promise<void> {
    await this.audit?.({ ...event, occurredAt: new Date().toISOString() });
  }

  async listWorkflows(cursor?: string, limit = 100): Promise<{ data: Array<{ id: string; name: string; active?: boolean }>; nextCursor?: string }> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 250) throw new Error("n8n workflow page limit must be between 1 and 250.");
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);
    return this.request(`workflows?${query.toString()}`);
  }

  async getWorkflow(id: string): Promise<Record<string, unknown>> {
    const result = await this.request<Record<string, unknown>>(`workflows/${encodeURIComponent(id)}`);
    await this.record({ action: "workflow.read", workflowId: id, outcome: "success" });
    return result;
  }

  async createDraft(definition: WorkflowDefinition, catalog: N8nNodeCatalogSnapshot): Promise<Record<string, unknown>> {
    validateWorkflow(definition, catalog);
    const payload = {
      name: definition.name,
      nodes: definition.nodes,
      connections: definition.connections,
      settings: definition.settings ?? {},
      // Deliberately omit active: workflows created through this adapter remain inactive drafts.
    };
    try {
      const result = await this.request<Record<string, unknown>>("workflows", { method: "POST", body: JSON.stringify(payload) });
      await this.record({ action: "workflow.draft.create", workflowId: String(result.id ?? ""), outcome: "success" });
      return result;
    } catch (error) {
      await this.record({ action: "workflow.draft.create", outcome: "failure", detail: safeError(error) });
      throw error;
    }
  }

  async updateDraft(id: string, definition: WorkflowDefinition, catalog: N8nNodeCatalogSnapshot): Promise<Record<string, unknown>> {
    validateWorkflow(definition, catalog);
    const existing = await this.getWorkflow(id);
    if (existing.active === true) throw new Error("Refusing to update an active workflow; deactivate it through an approved operator process first.");
    const payload = {
      name: definition.name,
      nodes: definition.nodes,
      connections: definition.connections,
      settings: definition.settings ?? {},
    };
    try {
      const result = await this.request<Record<string, unknown>>(`workflows/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await this.record({ action: "workflow.draft.update", workflowId: id, outcome: "success" });
      return result;
    } catch (error) {
      await this.record({ action: "workflow.draft.update", workflowId: id, outcome: "failure", detail: safeError(error) });
      throw error;
    }
  }

  async listExecutions(workflowId: string, limit = 20): Promise<Record<string, unknown>> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Execution page limit must be between 1 and 100.");
    const query = new URLSearchParams({ workflowId, limit: String(limit) });
    const result = await this.request<Record<string, unknown>>(`executions?${query.toString()}`);
    await this.record({ action: "execution.list", workflowId, outcome: "success" });
    return result;
  }
}

function safeError(error: unknown): string {
  return error instanceof N8nApiError ? error.message : "Unexpected n8n adapter error.";
}

export function validateWorkflow(definition: WorkflowDefinition, catalog: N8nNodeCatalogSnapshot): void {
  if (!definition.name.trim() || definition.name.length > 120) throw new Error("Workflow name must contain 1–120 characters.");
  if (!catalog.instanceVersion.trim() || !Number.isFinite(Date.parse(catalog.capturedAt))) throw new Error("A dated, versioned n8n node catalog is required.");
  if (catalog.source !== "instance_export" && catalog.source !== "verified_package_manifest") throw new Error("Unverified node catalog source.");
  const known = new Map(catalog.nodes.map((entry) => [entry.type, entry]));
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const node of definition.nodes) {
    if (!node.id || ids.has(node.id)) throw new Error("Workflow node IDs must be present and unique.");
    if (!node.name || names.has(node.name)) throw new Error("Workflow node names must be present and unique.");
    ids.add(node.id);
    names.add(node.name);
    const entry = known.get(node.type);
    if (!entry) throw new Error(`Node type is not in the verified instance catalog: ${node.type}`);
    if (!entry.supportedVersions.includes(node.typeVersion)) throw new Error(`Unsupported version ${node.typeVersion} for node type ${node.type}.`);
    if (!Array.isArray(node.position) || node.position.length !== 2 || !node.position.every(Number.isFinite)) throw new Error(`Invalid position for node ${node.name}.`);
    if (!node.parameters || typeof node.parameters !== "object" || Array.isArray(node.parameters)) throw new Error(`Invalid parameters for node ${node.name}.`);
    for (const [credentialType, reference] of Object.entries(node.credentials ?? {})) {
      if (!entry.credentialTypes?.includes(credentialType)) throw new Error(`Credential type ${credentialType} is not allowed for node ${node.name}.`);
      if (!reference.id?.trim()) throw new Error(`Credential reference ${credentialType} on node ${node.name} must use an existing credential ID.`);
    }
  }
  for (const [sourceName, outputs] of Object.entries(definition.connections)) {
    if (!names.has(sourceName)) throw new Error(`Connection source node does not exist: ${sourceName}`);
    const destinations = JSON.stringify(outputs);
    for (const targetName of names) {
      // A target is valid if it appears in the serialized connection object.
      if (destinations.includes(`"node":"${targetName}"`)) continue;
    }
    const referenced = [...destinations.matchAll(/"node"\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
    for (const targetName of referenced) if (!names.has(targetName)) throw new Error(`Connection target node does not exist: ${targetName}`);
  }
}
