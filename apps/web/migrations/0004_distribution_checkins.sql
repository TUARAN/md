-- Daily workflow check-ins for platform growth plans.
--
-- Rows are scoped by user + creator + platform + local date + item id so the
-- frontend can restore the exact checklist state across browsers after login.

CREATE TABLE IF NOT EXISTS distribution_checkins (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  creator_id    TEXT NOT NULL,
  platform_type TEXT NOT NULL,
  checkin_date  TEXT NOT NULL, -- YYYY-MM-DD, generated on the client for the user's local day
  item_id       TEXT NOT NULL,
  done          INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_distribution_checkins_unique
  ON distribution_checkins (user_id, creator_id, platform_type, checkin_date, item_id);

CREATE INDEX IF NOT EXISTS idx_distribution_checkins_lookup
  ON distribution_checkins (user_id, creator_id, platform_type, checkin_date);
