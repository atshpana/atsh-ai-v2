import { randomUUID } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage } from "node:http";
import { assertSandboxCommandRequest, type SandboxBackend, type SandboxCapabilities, type SandboxCommandRequest, type SandboxCommandResult } from "./sandbox-contract.js";
import { applyWorkspaceTar, createWorkspaceTar, parseWorkspaceTar, safeSandboxArchiveDiagnostic } from "./sandbox-archive.js";

const DOCKER_API_VERSION = "v1.45";
const WORKSPACE_PATH = "/workspace";
const SANDBOX_RESULT_PATH = ".atsh-sandbox-result";
const REQUEST_TIMEOUT_MS = 15_000;
const MEMORY_BYTES = 512 * 1024 * 1024;
const WORKSPACE_TMPFS_BYTES = 256 * 1024 * 1024;
const TEMP_TMPFS_BYTES = 64 * 1024 * 1024;
const MAX_PIDS = 128;
const CPU_NANO_CPUS = 1_000_000_000;
export const SANDBOX_ENTRYPOINT = [
  "/bin/sh",
  "-c",
  "tar -x -f - -C /workspace --no-same-owner || exit $?; rm -rf /workspace/.atsh-sandbox-result /workspace/.atsh-sandbox-result.tmp || exit 125; \"$@\"; result=$?; printf '%s\\n' \"$result\" > /workspace/.atsh-sandbox-result.tmp || exit 125; mv /workspace/.atsh-sandbox-result.tmp /workspace/.atsh-sandbox-result || exit 125; exec sleep infinity",
  "atsh-sandbox-init",
] as const;
const SAFE_ENV_NAMES = new Set(["CI", "LANG", "NODE_ENV", "TZ"]);
const SAFE_POLICY_FAILURES = new Set([
  "Sandbox container did not preserve the required non-root process and bounded input settings.",
  "Sandbox container did not preserve the trusted bootstrap and requested direct command.",
  "Sandbox container security mode does not match the approved isolated policy.",
  "Sandbox container resource limits do not match the approved bounds.",
  "Sandbox container did not preserve private process, UTS, and cgroup namespaces.",
  "Sandbox container did not drop capabilities or disable privilege escalation.",
  "Sandbox container requested a host path, device, or published port.",
  "Sandbox container is missing bounded workspace or temporary storage.",
  "Sandbox container output logging is not bounded.",
  "Sandbox container contains missing or unapproved writable mounts.",
  "Sandbox container contains an unapproved mount.",
]);
const IMAGE_DIGEST = /^(?:[A-Za-z0-9._:/-]+@)?sha256:[a-f0-9]{64}$/i;
const DAEMON_ID = /^(?:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|[a-z0-9]{4}(?::[a-z0-9]{4}){11}|[a-f0-9]{64})$/i;

type DockerResponse = { statusCode: number; headers: IncomingMessage["headers"]; body: Buffer };

export type DockerContainerSpec = {
  Image: string;
  Entrypoint: string[];
  Cmd: string[];
  Env: string[];
  User: string;
  WorkingDir: string;
  Tty: boolean;
  AttachStdout: boolean;
  AttachStderr: boolean;
  AttachStdin: boolean;
  OpenStdin: boolean;
  StdinOnce: boolean;
  Labels: Record<string, string>;
  HostConfig: {
    AutoRemove: boolean;
    Init: boolean;
    Privileged: boolean;
    ReadonlyRootfs: boolean;
    NetworkMode: string;
    IpcMode: string;
    NanoCpus: number;
    Memory: number;
    MemorySwap: number;
    PidsLimit: number;
    PidMode?: string;
    UTSMode?: string;
    CgroupnsMode: string;
    CapDrop: string[];
    CapAdd: string[];
    SecurityOpt: string[];
    Binds: string[];
    VolumesFrom: string[];
    Devices: unknown[];
    DeviceRequests: unknown[];
    PortBindings: Record<string, unknown>;
    Tmpfs: Record<string, string>;
    RestartPolicy: { Name: string };
    LogConfig: { Type: string; Config: Record<string, string> };
  };
};

type DockerInfo = {
  ID?: string;
  OSType?: string;
  Labels?: string[];
  SecurityOptions?: string[];
  MemoryLimit?: boolean;
  SwapLimit?: boolean;
  PidsLimit?: boolean;
};

