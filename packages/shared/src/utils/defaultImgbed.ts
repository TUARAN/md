export interface DefaultImgbedConfig {
  username: string
  branch: string
  repoList: string[]
  accessTokenList: string[]
  useCDN: boolean
}

export interface DefaultImgbedUploadInput {
  content: string
  filename: string
  referer?: string
}

export interface DefaultImgbedEnv {
  IMGBED_GITHUB_USERNAME?: string
  IMGBED_GITHUB_BRANCH?: string
  IMGBED_GITHUB_REPO_COUNT?: string
  IMGBED_GITHUB_TOKENS?: string
  IMGBED_USE_CDN?: string
}

function parseList(raw?: string) {
  if (!raw?.trim())
    return []
  return raw
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function parseDefaultImgbedConfig(env: DefaultImgbedEnv): DefaultImgbedConfig | null {
  const username = env.IMGBED_GITHUB_USERNAME?.trim() || `bucketio`
  const branch = env.IMGBED_GITHUB_BRANCH?.trim() || `main`
  const repoCount = Number.parseInt(env.IMGBED_GITHUB_REPO_COUNT || `20`, 10)
  const accessTokenList = parseList(env.IMGBED_GITHUB_TOKENS)
  const repoList = Number.isFinite(repoCount) && repoCount > 0
    ? Array.from({ length: repoCount }, (_, i) => `img${i}`)
    : []

  if (!username || !accessTokenList.length || !repoList.length)
    return null

  return {
    username,
    branch,
    repoList,
    accessTokenList,
    useCDN: env.IMGBED_USE_CDN !== `0` && env.IMGBED_USE_CDN !== `false`,
  }
}

export function isDefaultImgbedConfigured(env: DefaultImgbedEnv) {
  return parseDefaultImgbedConfig(env) != null
}

function getDir() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, `0`)
  const day = date.getDate().toString().padStart(2, `0`)
  return `${year}/${month}/${day}`
}

function getDateFilename(filename: string) {
  const currentTimestamp = Date.now()
  const fileSuffix = filename.split(`.`).pop() || `png`
  return `${currentTimestamp}-${crypto.randomUUID()}.${fileSuffix}`
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export async function uploadViaDefaultImgbed(
  config: DefaultImgbedConfig,
  input: DefaultImgbedUploadInput,
): Promise<string> {
  const username = config.username
  const repo = pickRandom(config.repoList)
  const accessToken = pickRandom(config.accessTokenList)
  const branch = config.branch
  const dir = getDir()
  const dateFilename = getDateFilename(input.filename)
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${dir}/${dateFilename}`

  const response = await fetch(url, {
    method: `PUT`,
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': `application/vnd.github+json`,
      'Content-Type': `application/json`,
      'User-Agent': `md-default-imgbed`,
    },
    body: JSON.stringify({
      content: input.content,
      branch,
      message: `Upload by ${input.referer || `md-editor`}`,
    }),
  })

  const payload = await response.json().catch(() => ({})) as {
    message?: string
    content?: { download_url?: string }
  }

  if (!response.ok)
    throw new Error(payload.message || `GitHub upload failed (${response.status})`)

  const downloadUrl = payload.content?.download_url
  if (!downloadUrl)
    throw new Error(`GitHub upload succeeded but download_url is missing`)

  if (!config.useCDN)
    return downloadUrl

  const githubResourceUrl = `raw.githubusercontent.com/${username}/${repo}/${branch}/`
  const cdnResourceUrl = `fastly.jsdelivr.net/gh/${username}/${repo}@${branch}/`
  return downloadUrl.replace(githubResourceUrl, cdnResourceUrl)
}

export async function handleDefaultImgbedRequest(
  request: Request,
  env: DefaultImgbedEnv,
): Promise<Response> {
  const config = parseDefaultImgbedConfig(env)
  if (!config) {
    return Response.json(
      { error: `默认图床未配置，请在服务端设置 IMGBED_GITHUB_* 环境变量或 Wrangler Secret` },
      { status: 503 },
    )
  }

  if (request.method === `GET`)
    return Response.json({ ok: true })

  if (request.method !== `POST`) {
    return Response.json({ error: `Method Not Allowed` }, { status: 405 })
  }

  let body: DefaultImgbedUploadInput
  try {
    body = await request.json() as DefaultImgbedUploadInput
  }
  catch {
    return Response.json({ error: `Invalid JSON body` }, { status: 400 })
  }

  if (!body.content || !body.filename) {
    return Response.json({ error: `content and filename are required` }, { status: 400 })
  }

  try {
    const url = await uploadViaDefaultImgbed(config, {
      content: body.content,
      filename: body.filename,
      referer: body.referer || request.headers.get(`referer`) || undefined,
    })
    return Response.json({ url })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: message }, { status: 502 })
  }
}

export const DEFAULT_IMGBED_API_SUFFIX = `api/imgbed/default`

export function resolveDefaultImgbedPathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, ``) || `/`
  if (normalized.endsWith(`/${DEFAULT_IMGBED_API_SUFFIX}`) || normalized === `/${DEFAULT_IMGBED_API_SUFFIX}`)
    return true
  return false
}

/** @deprecated use resolveDefaultImgbedPathname */
export const isDefaultImgbedApiPath = resolveDefaultImgbedPathname

export async function uploadToDefaultGithubImgbed(
  config: DefaultImgbedConfig,
  content: string,
  filename: string,
  referer?: string,
) {
  return uploadViaDefaultImgbed(config, { content, filename, referer })
}
