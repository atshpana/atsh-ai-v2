import { mkdir, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FILE_BYTES = 1_000_000;
const RESERVED_SEGMENTS = new Set([".git", ".env", "node_modules"]);

export type WorkspaceConfig = {
  root: string;
  jobId: string;
};

function assertInside(root: string, target: string): void {
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith(".." + sep) || rel === ".." || isAbsolute(rel)) {
    if (rel === "") return;
    throw new Error("Workspace path escapes the assigned job directory.");
  }
}

export async function createJobWorkspace(config: WorkspaceConfig): Promise<string> {
  if (!JOB_ID_PATTERN.test(config.jobId)) throw new Error("Invalid job identifier.");
  if (!config.root || !isAbsolute(config.root)) throw new Error("AGENT_WORKSPACE_ROOT must be an absolute path.");
  await mkdir(config.root, { recursive: true, mode: 0o700 });
  const root = await realpath(config.root);
  const workspace = resolve(root, config.jobId);
  assertInside(root, workspace);
  await mkdir(workspace, { recursive: true, mode: 0o700 });
  const actual = await realpath(workspace);
  assertInside(root, actual);
  if (actual !== workspace) throw new Error("Job workspace must not be a symlink.");
  return actual;
}

export async function writeWorkspaceFile(workspace: string, filePath: string, content: string): Promise<{ path: string; bytes: number }> {
  if (typeof filePath !== "string" || !filePath.trim() || isAbsolute(filePath)) {
    throw new Error("File path must be a non-empty relative path.");
  }
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (segments.some((part) => !part || part === "." || part === ".." || RESERVED_SEGMENTS.has(part))) {
    throw new Error("File path contains an unsafe or reserved segment.");
  }
  if (typeof content !== "string") throw new Error("File content must be text.");
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > MAX_FILE_BYTES) throw new Error("File exceeds the 1 MB workspace write limit.");
  const root = await realpath(workspace);
  const target = resolve(root, ...segments);
  assertInside(root, target);
  const parent = resolve(target, "..");
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const actualParent = await realpath(parent);
  assertInside(root, actualParent);
  if (actualParent !== parent) throw new Error("Workspace path contains a symlink.");
  await writeFile(target, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
  return { path: segments.join("/"), bytes };
}
