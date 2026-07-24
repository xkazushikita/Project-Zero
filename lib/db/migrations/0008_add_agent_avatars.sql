ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS avatar_url text;
