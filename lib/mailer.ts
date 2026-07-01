/**
 * lib/mailer.ts
 * Envio de e-mail via Gmail API, reaproveitando a Service Account
 * já usada em lib/sheets.ts, com domain-wide delegation para
 * impersonar GMAIL_SENDER_EMAIL (conta do Google Workspace).
 */

import { google } from 'googleapis'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set.`)
  return value
}

function getGmailAuth() {
  const credentials = JSON.parse(requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: requireEnv('GMAIL_SENDER_EMAIL'),
  })
}

function getGmailClient() {
  return google.gmail({ version: 'v1', auth: getGmailAuth() })
}

function toBase64Url(message: string) {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

type AccessApprovedEmailParams = {
  to: string
  nome: string
  email: string
  senha: string
  appUrl: string
}

function buildAccessApprovedMessage({ to, from, nome, email, senha, appUrl }: AccessApprovedEmailParams & { from: string }) {
  const subject = 'Acesso liberado - 3PL Chamados'
  const boundary = 'boundary-3pl-chamados-acesso'

  const text = [
    `Ola, ${nome}.`,
    '',
    'Seu cadastro no 3PL Chamados foi aprovado. Seguem os dados de acesso:',
    '',
    `Login: ${email}`,
    `Senha temporaria: ${senha}`,
    `Acesse em: ${appUrl}`,
    '',
    'Recomendamos trocar a senha apos o primeiro acesso.',
  ].join('\r\n')

  const html = [
    `<p>Ola, ${nome}.</p>`,
    '<p>Seu cadastro no <strong>3PL Chamados</strong> foi aprovado. Seguem os dados de acesso:</p>',
    '<p>',
    `Login: <strong>${email}</strong><br>`,
    `Senha temporaria: <strong>${senha}</strong><br>`,
    `Acesse em: <a href="${appUrl}">${appUrl}</a>`,
    '</p>',
    '<p>Recomendamos trocar a senha apos o primeiro acesso.</p>',
  ].join('')

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n')
}

export async function sendAccessApprovedEmail(params: AccessApprovedEmailParams): Promise<void> {
  const from = requireEnv('GMAIL_SENDER_EMAIL')
  const gmail = getGmailClient()
  const raw = toBase64Url(buildAccessApprovedMessage({ ...params, from }))
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })
}
