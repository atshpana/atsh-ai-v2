import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  HAI_INTAKE_EXTRACTOR_VERSION,
  extractHaiItems,
  ingestHaiSpecification,
  readHaiExtractedItems,
  recordHaiRequirementEvidence,
  type HaiIntakeClient,
  type HaiIntakePool,
} from "./hai-intake.js";

const JOB_ID = "22222222-2222-4222-8222-222222222222";
const SPEC_ID = "33333333-3333-4333-8333-333333333333";
const ITEM_ID = "44444444-4444-4444-8444-444444444444";
const EVIDENCE_ID = "55555555-5555-4555-8555-555555555555";
const COMMIT = "a".repeat(40);
const BLOB = "b".repeat(40);
const SPEC = [
  "# HAI Master",
  "## Requirements",
  "- The system must preserve each approved source version.",
  "## Screens",
  "- Customer dashboard displays open requests.",
  "## Modules",
  "- Request management module supports review.",
  "## Roles and permissions",
  "- Administrator can approve a quote.",
  "## Workflows",
  "- Customer submits a request and receives confirmation.",
  "## Business rules",
  "- A quote must expire after its approved validity period.",
  "## Data entities",
  "- Request stores the selected service and submitted details.",
  "## Integrations",
  "- n8n sends approved notifications.",
  "## Acceptance criteria",
  "- Given an accepted quote, when the customer confirms, then the request is converted.",
  "## Open questions",
  "- TBD: Which retention period should apply to draft requests?",
  "",
].join("\r\n");
const SOURCE_BYTES = Buffer.from(SPEC, "utf8");
const SOURCE_HASH = createHash("sha256").update(SOURCE_BYTES).digest("hex");

class FakePool implements HaiIntakePool, HaiIntakeClient {
  readonly calls: Array<{ sql: string; values: unknown[] }> = [];
  existingSpecification: { id: string; source_sha256: string; source_size_bytes: number; extraction_version: string } | null = null;
  insertedSpecification = true;
  requirementFound = true;
  insertedEvidence = true;
  failOnEvent = false;
  pageRows: Array<Record<string, unknown>> = [];
  linkedJobs = new Set<string>();
  transactionOpen = false;
  released = false;
  sourceParameter: Buffer | null = null;

  async connect(): Promise<HaiIntakeClient> { return this; }
  release(): void { this.released = true; }

  async query<Row = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<{ rows: Row[]; rowCount: number }> {
    this.calls.push({ sql, values });
    if (sql === "BEGIN") this.transactionOpen = true;
    if (sql === "COMMIT") this.transactionOpen = false;
    if (sql === "ROLLBACK") this.transactionOpen = false;
    if (sql.includes("SELECT id, source_sha256, source_size_bytes, extraction_version FROM hai_specifications")) {
      return { rows: (this.existingSpecification ? [this.existingSpecification] : []) as unknown as Row[], rowCount: this.existingSpecification ? 1 : 0 };
    }
    if (sql.includes("INSERT INTO hai_specifications")) {
      this.sourceParameter = values[9] as Buffer;
      return { rows: (this.insertedSpecification ? [{ id: SPEC_ID }] : []) as unknown as Row[], rowCount: this.insertedSpecification ? 1 : 0 };
    }
    if (sql.includes("SELECT item.id FROM hai_extracted_items AS item")) {
      return { rows: (this.requirementFound ? [{ id: ITEM_ID }] : []) as unknown as Row[], rowCount: this.requirementFound ? 1 : 0 };
    }
    if (sql.includes("INSERT INTO hai_specification_jobs")) {
      const key = `${String(values[0])}:${String(values[1])}`;
      if (this.linkedJobs.has(key)) return { rows: [] as unknown as Row[], rowCount: 0 };
      this.linkedJobs.add(key);
      return { rows: [{ job_id: values[1] }] as unknown as Row[], rowCount: 1 };
    }
    if (sql.includes("INSERT INTO hai_requirement_evidence")) {
      return { rows: (this.insertedEvidence ? [{ id: EVIDENCE_ID }] : []) as unknown as Row[], rowCount: this.insertedEvidence ? 1 : 0 };
    }
    if (sql.includes("SELECT id FROM hai_requirement_evidence")) {
      return { rows: [{ id: EVIDENCE_ID }] as unknown as Row[], rowCount: 1 };
    }
    if (sql.includes("FROM hai_extracted_items AS item") && sql.includes("ORDER BY item.ordinal")) {
      return { rows: this.pageRows as unknown as Row[], rowCount: this.pageRows.length };
    }
    if (sql.includes("INSERT INTO agent_job_events") && this.failOnEvent) throw new Error("simulated event storage failure");
    return { rows: [] as unknown as Row[], rowCount: 0 };
  }
}

