-- Syncblog users + per-user AI quota.
-- Created for Phase 1 of the syncblog SaaS layer; sessions are stateless (HMAC cookies),
-- so this migration only models persistent user identity + quota counters.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,            -- uuid v4 minted server-side
  github_id       INTEGER NOT NULL UNIQUE,     -- numeric GitHub user id (stable)
  github_login    TEXT NOT NULL,               -- GitHub username at last login (mutable upstream)
  email           TEXT,                        -- best-effort, may be null if user hides it
  name            TEXT,                        -- display name from GitHub
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ai_quota_used   INTEGER NOT NULL DEFAULT 0,  -- counter for current quota window
  ai_quota_reset_at INTEGER NOT NULL DEFAULT 0,-- unix epoch seconds; when reached, counter resets
  created_at      INTEGER NOT NULL,            -- unix epoch seconds
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_github_id ON users (github_id);
