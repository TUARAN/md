---
name: cloudflare-email-auth
description: Implement, migrate, deploy, or troubleshoot email/password authentication for Cloudflare Worker applications using D1, signed HttpOnly session cookies, email verification codes, and Resend. Use when replacing OAuth login, designing auth tables and APIs, configuring Resend domains or Cloudflare DNS, setting Worker secrets, validating registration flows, or diagnosing email delivery.
---

# Cloudflare Email Auth

Build a first-class email identity system while preserving existing user-owned data such as subscriptions, quotas, and profile records.

## Workflow

1. Inspect the existing authentication boundary before editing.
   - Find user schema, session implementation, `/api/auth/*` routes, frontend auth store, login UI, billing lookups, and user-dependent features.
   - Search for provider-specific fields and routes such as `github_id`, `github_login`, OAuth callbacks, and provider client secrets.
2. Design the migration around stable internal user IDs.
   - Keep `users.id` unchanged so foreign keys and user-owned data remain attached.
   - Make email the login identity.
   - Store password hashes and verification timestamps.
   - Keep legacy provider rows only when existing production users must be preserved.
3. Implement the backend before the frontend.
   - Add password hashing, verification-code storage, email sending, user queries, and auth routes.
   - Reuse the existing signed HttpOnly session cookie when it is sound.
   - Remove provider-specific claims from session tokens.
4. Add the frontend login and registration flow.
   - Provide email, password, verification code, send-code countdown, loading states, and errors.
   - Route every existing login prompt to the same auth UI.
5. Configure Resend and Cloudflare.
   - Use a verified sending subdomain for production.
   - Store all secrets as Worker secrets, never source code or public vars.
6. Validate end to end.
   - Run migrations against an empty database and a database containing representative legacy users and foreign-key rows.
   - Run lint, type-check, build, API smoke tests, browser UI tests, and Resend delivery-log checks.

## Security Requirements

- Hash passwords with a memory- or CPU-hard password algorithm supported by the runtime. PBKDF2-SHA256 with a unique random salt is acceptable for Worker-native Web Crypto; do not store plaintext passwords.
- Store only a keyed hash of verification codes, not plaintext codes.
- Use separate random values for `SESSION_SECRET` and `EMAIL_CODE_SECRET`.
- Set session cookies to `HttpOnly`, `Secure`, and an appropriate `SameSite` value.
- Normalize emails before lookup and enforce a unique database constraint.
- Rate-limit code sending by email and IP, rate-limit login attempts, expire codes, cap attempts, and mark used codes as consumed.
- Return generic login errors so account existence is not leaked.
- Do not log passwords, verification codes, API keys, or session tokens.

## Recommended API Surface

```txt
GET  /api/auth/me
POST /api/auth/email/send-code
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

Keep the public user response free of password hashes, auth secrets, and internal-only fields.

## Implementation Guidance

- Prefer small modules for password hashing, email sending, verification-code persistence, user persistence, sessions, and route dispatch.
- Keep email-provider code behind one adapter so Resend can be replaced later.
- Use both HTML and plain-text email bodies.
- Treat `{"ok":true}` from the send-code API as “provider accepted the request,” not proof of inbox delivery.
- Update billing/admin lookup paths from provider usernames to email or internal user ID.
- Remove obsolete OAuth callback relays, cookies, configuration vars, and UI copy.

## Deployment Guidance

Configure these Worker secrets:

```txt
SESSION_SECRET
EMAIL_CODE_SECRET
RESEND_API_KEY
EMAIL_FROM
```

Generate independent random secrets, for example:

```bash
openssl rand -base64 32
```

Avoid rotating `SESSION_SECRET` casually because rotation invalidates every active session.

For production email, verify a subdomain such as `mail.example.com` in Resend and set:

```txt
Product Name <noreply@mail.example.com>
```

## References

Read [references/resend-d1-auth.md](references/resend-d1-auth.md) when you need:

- D1 schema and migration details
- Resend API and sending-domain setup
- Cloudflare Auto configure and manual DNS formats
- Deployment commands, API smoke tests, and delivery troubleshooting