function input(sourceBytes: Uint8Array = SOURCE_BYTES) {
  return {
    jobId: JOB_ID,
    sourceRepository: "atshpana/atsh-ai-v2",
    sourceRef: "implementation/bootstrap",
    sourcePath: "docs/HAI-MASTER.md",
    sourceVersion: "1.0.0",
    sourceBytes,
    sourceCommitSha: COMMIT,
    sourceBlobSha: BLOB,
  };
}

test("extracts all supported HAI families deterministically with source line evidence", () => {
  const first = extractHaiItems(SPEC, SOURCE_HASH);
  const second = extractHaiItems(SPEC, SOURCE_HASH);
  assert.deepEqual(first, second);
  assert.deepEqual(new Set(first.map((item) => item.itemType)), new Set([
    "requirement", "screen", "module", "role", "workflow", "business_rule", "entity", "integration", "acceptance_criterion", "question",
  ]));
  const requirement = first.find((item) => item.itemType === "requirement");
  assert.equal(requirement?.sourceLineStart, 3);
  assert.equal(requirement?.sourceExcerpt, "- The system must preserve each approved source version.");
  assert.equal(requirement?.statement, "The system must preserve each approved source version.");
  assert.match(first.find((item) => item.itemType === "question")?.statement ?? "", /^TBD:/);
});

test("rejects an individual extracted item larger than the bounded model page can safely carry", () => {
  const largeSource = `## Requirements\n- ${"x".repeat(9_000)}`;
  assert.throws(() => extractHaiItems(largeSource, SOURCE_HASH), /larger than the extraction limit/);
});

test("ingests exact source bytes once and records immutable digest, extraction and audit evidence", async () => {
  const db = new FakePool();
  const result = await ingestHaiSpecification(db, input());
  assert.equal(result.created, true);
  assert.equal(result.sourceSha256, SOURCE_HASH);
  assert.equal(result.sourceSizeBytes, SOURCE_BYTES.length);
  assert.equal(result.extractionVersion, HAI_INTAKE_EXTRACTOR_VERSION);
  assert.equal(result.requirementCount, 1);
  assert.equal(db.sourceParameter?.equals(SOURCE_BYTES), true);
  assert.ok(db.calls.some((call) => call.sql.includes("INSERT INTO hai_extracted_items")));
  const audit = db.calls.find((call) => call.sql.includes("hai.specification.ingested"));
  assert.ok(audit);
  assert.doesNotMatch(JSON.stringify(audit.values), /The system must preserve/);
  assert.equal(db.transactionOpen, false);
  assert.equal(db.released, true);
});

test("repeated intake for the same path and version is idempotent", async () => {
  const db = new FakePool();
  db.existingSpecification = { id: SPEC_ID, source_sha256: SOURCE_HASH, source_size_bytes: SOURCE_BYTES.length, extraction_version: HAI_INTAKE_EXTRACTOR_VERSION };
  const result = await ingestHaiSpecification(db, input());
  assert.equal(result.created, false);
  assert.equal(result.specificationId, SPEC_ID);
  assert.equal(db.calls.filter((call) => call.sql.includes("INSERT INTO hai_specifications")).length, 0);
  assert.equal(db.calls.filter((call) => call.sql.includes("hai.specification.ingested")).length, 0);
});

test("links a reused immutable source version to the requesting job", async () => {
  const db = new FakePool();
  db.existingSpecification = { id: SPEC_ID, source_sha256: SOURCE_HASH, source_size_bytes: SOURCE_BYTES.length, extraction_version: HAI_INTAKE_EXTRACTOR_VERSION };
  const requestingJobId = "66666666-6666-4666-8666-666666666666";
  const result = await ingestHaiSpecification(db, { ...input(), jobId: requestingJobId });
  assert.equal(result.created, false);
  const link = db.calls.find((call) => call.sql.includes("INSERT INTO hai_specification_jobs"));
  assert.deepEqual(link?.values, [SPEC_ID, requestingJobId]);
  assert.ok(db.calls.some((call) => call.sql.includes("hai.specification.reused")));
});

test("rejects attempts to reuse an immutable source version for different bytes", async () => {
  const db = new FakePool();
  db.existingSpecification = { id: SPEC_ID, source_sha256: "0".repeat(64), source_size_bytes: SOURCE_BYTES.length, extraction_version: HAI_INTAKE_EXTRACTOR_VERSION };
  await assert.rejects(ingestHaiSpecification(db, input()), /already exists with different bytes/);
  assert.ok(db.calls.some((call) => call.sql === "ROLLBACK"));
});

