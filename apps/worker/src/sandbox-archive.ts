import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, readFile, realpath, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const BLOCK = 512;
export const MAX_WORKSPACE_BYTES = 64 * 1024 * 1024;
export const MAX_WORKSPACE_ENTRIES = 10_000;
export const MAX_WORKSPACE_ARCHIVE_BYTES = MAX_WORKSPACE_BYTES + MAX_WORKSPACE_ENTRIES * BLOCK * 2 + BLOCK * 2;
const RESERVED_SEGMENTS = new Set([".git", "node_modules", ".atsh-sandbox-result", ".atsh-sandbox-result.tmp"]);
const SAFE_ARCHIVE_FAILURES = new Set([
  "Sandbox archive contains an invalid relative path.",
  "Sandbox archive contains an empty entry path.",
  "Sandbox archive contains a backslash in an entry path.",
  "Sandbox archive absolute path is outside the assigned workspace.",
  "Sandbox archive contains a repeated separator after its root.",
  "Sandbox archive contains a reserved or unsafe path.",
  "Sandbox archive field is out of range.",
  "Workspace path exceeds the supported tar path length.",
  "Sandbox workspace must be a directory.",
  "Workspace changed while it was being archived.",
  "Workspace contains a symlink; refusing sandbox synchronization.",
  "Workspace contains a special file; refusing sandbox synchronization.",
  "Sandbox archive contains an invalid size or mode.",
  "Sandbox archive contains an out-of-range field.",
  "Sandbox archive has an invalid header checksum.",
  "Sandbox archive entry exceeds its available data.",
  "Sandbox output archive contains a link or special file.",
  "Sandbox archive root entry is invalid.",
  "Sandbox archive contains duplicate paths.",
  "Sandbox output exceeds the 64 MB transfer limit.",
  "Sandbox directory entry has unexpected content.",
  "Sandbox output has too many entries.",
  "Sandbox archive is truncated.",
  "Sandbox archive has a file used as a parent directory.",
  "Sandbox output path escaped the assigned workspace.",
  "Workspace path contains a non-directory or symlink.",
  "Workspace path contains a symlink.",
  "Sandbox output archive exceeds the 64 MB transfer limit.",
  "Sandbox output conflicts with a directory containing reserved files.",
  "Workspace changed during sandbox synchronization.",
  "Sandbox output conflicts with a non-directory path.",
  "Sandbox output conflicts with a non-file path.",
]);

export function safeSandboxArchiveDiagnostic(error: unknown): string | undefined {
  if (error instanceof Error && SAFE_ARCHIVE_FAILURES.has(error.message)) return error.message;
  return undefined;
}

export type WorkspaceArchiveEntry = {
  path: string;
  kind: "file" | "directory";
  mode: number;
  data?: Buffer;
};

function isReservedSegment(segment: string): boolean {
  return RESERVED_SEGMENTS.has(segment) || /^\.env(?:\.|$)/i.test(segment);
}

function assertRelativePath(path: string, allowedReservedPaths: ReadonlySet<string> = new Set()): string {
  if (!path || path.includes("\\") || path.includes("\0") || path.startsWith("/")) {
    throw new Error("Sandbox archive contains an invalid relative path.");
  }
  const segments = path.replace(/\/$/, "").split("/");
  if (segments.length === 1 && segments[0] === ".") return ".";
  if (segments.some((segment) => !segment || segment === "." || segment === ".." ||
      (isReservedSegment(segment) && !allowedReservedPaths.has(path)))) {
    throw new Error("Sandbox archive contains a reserved or unsafe path.");
  }
  return segments.join("/");
}

function writeOctal(buffer: Buffer, offset: number, length: number, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Sandbox archive field is out of range.");
  const octal = value.toString(8);
  if (octal.length > length - 1) throw new Error("Sandbox archive field is out of range.");
  buffer.write(octal.padStart(length - 1, "0") + "\0", offset, length, "ascii");
}

function splitTarPath(path: string): { name: string; prefix: string } {
  const pathBytes = Buffer.byteLength(path, "utf8");
  if (pathBytes <= 100) return { name: path, prefix: "" };
  const segments = path.split("/");
  for (let index = segments.length - 1; index > 0; index -= 1) {
    const prefix = segments.slice(0, index).join("/");
    const name = segments.slice(index).join("/");
    if (Buffer.byteLength(prefix, "utf8") <= 155 && Buffer.byteLength(name, "utf8") <= 100) return { name, prefix };
  }
  throw new Error("Workspace path exceeds the supported tar path length.");
}