export type DockerSandboxConfig = {
  host: URL;
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
  expectedDaemonId: string;
  image: string;
  workspaceRoot: string;
};

export function safeDockerDiagnostic(body: Buffer): string | undefined {
  let message = body.toString("utf8").trim();
  try {
    const parsed = JSON.parse(message) as { message?: unknown };
    if (typeof parsed.message === "string") message = parsed.message;
  } catch {
    // Docker usually returns JSON, but keep a bounded plain-text response if it does not.
  }
  message = message
    .replace(/\b(authorization|token|secret|password|api[_ -]?key)\b\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
    .replace(/sha256:[a-f0-9]{64}/gi, "sha256:[redacted]")
    .replace(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/gi, "[id]")
    .replace(/\/(?:home|tmp|var|run)\/[^\s,:;]+/gi, "[path]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7e]/g, "?")
    .trim()
    .slice(0, 160);
  return message || undefined;
}

export function safeSandboxPolicyDiagnostic(error: unknown): string | undefined {
  if (error instanceof SafeSandboxPolicyDiagnosticError) return `${error.message} ${error.diagnostic}`;
  if (error instanceof Error && SAFE_POLICY_FAILURES.has(error.message)) return error.message;
  return undefined;
}

class SafeSandboxPolicyDiagnosticError extends Error {
  readonly diagnostic: string;

  constructor(message: string, diagnostic: string) {
    super(message);
    this.name = "SafeSandboxPolicyDiagnosticError";
    this.diagnostic = diagnostic;
  }
}

function summarizeMountPolicy(mounts: unknown): string {
  if (!Array.isArray(mounts)) return "Observed mount inventory: invalid.";
  const entries = mounts as Array<{ Type?: unknown; Destination?: unknown; RW?: unknown }>;
  const approvedTmpfs = (mount: typeof entries[number]) =>
    mount.Type === "tmpfs" && (mount.Destination === WORKSPACE_PATH || mount.Destination === "/tmp") && mount.RW === true;
  const count = entries.length > 100 ? "100+" : String(entries.length);
  const unapproved = entries.filter((mount) => !approvedTmpfs(mount)).length;
  const unapprovedCount = unapproved > 100 ? "100+" : String(unapproved);
  const workspaceTmpfs = entries.some((mount) => mount.Type === "tmpfs" && mount.Destination === WORKSPACE_PATH && mount.RW === true);
  const tempTmpfs = entries.some((mount) => mount.Type === "tmpfs" && mount.Destination === "/tmp" && mount.RW === true);
  return `Observed mount inventory: count=${count}; workspaceTmpfs=${workspaceTmpfs}; tempTmpfs=${tempTmpfs}; unapproved=${unapprovedCount}.`;
}

function errorMessage(statusCode: number, method: string, path: string, body: Buffer): Error {
  const route = path.split("?", 1)[0]!.replace(/\/containers\/[a-f0-9-]{12,64}(?=\/|$)/gi, "/containers/:id");
  const diagnostic = process.env.SANDBOX_INTEGRATION === "1" ? safeDockerDiagnostic(body) : undefined;
  const error = new Error(`Docker Engine request failed with HTTP ${statusCode} for ${method} ${route}.${diagnostic ? ` ${diagnostic}` : ""}`) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export class DockerEngineClient {
  private readonly host: URL;
  private readonly tls: { ca: Buffer; cert: Buffer; key: Buffer };

  constructor(config: Pick<DockerSandboxConfig, "host" | "ca" | "cert" | "key">) {
    this.host = config.host;
    this.tls = { ca: config.ca, cert: config.cert, key: config.key };
  }

  request(
    path: string,
    method = "GET",
    body?: Buffer,
    signal?: AbortSignal,
    maxResponseBytes = 70 * 1024 * 1024,
    contentType = "application/json",
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<DockerResponse> {
    if (!path.startsWith("/v1.45/")) return Promise.reject(new Error("Docker Engine API path is invalid."));
    if (signal?.aborted) return Promise.reject(new Error("Docker Engine request was cancelled."));
    return new Promise((resolvePromise, rejectPromise) => {
      let settled = false;
      const finishReject = (error: Error) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        rejectPromise(error);
      };
      const onAbort = () => request.destroy(new Error("Docker Engine request was cancelled."));
      const request = httpsRequest({
        protocol: "https:",
        hostname: this.host.hostname,
        port: this.host.port || 443,
        path,
        method,
        ca: this.tls.ca,
        cert: this.tls.cert,
        key: this.tls.key,
        rejectUnauthorized: true,
        ...(body ? { headers: { "content-type": contentType, "content-length": body.byteLength } } : {}),
      }, (response) => {
        const chunks: Buffer[] = [];
        let received = 0;
        response.on("data", (chunk: Buffer | string) => {
          const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          received += data.byteLength;
          if (received > maxResponseBytes) {
            request.destroy(new Error("Docker Engine response exceeds the configured size limit."));
            return;
          }
          chunks.push(data);
        });
        response.on("error", (error) => finishReject(error));
        response.on("end", () => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener("abort", onAbort);
          const result: DockerResponse = {
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
          };
          const successful = result.statusCode >= 200 && result.statusCode < 300;
          if (!successful) rejectPromise(errorMessage(result.statusCode, method, path, result.body));
          else resolvePromise(result);
        });
      });
      request.setTimeout(timeoutMs, () => request.destroy(new Error("Docker Engine request timed out.")));
      request.on("error", (error) => finishReject(error));
      signal?.addEventListener("abort", onAbort, { once: true });
      if (body) request.write(body);
      request.end();
    });
  }

  sendWorkspaceArchive(containerId: string, archive: Buffer, signal?: AbortSignal): Promise<void> {
    if (!/^[a-f0-9]{12,64}$/i.test(containerId)) return Promise.reject(new Error("Docker container ID is invalid."));
    if (signal?.aborted) return Promise.reject(new Error("Docker Engine request was cancelled."));
    const path = `/${DOCKER_API_VERSION}/containers/${containerId}/attach?stream=1&stdin=1&stdout=0&stderr=0`;
    return new Promise((resolvePromise, rejectPromise) => {
      let settled = false;
      const settle = (error?: Error) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        if (error) rejectPromise(error);
        else resolvePromise();
      };
      let socket: import("node:stream").Duplex | undefined;
      const onAbort = () => {
        socket?.destroy(new Error("Docker Engine request was cancelled."));
        request.destroy(new Error("Docker Engine request was cancelled."));
      };
      const request = httpsRequest({
        protocol: "https:",
        hostname: this.host.hostname,
        port: this.host.port || 443,
        path,
        method: "POST",
        ca: this.tls.ca,
        cert: this.tls.cert,
        key: this.tls.key,
        rejectUnauthorized: true,
        headers: { connection: "Upgrade", upgrade: "tcp", "content-length": "0" },
      }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        response.on("end", () => settle(errorMessage(response.statusCode ?? 0, "POST", path, Buffer.concat(chunks))));
        response.on("error", (error) => settle(error));
      });
      request.on("upgrade", (response, upgradedSocket, head) => {
        if (response.statusCode !== 101) {
          upgradedSocket.destroy();
          settle(errorMessage(response.statusCode ?? 0, "POST", path, head));
          return;
        }
        socket = upgradedSocket;
        socket.on("data", () => undefined);
        socket.on("error", (error) => settle(error));
        socket.on("close", () => {
          if (!settled) settle(new Error("Docker Engine closed the workspace input stream early."));
        });
        if (head.byteLength) socket.unshift(head);
        socket.end(archive, () => settle());
      });
      request.on("error", (error) => settle(error));
      signal?.addEventListener("abort", onAbort, { once: true });
      request.end();
    });
  }
}