test("requires an explicit new source version when the extractor changes", async () => {
  const db = new FakePool();
  db.existingSpecification = { id: SPEC_ID, source_sha256: SOURCE_HASH, source_size_bytes: SOURCE_BYTES.length, extraction_version: "hai-markdown-v0" };
  await assert.rejects(ingestHaiSpecification(db, input()), /different extractor version/);
  assert.ok(db.calls.some((call) => call.sql === "ROLLBACK"));
});

test("rejects unsupported, invalid UTF-8, oversized, secret-like and path-traversal sources before database access", async () => {
  for (const invalid of [
    { ...input(), sourcePath: "../HAI.md" },
    { ...input(), sourcePath: "docs/HAI.pdf" },
    { ...input(Buffer.from([0xff, 0xfe, 0xfd])) },
    { ...input(Buffer.alloc(1_000_001, 0x61)) },
    { ...input(Buffer.from("## Requirements\n- GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuv1234567890", "utf8")) },
  ]) {
    const db = new FakePool();
    await assert.rejects(ingestHaiSpecification(db, invalid));
    assert.equal(db.calls.length, 0);
  }
});

test("rolls back the source, extraction and audit write as one unit", async () => {
  const db = new FakePool();
  db.failOnEvent = true;
  await assert.rejects(ingestHaiSpecification(db, input()), /simulated event storage failure/);
  assert.ok(db.calls.some((call) => call.sql.includes("INSERT INTO hai_specifications")));
  assert.ok(db.calls.some((call) => call.sql === "ROLLBACK"));
  assert.equal(db.transactionOpen, false);
});

test("pages extracted content with a bounded, stable source order", async () => {
  const db = new FakePool();
  db.pageRows = [{ itemKey: "HAI-aaaaaaaaaaaa-0001", itemType: "requirement", title: "An exact title", statement: "A source statement.", sourceExcerpt: "- A source statement.", sourceLineStart: 2, sourceLineEnd: 2, sourceHeading: "Requirements" }];
  assert.deepEqual(await readHaiExtractedItems(db, JOB_ID, SPEC_ID, 0, 50), { items: db.pageRows, nextOffset: null, hasMore: false });
  await assert.rejects(readHaiExtractedItems(db, JOB_ID, "not-a-uuid", 0, 50), /ID is invalid/);
  await assert.rejects(readHaiExtractedItems(db, JOB_ID, SPEC_ID, 0, 51), /page size is invalid/);
});

test("bounds page responses by bytes and returns the next stable offset", async () => {
  const db = new FakePool();
  db.pageRows = ["first", "second"].map((itemKey) => ({
    itemKey,
    itemType: "requirement",
    title: "Bounded row",
    statement: "x".repeat(30_000),
    sourceExcerpt: "y".repeat(12_000),
    sourceLineStart: 2,
    sourceLineEnd: 2,
    sourceHeading: "Requirements",
  }));
  const page = await readHaiExtractedItems(db, JOB_ID, SPEC_ID, 50, 50);
  assert.equal(page.items.length, 1);
  assert.equal(page.hasMore, true);
  assert.equal(page.nextOffset, 51);
  assert.ok(Buffer.byteLength(JSON.stringify(page), "utf8") < 65_536);
});

test("records requirement evidence as append-only and explicitly unverified", async () => {
  const db = new FakePool();
  const result = await recordHaiRequirementEvidence(db, {
    jobId: JOB_ID,
    requirementKey: "HAI-aaaaaaaaaaaa-0001",
    targetType: "test",
    artifactPath: "apps/worker/src/hai-intake.test.ts#L20",
    artifactCommitSha: COMMIT,
    artifactVersion: "agent/production-line-handoff",
  });
  assert.deepEqual(result, { evidenceId: EVIDENCE_ID, requirementKey: "HAI-aaaaaaaaaaaa-0001", verificationStatus: "unverified", created: true });
  const event = db.calls.find((call) => call.sql.includes("hai.requirement.evidence_proposed"));
  assert.match(String(event?.values[1]), /unverified/);
  assert.ok(db.calls.some((call) => call.sql.includes("ON CONFLICT DO NOTHING")));
});

test("rejects evidence paths outside safe repository-relative references", async () => {
  for (const artifactPath of ["../secrets.env", "https://example.invalid/file", "/etc/passwd"]) {
    const db = new FakePool();
    await assert.rejects(recordHaiRequirementEvidence(db, {
      jobId: JOB_ID,
      requirementKey: "HAI-aaaaaaaaaaaa-0001",
      targetType: "code",
      artifactPath,
      artifactCommitSha: COMMIT,
      artifactVersion: "main",
    }));
    assert.equal(db.calls.length, 0);
  }
});

