export type AgentCheckpoint = {
  version: 1;
  history: Array<Record<string, unknown>>;
  files: Record<string, string>;
};

export function parseCheckpoint(raw: string): AgentCheckpoint {
  if (!raw) return { version: 1, history: [], files: {} };
  try {
    const value = JSON.parse(raw) as Partial<AgentCheckpoint>;
    if (value.version === 1 && Array.isArray(value.history) && value.files && typeof value.files === "object") {
      return { version: 1, history: value.history, files: value.files };
    }
  } catch { /* Legacy free-text checkpoint. */ }
  return { version: 1, history: [{ role: "user", content: "Legacy checkpoint: " + raw }], files: {} };
}

export function serializeCheckpoint(value: AgentCheckpoint): string {
  return JSON.stringify(value);
}

export function rememberFile(value: AgentCheckpoint, path: string, content: string): boolean {
  if (Object.prototype.hasOwnProperty.call(value.files, path)) return false;
  value.files[path] = content;
  return true;
}

export function appendToolOutput(value: AgentCheckpoint, callId: string, output: unknown): void {
  value.history.push({ type: "function_call_output", call_id: callId, output: JSON.stringify(output) });
}
