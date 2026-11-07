export type SandboxCapabilities = {
  isolation: "container" | "microvm";
  nonRoot: boolean;
  noHostNetwork: boolean;
  noCoreDbNetwork: boolean;
  noHostSockets: boolean;
  readOnlyRootFilesystem: boolean;
  workspaceAndTmpOnlyWritable: boolean;
  cpuLimit: boolean;
  memoryLimit: boolean;
  processLimit: boolean;
  timeoutLimit: boolean;
  outputLimit: boolean;
  networkPolicy: "disabled" | "explicit_allowlist";
};

export type SandboxCommandRequest = {
  jobId: string;
  workspace: string;
  command: string[];
  environment: Record<string, string>;
  timeoutMs: number;
  maxOutputBytes: number;
  signal?: AbortSignal;
};

export type SandboxCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export interface SandboxBackend {
  readonly name: string;
  getCapabilities(signal?: AbortSignal): Promise<SandboxCapabilities>;
  execute(request: SandboxCommandRequest): Promise<SandboxCommandResult>;
}

const REQUIRED_BOOLEAN_CAPABILITIES = [
  "nonRoot",
  "noHostNetwork",
  "noCoreDbNetwork",
  "noHostSockets",
  "readOnlyRootFilesystem",
  "workspaceAndTmpOnlyWritable",
  "cpuLimit",
  "memoryLimit",
  "processLimit",
  "timeoutLimit",
  "outputLimit",
] as const;

const MAX_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_OUTPUT_BYTES = 2_000_000;
const MAX_COMMAND_PARTS = 64;
const MAX_ENV_ENTRIES = 32;
const ENV_NAME = /^[A-Z_][A-Z0-9_]{0,63}$/;
const SAFE_ENV_NAMES = new Set(["CI", "LANG", "NODE_ENV", "TZ"]);
const SHELL_EXECUTABLES = new Set(["sh", "bash", "dash", "zsh", "fish", "ash", "cmd", "cmd.exe", "powershell", "pwsh"]);

export function assertSandboxCapabilities(capabilities: SandboxCapabilities): void {
  if (capabilities.isolation !== "container" && capabilities.isolation !== "microvm") {
    throw new Error("Sandbox backend must provide container or microVM isolation.");
  }
  for (const key of REQUIRED_BOOLEAN_CAPABILITIES) {
    if (capabilities[key] !== true) {
      throw new Error(`Sandbox backend is missing required capability: ${key}.`);
    }
  }
  if (capabilities.networkPolicy !== "disabled" && capabilities.networkPolicy !== "explicit_allowlist") {
    throw new Error("Sandbox backend must enforce an explicit network policy.");
  }
}

export function assertSandboxCommandRequest(request: SandboxCommandRequest): void {
  if (!request.jobId.trim()) throw new Error("A job ID is required.");
  if (!request.workspace.startsWith("/")) throw new Error("Sandbox workspace must be an absolute path.");
  if (!Array.isArray(request.command) || request.command.length < 1 || request.command.length > MAX_COMMAND_PARTS ||
      request.command.some((part) => typeof part !== "string" || part.length === 0 || part.includes("\0"))) {
    throw new Error("Command must be a non-empty argument array; shell command strings are not accepted.");
  }
  const executable = request.command[0]?.split("/").at(-1)?.toLowerCase() ?? "";
  if (SHELL_EXECUTABLES.has(executable) || (request.command.length > 1 && request.command[1] === "-c")) {
    throw new Error("Shell interpreters and shell command execution are not permitted in sandbox requests.");
  }
  if (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 1 || request.timeoutMs > MAX_TIMEOUT_MS) {
    throw new Error(`Command timeout must be between 1 and ${MAX_TIMEOUT_MS} milliseconds.`);
  }
  if (!Number.isSafeInteger(request.maxOutputBytes) || request.maxOutputBytes < 1 || request.maxOutputBytes > MAX_OUTPUT_BYTES) {
    throw new Error(`Command output limit must be between 1 and ${MAX_OUTPUT_BYTES} bytes.`);
  }
  const entries = Object.entries(request.environment);
  if (entries.length > MAX_ENV_ENTRIES || entries.some(([key, value]) =>
    !ENV_NAME.test(key) || !SAFE_ENV_NAMES.has(key) || typeof value !== "string" || value.length > 4096 || /[\r\n\0]/.test(value))) {
    throw new Error("Command environment is invalid or exceeds the allowlisted size limits.");
  }
  if (request.signal?.aborted) throw new Error("Sandbox command was cancelled before execution.");
}

export async function executeSandboxCommand(
  backend: SandboxBackend | null | undefined,
  request: SandboxCommandRequest,
): Promise<SandboxCommandResult> {
  if (!backend) throw new Error("Sandbox execution is disabled: no approved sandbox backend is configured.");
  if (!backend.name.trim()) throw new Error("Sandbox backend must have a stable name.");
  assertSandboxCommandRequest(request);
  const capabilities = await backend.getCapabilities(request.signal);
  assertSandboxCapabilities(capabilities);
  return backend.execute(request);
}
