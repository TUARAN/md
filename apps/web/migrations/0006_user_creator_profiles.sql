-- Per-user creator profile (创作名片 / 平台矩阵 / 策略上下文).
-- Site owner (tuaran666@gmail.com) seeds creator_id=tuaran; other users get their own slug.
-- 分享列 (share_token / share_enabled) 包含在本迁移内，避免上线后再 ALTER。

CREATE TABLE IF NOT EXISTS user_creator_profiles (
  user_id              TEXT PRIMARY KEY,
  creator_id           TEXT NOT NULL UNIQUE,
  display_name         TEXT NOT NULL,
  tagline              TEXT NOT NULL DEFAULT '',
  homepage             TEXT,
  contact_hint         TEXT,
  social_accounts_json TEXT NOT NULL DEFAULT '[]',
  share_token          TEXT,
  share_enabled        INTEGER NOT NULL DEFAULT 0,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_creator_profiles_creator_id
  ON user_creator_profiles (creator_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_creator_profiles_share_token
  ON user_creator_profiles (share_token);
