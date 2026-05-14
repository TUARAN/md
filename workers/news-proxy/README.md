# News API proxy (Cloudflare Worker)

> 历史 Worker 名沿用 `md-gnews-proxy`（URL: `https://md-gnews-proxy.tuaran666.workers.dev`）。文件夹和文档已改为 `news-proxy`，名字与实际服务的 7 个源对齐；URL 暂不改名以避免破坏前端。

Proxies browser-safe `GET` / `HEAD` requests to multiple news providers:

- `/api/gnews/search`
- `/api/hackernews/search` (no API key required)
- `/api/benzhi/search` (no API key required; upstream https://benzhi.online/api/news)
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

### 用 API Token 部署（无法 OAuth 登录时）

`dash.cloudflare.com` 走不通的网络环境下，可改用 API Token：

1. 控制台 → Profile → API Tokens → Create Token，选 "Edit Cloudflare Workers" 模板生成。
2. 在该目录执行：

```bash
CLOUDFLARE_API_TOKEN='xxx' npx wrangler deploy
```

部署只需要访问 `api.cloudflare.com`（境内多数网络直连可达），与 OAuth 登录分离。

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

When unset on `https://md.tuaran666.workers.dev`, the app uses `https://md-gnews-proxy.tuaran666.workers.dev/api` by default. Other hosts can still call GNews and Hacker News directly, but API-key providers require the proxy.
