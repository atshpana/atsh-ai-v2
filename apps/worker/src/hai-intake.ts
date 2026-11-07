import { createHash, randomUUID } from "node:crypto";

export const HAI_INTAKE_EXTRACTOR_VERSION = "hai-markdown-v1";
export const MAX_HAI_SOURCE_BYTES = 1_000_000;
export const MAX_HAI_EXTRACTED_ITEMS = 5_000;
export const MAX_HAI_PAGE_SIZE = 50;
export const MAX_HAI_ITEM_BYTES = 8_192;
export const MAX_HAI_PAGE_BYTES = 65_536;

export const HAI_ITEM_TYPES = [
  "requirement",
  "screen",
  "module",
  "role",
  "workflow",
  "business_rule",
  "entity",
  "integration",
  "acceptance_criterion",
  "question",
] as const;

export type HaiItemType = (typeof HAI_ITEM_TYPES)[number];
export type HaiExtractedItem = {
  itemKey: string;
  itemType: HaiItemType;
  title: string;
  statement: string;
  sourceExcerpt: string;
  sourceLineStart: number;
  sourceLineEnd: number;
  sourceHeading: string | null;
};

export type HaiIntakeInput = {
  jobId: string;
  sourceRepository: string;
  sourceRef: string;
  sourcePath: string;
  sourceVersion: string;
  sourceBytes: Uint8Array;
  sourceCommitSha: string;
  sourceBlobSha: string;
};

export type HaiIntakeResult = {
  specificationId: string;
  sourceSha256: string;
  sourceVersion: string;
  sourceSizeBytes: number;
  extractionVersion: string;
  itemCounts: Record<HaiItemType, number>;
  requirementKeys: string[];
  requirementCount: number;
  created: boolean;
};

export type HaiRequirementPageItem = Pick<
  HaiExtractedItem,
  "itemKey" | "itemType" | "title" | "statement" | "sourceExcerpt" | "sourceLineStart" | "sourceLineEnd" | "sourceHeading"
>;
export type HaiRequirementPage = { items: HaiRequirementPageItem[]; nextOffset: number | null; hasMore: boolean };

type QueryResult<Row> = { rows: Row[]; rowCount?: number | null };
export interface HaiIntakeClient {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<Row>>;
  release?(): void;
}
export interface HaiIntakePool {
  connect(): Promise<HaiIntakeClient>;
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/i;
const GIT_BLOB_SHA = /^[0-9a-f]{40}$/i;
const SECRET_LIKE = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:OPENAI_API_KEY|GITHUB_TOKEN|DATABASE_URL)\s*[:=]\s*\S+|\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/i;

function classifyLabel(label: string): HaiItemType | null {
  const value = label.trim().toLocaleLowerCase("en").replace(/[\s_-]+/g, " ");
  if (/^(?:acceptance criteria|acceptance criterion|test criteria|معايير القبول|معيار قبول)$/.test(value)) return "acceptance_criterion";
  if (/^(?:business rules?|policies|قواعد العمل|قواعد الأعمال)$/.test(value)) return "business_rule";
  if (/^(?:data entities|entities|data model|كيانات البيانات|الكيانات)$/.test(value)) return "entity";
  if (/^(?:integrations?|external services|التكاملات|التكامل)$/.test(value)) return "integration";
  if (/^(?:screens?|pages?|الشاشات|الصفحات)$/.test(value)) return "screen";
  if (/^(?:modules?|features?|workspaces?|المكونات|الوحدات|الخصائص)$/.test(value)) return "module";
  if (/^(?:roles?(?: and permissions?)?|permissions|الأدوار(?: والصلاحيات)?|الصلاحيات)$/.test(value)) return "role";
  if (/^(?:workflows?|user journeys?|journeys?|المسارات|رحلات المستخدم|سير العمل)$/.test(value)) return "workflow";
  if (/^(?:open questions?|unresolved questions?|questions?|أسئلة مفتوحة|أسئلة|نقاط غير محسومة)$/.test(value)) return "question";
  if (/^(?:requirements?|functional requirements?|non functional requirements?|المتطلبات|المتطلبات الوظيفية|متطلبات غير وظيفية)$/.test(value)) return "requirement";
  return null;
}

