/**
 * Transactional email adapter.
 *
 * v1 implements Resend. Other providers can be added here without changing
 * auth routes.
 */

export interface EmailEnv {
  EMAIL_PROVIDER?: string
  EMAIL_FROM?: string
  RESEND_API_KEY?: string
}

export async function sendVerificationEmail(
  env: EmailEnv,
  params: {
    to: string
    code: string
    purpose: 'register' | 'reset_password'
  },
): Promise<void> {
  const provider = env.EMAIL_PROVIDER || `resend`
  if (provider !== `resend`)
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`)
  if (!env.RESEND_API_KEY)
    throw new Error(`missing RESEND_API_KEY`)
  if (!env.EMAIL_FROM)
    throw new Error(`missing EMAIL_FROM`)

  const purposeLabel = params.purpose === `register` ? `注册` : `重置密码`
  const text = `你的 SyncBlog ${purposeLabel}验证码是：${params.code}\n\n验证码 10 分钟内有效。如果不是你本人操作，可以忽略这封邮件。`
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#111827;">
      <p>你的 SyncBlog ${purposeLabel}验证码是：</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0;">${params.code}</p>
      <p style="color:#6b7280;">验证码 10 分钟内有效。如果不是你本人操作，可以忽略这封邮件。</p>
    </div>
  `
  const res = await fetch(`https://api.resend.com/emails`, {
    method: `POST`,
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': `application/json`,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [params.to],
      subject: `SyncBlog ${purposeLabel}验证码`,
      text,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => ``)
    throw new Error(`Resend email failed (${res.status}): ${body.slice(0, 200)}`)
  }
}
