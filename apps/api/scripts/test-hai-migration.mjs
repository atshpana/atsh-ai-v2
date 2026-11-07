import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const requiredDatabase = 'hai_migration_acceptance';
const requiredUser = 'hai_test';
const databaseUrl = process.env.HAI_MIGRATION_TEST_DATABASE_URL;

function parseLocalTestDatabaseUrl(value) {
  if (!value) throw new Error('HAI migration test database URL is required');

  const url = new URL(value);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    url.port !== '5432' ||
    databaseName !== requiredDatabase ||
    decodeURIComponent(url.username) !== requiredUser ||
    url.search ||
    url.hash
  ) {
    throw new Error('Refusing to use anything except the dedicated local HAI migration test database');
  }

  return url.toString();
}

async function expectAppendOnlyFailure(client, statement) {
  await client.query('BEGIN');
  try {
    await assert.rejects(client.query(statement), {
      message: 'HAI intake and evidence records are append-only',
    });
  } finally {
    await client.query('ROLLBACK');
  }
}

async function main() {
  const connectionString = parseLocalTestDatabaseUrl(databaseUrl);
  const client = new Client({ connectionString, connectionTimeoutMillis: 5_000 });
  await client.connect();

  try {
    const existingTables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 1",
    );
    if (existingTables.rowCount !== 0) {
      throw new Error('Refusing to apply test migrations to a database that is not empty');
    }

    const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
    const migrationsRoot = join(apiRoot, 'prisma', 'migrations');
    const migrations = (await readdir(migrationsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    if (migrations.length === 0) throw new Error('No API migrations were found');

    for (const migration of migrations) {
      const sql = await readFile(join(migrationsRoot, migration, 'migration.sql'), 'utf8');
      await client.query(sql);
    }

    const job = await client.query(
      "INSERT INTO agent_jobs(input) VALUES ('{}'::jsonb) RETURNING id",
    );
    const jobId = job.rows[0].id;
    const specificationId = randomUUID();
    const itemId = randomUUID();
    const evidenceId = randomUUID();
    const source = Buffer.from('# HAI migration acceptance\n- Requirement: keep intake immutable.\n');
    const sourceHash = createHash('sha256').update(source).digest('hex');

    await client.query(
      `INSERT INTO hai_specifications (
        id, job_id, source_repository, source_ref, source_path, source_version,
        source_media_type, source_sha256, source_size_bytes, source_bytes,
        source_commit_sha, source_blob_sha, extraction_version
      ) VALUES ($1, $2, 'atshpana/atsh-ai-v2', 'refs/heads/main', 'docs/acceptance.md',
        'test-v1', 'text/markdown', $3, $4, $5, $6, $7, 'test-extractor-v1')`,
      [
        specificationId,
        jobId,
        sourceHash,
        source.byteLength,
        source,
        'a'.repeat(40),
        'b'.repeat(40),
      ],
    );
    await client.query(
      'INSERT INTO hai_specification_jobs(specification_id, job_id) VALUES ($1, $2)',
      [specificationId, jobId],
    );
    await client.query(
      `INSERT INTO hai_extracted_items (
        id, specification_id, ordinal, item_key, item_type, title, statement,
        source_excerpt, source_line_start, source_line_end
      ) VALUES ($1, $2, 1, 'REQ-1', 'requirement', 'Keep intake immutable',
        'Keep the approved source immutable.', 'Requirement: keep intake immutable.', 2, 2)`,
      [itemId, specificationId],
    );
    await client.query(
      `INSERT INTO hai_requirement_evidence (
        id, requirement_id, job_id, target_type, artifact_path,
        artifact_commit_sha, artifact_version
      ) VALUES ($1, $2, $3, 'test', 'apps/api/scripts/test-hai-migration.mjs', $4, 'test-v1')`,
      [evidenceId, itemId, jobId, 'c'.repeat(40)],
    );

    const immutableTables = [
      ['hai_specifications', `UPDATE hai_specifications SET source_ref = 'refs/heads/changed' WHERE id = '${specificationId}'`, `DELETE FROM hai_specifications WHERE id = '${specificationId}'`],
      ['hai_specification_jobs', `UPDATE hai_specification_jobs SET linked_at = NOW() WHERE specification_id = '${specificationId}' AND job_id = '${jobId}'`, `DELETE FROM hai_specification_jobs WHERE specification_id = '${specificationId}' AND job_id = '${jobId}'`],
      ['hai_extracted_items', `UPDATE hai_extracted_items SET statement = 'changed' WHERE id = '${itemId}'`, `DELETE FROM hai_extracted_items WHERE id = '${itemId}'`],
      ['hai_requirement_evidence', `UPDATE hai_requirement_evidence SET artifact_version = 'changed' WHERE id = '${evidenceId}'`, `DELETE FROM hai_requirement_evidence WHERE id = '${evidenceId}'`],
    ];

    for (const [table, update, deletion] of immutableTables) {
      await expectAppendOnlyFailure(client, update);
      await expectAppendOnlyFailure(client, deletion);
      await expectAppendOnlyFailure(client, `TRUNCATE TABLE ${table} CASCADE`);
    }

    const retainedRows = await client.query(
      `SELECT
        (SELECT count(*) FROM hai_specifications WHERE id = $1) AS specifications,
        (SELECT count(*) FROM hai_specification_jobs WHERE specification_id = $1 AND job_id = $2) AS links,
        (SELECT count(*) FROM hai_extracted_items WHERE id = $3) AS items,
        (SELECT count(*) FROM hai_requirement_evidence WHERE id = $4) AS evidence`,
      [specificationId, jobId, itemId, evidenceId],
    );
    assert.deepEqual(
      Object.values(retainedRows.rows[0]).map(Number),
      [1, 1, 1, 1],
      'failed mutations must leave every inserted audit row intact',
    );

    console.log(
      `PASS: applied ${migrations.length} API migrations to an empty local test database; verified all four HAI tables reject UPDATE, DELETE, and TRUNCATE.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`HAI migration acceptance failed: ${error instanceof Error ? error.message : 'unexpected error'}`);
  process.exitCode = 1;
});

