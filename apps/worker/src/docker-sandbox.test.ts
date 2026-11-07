import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  assertCreatedContainerSecurity,
  assertDockerDaemonIdentity,
  buildDockerContainerSpec,
  demultiplexDockerLogs,
  SANDBOX_ENTRYPOINT,
  safeDockerDiagnostic,
  safeSandboxPolicyDiagnostic,
} from "./docker-sandbox.js";
import type { SandboxCommandRequest } from "./sandbox-contract.js";

const image = `sha256:${"a".repeat(64)}`;
const daemonId = "c20f7230-59a2-4824-a2f4-fda71c982ee6";
const request: SandboxCommandRequest = {
  jobId: "c03bb714-4c31-4c31-b8f0-cca21c3df1c5",
  workspace: "/var/lib/atsh-agent/jobs/c03bb714-4c31-4c31-b8f0-cca21c3df1c5",
  command: ["node", "--version"],
  environment: { NODE_ENV: "test" },
  timeoutMs: 60_000,
  maxOutputBytes: 10_000,
};

function daemonInfo() {
  return {
    ID: daemonId,
    OSType: "linux",
    Labels: ["atsh.sandbox=true"],
    SecurityOptions: ["name=seccomp,profile=default", "name=rootless", "name=cgroupns"],
    MemoryLimit: true,
    SwapLimit: true,
    PidsLimit: true,
  };
}

function safeInspect() {
  return {
    Config: { User: "65532:65532", Tty: false, OpenStdin: true, StdinOnce: true, Entrypoint: [...SANDBOX_ENTRYPOINT], Cmd: request.command },
    HostConfig: {
      Privileged: false,
      ReadonlyRootfs: true,
      NetworkMode: "none",
      IpcMode: "none",
      NanoCpus: 1_000_000_000,
      Memory: 512 * 1024 * 1024,
      MemorySwap: 512 * 1024 * 1024,
      PidsLimit: 128,
      PidMode: "",
      UTSMode: "",
      CgroupnsMode: "private",
      CapDrop: ["ALL"],
      CapAdd: [],
      SecurityOpt: ["no-new-privileges:true"],
      Binds: [],
      VolumesFrom: [],
      Devices: [],
      DeviceRequests: [],
      PortBindings: {},
      Tmpfs: { "/workspace": "rw,size=268435456", "/tmp": "rw,size=67108864" },
      LogConfig: { Type: "local", Config: { "max-size": "10k", "max-file": "1", compress: "false" } },
    },
    Mounts: [
      { Type: "tmpfs", Destination: "/workspace", RW: true },
      { Type: "tmpfs", Destination: "/tmp", RW: true },
    ],
  };
}

test("requires a pinned dedicated rootless Linux sandbox daemon with limit support", () => {
  assert.doesNotThrow(() => assertDockerDaemonIdentity(daemonInfo(), daemonId));
  assert.doesNotThrow(() => assertDockerDaemonIdentity({ ...daemonInfo(), ID: "J6Q3:IPZB:QYBB:VPBQ:UMPP:KARE:6ZNR:XE6T:7EWV:PKF4:ZOJD:TPYS" }, "J6Q3:IPZB:QYBB:VPBQ:UMPP:KARE:6ZNR:XE6T:7EWV:PKF4:ZOJD:TPYS"));
  assert.doesNotThrow(() => assertDockerDaemonIdentity({ ...daemonInfo(), ID: "a".repeat(64) }, "a".repeat(64)));
  assert.throws(() => assertDockerDaemonIdentity(daemonInfo(), "c20f7230-59a2-4824-a2f4-fda71c982ee7"), /identity did not match/);
  assert.throws(() => assertDockerDaemonIdentity(daemonInfo(), "not-a-docker-id"), /identity did not match/);
  assert.throws(() => assertDockerDaemonIdentity({ ...daemonInfo(), Labels: [] }, daemonId), /dedicated ATSH sandbox/);
  assert.throws(() => assertDockerDaemonIdentity({ ...daemonInfo(), SecurityOptions: [] }, daemonId), /rootless mode/);
  assert.throws(() => assertDockerDaemonIdentity({ ...daemonInfo(), PidsLimit: false }, daemonId), /resource-limit support/);
});

test("constructs a non-root, networkless, read-only, resource-bounded container without host mounts", () => {
  const spec = buildDockerContainerSpec(image, request, request.maxOutputBytes);
  assert.equal(spec.User, "65532:65532");
  assert.deepEqual(spec.Entrypoint, [...SANDBOX_ENTRYPOINT]);
  assert.match(spec.Entrypoint[2]!, /tar -x -f - -C \/workspace/);
  assert.match(spec.Entrypoint[2]!, /\.atsh-sandbox-result/);
  assert.match(spec.Entrypoint[2]!, /exit 125/);
  assert.match(spec.Entrypoint[2]!, /sleep infinity/);
  assert.equal(spec.AttachStdin, true);
  assert.equal(spec.OpenStdin, true);
  assert.equal(spec.StdinOnce, true);
  assert.deepEqual(spec.Cmd, request.command);
  assert.deepEqual(spec.Env, [
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "HOME=/tmp",
    "TMPDIR=/tmp",
    "CI=true",
    "NODE_ENV=test",
  ]);
  assert.equal(spec.HostConfig.NetworkMode, "none");
  assert.equal(spec.HostConfig.ReadonlyRootfs, true);
  assert.equal(spec.HostConfig.Memory, 512 * 1024 * 1024);
  assert.equal(spec.HostConfig.MemorySwap, 512 * 1024 * 1024);
  assert.equal(spec.HostConfig.PidsLimit, 128);
  assert.equal(spec.HostConfig.PidMode, undefined);
  assert.equal(spec.HostConfig.UTSMode, undefined);
  assert.deepEqual(spec.HostConfig.CapDrop, ["ALL"]);
  assert.deepEqual(spec.HostConfig.DeviceRequests, []);
  assert.deepEqual(spec.HostConfig.Binds, []);
  assert.equal(spec.HostConfig.LogConfig.Config["max-size"], "10k");
  assert.equal(spec.HostConfig.LogConfig.Config.compress, "false");
});

