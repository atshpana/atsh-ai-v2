-- Durable, versioned planning records. Apply only to the dedicated agent database after review.
BEGIN;

CREATE TABLE agent_tool_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  registry_version VARCHAR(80) NOT NULL,
  brief JSONB NOT NULL,
  plan JSONB NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','rejected','superseded')),
  estimated_monthly_usd DOUBLE PRECISION CHECK (estimated_monthly_usd IS NULL OR estimated_monthly_usd >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  requires_human_approval BOOLEAN NOT NULL DEFAULT TRUE,
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_note VARCHAR(2000),
  fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, version),
  UNIQUE(job_id, fingerprint)
);
CREATE INDEX agent_tool_plans_status_created_idx ON agent_tool_plans(status, created_at);
CREATE INDEX agent_tool_plans_job_created_idx ON agent_tool_plans(job_id, created_at);

CREATE TABLE agent_tool_plan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES agent_tool_plans(id) ON DELETE RESTRICT,
  event_type VARCHAR(80) NOT NULL,
  actor_user_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX agent_tool_plan_events_plan_time_idx ON agent_tool_plan_events(plan_id, created_at);

CREATE TABLE agent_tool_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id VARCHAR(120) NOT NULL,
  provider VARCHAR(120) NOT NULL,
  version VARCHAR(80) NOT NULL,
  metadata JSONB NOT NULL,
  source_url VARCHAR(2000),
  pricing_url VARCHAR(2000),
  terms_url VARCHAR(2000),
  region VARCHAR(80),
  evidence_verified_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(capability_id, version)
);
CREATE INDEX agent_tool_capabilities_provider_enabled_idx ON agent_tool_capabilities(provider, enabled);

COMMIT;
