import { Readable } from 'node:stream'
import { google } from 'googleapis'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

type DriveEvidenceInput = {
  dataUrl: string
  fileName: string
  fallbackMimeType?: string
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set.`)
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
  if (!match || !match[2]) throw new Error('Arquivo de evidencia invalido.')

  const mimeType = match[1] || fallbackMimeType || 'application/octet-stream'
  const buffer = Buffer.from(match[3], 'base64')

  if (!buffer.length) throw new Error('Arquivo de evidencia vazio.')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('Arquivo de evidencia acima de 8 MB.')

  return { mimeType, buffer }
}

export function isEvidenceDataUrl(value: string) {
  return value.startsWith('data:')
}

export async function uploadEvidenceToDrive(input: DriveEvidenceInput) {
  const folderId = requireEnv('GOOGLE_DRIVE_UPLOAD_FOLDER_ID')
  const { mimeType, buffer } = parseDataUrl(input.dataUrl, input.fallbackMimeType)
  const drive = getDriveClient()

  const created = await drive.files.create({
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
  if (!fileId) throw new Error('Google Drive nao retornou o ID do arquivo.')

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return created.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
}
