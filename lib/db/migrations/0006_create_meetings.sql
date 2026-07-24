CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text,
  lead_id uuid,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'call',
  when_at timestamptz NOT NULL,
  when_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meetings_user_when_idx ON meetings (user_id, when_at);
