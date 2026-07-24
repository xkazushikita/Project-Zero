CREATE TABLE IF NOT EXISTS tiktok_connections (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  open_id text NOT NULL,
  username text,
  display_name text,
  avatar_url text,
  follower_count integer,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now()
);