function classifyHeading(label: string): HaiItemType | null {
  const exact = classifyLabel(label);
  if (exact) return exact;
  const value = label.toLocaleLowerCase("en");
  if (/acceptance|test criteria|معايير القبول|معيار قبول/.test(value)) return "acceptance_criterion";
  if (/business rule|policy|قواعد العمل|قواعد الأعمال/.test(value)) return "business_rule";
  if (/data entity|entities|data model|schema|كيانات البيانات|الكيانات/.test(value)) return "entity";
  if (/integration|external service|تكامل|التكامل/.test(value)) return "integration";
  if (/screen|page|شاشة|صفحة/.test(value)) return "screen";
  if (/module|feature|workspace|وحدة|مكون|خاصية/.test(value)) return "module";
  if (/role|permission|صلاحية|دور/.test(value)) return "role";
  if (/workflow|journey|user flow|سير العمل|مسار|رحلة المستخدم/.test(value)) return "workflow";
  if (/open question|unresolved|question|سؤال|غير محسوم/.test(value)) return "question";
  if (/requirement|specification|المتطلب|المتطلبات/.test(value)) return "requirement";
  return null;
}

function inferType(value: string, sectionType: HaiItemType | null): HaiItemType | null {
  if (/\b(?:todo|tbd|tbc|open question|needs? clarification|pending decision)\b|(?:سؤال|غير محسوم|بانتظار قرار)|[?؟]\s*$/i.test(value)) return "question";
  const prefix = value.match(/^\s*(?:\[[A-Z][A-Z0-9_-]{1,24}\]\s*)?([\p{L}][\p{L}\s_-]{1,50})\s*:/u)?.[1];
  const prefixedType = prefix ? classifyLabel(prefix) : null;
  return prefixedType ?? sectionType;
}

function isCollectionHeading(value: string): boolean {
  return classifyLabel(value) !== null;
}

