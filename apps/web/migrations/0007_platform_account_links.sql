-- Additive only: original user IDs, passwords, paid periods and quota are kept.
CREATE TABLE IF NOT EXISTS platform_account_links (
  platform_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  created_at INTEGER NOT NULL
);
