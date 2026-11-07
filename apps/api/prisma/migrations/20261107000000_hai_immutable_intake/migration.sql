-- Immutable HAI source intake and append-only requirement evidence for the dedicated agent database.
-- Additive only. Review and apply manually to agent-db; never run this against core-db.
BEGIN;

CREATE TABLE hai_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE RESTRICT,
  source_repository VARCHAR(200) NOT NULL CHECK (source_repository = 'atshpana/atsh-ai-v2'),
  source_ref VARCHAR(200) NOT NULL,
  source_path VARCHAR(512) NOT NULL,
  source_version VARCHAR(120) NOT NULL,
  source_media_type VARCHAR(80) NOT NULL CHECK (source_media_type IN ('text/markdown', 'text/plain')),
  source_sha256 CHAR(64) NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_size_bytes BIGINT NOT NULL CHECK (source_size_bytes BETWEEN 1 AND 1000000),
  source_bytes BYTEA NOT NULL,
  source_commit_sha CHAR(40) NOT NULL CHECK (source_commit_sha ~ '^[0-9a-f]{40}$'),
  source_blob_sha CHAR(40) NOT NULL CHECK (source_blob_sha ~ '^[0-9a-f]{40}$'),
  extraction_version VARCHAR(80) NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_path, source_version)
);
CREATE INDEX hai_specifications_job_time_idx ON hai_specifications(job_id, ingested_at);
CREATE INDEX hai_specifications_source_hash_idx ON hai_specifications(source_sha256);

CREATE TABLE hai_specification_jobs (
  specification_id UUID NOT NULL REFERENCES hai_specifications(id) ON DELETE RESTRICT,
  job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE RESTRICT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (specification_id, job_id)
);
CREATE INDEX hai_specification_jobs_job_idx ON hai_specification_jobs(job_id, linked_at);

CREATE TABLE hai_extracted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specification_id UUID NOT NULL REFERENCES hai_specifications(id) ON DELETE RESTRICT,
  ordinal INTEGER NOT NULL CHECK (ordinal > 0),
  item_key VARCHAR(80) NOT NULL,
  item_type VARCHAR(32) NOT NULL CHECK (item_type IN (
    'requirement', 'screen', 'module', 'role', 'workflow', 'business_rule',
    'entity', 'integration', 'acceptance_criterion', 'question'
  )),
  title VARCHAR(180) NOT NULL,
  statement TEXT NOT NULL,
  source_excerpt TEXT NOT NULL,
  source_line_start INTEGER NOT NULL CHECK (source_line_start > 0),
  source_line_end INTEGER NOT NULL CHECK (source_line_end >= source_line_start),
  source_heading TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (specification_id, ordinal),
  UNIQUE (specification_id, item_key)
);
CREATE INDEX hai_extracted_items_spec_type_ordinal_idx ON hai_extracted_items(specification_id, item_type, ordinal);

CREATE TABLE hai_requirement_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES hai_extracted_items(id) ON DELETE RESTRICT,
  job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE RESTRICT,
  target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('code', 'test', 'evidence')),
  artifact_path VARCHAR(512) NOT NULL,
  artifact_commit_sha CHAR(40) NOT NULL CHECK (artifact_commit_sha ~ '^[0-9a-f]{40}$'),
  artifact_version VARCHAR(200) NOT NULL,
  verification_status VARCHAR(24) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX hai_requirement_evidence_identity_idx
  ON hai_requirement_evidence(requirement_id, target_type, artifact_path, artifact_commit_sha, artifact_version);
CREATE INDEX hai_requirement_evidence_job_time_idx ON hai_requirement_evidence(job_id, created_at);

CREATE FUNCTION hai_reject_immutable_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'HAI intake and evidence records are append-only';
END;
$$;

CREATE TRIGGER hai_specifications_no_row_mutation
  BEFORE UPDATE OR DELETE ON hai_specifications
  FOR EACH ROW EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_specifications_no_truncate
  BEFORE TRUNCATE ON hai_specifications
  FOR EACH STATEMENT EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_specification_jobs_no_row_mutation
  BEFORE UPDATE OR DELETE ON hai_specification_jobs
  FOR EACH ROW EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_specification_jobs_no_truncate
  BEFORE TRUNCATE ON hai_specification_jobs
  FOR EACH STATEMENT EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_extracted_items_no_row_mutation
  BEFORE UPDATE OR DELETE ON hai_extracted_items
  FOR EACH ROW EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_extracted_items_no_truncate
  BEFORE TRUNCATE ON hai_extracted_items
  FOR EACH STATEMENT EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_requirement_evidence_no_row_mutation
  BEFORE UPDATE OR DELETE ON hai_requirement_evidence
  FOR EACH ROW EXECUTE FUNCTION hai_reject_immutable_mutation();
CREATE TRIGGER hai_requirement_evidence_no_truncate
  BEFORE TRUNCATE ON hai_requirement_evidence
  FOR EACH STATEMENT EXECUTE FUNCTION hai_reject_immutable_mutation();

COMMIT;

