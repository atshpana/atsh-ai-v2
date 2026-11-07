export type AgentCheckpoint = {
  version: 2;
  taskInput: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  files: Record<string, string>;
  legacyNotes: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasLegacyOnlyHistory(history: Array<Record<string, unknown>>): boolean {
  return history.length > 0 && history.every((item) => {
    const content = item.content;
    return item.role === "user" && typeof content === "string" &&
      /^(?:Legacy checkpoint:|Turn limit reached; safely yielding)/.test(content);
  });
}

export function parseCheckpoint(raw: string, taskInput: Record<string, unknown> = {}): AgentCheckpoint {
  if (raw) {
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      if ((value.version === 1 || value.version === 2) &&
          Array.isArray(value.history) && isRecord(value.files)) {
        const history = value.history as Array<Record<string, unknown>>;
        const legacyNotes = Array.isArray(value.legacyNotes)
          ? value.legacyNotes.filter((note): note is string => typeof note === "string")
          : [];
        if (hasLegacyOnlyHistory(history)) {
          legacyNotes.push(...history.map((item) => String(item.content ?? "")));
          history.length = 0;
        }
        return {
          version: 2,
          taskInput: isRecord(value.taskInput) ? value.taskInput : taskInput,
          history,
          files: value.files as Record<string, string>,
          legacyNotes,
        };
      }
    } catch { /* Migrate legacy free-text checkpoints below. */ }
    return { version: 2, taskInput, history: [], files: {}, legacyNotes: [raw] };
  }
  return { version: 2, taskInput, history: [], files: {}, legacyNotes: [] };
}

export function serializeCheckpoint(value: AgentCheckpoint): string {
  return JSON.stringify(value);
}

export function ensureTaskContext(value: AgentCheckpoint, taskInput: Record<string, unknown>): void {
  value.taskInput = taskInput;
  const serializedTask = JSON.stringify(taskInput);
  const hasTaskContext = value.history.some((item) =>
    item.role === "user" && typeof item.content === "string" && (() => {
      try { return JSON.stringify((JSON.parse(item.content) as { task?: unknown }).task) === serializedTask; }
      catch { return false; }
    })());
  if (!hasTaskContext) {
    value.history.unshift({
      role: "user",
      content: JSON.stringify({
        task: taskInput,
        acceptanceCriteria: taskInput.acceptanceCriteria ?? null,
        resumeContext: value.legacyNotes.length
          ? "A legacy checkpoint was encountered. Its note is retained as metadata; treat this original task input as authoritative."
          : null,
      }),
    });
  }
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
