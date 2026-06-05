import { Readable } from 'node:stream'
import { google } from 'googleapis'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export class DriveUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DriveUploadError'
  }
}

type DriveEvidenceInput = {
  dataUrl: string
  fileName: string
  fallbackMimeType?: string
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new DriveUploadError(`${name} must be set.`)
  return value
}

function getAuth() {
  const credentials = JSON.parse(requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
}

function getDriveClient() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

function sanitizeFileName(fileName: string) {
  const clean = fileName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120)

  return clean || `evidencia-${Date.now()}`
}

function parseDataUrl(dataUrl: string, fallbackMimeType?: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match || !match[2]) throw new DriveUploadError('Arquivo de evidencia invalido.')

  const mimeType = match[1] || fallbackMimeType || 'application/octet-stream'
  const buffer = Buffer.from(match[3], 'base64')

  if (!buffer.length) throw new DriveUploadError('Arquivo de evidencia vazio.')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new DriveUploadError('Arquivo de evidencia acima de 8 MB.')

  return { mimeType, buffer }
}

export function isEvidenceDataUrl(value: string) {
  return value.startsWith('data:')
}

export async function uploadEvidenceToDrive(input: DriveEvidenceInput) {
  const { mimeType, buffer } = parseDataUrl(input.dataUrl, input.fallbackMimeType)

  if (process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL) {
    return uploadEvidenceWithAppsScript({
      fileName: sanitizeFileName(input.fileName),
      mimeType,
      buffer,
    })
  }

  const folderId = requireEnv('GOOGLE_DRIVE_UPLOAD_FOLDER_ID')
  const drive = getDriveClient()

  try {
    const created = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: sanitizeFileName(input.fileName),
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id, webViewLink',
    })

    const fileId = created.data.id
    if (!fileId) throw new DriveUploadError('Google Drive nao retornou o ID do arquivo.')

    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return created.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Drive API has not been used') || message.includes('it is disabled')) {
      throw new DriveUploadError('Google Drive API nao esta ativada no projeto da service account.')
    }
    if (message.includes('Service Accounts do not have storage quota')) {
      throw new DriveUploadError('A pasta de upload precisa estar em um Drive compartilhado. Service accounts nao possuem cota para salvar arquivos no Meu Drive.')
    }
    if (message.includes('File not found') || message.includes('notFound')) {
      throw new DriveUploadError('Pasta de upload do Drive nao encontrada ou sem permissao para a service account.')
    }
    if (message.includes('insufficient') || message.includes('permission') || message.includes('Forbidden')) {
      throw new DriveUploadError('Service account sem permissao para enviar evidencia ao Drive.')
    }
    throw err
  }
}

async function uploadEvidenceWithAppsScript(input: { fileName: string; mimeType: string; buffer: Buffer }) {
  const uploadUrl = requireEnv('GOOGLE_APPS_SCRIPT_UPLOAD_URL')
  const token = requireEnv('GOOGLE_APPS_SCRIPT_UPLOAD_TOKEN')

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadEvidence',
      token,
      fileName: input.fileName,
      mimeType: input.mimeType,
      dataBase64: input.buffer.toString('base64'),
    }),
  })

  const text = await res.text()
  let data: { ok?: boolean; error?: string; url?: string } = {}

  try {
    data = JSON.parse(text)
  } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180)
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
      throw new DriveUploadError('Apps Script retornou HTML em vez de JSON. Verifique se a URL e do Web App /exec e se o acesso esta como Anyone.')
    }
    throw new DriveUploadError(`Apps Script retornou uma resposta invalida no upload da evidencia: ${preview || 'sem conteudo'}`)
  }

  if (!res.ok || !data.ok || !data.url) {
    throw new DriveUploadError(data.error || 'Apps Script nao conseguiu salvar a evidencia no Drive.')
  }

  return data.url
}
