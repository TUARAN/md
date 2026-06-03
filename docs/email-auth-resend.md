# 邮箱登录与 Resend 邮件验证码配置经验

本文记录 SyncBlog 从 GitHub OAuth 改为邮箱注册 / 密码登录的设计方案，以及使用 Resend 发送邮箱验证码、通过 Cloudflare 自动配置 DNS 的上线流程。

## 目标

- 不再依赖 GitHub 登录。
- 用户使用邮箱、密码注册和登录。
- 注册时发送邮箱验证码。
- 用户数据继续存储在 Cloudflare D1。
- 登录态继续使用 Worker 签名的 HttpOnly cookie。
- 邮件发送使用第三方服务 Resend。

## 认证设计

后端接口：

```txt
GET  /api/auth/me
POST /api/auth/email/send-code
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

流程：

1. 用户输入邮箱，点击发送验证码。
2. Worker 生成 6 位验证码。
3. D1 只存验证码哈希，不存明文验证码。
4. Worker 调用 Resend API 发送验证码邮件。
5. 用户提交邮箱、密码、验证码。
6. Worker 校验验证码，使用 PBKDF2-SHA256 哈希密码。
7. 用户写入 D1 `users` 表。
8. Worker 签发 HttpOnly session cookie。

## D1 数据模型

核心表：

- `users`
- `email_verification_codes`
- 既有的 `subscriptions`、`payment_events`、AI 配额字段继续保留。

`users` 关键字段：

```txt
id
email
password_hash
login
name
avatar_url
auth_provider
email_verified_at
plan
ai_quota_used
ai_quota_reset_at
pro_expires_at
created_at
updated_at
```

`email_verification_codes` 关键字段：

```txt
id
email
code_hash
purpose
expires_at
consumed_at
attempts
created_at
```

验证码策略：

- 6 位数字验证码。
- 有效期 10 分钟。
- 最多尝试 5 次。
- 同邮箱每分钟 1 次。
- 同邮箱每天 10 次。
- 同 IP 每分钟 6 次。

## Resend 配置

### 1. 创建 API Key

进入 Resend 后台：

```txt
API keys -> Add API key
```

生成后不要写进代码，也不要提交到仓库。通过 Cloudflare Worker secret 配置。

### 2. 测试发件人

Resend 默认提供：

```txt
onboarding@resend.dev
```

这个地址只适合测试，通常只能发送给 Resend 账号关联邮箱。要给任意用户发送验证码，必须验证自己的域名。

### 3. 添加自定义域名

推荐添加子域名：

```txt
mail.syncblog.cn
```

这样正式发件人可以配置成：

```txt
SyncBlog <noreply@mail.syncblog.cn>
```

## Cloudflare 自动授权配置 DNS

如果域名 DNS 托管在 Cloudflare，Resend 的 Add domain 页面会提供自动配置入口。

操作流程：

1. Resend 左侧进入 `Domains`。
2. 点击 `Add domain`。
3. 输入：

```txt
mail.syncblog.cn
```

4. 到 `DNS Records` 步骤。
5. 点击 `Auto configure`。
6. 授权 Resend 访问 Cloudflare。
7. Resend 自动写入 SPF、DKIM、MX / Return-Path 等记录。
8. 等待状态变为 `Verified`。

看到类似状态即可：

```txt
Status: Verified
Domain verified: Your domain is ready to send emails.
```

## 手动 DNS 配置

如果不使用自动授权，就在 Resend 点 `Manual setup`，复制它展示的 DNS records。

Cloudflare 路径：

```txt
Cloudflare Dashboard
-> syncblog.cn
-> DNS
-> Records
-> Add record
```

常见记录格式：

```txt
Type: TXT
Name: mail
Content: v=spf1 include:amazonses.com ~all
TTL: Auto
```

```txt
Type: TXT
Name: resend._domainkey.mail
Content: p=...
TTL: Auto
```

```txt
Type: CNAME
Name: bounce.mail
Target: ...
Proxy status: DNS only
TTL: Auto
```

```txt
Type: MX
Name: mail
Mail server: ...
Priority: Resend 给出的值
TTL: Auto
```

注意事项：

- `Name` 按 Resend 给出的主机名填写；Cloudflare 通常会自动补全根域名。
- `Value` / `Content` / `Target` 必须完整复制。
- CNAME 必须是 `DNS only`，不要开启橙云代理。
- DNS 生效可能需要几分钟到数小时。

## Worker secrets

需要配置：

```txt
SESSION_SECRET
EMAIL_CODE_SECRET
RESEND_API_KEY
EMAIL_FROM
```

生成随机密钥：

```bash
openssl rand -base64 32
```

配置命令：

```bash
cd apps/web

pnpm exec wrangler secret put SESSION_SECRET
pnpm exec wrangler secret put EMAIL_CODE_SECRET
pnpm exec wrangler secret put RESEND_API_KEY
pnpm exec wrangler secret put EMAIL_FROM
```

正式 `EMAIL_FROM` 推荐值：

```txt
SyncBlog <noreply@mail.syncblog.cn>
```

说明：

- `SESSION_SECRET` 用于签名登录 cookie，线上不要频繁更换，否则所有用户需要重新登录。
- `EMAIL_CODE_SECRET` 用于验证码哈希，应该和 `SESSION_SECRET` 使用不同随机值。
- `RESEND_API_KEY` 是 Resend 后台生成的 API key。
- `EMAIL_FROM` 必须使用 Resend 已验证域名下的发件地址。

## 部署和验证

应用 D1 migration：

```bash
cd apps/web
pnpm exec wrangler d1 migrations apply syncblog --remote
```

部署 Worker：

```bash
pnpm run wrangler:deploy
```

测试发验证码：

```bash
curl -i -X POST https://syncblog.cn/api/auth/email/send-code \
  -H 'Content-Type: application/json' \
  --data '{"email":"your-email@example.com","purpose":"register"}'
```

预期响应：

```json
{ "ok": true }
```

然后在邮箱中查看验证码。

## 常见问题

### 返回 ok:true 但没收到邮件

`ok:true` 表示 Worker 已经成功调用 Resend API。下一步去 Resend 后台查看 `Logs` 或 `Emails`。

关注状态：

- `Delivered`：Resend 认为已投递，检查收件箱、垃圾邮件、广告邮件。
- `Bounced`：收件方拒收。
- `Failed`：Resend 请求失败或发件配置有问题。

### 139 邮箱没有短信提醒

当前实现是邮箱验证码，不是短信验证码。`19802021453@139.com` 是邮箱地址，不等同于手机短信验证码。

如果未来需要短信验证码，应另接短信服务，例如阿里云短信、腾讯云短信等。

### 429 限流

发送验证码有频率限制：

- 同邮箱 1 分钟 1 次。
- 同邮箱每天 10 次。
- 同 IP 每分钟 6 次。

等待一段时间后再试。

### 409 邮箱已注册

说明该邮箱已经存在于 `users` 表，应该走登录流程。

### 502 验证码邮件发送失败

检查：

- `RESEND_API_KEY` 是否正确。
- `EMAIL_FROM` 是否属于 Resend 已验证域名。
- Resend 域名状态是否为 `Verified`。
- Resend Logs 中是否有更具体的错误。