function createTarHeader(entry: WorkspaceArchiveEntry): Buffer {
  const header = Buffer.alloc(BLOCK);
  const name = entry.kind === "directory" && entry.path !== "." && !entry.path.endsWith("/") ? `${entry.path}/` : entry.path;
  const parts = splitTarPath(name);
  header.write(parts.name, 0, 100, "utf8");
  writeOctal(header, 100, 8, entry.mode & 0o777);
  writeOctal(header, 108, 8, 65532);
  writeOctal(header, 116, 8, 65532);
  writeOctal(header, 124, 12, entry.data?.byteLength ?? 0);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  header.fill(0x20, 148, 156);
  header[156] = entry.kind === "directory" ? 0x35 : 0x30;
  header.write("ustar\0", 257, 6, "ascii");
  header.write("00", 263, 2, "ascii");
  if (parts.prefix) header.write(parts.prefix, 345, 155, "utf8");
  let checksum = 0;
  for (const byte of header) checksum += byte;
  const checksumText = checksum.toString(8).padStart(6, "0");
  header.write(checksumText, 148, 6, "ascii");
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

async function collectWorkspaceEntries(workspace: string): Promise<WorkspaceArchiveEntry[]> {
  const root = await realpath(workspace);
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) throw new Error("Sandbox workspace must be a directory.");
  const entries: WorkspaceArchiveEntry[] = [];
  let totalBytes = 0;

  const visit = async (directory: string, prefix: string): Promise<void> => {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      if (isReservedSegment(child.name)) continue;
      const relativePath = prefix ? `${prefix}/${child.name}` : child.name;
      assertRelativePath(relativePath);
      if (entries.length >= MAX_WORKSPACE_ENTRIES) throw new Error("Sandbox workspace has too many entries.");
      const fullPath = resolve(directory, child.name);
      const metadata = await lstat(fullPath);
      if (metadata.isSymbolicLink() || (!metadata.isFile() && !metadata.isDirectory())) {
        throw new Error("Sandbox workspace may contain only regular files and directories.");
      }
      if (metadata.isDirectory()) {
        entries.push({ path: relativePath, kind: "directory", mode: 0o700 });
        await visit(fullPath, relativePath);
        continue;
      }
      totalBytes += metadata.size;
      if (totalBytes > MAX_WORKSPACE_BYTES) throw new Error("Sandbox workspace exceeds the 64 MB transfer limit.");
      const data = await readFile(fullPath);
      if (data.byteLength !== metadata.size) throw new Error("Sandbox workspace changed during transfer.");
      entries.push({ path: relativePath, kind: "file", mode: metadata.mode & 0o700, data });
    }
  };

  await visit(root, "");
  return entries;
}

export async function createWorkspaceTar(workspace: string): Promise<Buffer> {
  const entries = await collectWorkspaceEntries(workspace);
  const chunks: Buffer[] = [];
  for (const entry of entries) {
    chunks.push(createTarHeader(entry));
    if (entry.kind === "file") {
      const data = entry.data ?? Buffer.alloc(0);
      chunks.push(data);
      const padding = (BLOCK - (data.byteLength % BLOCK)) % BLOCK;
      if (padding) chunks.push(Buffer.alloc(padding));
    }
  }
  chunks.push(Buffer.alloc(BLOCK * 2));
  return Buffer.concat(chunks);
}

function parseOctal(header: Buffer, offset: number, length: number): number {
  const raw = header.subarray(offset, offset + length).toString("ascii").replace(/\0.*$/, "").trim();
  if (!raw) return 0;
  if (!/^[0-7]+$/.test(raw)) throw new Error("Sandbox archive contains an invalid size or mode.");
  const value = Number.parseInt(raw, 8);
  if (!Number.isSafeInteger(value)) throw new Error("Sandbox archive contains an out-of-range field.");
  return value;
}

function readTarString(header: Buffer, offset: number, length: number): string {
  const field = header.subarray(offset, offset + length);
  const terminator = field.indexOf(0);
  return field.subarray(0, terminator < 0 ? field.length : terminator).toString("utf8");
}

function verifyTarChecksum(header: Buffer): void {
  const expected = parseOctal(header, 148, 8);
  let actual = 0;
  for (let index = 0; index < header.length; index += 1) actual += index >= 148 && index < 156 ? 0x20 : header[index]!;
  if (actual !== expected) throw new Error("Sandbox archive has an invalid header checksum.");
}

