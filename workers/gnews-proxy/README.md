# GNews API proxy (Cloudflare Worker)

Proxies browser-safe `GET` / `HEAD` to [GNews API v4 search](https://gnews.io/docs/v4) at `/api/v4/search`, matching the URL shape built by `@md/shared/utils/gnews` (`buildGNewsSearchUrl`).

## Deploy

First time, sign in to Cloudflare:

```bash
npx wrangler login
```

From this directory:

```bash
npx wrangler deploy
```

### Environment variables

| Name              | Required | Description                                                                                                                                             |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS` | No       | Comma-separated allowed `Origin` values for CORS, or `*` for any origin. This project sets it to `https://md.tuaran666.workers.dev` in `wrangler.toml`. |

Set plain vars in the Cloudflare dashboard (**Workers** → your worker → **Settings** → **Variables**) or via `wrangler.toml` `[vars]` for non-secret values.

### Secrets

| Name            | Required | Description                                                                                                                                                                            |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GNEWS_API_KEY` | No       | If set, the worker **replaces** the client `apikey` query parameter before calling GNews (key stays off the client). If unset, the incoming request’s `apikey` is forwarded unchanged. |

Bind the secret:

```bash
npx wrangler secret put GNEWS_API_KEY
```

(Paste the API key when prompted; it is stored encrypted in the dashboard.)

## Local dev

```bash
npx wrangler dev
```

The dev server prints a `*.workers.dev`-style URL; use it as `VITE_GNEWS_PROXY_URL` in the web app (see below).

## Web app

Set Vite env (e.g. `.env.production`):

```bash
# Must match worker origin + /api/v4 (same logical base as https://gnews.io/api/v4)
VITE_GNEWS_PROXY_URL=https://md-gnews-proxy.tuaran666.workers.dev/api/v4
```

When unset on `https://md.tuaran666.workers.dev`, the app uses `https://md-gnews-proxy.tuaran666.workers.dev/api/v4` by default. Other hosts continue to call `https://gnews.io/api/v4` directly unless `VITE_GNEWS_PROXY_URL` is configured.