function cleanStatement(value: string): string {
  return value
    .replace(/^\s*(?:[-*+]\s+|\d{1,4}[.)]\s+)(?:\[[ xX]\]\s*)?/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFor(statement: string): string {
  const plain = statement.replace(/[`*_~]/g, "").trim();
  const firstClause = plain.split(/(?<=[.!?؟])\s/u, 1)[0] ?? plain;
  return (firstClause || plain).slice(0, 180);
}

export function extractHaiItems(sourceText: string, sourceSha256: string): HaiExtractedItem[] {
  if (!/^[0-9a-f]{64}$/.test(sourceSha256)) throw new Error("HAI source digest is invalid.");
  const lines = sourceText.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const items: HaiExtractedItem[] = [];
  let sectionType: HaiItemType | null = null;
  let currentHeading: string | null = null;

  const add = (rawLines: string[], start: number, end: number, itemType: HaiItemType, heading: string | null) => {
    const sourceExcerpt = rawLines.join("\n");
    const statement = cleanStatement(rawLines.map((line) => line.trim()).join(" "));
    if (!statement) return;
    if (Buffer.byteLength(statement, "utf8") > MAX_HAI_ITEM_BYTES || Buffer.byteLength(sourceExcerpt, "utf8") > MAX_HAI_ITEM_BYTES) {
      throw new Error("HAI source contains an item larger than the extraction limit.");
    }
    if (items.length >= MAX_HAI_EXTRACTED_ITEMS) throw new Error("HAI source produces too many extracted items.");
    const ordinal = String(items.length + 1).padStart(4, "0");
    items.push({
      itemKey: `HAI-${sourceSha256.slice(0, 12)}-${ordinal}`,
      itemType,
      title: titleFor(statement),
      statement,
      sourceExcerpt,
      sourceLineStart: start + 1,
      sourceLineEnd: end + 1,
      sourceHeading: heading,
    });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/u);
    if (headingMatch) {
      const label = headingMatch[2]?.trim() ?? "";
      const classifiedHeading = classifyHeading(label);
      if (classifiedHeading) sectionType = classifiedHeading;
      else if (headingMatch[1]!.length <= 2) sectionType = null;
      currentHeading = label || null;
      if (label && !isCollectionHeading(label)) {
        const headingType = inferType(label, sectionType);
        if (headingType) add([raw], index, index, headingType, currentHeading);
      }
      continue;
    }

    const bullet = /^\s*(?:[-*+]\s+|\d{1,4}[.)]\s+)(?:\[[ xX]\]\s*)?.+/u.test(raw);
    if (bullet) {
      const collected = [raw];
      let end = index;
      while (index + 1 < lines.length) {
        const next = lines[index + 1] ?? "";
        const nextTrimmed = next.trim();
        if (!nextTrimmed || /^(?:#{1,6}\s+|[-*+]\s+|\d{1,4}[.)]\s+)/u.test(next)) break;
        if (!/^\s{2,}\S/u.test(next)) break;
        collected.push(next);
        index += 1;
        end = index;
      }
      const text = collected.map((line) => cleanStatement(line)).join(" ");
      const itemType = inferType(text, sectionType) ?? "requirement";
      add(collected, end - collected.length + 1, end, itemType, currentHeading);
      continue;
    }

    const inferred = inferType(trimmed, sectionType);
    if (inferred && (sectionType !== null || inferred === "question" || /\b(?:must|shall|should|required|need to)\b|\b(?:يجب|ينبغي|يلزم)\b/i.test(trimmed))) {
      add([raw], index, index, inferred, currentHeading);
    }
  }

  return items;
}

function validateSource(input: HaiIntakeInput): { sourceBytes: Buffer; sourceText: string; sourceSha256: string } {
  if (!UUID.test(input.jobId)) throw new Error("HAI intake job ID is invalid.");
  if (!input.sourcePath || input.sourcePath.length > 512 || input.sourcePath.startsWith("/") || input.sourcePath.includes("\\") ||
      /^[A-Za-z]:/.test(input.sourcePath) || /[?#\0-\x1f\x7f]/.test(input.sourcePath) ||
      input.sourcePath.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("HAI source path is invalid.");
  }
  if (input.sourceRepository !== "atshpana/atsh-ai-v2" || !input.sourceRef || input.sourceRef.length > 200 ||
      !/^[A-Za-z0-9._/-]+$/.test(input.sourceRef) || input.sourceRef.includes("..")) {
    throw new Error("HAI source repository metadata is invalid.");
  }
  if (!/\.(?:md|mdx|txt)$/i.test(input.sourcePath)) throw new Error("HAI intake supports Markdown and plain text files only.");
  if (!VERSION.test(input.sourceVersion) || input.sourceVersion.includes("..")) throw new Error("HAI source version is invalid.");
  if (!COMMIT_SHA.test(input.sourceCommitSha) || !GIT_BLOB_SHA.test(input.sourceBlobSha)) throw new Error("HAI source revision metadata is invalid.");
  const sourceBytes = Buffer.from(input.sourceBytes);
  if (!sourceBytes.length || sourceBytes.length > MAX_HAI_SOURCE_BYTES) throw new Error("HAI source size is outside the allowed limit.");
  let sourceText: string;
  try {
    sourceText = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
  } catch {
    throw new Error("HAI source must be valid UTF-8 text.");
  }
  if (SECRET_LIKE.test(sourceText)) throw new Error("HAI source contains a credential-like value and was not stored.");
  return { sourceBytes, sourceText, sourceSha256: createHash("sha256").update(sourceBytes).digest("hex") };
}

function emptyCounts(): Record<HaiItemType, number> {
  return Object.fromEntries(HAI_ITEM_TYPES.map((type) => [type, 0])) as Record<HaiItemType, number>;
}

function summarize(items: HaiExtractedItem[]): { itemCounts: Record<HaiItemType, number>; requirementKeys: string[] } {
  const itemCounts = emptyCounts();
  for (const item of items) itemCounts[item.itemType] += 1;
  return { itemCounts, requirementKeys: items.filter((item) => item.itemType === "requirement").map((item) => item.itemKey) };
}

async function linkSpecificationToJob(client: HaiIntakeClient, specificationId: string, jobId: string): Promise<boolean> {
  const linked = await client.query<{ job_id: string }>(
    `INSERT INTO hai_specification_jobs (specification_id, job_id)
     VALUES ($1, $2) ON CONFLICT (specification_id, job_id) DO NOTHING
     RETURNING job_id`,
    [specificationId, jobId],
  );
  return Boolean(linked.rowCount ?? linked.rows.length);
}

export async function ingestHaiSpecification(pool: HaiIntakePool, input: HaiIntakeInput): Promise<HaiIntakeResult> {
  const { sourceBytes, sourceText, sourceSha256 } = validateSource(input);
  const items = extractHaiItems(sourceText, sourceSha256);
  const summary = summarize(items);
  const client = await pool.connect();
  let inTransaction = false;
  try {
    await client.query("BEGIN");
    inTransaction = true;
    const prior = await client.query<{ id: string; source_sha256: string; source_size_bytes: number; extraction_version: string }>(
      "SELECT id, source_sha256, source_size_bytes, extraction_version FROM hai_specifications WHERE source_path = $1 AND source_version = $2 FOR UPDATE",
      [input.sourcePath, input.sourceVersion],
    );
    if (prior.rows[0]) {
      if (prior.rows[0].source_sha256 !== sourceSha256 || Number(prior.rows[0].source_size_bytes) !== sourceBytes.length) {
        throw new Error("HAI source version already exists with different bytes; create a new source version.");
      }
      if (prior.rows[0].extraction_version !== HAI_INTAKE_EXTRACTOR_VERSION) throw new Error("HAI source version was extracted by a different extractor version; re-intake requires a new source version.");
      const linked = await linkSpecificationToJob(client, prior.rows[0].id, input.jobId);
      if (linked) {
        await client.query(
          "INSERT INTO agent_job_events (job_id, event_type, payload) VALUES ($1, 'hai.specification.reused', $2::jsonb)",
          [input.jobId, JSON.stringify({ specificationId: prior.rows[0].id, sourceSha256, sourceVersion: input.sourceVersion })],
        );
      }
      await client.query("COMMIT");
      inTransaction = false;
      return {
        specificationId: prior.rows[0].id,
        sourceSha256,
        sourceVersion: input.sourceVersion,
        sourceSizeBytes: sourceBytes.length,
        extractionVersion: HAI_INTAKE_EXTRACTOR_VERSION,
        itemCounts: summary.itemCounts,
        requirementKeys: summary.requirementKeys.slice(0, MAX_HAI_PAGE_SIZE),
        requirementCount: summary.itemCounts.requirement,
        created: false,
      };
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO hai_specifications
        (id, job_id, source_repository, source_ref, source_path, source_version, source_media_type, source_sha256,
         source_size_bytes, source_bytes, source_commit_sha, source_blob_sha, extraction_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (source_path, source_version) DO NOTHING
       RETURNING id`,
      [randomUUID(), input.jobId, input.sourceRepository, input.sourceRef, input.sourcePath, input.sourceVersion,
        /\.txt$/i.test(input.sourcePath) ? "text/plain" : "text/markdown", sourceSha256,
        sourceBytes.length, sourceBytes, input.sourceCommitSha.toLowerCase(), input.sourceBlobSha.toLowerCase(), HAI_INTAKE_EXTRACTOR_VERSION],
    );
    const specification = inserted.rows[0];
    if (!specification) {
      const raced = await client.query<{ id: string; source_sha256: string; source_size_bytes: number; extraction_version: string }>(
        "SELECT id, source_sha256, source_size_bytes, extraction_version FROM hai_specifications WHERE source_path = $1 AND source_version = $2 FOR UPDATE",
        [input.sourcePath, input.sourceVersion],
      );
      if (!raced.rows[0] || raced.rows[0].source_sha256 !== sourceSha256 || Number(raced.rows[0].source_size_bytes) !== sourceBytes.length) {
        throw new Error("HAI source version already exists with different bytes; create a new source version.");
      }
      if (raced.rows[0].extraction_version !== HAI_INTAKE_EXTRACTOR_VERSION) throw new Error("HAI source version was extracted by a different extractor version; re-intake requires a new source version.");
      const linked = await linkSpecificationToJob(client, raced.rows[0].id, input.jobId);
      if (linked) {
        await client.query(
          "INSERT INTO agent_job_events (job_id, event_type, payload) VALUES ($1, 'hai.specification.reused', $2::jsonb)",
          [input.jobId, JSON.stringify({ specificationId: raced.rows[0].id, sourceSha256, sourceVersion: input.sourceVersion })],
        );
      }
      await client.query("COMMIT");
      inTransaction = false;
      return {
        specificationId: raced.rows[0].id,
        sourceSha256,
        sourceVersion: input.sourceVersion,
        sourceSizeBytes: sourceBytes.length,
        extractionVersion: HAI_INTAKE_EXTRACTOR_VERSION,
        itemCounts: summary.itemCounts,
        requirementKeys: summary.requirementKeys.slice(0, MAX_HAI_PAGE_SIZE),
        requirementCount: summary.itemCounts.requirement,
        created: false,
      };
    }

    await linkSpecificationToJob(client, specification.id, input.jobId);

    if (items.length) {
      const keys = items.map((item) => item.itemKey);
      const types = items.map((item) => item.itemType);
      const titles = items.map((item) => item.title);
      const statements = items.map((item) => item.statement);
      const excerpts = items.map((item) => item.sourceExcerpt);
      const lineStarts = items.map((item) => item.sourceLineStart);
      const lineEnds = items.map((item) => item.sourceLineEnd);
      const headings = items.map((item) => item.sourceHeading);
      await client.query(
        `INSERT INTO hai_extracted_items
          (specification_id, ordinal, item_key, item_type, title, statement, source_excerpt,
           source_line_start, source_line_end, source_heading)
         SELECT $1, input.ordinality::integer, input.item_key, input.item_type, input.title,
                input.statement, input.source_excerpt, input.line_start, input.line_end, input.source_heading
           FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::integer[], $8::integer[], $9::text[])
             WITH ORDINALITY AS input(item_key, item_type, title, statement, source_excerpt, line_start, line_end, source_heading, ordinality)`,
        [specification.id, keys, types, titles, statements, excerpts, lineStarts, lineEnds, headings],
      );
    }
    await client.query(
      "INSERT INTO agent_job_events (job_id, event_type, payload) VALUES ($1, 'hai.specification.ingested', $2::jsonb)",
      [input.jobId, JSON.stringify({ specificationId: specification.id, sourceSha256, sourceVersion: input.sourceVersion, sourceSizeBytes: sourceBytes.length, itemCounts: summary.itemCounts })],
    );
    await client.query("COMMIT");
    inTransaction = false;
    return {
      specificationId: specification.id,
      sourceSha256,
      sourceVersion: input.sourceVersion,
      sourceSizeBytes: sourceBytes.length,
      extractionVersion: HAI_INTAKE_EXTRACTOR_VERSION,
      itemCounts: summary.itemCounts,
      requirementKeys: summary.requirementKeys.slice(0, MAX_HAI_PAGE_SIZE),
      requirementCount: summary.itemCounts.requirement,
      created: true,
    };
  } catch (error) {
    if (inTransaction) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release?.();
  }
}

export async function readHaiExtractedItems(
  pool: HaiIntakePool,
  jobId: string,
  specificationId: string,
  offset: number,
  limit: number,
): Promise<HaiRequirementPage> {
  if (!UUID.test(jobId) || !UUID.test(specificationId)) throw new Error("HAI specification ID is invalid.");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) throw new Error("HAI item offset is invalid.");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_HAI_PAGE_SIZE) throw new Error("HAI item page size is invalid.");
  const result = await pool.query<HaiRequirementPageItem>(
    `SELECT item.item_key AS "itemKey", item.item_type AS "itemType", item.title, item.statement,
            item.source_excerpt AS "sourceExcerpt", item.source_line_start AS "sourceLineStart",
            item.source_line_end AS "sourceLineEnd", item.source_heading AS "sourceHeading"
       FROM hai_extracted_items AS item
       JOIN hai_specification_jobs AS specification_job ON specification_job.specification_id = item.specification_id
      WHERE item.specification_id = $1 AND specification_job.job_id = $2
      ORDER BY item.ordinal
      LIMIT $4 OFFSET $3`,
    [specificationId, jobId, offset, limit + 1],
  );
  const candidates = result.rows.slice(0, limit);
  const items: HaiRequirementPageItem[] = [];
  let pageBytes = 0;
  for (const item of candidates) {
    const itemBytes = Buffer.byteLength(JSON.stringify(item), "utf8");
    if (pageBytes + itemBytes > MAX_HAI_PAGE_BYTES) {
      if (!items.length) throw new Error("HAI extracted item exceeds the response limit.");
      break;
    }
    items.push(item);
    pageBytes += itemBytes;
  }
  const hasMore = items.length < result.rows.length;
  return { items, nextOffset: hasMore ? offset + items.length : null, hasMore };
}