function normalizeContainerArchivePath(name: string, allowedReservedPaths: ReadonlySet<string>): string {
  let normalized = name;
  if (!normalized) throw new Error("Sandbox archive contains an empty entry path.");
  if (normalized.includes("\\")) throw new Error("Sandbox archive contains a backslash in an entry path.");
  // GNU tar emits ./-prefixed paths when archiving the workspace root.
  if (normalized === "./") normalized = ".";
  else if (normalized.startsWith("./")) normalized = normalized.slice(2);
  // Docker Engine versions may preserve the requested absolute container path
  // in the archive headers. Accept only the exact assigned tmpfs root; all
  // subsequent validation still runs on the stripped, workspace-relative path.
  if (normalized === "/workspace" || normalized === "/workspace/") normalized = ".";
  else if (normalized.startsWith("/workspace/")) normalized = normalized.slice("/workspace/".length);
  else if (normalized.startsWith("/")) throw new Error("Sandbox archive absolute path is outside the assigned workspace.");
  else if (normalized === "workspace" || normalized === "workspace/") normalized = ".";
  else if (normalized.startsWith("workspace/")) normalized = normalized.slice("workspace/".length);
  if (!normalized) throw new Error("Sandbox archive contains an empty entry path.");
  if (normalized.startsWith("/")) throw new Error("Sandbox archive contains a repeated separator after its root.");
  return assertRelativePath(normalized, allowedReservedPaths);
}

export function parseWorkspaceTar(archive: Buffer, allowedReservedPaths: ReadonlySet<string> = new Set()): WorkspaceArchiveEntry[] {
  if (archive.byteLength < BLOCK * 2) throw new Error("Sandbox archive is truncated.");
  if (archive.byteLength > MAX_WORKSPACE_ARCHIVE_BYTES) {
    throw new Error("Sandbox output archive exceeds the 64 MB transfer limit.");
  }
  const entries: WorkspaceArchiveEntry[] = [];
  const seen = new Set<string>();
  let totalBytes = 0;
  let offset = 0;
  let hasTerminator = false;
  while (offset + BLOCK <= archive.byteLength) {
    const header = archive.subarray(offset, offset + BLOCK);
    if (header.every((byte) => byte === 0)) {
      const remainder = archive.subarray(offset);
      if (remainder.byteLength < BLOCK * 2 || remainder.some((byte) => byte !== 0)) {
        throw new Error("Sandbox archive is truncated.");
      }
      hasTerminator = true;
      offset = archive.byteLength;
      break;
    }
    verifyTarChecksum(header);
    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const rawPath = prefix ? `${prefix}/${name}` : name;
    const typeFlag = header[156] ?? 0;
    const size = parseOctal(header, 124, 12);
    const mode = parseOctal(header, 100, 8) & 0o700;
    offset += BLOCK;
    if (size > MAX_WORKSPACE_BYTES || offset + size > archive.byteLength) throw new Error("Sandbox archive entry exceeds its available data.");
    const kind = typeFlag === 0 || typeFlag === 0x30 ? "file" : typeFlag === 0x35 ? "directory" : null;
    if (!kind) throw new Error("Sandbox output archive contains a link or special file.");
    const path = normalizeContainerArchivePath(rawPath, allowedReservedPaths);
    if (path === ".") {
      if (kind !== "directory" || size !== 0) throw new Error("Sandbox archive root entry is invalid.");
    } else {
      if (seen.has(path)) throw new Error("Sandbox archive contains duplicate paths.");
      seen.add(path);
      if (kind === "file") {
        totalBytes += size;
        if (totalBytes > MAX_WORKSPACE_BYTES) throw new Error("Sandbox output exceeds the 64 MB transfer limit.");
        entries.push({ path, kind, mode, data: Buffer.from(archive.subarray(offset, offset + size)) });
      } else {
        if (size !== 0) throw new Error("Sandbox directory entry has unexpected content.");
        entries.push({ path, kind, mode });
      }
    }
    offset += size + ((BLOCK - (size % BLOCK)) % BLOCK);
    if (entries.length > MAX_WORKSPACE_ENTRIES) throw new Error("Sandbox output has too many entries.");
  }
  if (!hasTerminator || offset > archive.byteLength) throw new Error("Sandbox archive is truncated.");

  const files = new Set(entries.filter((entry) => entry.kind === "file").map((entry) => entry.path));
  for (const path of files) {
    let parent = dirname(path).replace(/\\/g, "/");
    while (parent && parent !== ".") {
      if (files.has(parent)) throw new Error("Sandbox archive has a file used as a parent directory.");
      parent = dirname(parent).replace(/\\/g, "/");
    }
  }
  return entries;
}

function assertInside(root: string, target: string): void {
  const rel = relative(root, target);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error("Sandbox output path escaped the assigned workspace.");
  }
}

