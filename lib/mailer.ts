/**
 * lib/mailer.ts
 * Envio de e-mail via Web App do Google Apps Script (scripts/apps-script-backend.gs),
 * que roda "Executar como" a conta remetente (ex.: luiz.carlossilva@shopee.com).
 * Evita depender de domain-wide delegation / Gmail API.
 */

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set.`)
  return value
}

type AccessApprovedEmailParams = {
  to: string
  nome: string
  email: string
  senha: string
  appUrl: string
}

export async function sendAccessApprovedEmail(params: AccessApprovedEmailParams): Promise<void> {
  const url = requireEnv('APPS_SCRIPT_EMAIL_URL')
  const secret = requireEnv('APPS_SCRIPT_EMAIL_SECRET')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, ...params }),
  })

  const data = await res.json().catch(() => null) as { ok?: boolean; error?: string } | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Apps Script respondeu com status ${res.status}`)
  }
}
