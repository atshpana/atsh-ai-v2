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

export function requiredFilePaths(input: unknown): string[] {
  const found = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === "string") {
      const pattern = /(?:^|[\s"'(])((?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:md|mdx|ts|tsx|js|jsx|json|sql|prisma|ya?ml|toml|txt|sh|css|html))(?=$|[\s"',;)])/g;
      for (const match of value.matchAll(pattern)) {
        const path = match[1];
        if (path && !path.includes("://")) found.add(path);
      }
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(visit);
  };
  visit(input);
  return [...found];
}
