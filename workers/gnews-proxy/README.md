# News API proxy (Cloudflare Worker)

Proxies browser-safe `GET` / `HEAD` requests to multiple news providers:

- `/api/gnews/search`
- `/api/newsapi/search`
- `/api/mediastack/search`
- `/api/guardian/search`
- `/api/currents/search`

Legacy `/api/v4/search` still maps to GNews.

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

| Name                 | Required | Description                                                      |
| -------------------- | -------- | ---------------------------------------------------------------- |
| `GNEWS_API_KEY`      | No       | Used when the client does not provide `apikey`.                  |
| `NEWSAPI_API_KEY`    | No       | Used when the client does not provide `apikey` for NewsAPI.      |
| `MEDIASTACK_API_KEY` | No       | Used when the client does not provide `apikey` for Mediastack.   |
| `GUARDIAN_API_KEY`   | No       | Used when the client does not provide `apikey` for The Guardian. |
| `CURRENTS_API_KEY`   | No       | Used when the client does not provide `apikey` for Currents.     |

Bind the secret:

```bash
npx wrangler secret put GNEWS_API_KEY
npx wrangler secret put NEWSAPI_API_KEY
npx wrangler secret put MEDIASTACK_API_KEY
npx wrangler secret put GUARDIAN_API_KEY
npx wrangler secret put CURRENTS_API_KEY
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
# Must match worker origin + /api
VITE_GNEWS_PROXY_URL=https://md-gnews-proxy.tuaran666.workers.dev/api
```

When unset on `https://md.tuaran666.workers.dev`, the app uses `https://md-gnews-proxy.tuaran666.workers.dev/api` by default. Other hosts can still call GNews directly, but additional providers require the proxy.
