import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { applyWorkspaceTar, createWorkspaceTar, parseWorkspaceTar, safeSandboxArchiveDiagnostic } from "./sandbox-archive.js";

test("only exposes fixed workspace archive errors as integration diagnostics", () => {
  assert.equal(safeSandboxArchiveDiagnostic(new Error("Sandbox archive is truncated.")), "Sandbox archive is truncated.");
  assert.equal(safeSandboxArchiveDiagnostic(new Error("Sandbox archive absolute path is outside the assigned workspace.")), "Sandbox archive absolute path is outside the assigned workspace.");
  assert.equal(safeSandboxArchiveDiagnostic(new Error("Sandbox archive contains a repeated separator after its root.")), "Sandbox archive contains a repeated separator after its root.");
  assert.equal(safeSandboxArchiveDiagnostic(new Error("EACCES: permission denied, open /private/path")), undefined);
});

test("workspace tar transfer preserves regular files and excludes secrets and repository metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-archive-"));
  const workspace = join(root, "workspace");
  try {
    await mkdir(join(workspace, "src"), { recursive: true });
    await mkdir(join(workspace, ".git"), { recursive: true });
    await writeFile(join(workspace, "src", "index.js"), "export const value = 1;\n");
    await writeFile(join(workspace, ".env"), "should-not-leave-host\n");
    await writeFile(join(workspace, ".git", "config"), "repository metadata\n");

    const archive = await createWorkspaceTar(workspace);
    const entries = parseWorkspaceTar(archive);
    assert.deepEqual(entries.map((entry) => entry.path).sort(), ["src", "src/index.js"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes only the assigned absolute Docker archive root", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-absolute-archive-"));
  const workspace = join(root, "workspace");
  try {
    await mkdir(workspace);
    await writeFile(join(workspace, "result.txt"), "safe output");
    const archive = await createWorkspaceTar(workspace);
    const setHeaderPath = (path: string): void => {
      archive.fill(0, 0, 100);
      archive.write(path, 0, 100, "utf8");
      archive.fill(0x20, 148, 156);
      let checksum = 0;
      for (let index = 0; index < 512; index += 1) checksum += archive[index]!;
      archive.write(checksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
      archive[154] = 0;
      archive[155] = 0x20;
    };

    setHeaderPath("/workspace/result.txt");
    assert.deepEqual(parseWorkspaceTar(archive).map((entry) => entry.path), ["result.txt"]);

    const rootEntry = Buffer.from(archive.subarray(0, 512));
    rootEntry.fill(0, 0, 100);
    rootEntry.write("/workspace/", 0, 100, "utf8");
    rootEntry[156] = 0x35;
    rootEntry.fill(0, 124, 136);
    rootEntry.fill(0x20, 148, 156);
    let rootChecksum = 0;
    for (let index = 0; index < 512; index += 1) rootChecksum += rootEntry[index]!;
    rootEntry.write(rootChecksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
    rootEntry[154] = 0;
    rootEntry[155] = 0x20;
    assert.deepEqual(parseWorkspaceTar(Buffer.concat([rootEntry, Buffer.alloc(1024)])), []);

    setHeaderPath("/etc/passwd");
    assert.throws(() => parseWorkspaceTar(archive), /absolute path is outside/);

    setHeaderPath("/workspace//result.txt");
    assert.throws(() => parseWorkspaceTar(archive), /repeated separator after its root/);

    setHeaderPath("folder\\result.txt");
    assert.throws(() => parseWorkspaceTar(archive), /backslash in an entry path/);

    setHeaderPath("");
    assert.throws(() => parseWorkspaceTar(archive), /empty entry path/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace result synchronization applies file changes, deletions, and file-directory replacements safely", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-sync-"));
  const workspace = join(root, "workspace");
  const output = join(root, "output");
  try {
    await mkdir(join(workspace, "src"), { recursive: true });
    await mkdir(join(workspace, "replace-me"), { recursive: true });
    await mkdir(output, { recursive: true });
    await writeFile(join(workspace, "src", "old.js"), "remove me");
    await writeFile(join(workspace, "replace-me", "child.txt"), "replace directory");
    await writeFile(join(workspace, ".env.local"), "preserve without transfer");
    await writeFile(join(output, "src", "new.js"), "export const value = 2;\n").catch(async () => {
      await mkdir(join(output, "src"), { recursive: true });
      await writeFile(join(output, "src", "new.js"), "export const value = 2;\n");
    });
    await writeFile(join(output, "replace-me"), "now a file");

    await applyWorkspaceTar(workspace, await createWorkspaceTar(output));
    assert.equal(await readFile(join(workspace, "src", "new.js"), "utf8"), "export const value = 2;\n");
    await assert.rejects(readFile(join(workspace, "src", "old.js")));
    assert.equal(await readFile(join(workspace, "replace-me"), "utf8"), "now a file");
    assert.equal(await readFile(join(workspace, ".env.local"), "utf8"), "preserve without transfer");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads internal sandbox completion metadata but never synchronizes it to the host workspace", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-result-marker-"));
  const workspace = join(root, "workspace");
  const output = join(root, "output");
  const markerPath = ".atsh-sandbox-result";
  try {
    await mkdir(workspace);
    await mkdir(output);
    await writeFile(join(output, "a-status-marker"), "0\n");
    await writeFile(join(output, "result.json"), "{\"ready\":true}\n");
    const archive = await createWorkspaceTar(output);
    archive.fill(0, 0, 100);
    archive.write(markerPath, 0, 100, "utf8");
    archive.fill(0x20, 148, 156);
    let checksum = 0;
    for (let index = 0; index < 512; index += 1) checksum += archive[index]!;
    archive.write(checksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
    archive[154] = 0;
    archive[155] = 0x20;

    assert.throws(() => parseWorkspaceTar(archive), /reserved or unsafe path/);
    const allowedMetadata = new Set([markerPath]);
    const parsed = parseWorkspaceTar(archive, allowedMetadata);
    assert.equal(parsed.find((entry) => entry.path === markerPath)?.data?.toString("ascii"), "0\n");
    await applyWorkspaceTar(workspace, archive, allowedMetadata);
    assert.equal(await readFile(join(workspace, "result.json"), "utf8"), "{\"ready\":true}\n");
    await assert.rejects(readFile(join(workspace, markerPath)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace tar transfer rejects symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-link-"));
  const workspace = join(root, "workspace");
  const outside = join(root, "outside");
  try {
    await mkdir(workspace);
    await mkdir(outside);
    await symlink(outside, join(workspace, "link"), "dir");
    await assert.rejects(createWorkspaceTar(workspace), /only regular files and directories/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace tar parser rejects traversal and unsupported filesystem entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-sandbox-tar-"));
  const workspace = join(root, "workspace");
  try {
    await mkdir(workspace);
    await writeFile(join(workspace, "ok.txt"), "ok");
    const traversal = await createWorkspaceTar(workspace);
    traversal.write("../evil.txt", 0, 100, "utf8");
    traversal.fill(0x20, 148, 156);
    let checksum = 0;
    for (let index = 0; index < 512; index += 1) checksum += traversal[index]!;
    traversal.write(checksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
    traversal[154] = 0;
    traversal[155] = 0x20;
    assert.throws(() => parseWorkspaceTar(traversal), /unsafe path/);

    const link = await createWorkspaceTar(workspace);
    link[156] = 0x32;
    link.fill(0x20, 148, 156);
    checksum = 0;
    for (let index = 0; index < 512; index += 1) checksum += link[index]!;
    link.write(checksum.toString(8).padStart(6, "0"), 148, 6, "ascii");
    link[154] = 0;
    link[155] = 0x20;
    assert.throws(() => parseWorkspaceTar(link), /link or special file/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