function parseJson<T>(response: DockerResponse): T {
  try {
    return JSON.parse(response.body.toString("utf8")) as T;
  } catch {
    throw new Error("Docker Engine returned an invalid JSON response.");
  }
}

function dockerStatusCode(error: unknown): number | undefined {
  if (error instanceof Error && "statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  return undefined;
}

async function waitForSandboxExitCode(client: DockerEngineClient, containerId: string, signal: AbortSignal): Promise<number> {
  const markerSet = new Set([SANDBOX_RESULT_PATH]);
  const markerPath = `/${DOCKER_API_VERSION}/containers/${containerId}/archive?path=%2Fworkspace%2F${encodeURIComponent(SANDBOX_RESULT_PATH)}`;
  const inspectPath = `/${DOCKER_API_VERSION}/containers/${containerId}/json`;
  let lastStateCheck = Number.NEGATIVE_INFINITY;
  while (!signal.aborted) {
    try {
      const response = await client.request(markerPath, "GET", undefined, signal, 1024 * 1024, "application/json", 1_000);
      const marker = parseWorkspaceTar(response.body, markerSet).find((entry) => entry.path === SANDBOX_RESULT_PATH && entry.kind === "file");
      const rawExitCode = marker?.data?.toString("ascii").trim();
      if (!rawExitCode || !/^(?:0|[1-9][0-9]{0,2})$/.test(rawExitCode)) {
        throw new Error("Sandbox completion marker contains an invalid exit code.");
      }
      const exitCode = Number(rawExitCode);
      if (exitCode > 255) throw new Error("Sandbox completion marker contains an invalid exit code.");
      return exitCode;
    } catch (error) {
      if (dockerStatusCode(error) !== 404) throw error;
      if (performance.now() - lastStateCheck >= 1_000) {
        lastStateCheck = performance.now();
        const inspect = parseJson<{ State?: { Running?: boolean } }>(await client.request(inspectPath, "GET", undefined, signal, 1_000_000));
        if (inspect.State?.Running === false) throw new Error("Sandbox container exited before publishing its result.");
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
  throw new Error("Sandbox command was cancelled.");
}

export function assertDockerDaemonIdentity(info: DockerInfo, expectedDaemonId: string): void {
  if (!DAEMON_ID.test(expectedDaemonId) || info.ID?.toLowerCase() !== expectedDaemonId.toLowerCase()) {
    throw new Error("Docker sandbox daemon identity did not match the configured pin.");
  }
  if (info.OSType !== "linux") throw new Error("Docker sandbox daemon must run Linux containers.");
  if (!info.Labels?.includes("atsh.sandbox=true")) throw new Error("Docker daemon is not labeled as a dedicated ATSH sandbox.");
  if (!info.SecurityOptions?.some((option) => option.toLowerCase().includes("rootless"))) {
    throw new Error("Docker sandbox daemon must run in rootless mode.");
  }
  if (info.MemoryLimit !== true || info.SwapLimit !== true || info.PidsLimit !== true) {
    throw new Error("Docker sandbox daemon does not report required cgroup resource-limit support.");
  }
}

export function buildDockerContainerSpec(
  image: string,
  request: SandboxCommandRequest,
  outputBytes: number,
): DockerContainerSpec {
  if (!IMAGE_DIGEST.test(image)) throw new Error("Sandbox image must be referenced by an immutable sha256 digest.");
  const environment = Object.entries(request.environment);
  if (environment.some(([key, value]) => !SAFE_ENV_NAMES.has(key) || /[\r\n\0]/.test(value))) {
    throw new Error("Sandbox environment contains a non-allowlisted variable.");
  }
  const logKibibytes = Math.max(1, Math.ceil(outputBytes / 1024));
  return {
    Image: image,
    Entrypoint: [...SANDBOX_ENTRYPOINT],
    Cmd: request.command,
    Env: [
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "HOME=/tmp",
      "TMPDIR=/tmp",
      "CI=true",
      ...environment.map(([key, value]) => `${key}=${value}`),
    ],
    User: "65532:65532",
    WorkingDir: WORKSPACE_PATH,
    Tty: false,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: true,
    OpenStdin: true,
    StdinOnce: true,
    Labels: { "atsh.sandbox": "true", "atsh.job.id": request.jobId },
    HostConfig: {
      AutoRemove: false,
      Init: true,
      Privileged: false,
      ReadonlyRootfs: true,
      NetworkMode: "none",
      IpcMode: "none",
      NanoCpus: CPU_NANO_CPUS,
      Memory: MEMORY_BYTES,
      MemorySwap: MEMORY_BYTES,
      PidsLimit: MAX_PIDS,
      CgroupnsMode: "private",
      CapDrop: ["ALL"],
      CapAdd: [],
      SecurityOpt: ["no-new-privileges:true"],
      Binds: [],
      VolumesFrom: [],
      Devices: [],
      DeviceRequests: [],
      PortBindings: {},
      Tmpfs: {
        [WORKSPACE_PATH]: `rw,nosuid,nodev,size=${WORKSPACE_TMPFS_BYTES},mode=0700,uid=65532,gid=65532`,
        "/tmp": `rw,nosuid,nodev,noexec,size=${TEMP_TMPFS_BYTES},mode=0700,uid=65532,gid=65532`,
      },
      RestartPolicy: { Name: "no" },
      LogConfig: { Type: "local", Config: { "max-size": `${logKibibytes}k`, "max-file": "1", compress: "false" } },
    },
  };
}

export function assertCreatedContainerSecurity(inspect: {
  Config?: { User?: string; Tty?: boolean; OpenStdin?: boolean; StdinOnce?: boolean; Entrypoint?: string[] | null; Cmd?: string[] };
  HostConfig?: {
    Privileged?: boolean;
    ReadonlyRootfs?: boolean;
    NetworkMode?: string;
    IpcMode?: string;
    NanoCpus?: number;
    Memory?: number;
    MemorySwap?: number;
    PidsLimit?: number | null;
    PidMode?: string;
    UTSMode?: string;
    CgroupnsMode?: string;
    CapDrop?: string[];
    CapAdd?: string[] | null;
    SecurityOpt?: string[];
    Binds?: string[] | null;
    VolumesFrom?: string[] | null;
    Devices?: unknown[];
    DeviceRequests?: unknown[] | null;
    PortBindings?: Record<string, unknown> | null;
    Tmpfs?: Record<string, string>;
    LogConfig?: { Type?: string; Config?: Record<string, string> };
  };
  Mounts?: Array<{ Type?: string; Destination?: string; RW?: boolean }>;
}, outputBytes = 2_000_000, expectedCommand?: string[]): void {
  const host = inspect.HostConfig;
  if (inspect.Config?.User !== "65532:65532" || inspect.Config.Tty !== false ||
      inspect.Config.OpenStdin !== true || inspect.Config.StdinOnce !== true) {
    throw new Error("Sandbox container did not preserve the required non-root process and bounded input settings.");
  }
  if (JSON.stringify(inspect.Config.Entrypoint) !== JSON.stringify(SANDBOX_ENTRYPOINT) ||
      (expectedCommand && JSON.stringify(inspect.Config.Cmd) !== JSON.stringify(expectedCommand))) {
    throw new Error("Sandbox container did not preserve the trusted bootstrap and requested direct command.");
  }
  if (!host || host.Privileged !== false || host.ReadonlyRootfs !== true || host.NetworkMode !== "none" || host.IpcMode !== "none") {
    throw new Error("Sandbox container security mode does not match the approved isolated policy.");
  }
  if (host.NanoCpus !== CPU_NANO_CPUS || host.Memory !== MEMORY_BYTES || host.MemorySwap !== MEMORY_BYTES || host.PidsLimit !== MAX_PIDS) {
    throw new Error("Sandbox container resource limits do not match the approved bounds.");
  }
  if ((host.PidMode !== undefined && host.PidMode !== "") ||
      (host.UTSMode !== undefined && host.UTSMode !== "") || host.CgroupnsMode !== "private") {
    throw new Error("Sandbox container did not preserve private process, UTS, and cgroup namespaces.");
  }
  if (host.CapDrop?.length !== 1 || host.CapDrop[0] !== "ALL" || (host.CapAdd?.length ?? 0) !== 0 ||
      host.SecurityOpt?.length !== 1 || host.SecurityOpt[0] !== "no-new-privileges:true") {
    throw new Error("Sandbox container did not drop capabilities or disable privilege escalation.");
  }
  if ((host.Binds?.length ?? 0) !== 0 || (host.VolumesFrom?.length ?? 0) !== 0 ||
      (host.Devices?.length ?? 0) !== 0 || (host.DeviceRequests?.length ?? 0) !== 0 ||
      Object.keys(host.PortBindings ?? {}).length !== 0) {
    throw new Error("Sandbox container requested a host path, device, or published port.");
  }
  const writablePaths = Object.keys(host.Tmpfs ?? {}).sort();
  if (JSON.stringify(writablePaths) !== JSON.stringify(["/tmp", WORKSPACE_PATH].sort()) ||
      !host.Tmpfs?.[WORKSPACE_PATH]?.includes(`size=${WORKSPACE_TMPFS_BYTES}`) ||
      !host.Tmpfs["/tmp"]?.includes(`size=${TEMP_TMPFS_BYTES}`)) {
    throw new Error("Sandbox container is missing bounded workspace or temporary storage.");
  }
  const expectedLogSize = `${Math.max(1, Math.ceil(outputBytes / 1024))}k`;
  if (host.LogConfig?.Type !== "local" || host.LogConfig.Config?.["max-file"] !== "1" ||
      host.LogConfig.Config["max-size"] !== expectedLogSize || host.LogConfig.Config.compress !== "false") {
    throw new Error("Sandbox container output logging is not bounded.");
  }
  // Docker reports tmpfs Mounts only after a created container starts. This
  // validation runs before start, so HostConfig.Tmpfs above is authoritative
  // here; validate Mounts strictly if the daemon does return a materialized list.
  if (Array.isArray(inspect.Mounts) && inspect.Mounts.length > 0 &&
      (inspect.Mounts.length !== 2 ||
       ![WORKSPACE_PATH, "/tmp"].every((destination) => inspect.Mounts?.some((mount) =>
         mount.Type === "tmpfs" && mount.Destination === destination && mount.RW === true)))) {
    throw new SafeSandboxPolicyDiagnosticError(
      "Sandbox container contains missing or unapproved writable mounts.",
      summarizeMountPolicy(inspect.Mounts),
    );
  }
  for (const mount of inspect.Mounts ?? []) {
    if (mount.Type !== "tmpfs" || (mount.Destination !== WORKSPACE_PATH && mount.Destination !== "/tmp")) {
      throw new Error("Sandbox container contains an unapproved mount.");
    }
  }
}

function truncateUtf8(text: string, maxBytes: number): string {
  let acceptedBytes = 0;
  let acceptedCharacters = 0;
  for (const character of text) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (acceptedBytes + characterBytes > maxBytes) break;
    acceptedBytes += characterBytes;
    acceptedCharacters += character.length;
  }
  return text.slice(0, acceptedCharacters);
}

export function demultiplexDockerLogs(buffer: Buffer, maxBytes: number): { stdout: string; stderr: string } {
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  let outputSize = 0;
  let offset = 0;
  while (offset + 8 <= buffer.byteLength && outputSize < maxBytes) {
    const streamType = buffer[offset]!;
    const frameSize = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if ((streamType !== 1 && streamType !== 2) || offset + frameSize > buffer.byteLength) break;
    const remaining = maxBytes - outputSize;
    const partSize = Math.min(frameSize, remaining);
    const part = Buffer.from(buffer.subarray(offset, offset + partSize));
    (streamType === 1 ? stdout : stderr).push(part);
    outputSize += partSize;
    offset += frameSize;
  }
  const stdoutText = Buffer.concat(stdout).toString("utf8");
  const stderrText = Buffer.concat(stderr).toString("utf8");
  if (Buffer.byteLength(stdoutText, "utf8") + Buffer.byteLength(stderrText, "utf8") <= maxBytes) {
    return { stdout: stdoutText, stderr: stderrText };
  }
  const boundedStdout = truncateUtf8(stdoutText, maxBytes);
  const remainingBytes = Math.max(0, maxBytes - Buffer.byteLength(boundedStdout, "utf8"));
  return { stdout: boundedStdout, stderr: truncateUtf8(stderrText, remainingBytes) };
}

function assertWorkspaceBelongsToJob(workspaceRoot: string, workspace: string, jobId: string): Promise<string> {
  return (async () => {
    if (!isAbsolute(workspaceRoot) || !isAbsolute(workspace)) throw new Error("Sandbox workspace paths must be absolute.");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
      throw new Error("Sandbox job identifier must be a UUID.");
    }
    const root = await realpath(workspaceRoot);
    const target = await realpath(workspace);
    const rel = relative(root, target);
    if (rel !== jobId || rel.startsWith(`..${sep}`) || resolve(root, jobId) !== target) {
      throw new Error("Sandbox workspace must be the assigned job directory under its configured root.");
    }
    if (!(await stat(target)).isDirectory()) throw new Error("Sandbox workspace must be a directory.");
    return target;
  })();
}

export class DockerSandboxBackend implements SandboxBackend {
  readonly name = "docker-engine-rootless-mtls";
  private readonly client: DockerEngineClient;
  private readonly expectedDaemonId: string;
  private readonly image: string;
  private readonly workspaceRoot: string;

  constructor(config: DockerSandboxConfig) {
    if (config.host.protocol !== "https:" || config.host.username || config.host.password || config.host.search || config.host.hash || (config.host.pathname !== "/" && config.host.pathname !== "")) {
      throw new Error("Sandbox Docker API endpoint must be an HTTPS origin without credentials or a path.");
    }
    if (!DAEMON_ID.test(config.expectedDaemonId)) throw new Error("A pinned Docker sandbox daemon ID is required.");
    if (!IMAGE_DIGEST.test(config.image)) throw new Error("Sandbox image must be referenced by an immutable sha256 digest.");
    if (!isAbsolute(config.workspaceRoot)) throw new Error("AGENT_WORKSPACE_ROOT must be an absolute path.");
    this.client = new DockerEngineClient(config);
    this.expectedDaemonId = config.expectedDaemonId;
    this.image = config.image;
    this.workspaceRoot = config.workspaceRoot;
  }

  async getCapabilities(signal?: AbortSignal): Promise<SandboxCapabilities> {
    const response = await this.client.request(`/${DOCKER_API_VERSION}/info`, "GET", undefined, signal, 1_000_000);
    assertDockerDaemonIdentity(parseJson<DockerInfo>(response), this.expectedDaemonId);
    return {
      isolation: "container",
      nonRoot: true,
      noHostNetwork: true,
      noCoreDbNetwork: true,
      noHostSockets: true,
      readOnlyRootFilesystem: true,
      workspaceAndTmpOnlyWritable: true,
      cpuLimit: true,
      memoryLimit: true,
      processLimit: true,
      timeoutLimit: true,
      outputLimit: true,
      networkPolicy: "disabled",
    };
  }

  async execute(request: SandboxCommandRequest): Promise<SandboxCommandResult> {
    assertSandboxCommandRequest(request);
    await this.getCapabilities(request.signal);
    const workspace = await assertWorkspaceBelongsToJob(this.workspaceRoot, request.workspace, request.jobId);
    const workspaceTar = await createWorkspaceTar(workspace);
    const containerName = `atsh-sandbox-${request.jobId}-${randomUUID().slice(0, 8)}`;
    const spec = buildDockerContainerSpec(this.image, request, request.maxOutputBytes);
    const controller = new AbortController();
    const signals = request.signal ? [request.signal, controller.signal] : [controller.signal];
    const operationSignal = AbortSignal.any(signals);
    let timedOut = false;
    const startedAt = performance.now();
    let integrationStage: "container-create" | "policy-inspection" | "container-start" | "workspace-input" | "command-completion" | "command-logs" | "workspace-output" | "workspace-apply" = "container-create";
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeoutMs);
    let containerId: string | undefined;
    let createAttempted = false;
    try {
      createAttempted = true;
      const createResponse = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/create?name=${encodeURIComponent(containerName)}`,
        "POST",
        Buffer.from(JSON.stringify(spec)),
        operationSignal,
        1_000_000,
      );
      const created = parseJson<{ Id?: string }>(createResponse);
      if (!created.Id || !/^[a-f0-9]{12,64}$/i.test(created.Id)) throw new Error("Docker Engine did not return a valid sandbox container ID.");
      containerId = created.Id;

      integrationStage = "policy-inspection";
      const inspectResponse = await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}/json`, "GET", undefined, operationSignal, 1_000_000);
      const inspect = parseJson<Parameters<typeof assertCreatedContainerSecurity>[0]>(inspectResponse);
      assertCreatedContainerSecurity(inspect, request.maxOutputBytes, request.command);

      integrationStage = "container-start";
      await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}/start`, "POST", undefined, operationSignal, 1_000_000);
      integrationStage = "workspace-input";
      await this.client.sendWorkspaceArchive(containerId, workspaceTar, operationSignal);
      integrationStage = "command-completion";
      const exitCode = await waitForSandboxExitCode(this.client, containerId, operationSignal);
      await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}/pause`, "POST", undefined, operationSignal, 1_000_000);

      integrationStage = "command-logs";
      const logResponse = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/logs?stdout=1&stderr=1`,
        "GET",
        undefined,
        operationSignal,
        request.maxOutputBytes + 64 * 1024,
      );
      const logs = demultiplexDockerLogs(logResponse.body, request.maxOutputBytes);

      integrationStage = "workspace-output";
      const archiveResponse = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/archive?path=%2Fworkspace`,
        "GET",
        undefined,
        operationSignal,
      );
      integrationStage = "workspace-apply";
      await applyWorkspaceTar(workspace, archiveResponse.body, new Set([SANDBOX_RESULT_PATH]));
      return {
        exitCode,
        stdout: logs.stdout,
        stderr: logs.stderr,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    } catch (error) {
      if (timedOut) {
        if (process.env.SANDBOX_INTEGRATION === "1") throw new Error(`Sandbox command timed out during integration stage ${integrationStage}.`);
        throw new Error(`Sandbox command timed out after ${request.timeoutMs} milliseconds.`);
      }
      if (request.signal?.aborted) throw new Error("Sandbox command was cancelled.");
      const policyDiagnostic = process.env.SANDBOX_INTEGRATION === "1" ? safeSandboxPolicyDiagnostic(error) : undefined;
      if (policyDiagnostic) throw new Error(`Sandbox command failed. ${policyDiagnostic}`);
      if (error instanceof Error && /^Docker Engine request failed with HTTP \d{3} for (GET|POST|PUT|DELETE) \/v1\.45\//.test(error.message)) {
        throw new Error(`Sandbox command failed. ${error.message} Response details were suppressed.`);
      }
      const archiveDiagnostic = process.env.SANDBOX_INTEGRATION === "1" ? safeSandboxArchiveDiagnostic(error) : undefined;
      if (archiveDiagnostic) throw new Error(`Sandbox command failed. ${archiveDiagnostic}`);
      if (process.env.SANDBOX_INTEGRATION === "1") {
        throw new Error(`Sandbox command failed during integration stage ${integrationStage}.`);
      }
      throw new Error("Sandbox command failed. Docker Engine returned an error; sensitive details were suppressed.");
    } finally {
      clearTimeout(timer);
      if (containerId) await this.forceRemove(containerId);
      else if (createAttempted) await this.forceRemoveByName(containerName);
    }
  }

  private async forceRemove(containerId: string): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}?force=1&v=1`, "DELETE", undefined, undefined, 1_000_000, "application/json", 5_000);
        return;
      } catch {
        if (attempt === 1) throw new Error("Sandbox container cleanup failed; the result was discarded.");
      }
    }
  }

  private async forceRemoveByName(containerName: string): Promise<void> {
    const filters = encodeURIComponent(JSON.stringify({ name: [containerName] }));
    try {
      const response = await this.client.request(`/${DOCKER_API_VERSION}/containers/json?all=1&filters=${filters}`, "GET", undefined, undefined, 1_000_000, "application/json", 5_000);
      const containers = parseJson<Array<{ Id?: string }>>(response);
      for (const container of containers) {
        if (container.Id && /^[a-f0-9]{12,64}$/i.test(container.Id)) await this.forceRemove(container.Id);
      }
    } catch {
      throw new Error("Sandbox container cleanup failed; the result was discarded.");
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to enable the isolated build sandbox.`);
  return value;
}

