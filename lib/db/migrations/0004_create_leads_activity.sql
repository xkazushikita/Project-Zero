CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text,
  name text NOT NULL,
  title text,
  company text,
  email text,
  status text NOT NULL DEFAULT 'new',
  score integer,
  source text NOT NULL DEFAULT 'manual',
  review text NOT NULL DEFAULT 'accepted',
  profile_url text,
  platform text,
  research jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_user_agent_idx ON leads (user_id, agent_id);
CREATE INDEX IF NOT EXISTS leads_user_review_idx ON leads (user_id, review);

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text,
  type text NOT NULL,
  lead_id uuid,
  text text NOT NULL,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_user_idx ON activity (user_id, created_at);
