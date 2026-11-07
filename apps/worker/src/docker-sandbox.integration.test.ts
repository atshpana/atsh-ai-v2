import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createJobWorkspace } from "./workspace-executor.js";
import { createDockerSandboxBackendFromEnv, DockerEngineClient } from "./docker-sandbox.js";

const enabled = process.env.SANDBOX_INTEGRATION === "1";

test("real rootless Docker sandbox enforces isolation, limits, output bounds, and cancellation", { skip: !enabled }, async () => {
  const backend = await createDockerSandboxBackendFromEnv();
  assert.ok(backend, "sandbox endpoint configuration is required");
  const host = new URL(process.env.SANDBOX_DOCKER_HOST!);
  const [ca, cert, key] = await Promise.all([
    readFile(process.env.SANDBOX_DOCKER_CA_FILE!),
    readFile(process.env.SANDBOX_DOCKER_CERT_FILE!),
    readFile(process.env.SANDBOX_DOCKER_KEY_FILE!),
  ]);
  const client = new DockerEngineClient({ host, ca, cert, key });
  const workspaceRoot = process.env.AGENT_WORKSPACE_ROOT!;
  const jobId = "aaad6f4c-e54a-4b4e-a28a-1337ed2b99a1";
  const root = workspaceRoot;
  await mkdir(root, { recursive: true });
  const workspace = await createJobWorkspace({ root, jobId });
  const outputJobId = "a2f3325e-055b-424e-8db6-2a3be0956aa7";
  const outputWorkspace = await createJobWorkspace({ root, jobId: outputJobId });
  const cancelJobId = "c8e36d8a-041b-4df6-a45a-823ee9d10ffa";
  const cancelWorkspace = await createJobWorkspace({ root, jobId: cancelJobId });
  const timeoutJobId = "dba1ff04-7c9b-42ad-8e64-f179fa7b37f4";
  const timeoutWorkspace = await createJobWorkspace({ root, jobId: timeoutJobId });
  try {
    await writeFile(join(workspace, "input.txt"), "staged input");
    const script = [
      "const fs=require('node:fs');const os=require('node:os');",
      "if(process.getuid()!==65532)throw Error('wrong uid');",
      "if(!Object.keys(os.networkInterfaces()).every((name)=>name==='lo'))throw Error('network interface available');",
      "if(fs.existsSync('/var/run/docker.sock')||fs.existsSync('/run/docker.sock'))throw Error('host socket available');",
      "const mounts=fs.readFileSync('/proc/mounts','utf8').split('\\n');const root=mounts.find((line)=>line.split(' ')[1]==='/');if(!root||!root.split(' ')[3].split(',').includes('ro'))throw Error('root filesystem is writable');",
      "const workspaceMount=mounts.find((line)=>line.split(' ')[1]==='/workspace');if(!workspaceMount||workspaceMount.split(' ')[2]!=='tmpfs'||!workspaceMount.split(' ')[3].split(',').includes('size=262144k'))throw Error('workspace tmpfs is missing or unbounded');",
      "const tempMount=mounts.find((line)=>line.split(' ')[1]==='/tmp');if(!tempMount||tempMount.split(' ')[2]!=='tmpfs'||!tempMount.split(' ')[3].split(',').includes('size=65536k'))throw Error('temporary tmpfs is missing or unbounded');",
      "const mem=Number(fs.readFileSync('/sys/fs/cgroup/memory.max','utf8').trim());if(!Number.isFinite(mem)||mem<=0||mem>536870912)throw Error('memory limit missing');",
      "const pids=Number(fs.readFileSync('/sys/fs/cgroup/pids.max','utf8').trim());if(!Number.isFinite(pids)||pids<=0||pids>128)throw Error('pid limit missing');",
      "const [quota,period]=fs.readFileSync('/sys/fs/cgroup/cpu.max','utf8').trim().split(' ').map(Number);if(!(quota>0&&period>0&&quota/period<=1))throw Error('cpu limit missing');",
      "const input=fs.readFileSync('/workspace/input.txt','utf8');fs.writeFileSync('/workspace/result.json',JSON.stringify({uid:process.getuid(),input,interfaces:Object.keys(os.networkInterfaces()),memory:mem,pids,cpuQuota:quota,cpuPeriod:period}));",
      "fs.writeFileSync('/tmp/temp-ok','yes');",
    ].join("");
    const result = await backend.execute({
      jobId,
      workspace,
      command: ["node", "-e", script],
      environment: { NODE_ENV: "test" },
      timeoutMs: 30_000,
      maxOutputBytes: 10_000,
    });
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr) <= 10_000, true);
    const evidence = JSON.parse(await readFile(join(workspace, "result.json"), "utf8")) as { uid: number; input: string; interfaces: string[]; memory: number; pids: number; cpuQuota: number; cpuPeriod: number };
    assert.equal(evidence.uid, 65532);
    assert.equal(evidence.input, "staged input");
    assert.deepEqual(evidence.interfaces, ["lo"]);
    assert.equal(evidence.memory <= 512 * 1024 * 1024, true);
    assert.equal(evidence.pids <= 128, true);
    assert.equal(evidence.cpuQuota / evidence.cpuPeriod <= 1, true);

    const outputLimit = 10_000;
    const noisy = await backend.execute({
      jobId: outputJobId,
      workspace: outputWorkspace,
      command: ["node", "-e", "process.stdout.write('x'.repeat(100000))"],
      environment: {},
      timeoutMs: 30_000,
      maxOutputBytes: outputLimit,
    });
    assert.equal(Buffer.byteLength(noisy.stdout) + Buffer.byteLength(noisy.stderr) <= outputLimit, true);

    const controller = new AbortController();
    const running = backend.execute({
      jobId: cancelJobId,
      workspace: cancelWorkspace,
      command: ["node", "-e", "setInterval(()=>{},1000)"],
      environment: {},
      timeoutMs: 20_000,
      maxOutputBytes: 10_000,
      signal: controller.signal,
    });
    const waitUntilRunning = async (expectedJobId: string) => {
      const filters = encodeURIComponent(JSON.stringify({ label: [`atsh.job.id=${expectedJobId}`] }));
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const response = await client.request(`/v1.45/containers/json?all=1&filters=${filters}`, "GET", undefined, undefined, 1_000_000);
        const containers = JSON.parse(response.body.toString("utf8")) as Array<{ State?: string }>;
        if (containers.some((container) => container.State === "running")) return;
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
      }
      throw new Error("Cancelled sandbox process did not enter the running state.");
    };
    await Promise.race([waitUntilRunning(cancelJobId), running.then(() => { throw new Error("Cancellation process unexpectedly exited."); })]);
    controller.abort();
    await assert.rejects(running, /cancelled/);

    const timedCommand = backend.execute({
      jobId: timeoutJobId,
      workspace: timeoutWorkspace,
      command: ["node", "-e", "setInterval(()=>{},1000)"],
      environment: {},
      timeoutMs: 5_000,
      maxOutputBytes: 10_000,
    });
    await Promise.race([waitUntilRunning(timeoutJobId), timedCommand.then(() => { throw new Error("Timed sandbox process unexpectedly exited."); })]);
    await assert.rejects(timedCommand, /timed out during integration stage command-execution/);

    for (const expectedJobId of [cancelJobId, timeoutJobId]) {
      const filters = encodeURIComponent(JSON.stringify({ label: [`atsh.job.id=${expectedJobId}`] }));
      const leftovers = await client.request(`/v1.45/containers/json?all=1&filters=${filters}`, "GET", undefined, undefined, 1_000_000);
      assert.deepEqual(JSON.parse(leftovers.body.toString("utf8")) as unknown[], []);
    }
  } finally {
    await Promise.all([jobId, outputJobId, cancelJobId, timeoutJobId].map((id) => rm(join(root, id), { recursive: true, force: true })));
  }
});