export async function createDockerSandboxBackendFromEnv(): Promise<DockerSandboxBackend | null> {
  const names = [
    "SANDBOX_DOCKER_HOST",
    "SANDBOX_DOCKER_CA_FILE",
    "SANDBOX_DOCKER_CERT_FILE",
    "SANDBOX_DOCKER_KEY_FILE",
    "SANDBOX_DOCKER_EXPECTED_DAEMON_ID",
    "SANDBOX_IMAGE",
  ];
  const configured = names.filter((name) => Boolean(process.env[name]?.trim()));
  if (configured.length === 0) return null;
  if (configured.length !== names.length) throw new Error("Sandbox configuration is incomplete; refusing to enable command execution.");
  const hostText = requireEnv("SANDBOX_DOCKER_HOST");
  let host: URL;
  try {
    host = new URL(hostText);
  } catch {
    throw new Error("SANDBOX_DOCKER_HOST must be a valid HTTPS URL.");
  }
  if (host.protocol !== "https:") throw new Error("SANDBOX_DOCKER_HOST must use HTTPS with mutual TLS.");
  const [ca, cert, key] = await Promise.all([
    readFile(requireEnv("SANDBOX_DOCKER_CA_FILE")),
    readFile(requireEnv("SANDBOX_DOCKER_CERT_FILE")),
    readFile(requireEnv("SANDBOX_DOCKER_KEY_FILE")),
  ]);
  return new DockerSandboxBackend({
    host,
    ca,
    cert,
    key,
    expectedDaemonId: requireEnv("SANDBOX_DOCKER_EXPECTED_DAEMON_ID"),
    image: requireEnv("SANDBOX_IMAGE"),
    workspaceRoot: requireEnv("AGENT_WORKSPACE_ROOT"),
  });
}
