import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { applyWorkspaceTar, createWorkspaceTar, parseWorkspaceTar } from "./sandbox-archive.js";

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
