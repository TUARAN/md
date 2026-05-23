import type { IncomingMessage } from 'node:http'
import type { Plugin, ResolvedConfig } from 'vite'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { loadEnv } from 'vite'

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on(`data`, chunk => chunks.push(Buffer.from(chunk)))
    req.on(`end`, () => resolve(Buffer.concat(chunks).toString(`utf8`)))
    req.on(`error`, reject)
  })
}

type DefaultImgbedModule = typeof import('@md/shared/utils/defaultImgbed')

export function defaultImgbedDevPlugin(): Plugin {
  let env: Record<string, string> = {}
  let modulePromise: Promise<DefaultImgbedModule | null> | null = null

  // 通过 Vite 的 ssrLoadModule 走 Vite 的转译管线，避免 Node 22 < 22.18
  // 不支持原生 ESM 加载 .ts 时崩溃；同时把首次加载失败缓存为 null，请求层返回
  // 500 而不会让整个 dev server 进程因 unhandled rejection 退出。
  function loadModule(server: import('vite').ViteDevServer): Promise<DefaultImgbedModule | null> {
    modulePromise ??= (async () => {
      try {
        return await server.ssrLoadModule(`@md/shared/utils/defaultImgbed`) as DefaultImgbedModule
      }
      catch (err) {
        console.warn(`[default-imgbed-dev] failed to load handler, default imgbed will be disabled in dev:`, err)
        return null
      }
    })()
    return modulePromise
  }

  return {
    name: `default-imgbed-dev`,
    configResolved(config: ResolvedConfig) {
      env = loadEnv(config.mode, config.root, ``)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const mod = await loadModule(server)
        if (!mod) {
          next()
          return
        }
        const { handleDefaultImgbedRequest, resolveDefaultImgbedPathname } = mod
        const url = new URL(req.url || `/`, `http://${req.headers.host || `localhost`}`)
        if (!resolveDefaultImgbedPathname(url.pathname)) {
          next()
          return
        }

        try {
          const body = req.method === `POST` ? await readRequestBody(req) : undefined
          const request = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as HeadersInit,
            body,
          })
          const response = await handleDefaultImgbedRequest(request, { ...process.env, ...env })
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(await response.text())
        }
        catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          res.statusCode = 500
          res.setHeader(`Content-Type`, `application/json`)
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}
