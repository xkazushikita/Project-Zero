CREATE TABLE IF NOT EXISTS agents (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  initials text NOT NULL,
  role text NOT NULL,
  color text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  task text,
  score integer,
  goal text,
  char integer,
  type text NOT NULL DEFAULT 'custom',
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS teams (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  icon text,
  icon_bg text,
  description text,
  goal text,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  meetings integer NOT NULL DEFAULT 0,
  pipeline integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS agent_config (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  role text,
  goal text,
  permissions jsonb,
  settings jsonb,
  PRIMARY KEY (user_id, agent_id)
);

CREATE TABLE IF NOT EXISTS agent_states (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  removed boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, agent_id)
);

CREATE TABLE IF NOT EXISTS team_members (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id text NOT NULL,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (user_id, team_id)
);
