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

| Name              | Required | Description                                                                                                                                                                                                |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS` | No       | Comma-separated allowed `Origin` values for CORS, or `*` for any origin. If unset, defaults to `*` (permissive). Set explicitly in production (e.g. `https://your-app.pages.dev,https://your-domain.com`). |

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
VITE_GNEWS_PROXY_URL=https://md-gnews-proxy.<your-subdomain>.workers.dev/api/v4
```

When unset, the app continues to call `https://gnews.io/api/v4` directly (localhost default unchanged).