async function ensureSafeDirectory(root: string, relativePath: string): Promise<string> {
  let current = root;
  for (const segment of relativePath.split("/")) {
    if (!segment) continue;
    current = resolve(current, segment);
    assertInside(root, current);
    try {
      const metadata = await lstat(current);
      if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new Error("Workspace path contains a non-directory or symlink.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(current, { mode: 0o700 });
    }
    const actual = await realpath(current);
    assertInside(root, actual);
    if (actual !== current) throw new Error("Workspace path contains a symlink.");
  }
  return current;
}

async function collectExistingTree(root: string): Promise<{ files: Set<string>; directories: Set<string>; reservedAncestors: Set<string> }> {
  const files = new Set<string>();
  const directories = new Set<string>();
  const reservedAncestors = new Set<string>();
  const visit = async (directory: string, prefix: string): Promise<void> => {
    for (const child of await readdir(directory, { withFileTypes: true })) {
      if (isReservedSegment(child.name)) {
        let ancestor = prefix;
        while (ancestor) {
          reservedAncestors.add(ancestor);
          ancestor = dirname(ancestor).replace(/\\/g, "/");
          if (ancestor === ".") break;
        }
        continue;
      }
      const relativePath = prefix ? `${prefix}/${child.name}` : child.name;
      const fullPath = resolve(directory, child.name);
      const metadata = await lstat(fullPath);
      if (metadata.isSymbolicLink()) throw new Error("Workspace contains a symlink; refusing sandbox synchronization.");
      if (metadata.isDirectory()) {
        directories.add(relativePath);
        await visit(fullPath, relativePath);
      }
      else if (metadata.isFile()) files.add(relativePath);
      else throw new Error("Workspace contains a special file; refusing sandbox synchronization.");
    }
  };
  await visit(root, "");
  return { files, directories, reservedAncestors };
}

export async function applyWorkspaceTar(
  workspace: string,
  archive: Buffer,
  excludedPaths: ReadonlySet<string> = new Set(),
): Promise<void> {
  const root = await realpath(workspace);
  if (!(await stat(root)).isDirectory()) throw new Error("Sandbox workspace must be a directory.");
  const entries = parseWorkspaceTar(archive, excludedPaths).filter((entry) => !excludedPaths.has(entry.path));
  const existing = await collectExistingTree(root);
  const incomingFiles = new Set(entries.filter((entry) => entry.kind === "file").map((entry) => entry.path));
  const incomingDirectories = new Set(entries.filter((entry) => entry.kind === "directory").map((entry) => entry.path));
  for (const entry of entries) {
    const segments = entry.path.split("/");
    for (let index = 1; index < segments.length; index += 1) incomingDirectories.add(segments.slice(0, index).join("/"));
  }
  for (const path of existing.reservedAncestors) {
    if (incomingFiles.has(path)) throw new Error("Sandbox output conflicts with a directory containing reserved files.");
  }

  for (const path of existing.files) {
    if (incomingFiles.has(path)) continue;
    const fullPath = resolve(root, ...path.split("/"));
    assertInside(root, fullPath);
    const metadata = await lstat(fullPath);
    if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error("Workspace changed during sandbox synchronization.");
    await rm(fullPath);
  }

  const orderedDirectories = [...existing.directories].sort((a, b) => b.split("/").length - a.split("/").length);
  for (const path of orderedDirectories) {
    if (incomingDirectories.has(path)) continue;
    if (existing.reservedAncestors.has(path)) {
      continue;
    }
    const fullPath = resolve(root, ...path.split("/"));
    assertInside(root, fullPath);
    const metadata = await lstat(fullPath);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new Error("Workspace changed during sandbox synchronization.");
    await rm(fullPath, { recursive: true });
  }

  for (const entry of entries) {
    if (entry.path === ".") continue;
    const segments = entry.path.split("/");
    const leaf = segments.pop()!;
    const parent = await ensureSafeDirectory(root, segments.join("/"));
    const fullPath = resolve(parent, leaf);
    assertInside(root, fullPath);
    if (entry.kind === "directory") {
      try {
        const metadata = await lstat(fullPath);
        if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new Error("Sandbox output conflicts with a non-directory path.");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await mkdir(fullPath, { mode: 0o700 });
      }
      continue;
    }
    try {
      const metadata = await lstat(fullPath);
      if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error("Sandbox output conflicts with a non-file path.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const handle = await open(fullPath, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0), entry.mode || 0o600);
    try {
      await handle.writeFile(entry.data ?? Buffer.alloc(0));
    } finally {
      await handle.close();
    }
  }
}
