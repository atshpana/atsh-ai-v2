import { randomUUID } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage } from "node:http";
import { assertSandboxCommandRequest, type SandboxBackend, type SandboxCapabilities, type SandboxCommandRequest, type SandboxCommandResult } from "./sandbox-contract.js";
import { applyWorkspaceTar, createWorkspaceTar } from "./sandbox-archive.js";

const DOCKER_API_VERSION = "v1.45";
const WORKSPACE_PATH = "/workspace";
const TIMEOUT_GRACE_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;
const MEMORY_BYTES = 512 * 1024 * 1024;
const WORKSPACE_TMPFS_BYTES = 256 * 1024 * 1024;
const TEMP_TMPFS_BYTES = 64 * 1024 * 1024;
const MAX_PIDS = 128;
const CPU_NANO_CPUS = 1_000_000_000;
const SAFE_ENV_NAMES = new Set(["CI", "LANG", "NODE_ENV", "TZ"]);
const IMAGE_DIGEST = /^(?:[A-Za-z0-9._:/-]+@)?sha256:[a-f0-9]{64}$/i;
const DAEMON_ID = /^[a-f0-9]{64}$/i;

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
    PidMode: string;
    UTSMode: string;
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

function errorMessage(statusCode: number): Error {
  return new Error(`Docker Engine request failed with HTTP ${statusCode}.`);
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
          if (!successful) rejectPromise(errorMessage(result.statusCode));
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
}

function parseJson<T>(response: DockerResponse): T {
  try {
    return JSON.parse(response.body.toString("utf8")) as T;
  } catch {
    throw new Error("Docker Engine returned an invalid JSON response.");
  }
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
    Entrypoint: [],
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
    AttachStdin: false,
    OpenStdin: false,
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
      PidMode: "private",
      UTSMode: "private",
      CgroupnsMode: "private",
      CapDrop: ["ALL"],
      CapAdd: [],
      SecurityOpt: ["no-new-privileges:true"],
      Binds: [],
      VolumesFrom: [],
      Devices: [],
      PortBindings: {},
      Tmpfs: {
        [WORKSPACE_PATH]: `rw,nosuid,nodev,size=${WORKSPACE_TMPFS_BYTES},mode=0700,uid=65532,gid=65532`,
        "/tmp": `rw,nosuid,nodev,noexec,size=${TEMP_TMPFS_BYTES},mode=0700,uid=65532,gid=65532`,
      },
      RestartPolicy: { Name: "no" },
      LogConfig: { Type: "local", Config: { "max-size": `${logKibibytes}k`, "max-file": "1" } },
    },
  };
}

export function assertCreatedContainerSecurity(inspect: {
  Config?: { User?: string; Tty?: boolean; OpenStdin?: boolean; Entrypoint?: string[] | null; Cmd?: string[] };
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
  if (inspect.Config?.User !== "65532:65532" || inspect.Config.Tty !== false || inspect.Config.OpenStdin !== false) {
    throw new Error("Sandbox container did not preserve the required non-root process settings.");
  }
  if ((inspect.Config.Entrypoint?.length ?? 0) !== 0 ||
      (expectedCommand && JSON.stringify(inspect.Config.Cmd) !== JSON.stringify(expectedCommand))) {
    throw new Error("Sandbox container did not preserve the requested direct command.");
  }
  if (!host || host.Privileged !== false || host.ReadonlyRootfs !== true || host.NetworkMode !== "none" || host.IpcMode !== "none") {
    throw new Error("Sandbox container security mode does not match the approved isolated policy.");
  }
  if (host.NanoCpus !== CPU_NANO_CPUS || host.Memory !== MEMORY_BYTES || host.MemorySwap !== MEMORY_BYTES || host.PidsLimit !== MAX_PIDS) {
    throw new Error("Sandbox container resource limits do not match the approved bounds.");
  }
  if (host.PidMode !== "private" || host.UTSMode !== "private" || host.CgroupnsMode !== "private") {
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
  if (host.LogConfig?.Type !== "local" || host.LogConfig.Config?.["max-file"] !== "1" || host.LogConfig.Config["max-size"] !== expectedLogSize) {
    throw new Error("Sandbox container output logging is not bounded.");
  }
  if (!Array.isArray(inspect.Mounts) || inspect.Mounts.length !== 2 ||
      ![WORKSPACE_PATH, "/tmp"].every((destination) => inspect.Mounts?.some((mount) =>
        mount.Type === "tmpfs" && mount.Destination === destination && mount.RW === true))) {
    throw new Error("Sandbox container contains missing or unapproved writable mounts.");
  }
  for (const mount of inspect.Mounts) {
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

      const inspectResponse = await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}/json`, "GET", undefined, operationSignal, 1_000_000);
      const inspect = parseJson<Parameters<typeof assertCreatedContainerSecurity>[0]>(inspectResponse);
      assertCreatedContainerSecurity(inspect, request.maxOutputBytes, request.command);

      await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/archive?path=%2Fworkspace`,
        "PUT",
        workspaceTar,
        operationSignal,
        1_000_000,
        "application/x-tar",
      );
      await this.client.request(`/${DOCKER_API_VERSION}/containers/${containerId}/start`, "POST", undefined, operationSignal, 1_000_000);
      const wait = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/wait?condition=not-running`,
        "POST",
        undefined,
        operationSignal,
        1_000_000,
        "application/json",
        request.timeoutMs + TIMEOUT_GRACE_MS,
      );
      const waitResult = parseJson<{ StatusCode?: number }>(wait);
      if (!Number.isInteger(waitResult.StatusCode)) throw new Error("Docker Engine did not return a sandbox exit status.");

      const logResponse = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/logs?stdout=1&stderr=1`,
        "GET",
        undefined,
        operationSignal,
        request.maxOutputBytes + 64 * 1024,
      );
      const logs = demultiplexDockerLogs(logResponse.body, request.maxOutputBytes);

      const archiveResponse = await this.client.request(
        `/${DOCKER_API_VERSION}/containers/${containerId}/archive?path=%2Fworkspace`,
        "GET",
        undefined,
        operationSignal,
      );
      await applyWorkspaceTar(workspace, archiveResponse.body);
      return {
        exitCode: waitResult.StatusCode,
        stdout: logs.stdout,
        stderr: logs.stderr,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    } catch {
      if (timedOut) throw new Error(`Sandbox command timed out after ${request.timeoutMs} milliseconds.`);
      if (request.signal?.aborted) throw new Error("Sandbox command was cancelled.");
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
