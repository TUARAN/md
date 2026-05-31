/**
 * GitHub OAuth — authorize URL + code → token + token → profile.
 */

import type { GitHubProfile } from './user'

const GITHUB_AUTHORIZE = `https://github.com/login/oauth/authorize`
const GITHUB_TOKEN = `https://github.com/login/oauth/access_token`
const GITHUB_USER = `https://api.github.com/user`
const GITHUB_USER_EMAILS = `https://api.github.com/user/emails`

export function buildAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const u = new URL(GITHUB_AUTHORIZE)
  u.searchParams.set(`client_id`, clientId)
  u.searchParams.set(`redirect_uri`, redirectUri)
  u.searchParams.set(`scope`, `read:user user:email`)
  u.searchParams.set(`state`, state)
  return u.toString()
}

export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(GITHUB_TOKEN, {
    method: `POST`,
    headers: {
      'Accept': `application/json`,
      'Content-Type': `application/json`,
      'User-Agent': `syncblog`,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok)
    throw new Error(`GitHub token exchange failed (${res.status})`)
  const data = await res.json<{
    access_token?: string
    error?: string
    error_description?: string
  }>()
  if (!data.access_token)
    throw new Error(data.error_description ?? data.error ?? `no access_token`)
  return data.access_token
}

export async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const headers = {
    'Accept': `application/vnd.github+json`,
    'Authorization': `Bearer ${accessToken}`,
    'User-Agent': `syncblog`,
  }
  const userRes = await fetch(GITHUB_USER, { headers })
  if (!userRes.ok)
    throw new Error(`GitHub /user ${userRes.status}`)
  const u = await userRes.json<{
    id: number
    login: string
    email: string | null
    name: string | null
    avatar_url: string | null
  }>()

  let email = u.email
  if (!email) {
    try {
      const emailsRes = await fetch(GITHUB_USER_EMAILS, { headers })
      if (emailsRes.ok) {
        const emails = await emailsRes.json<Array<{
          email: string
          primary: boolean
          verified: boolean
        }>>()
        const primary
          = emails.find(e => e.primary && e.verified)
            ?? emails.find(e => e.verified)
        email = primary?.email ?? null
      }
    }
    catch {
      // ignore — email is best-effort
    }
  }

  return {
    id: u.id,
    login: u.login,
    email,
    name: u.name,
    avatar_url: u.avatar_url,
  }
}
