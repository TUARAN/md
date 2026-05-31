-- Phase 5 billing data model.
--
-- 数据模型说明:
--   - users.pro_expires_at 是「单一真相」: 当前是否 Pro 看这个时间戳是否 >= now
--     用户首次付款 / 续费 / 退款都通过 webhook 写这里
--   - subscriptions 表是订阅历史 (谁、什么渠道、什么 SKU、当前周期)
--   - payment_events 是 webhook 原始 payload 审计日志,出问题可重放
--
-- 为什么不直接用 users.plan? plan 字段保留作为 (`free`|`pro`) 的派生标签,
-- 但**判断当前权限**统一查 pro_expires_at,避免「Pro 已过期但 plan 字段忘了
-- 改」这种 drift bug。Worker 在 toPublicUser 里实时算 plan。

ALTER TABLE users ADD COLUMN pro_expires_at INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_pro_expires_at ON users (pro_expires_at);

-- 订阅记录。一个用户可以有多条 (历史 + 当前)。
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL,
  provider                 TEXT NOT NULL CHECK (provider IN ('wechat', 'alipay', 'manual')),
  provider_order_id        TEXT,                    -- 渠道侧订单号
  provider_subscription_id TEXT,                    -- 渠道侧订阅 id (微信合约单号等)
  sku                      TEXT NOT NULL CHECK (sku IN ('pro_monthly', 'pro_yearly')),
  status                   TEXT NOT NULL CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'refunded')),
  amount_cents             INTEGER NOT NULL,        -- ¥39 月付 = 3900;¥399 年付 = 39900
  currency                 TEXT NOT NULL DEFAULT 'CNY',
  started_at               INTEGER NOT NULL DEFAULT 0,
  current_period_end       INTEGER NOT NULL DEFAULT 0,
  cancelled_at             INTEGER,
  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_order ON subscriptions (provider, provider_order_id);

-- 渠道回调的原始 payload + 签名校验结果。
-- 出现争议或漏发时,可以从这里重放。
CREATE TABLE IF NOT EXISTS payment_events (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT,                              -- 关联订阅(可空,因为可能签名失败前关联不上)
  provider        TEXT NOT NULL,
  event_type      TEXT NOT NULL,                     -- 例如 'wechat:NOTIFY_PAY_SUCCESS'
  signature_ok    INTEGER NOT NULL DEFAULT 0,        -- 0=签名失败 / 1=通过
  raw_payload     TEXT NOT NULL,                     -- 原始 JSON / XML 字符串
  processed_ok    INTEGER NOT NULL DEFAULT 0,        -- 0=处理失败 / 1=成功;失败的可重放
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_events_sub ON payment_events (subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events (created_at);