test("rejects mutable images and secret-like environment variables", () => {
  assert.throws(() => buildDockerContainerSpec("node:22", request, 1000), /immutable sha256 digest/);
  assert.throws(() => buildDockerContainerSpec(image, {
    ...request,
    environment: { OPENAI_API_KEY: "never-allowed" },
  }, 1000), /non-allowlisted/);
});

test("keeps decoded log output within the byte cap for multibyte UTF-8", () => {
  const frame = Buffer.from([1, 0, 0, 0, 0, 0, 0, 3, 0xe2, 0x82, 0xac]);
  const result = demultiplexDockerLogs(frame, 1);
  assert.equal(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr) <= 1, true);
});

test("sanitizes Docker diagnostics before opt-in integration logging", () => {
  const diagnostic = safeDockerDiagnostic(Buffer.from(JSON.stringify({
    message: `invalid mount /home/runner/work/private token=secret-value sha256:${"a".repeat(64)} 123e4567-e89b-12d3-a456-426614174000`,
  })));
  assert.ok(diagnostic);
  assert.equal(diagnostic.includes("secret-value"), false);
  assert.equal(diagnostic.includes("/home/runner"), false);
  assert.equal(diagnostic.includes("a".repeat(64)), false);
  assert.equal(diagnostic.includes("123e4567-e89b-12d3-a456-426614174000"), false);
  assert.equal(diagnostic.length <= 160, true);
});

test("exposes only allowlisted sandbox policy failures in integration diagnostics", () => {
  const policyFailure = new Error("Sandbox container security mode does not match the approved isolated policy.");
  assert.equal(safeSandboxPolicyDiagnostic(policyFailure), policyFailure.message);
  assert.equal(safeSandboxPolicyDiagnostic(new Error("unexpected token=private-value")), undefined);
});

test("summarizes inspected mount mismatches without exposing source paths", () => {
  let failure: unknown;
  try {
    assertCreatedContainerSecurity({
      ...safeInspect(),
      Mounts: [
        { Type: "tmpfs", Destination: "/workspace", RW: true },
        { Type: "bind", Destination: "/private/host/source", RW: true },
      ],
    }, request.maxOutputBytes, request.command);
  } catch (error) {
    failure = error;
  }
  const diagnostic = safeSandboxPolicyDiagnostic(failure);
  assert.equal(diagnostic, "Sandbox container contains missing or unapproved writable mounts. Observed mount inventory: count=2; workspaceTmpfs=true; tempTmpfs=false; unapproved=1.");
  assert.equal(diagnostic?.includes("/private/host/source"), false);
});

test("refuses an inspected container whose effective security settings differ from policy", () => {
  assert.doesNotThrow(() => assertCreatedContainerSecurity(safeInspect(), request.maxOutputBytes, request.command));
  assert.doesNotThrow(() => assertCreatedContainerSecurity({ ...safeInspect(), Mounts: [] }, request.maxOutputBytes, request.command));
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    HostConfig: { ...safeInspect().HostConfig, NetworkMode: "bridge" },
  }, request.maxOutputBytes), /security mode/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    HostConfig: { ...safeInspect().HostConfig, Binds: ["/:/host"] },
  }, request.maxOutputBytes), /host path/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    Mounts: [{ Type: "bind", Destination: "/var/run/docker.sock" }],
  }, request.maxOutputBytes), /unapproved writable mounts/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    HostConfig: { ...safeInspect().HostConfig, Tmpfs: { ...safeInspect().HostConfig.Tmpfs, "/root": "rw,size=1024" } },
  }, request.maxOutputBytes), /workspace or temporary storage/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    HostConfig: { ...safeInspect().HostConfig, PidMode: "host" },
  }, request.maxOutputBytes), /private process/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    HostConfig: { ...safeInspect().HostConfig, UTSMode: "host" },
  }, request.maxOutputBytes), /private process/);
  assert.throws(() => assertCreatedContainerSecurity(safeInspect(), request.maxOutputBytes, ["sh", "-c", "unsafe"]), /requested direct command/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    Config: { ...safeInspect().Config, Entrypoint: [] },
  }, request.maxOutputBytes, request.command), /trusted bootstrap/);
  assert.throws(() => assertCreatedContainerSecurity({
    ...safeInspect(),
    Config: { ...safeInspect().Config, OpenStdin: false },
  }, request.maxOutputBytes, request.command), /bounded input/);
});
