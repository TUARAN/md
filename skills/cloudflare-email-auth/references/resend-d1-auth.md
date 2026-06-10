# Resend, D1, and Cloudflare Reference

## Contents

- [D1 Data Model](#d1-data-model)
- [Migration Strategy](#migration-strategy)
- [Verification Code Policy](#verification-code-policy)
- [Resend Setup](#resend-setup)
- [Cloudflare DNS Auto Configure](#cloudflare-dns-auto-configure)
- [Manual DNS Setup](#manual-dns-setup)
- [Worker Secrets](#worker-secrets)
- [Deployment and Validation](#deployment-and-validation)
- [Troubleshooting](#troubleshooting)

## D1 Data Model

Recommended `users` fields:

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

Recommended `email_verification_codes` fields:

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

Use `purpose` values such as:

```txt
register
reset_password
```

## Migration Strategy

When replacing an OAuth-bound `users` table:

1. Disable foreign-key enforcement only for the migration transaction if required by SQLite/D1.
2. Create `users_new` with the target schema.
3. Copy old users into `users_new`, preserving `id`, plan, quota, subscription-related state, and timestamps.
4. Mark old rows with a legacy provider value if they cannot password-login yet.
5. Drop the old `users` table.
6. Rename `users_new` to `users`.
7. Recreate indexes.
8. Re-enable foreign-key enforcement.

Do not rename the old `users` table first without checking SQLite foreign-key rewrite behavior. Renaming can cause dependent tables to point at the legacy table name.

Validate migrations in two cases:

- Empty database with every migration applied in order.
- Database containing a legacy user plus representative foreign-key rows such as subscriptions or check-ins.

## Verification Code Policy

A practical baseline:

```txt
Code format: 6 numeric digits
TTL: 10 minutes
Maximum attempts: 5
Per-email send rate: 1 per minute
Per-email daily rate: 10 per day
Per-IP send rate: 6 per minute
```

Hash input should bind the code to its email and purpose:

```txt
normalized_email + purpose + code + EMAIL_CODE_SECRET
```

Use a cryptographic digest such as SHA-256 and store only the digest.

## Resend Setup

Create an API key in:

```txt
Resend Dashboard -> API keys -> Add API key
```

Never put the key in code. Store it as `RESEND_API_KEY`.

Resend's test sender:

```txt
onboarding@resend.dev
```

Use it only for initial testing. It is generally limited to the Resend account's own verified email. To send to arbitrary users, verify a domain you control.

Prefer a sending subdomain:

```txt
mail.example.com
```

Then use a sender such as:

```txt
Product Name <noreply@mail.example.com>
```

Resend send-email API shape:

```json
{
  "from": "Product Name <noreply@mail.example.com>",
  "to": ["user@example.com"],
  "subject": "Product registration code",
  "text": "Your code is 123456",
  "html": "<p>Your code is <strong>123456</strong></p>"
}
```

## Cloudflare DNS Auto Configure

When the domain's DNS is hosted by Cloudflare:

1. Open Resend `Domains`.
2. Click `Add domain`.
3. Enter a sending subdomain such as `mail.example.com`.
4. At the `DNS Records` step, click `Auto configure`.
5. Authorize Resend to make Cloudflare DNS changes.
6. Wait until Resend shows:

```txt
Status: Verified
Domain verified: Your domain is ready to send emails.
```

Auto configure is preferred because it avoids transcription mistakes in SPF, DKIM, MX, and Return-Path records.

## Manual DNS Setup

If auto configuration is unavailable, click `Manual setup` in Resend and copy each displayed DNS record into:

```txt
Cloudflare Dashboard
-> domain
-> DNS
-> Records
-> Add record
```

Typical examples:

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
Priority: value supplied by Resend
TTL: Auto
```

Rules:

- Copy `Name`, `Value`, `Content`, `Target`, and priority exactly.
- Cloudflare normally appends the root domain to the `Name` field.
- Set CNAME records to `DNS only`, not proxied orange-cloud mode.
- Allow several minutes to several hours for DNS propagation.

## Worker Secrets

Required secrets:

```txt
SESSION_SECRET
EMAIL_CODE_SECRET
RESEND_API_KEY
EMAIL_FROM
```

Example configuration:

```bash
pnpm exec wrangler secret put SESSION_SECRET
pnpm exec wrangler secret put EMAIL_CODE_SECRET
pnpm exec wrangler secret put RESEND_API_KEY
pnpm exec wrangler secret put EMAIL_FROM
```

Generate separate secret values:

```bash
openssl rand -base64 32
```

Do not place secrets in `wrangler.jsonc` public vars, committed `.env` files, screenshots, logs, or source code.

## Deployment and Validation

Apply remote D1 migrations:

```bash
pnpm exec wrangler d1 migrations apply <database-name> --remote
```

Deploy:

```bash
pnpm run wrangler:deploy
```

Smoke-test code sending:

```bash
curl -i -X POST https://example.com/api/auth/email/send-code \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","purpose":"register"}'
```

Expected API response:

```json
{ "ok": true }
```

Then verify:

1. The email arrives.
2. The registration form accepts the code.
3. The user row is created in D1.
4. The session cookie is set.
5. `/api/auth/me` returns the public user.
6. Logout clears the session.
7. Existing user-owned data remains attached after migration.

## Troubleshooting

### API returns ok:true but no email arrives

`ok:true` means the provider accepted the request, not that the inbox accepted delivery.

Open Resend `Logs` or `Emails` and inspect the recipient:

- `Delivered`: check inbox, spam, promotions, and provider filtering.
- `Bounced`: recipient provider rejected the message.
- `Failed`: inspect the provider error and sender configuration.

### Other recipients cannot receive test emails

`onboarding@resend.dev` is for testing. Verify a custom domain and use a sender under that domain.

### A mobile-number email address does not produce an SMS

An address such as `number@carrier-domain.example` is still email. Email verification is not SMS verification. Integrate a dedicated SMS provider separately if SMS codes are required.

### 429 response

The code-send or login rate limit was reached. Wait for the relevant window or adjust limits deliberately.

### 409 response

The email is already registered. Direct the user to login.

### 502 send failure

Check:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- Resend domain status is `Verified`
- Sender belongs to the verified domain
- Resend delivery logs
