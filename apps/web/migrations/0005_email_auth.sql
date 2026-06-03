-- Switch account identity from GitHub OAuth to email/password.
--
-- Keep existing user ids so subscriptions, payment events and quota counters
-- continue to point at the same account rows. Legacy GitHub users are kept as
-- auth_provider='legacy_github'; they cannot password-login until manually
-- migrated to an email account.

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id                  TEXT PRIMARY KEY,
  email               TEXT UNIQUE,
  password_hash       TEXT,
  login               TEXT NOT NULL,
  name                TEXT,
  avatar_url          TEXT,
  auth_provider       TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'legacy_github')),
  email_verified_at   INTEGER,
  plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ai_quota_used       INTEGER NOT NULL DEFAULT 0,
  ai_quota_reset_at   INTEGER NOT NULL DEFAULT 0,
  pro_expires_at      INTEGER NOT NULL DEFAULT 0,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

INSERT INTO users_new (
  id,
  email,
  password_hash,
  login,
  name,
  avatar_url,
  auth_provider,
  email_verified_at,
  plan,
  ai_quota_used,
  ai_quota_reset_at,
  pro_expires_at,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  NULL,
  github_login,
  name,
  avatar_url,
  'legacy_github',
  NULL,
  plan,
  ai_quota_used,
  ai_quota_reset_at,
  pro_expires_at,
  created_at,
  updated_at
FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_login ON users (login);
CREATE INDEX IF NOT EXISTS idx_users_pro_expires_at ON users (pro_expires_at);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  code_hash      TEXT NOT NULL,
  purpose        TEXT NOT NULL CHECK (purpose IN ('register', 'reset_password')),
  expires_at     INTEGER NOT NULL,
  consumed_at    INTEGER,
  attempts       INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_codes_email_purpose
ON email_verification_codes (email, purpose, created_at);

CREATE INDEX IF NOT EXISTS idx_email_codes_expires_at
ON email_verification_codes (expires_at);

PRAGMA foreign_keys = ON;
