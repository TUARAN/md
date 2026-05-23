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

export function defaultImgbedDevPlugin(): Plugin {
  let env: Record<string, string> = {}

  return {
    name: `default-imgbed-dev`,
    configResolved(config: ResolvedConfig) {
      env = loadEnv(config.mode, config.root, ``)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { handleDefaultImgbedRequest, resolveDefaultImgbedPathname } = await import(`@md/shared/utils/defaultImgbed`)
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