export type HaiEvidenceInput = {
  jobId: string;
  requirementKey: string;
  targetType: "code" | "test" | "evidence";
  artifactPath: string;
  artifactCommitSha: string;
  artifactVersion: string;
};

export async function recordHaiRequirementEvidence(pool: HaiIntakePool, input: HaiEvidenceInput): Promise<{ evidenceId: string; requirementKey: string; verificationStatus: "unverified"; created: boolean }> {
  if (!UUID.test(input.jobId)) throw new Error("HAI evidence job ID is invalid.");
  if (!/^HAI-[0-9a-f]{12}-\d{4}$/.test(input.requirementKey)) throw new Error("HAI requirement key is invalid.");
  if (!(new Set(["code", "test", "evidence"])).has(input.targetType)) throw new Error("HAI evidence target type is invalid.");
  if (!COMMIT_SHA.test(input.artifactCommitSha)) throw new Error("HAI evidence commit SHA is invalid.");
  if (!input.artifactVersion || input.artifactVersion.length > 200 || /[\r\n\0]/.test(input.artifactVersion)) throw new Error("HAI evidence revision is invalid.");
  const path = input.artifactPath.trim();
  const pathParts = path.split("#");
  if (!path || path.length > 512 || path.startsWith("/") || path.includes("\\") || pathParts.length > 2 || /^[A-Za-z]:/.test(pathParts[0] ?? "") ||
      (pathParts[1] !== undefined && !/^L[1-9][0-9]*(?:-L[1-9][0-9]*)?$/.test(pathParts[1])) ||
      (pathParts[0] ?? "").split("/").some((part) => !part || part === "." || part === "..") ||
      /^(?:https?:|data:)/i.test(path) || /[\0-\x1f\x7f]/.test(path)) throw new Error("HAI evidence path is invalid.");

  const client = await pool.connect();
  let inTransaction = false;
  try {
    await client.query("BEGIN");
    inTransaction = true;
    const requirement = await client.query<{ id: string }>(
      `SELECT item.id FROM hai_extracted_items AS item
       JOIN hai_specification_jobs AS specification_job ON specification_job.specification_id = item.specification_id
       WHERE item.item_key = $1 AND item.item_type = 'requirement' AND specification_job.job_id = $2`,
      [input.requirementKey, input.jobId],
    );
    if (!requirement.rows[0]) throw new Error("HAI requirement key was not found in immutable intake records.");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO hai_requirement_evidence
        (id, requirement_id, job_id, target_type, artifact_path, artifact_commit_sha, artifact_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [randomUUID(), requirement.rows[0].id, input.jobId, input.targetType, path,
        input.artifactCommitSha.toLowerCase(), input.artifactVersion],
    );
    let evidenceId = inserted.rows[0]?.id;
    const created = Boolean(evidenceId);
    if (!evidenceId) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM hai_requirement_evidence
          WHERE requirement_id = $1 AND target_type = $2 AND artifact_path = $3
            AND artifact_commit_sha = $4 AND artifact_version = $5
          ORDER BY created_at LIMIT 1`,
        [requirement.rows[0].id, input.targetType, path, input.artifactCommitSha.toLowerCase(), input.artifactVersion],
      );
      evidenceId = existing.rows[0]?.id;
      if (!evidenceId) throw new Error("HAI evidence record could not be confirmed.");
    }
    if (created) {
      await client.query(
        "INSERT INTO agent_job_events (job_id, event_type, payload) VALUES ($1, 'hai.requirement.evidence_proposed', $2::jsonb)",
        [input.jobId, JSON.stringify({ evidenceId, requirementKey: input.requirementKey, targetType: input.targetType, artifactPath: path, artifactCommitSha: input.artifactCommitSha.toLowerCase(), verificationStatus: "unverified" })],
      );
    }
    await client.query("COMMIT");
    inTransaction = false;
    return { evidenceId, requirementKey: input.requirementKey, verificationStatus: "unverified", created };
  } catch (error) {
    if (inTransaction) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release?.();
  }
}

