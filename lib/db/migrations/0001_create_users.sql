CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text,
  name text,
  workspace_name text NOT NULL DEFAULT 'My Workspace',
  notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
