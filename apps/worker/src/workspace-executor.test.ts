import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createJobWorkspace, writeWorkspaceFile } from "./workspace-executor.js";

const jobId = "c03bb714-4c31-4c31-b8f0-cca21c3df1c5";

test("creates a private workspace and writes nested files", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-agent-"));
  try {
    const workspace = await createJobWorkspace({ root, jobId });
    const result = await writeWorkspaceFile(workspace, "src/index.ts", "export const ok = true;");
    assert.equal(result.path, "src/index.ts");
    assert.equal(await readFile(join(workspace, "src/index.ts"), "utf8"), "export const ok = true;");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rejects invalid job ids and traversal paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-agent-"));
  try {
    await assert.rejects(createJobWorkspace({ root, jobId: "../escape" }));
    const workspace = await createJobWorkspace({ root, jobId });
    await assert.rejects(writeWorkspaceFile(workspace, "../escape.txt", "no"));
    await assert.rejects(writeWorkspaceFile(workspace, ".env", "secret"));
    await assert.rejects(writeWorkspaceFile(workspace, ".git/config", "no"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("refuses overwriting an existing file and oversized content", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-agent-"));
  try {
    const workspace = await createJobWorkspace({ root, jobId });
    await writeWorkspaceFile(workspace, "README.md", "first");
    await assert.rejects(writeWorkspaceFile(workspace, "README.md", "second"));
    await assert.rejects(writeWorkspaceFile(workspace, "large.txt", "x".repeat(1_000_001)));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rejects symlinked workspace parents", async () => {
  const root = await mkdtemp(join(tmpdir(), "atsh-agent-"));
  const outside = await mkdtemp(join(tmpdir(), "atsh-outside-"));
  try {
    const workspace = await createJobWorkspace({ root, jobId });
    await symlink(outside, join(workspace, "linked"), "dir");
    await assert.rejects(writeWorkspaceFile(workspace, "linked/pwned.txt", "no"));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
