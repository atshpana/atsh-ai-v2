-- ATSH AI durable agent queue. Apply only to the new, independent PostgreSQL database.
-- This migration is intentionally not run automatically by the worker.
BEGIN;

CREATE TABLE agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(24) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','waiting_approval','succeeded','failed','cancelled')),
  input JSONB NOT NULL,
  result JSONB,
  checkpoint TEXT,
  last_response_id VARCHAR(255),
  approval_reason TEXT,
  last_error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner VARCHAR(160),
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'running') = (lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL))
);

CREATE INDEX agent_jobs_claim_idx ON agent_jobs(status, available_at, created_at);
CREATE INDEX agent_jobs_lease_idx ON agent_jobs(lease_expires_at) WHERE status = 'running';

CREATE TABLE agent_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE RESTRICT,
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX agent_job_events_job_time_idx ON agent_job_events(job_id, created_at);

COMMIT;
