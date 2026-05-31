-- Per-IP rate-limit counters, scoped by endpoint family ("scope").
--
-- Key shape: "{scope}:{ip}:{window_id}" where window_id is
-- floor(unix_seconds / window_size). Each row holds the count for that
-- window. Rows expire when expires_at < now() and can be GC'd; doing it
-- inline on each write would penalise the hot path, so cleanup is left to
-- a future cron — leftover rows are cheap (small, indexed).

CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL DEFAULT 0,
  expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires
  ON rate_limits (expires_at);
