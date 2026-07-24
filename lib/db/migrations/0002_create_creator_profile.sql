CREATE TABLE IF NOT EXISTS creator_profile (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  niche text,
  bio text,
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  tone text,
  past_deals text,
  rate_floor integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
