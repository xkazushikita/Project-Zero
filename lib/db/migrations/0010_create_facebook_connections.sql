CREATE TABLE IF NOT EXISTS facebook_connections (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text,
  avatar_url text,
  follower_count integer,
  like_count integer,
  page_access_token text NOT NULL,
  token_expires_at timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now()
);
