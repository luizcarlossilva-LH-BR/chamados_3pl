import { put } from '@vercel/blob'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

type EvidenceInput = {
  dataUrl: string
  fileName: string
  fallbackMimeType?: string
}

export class EvidenceUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvidenceUploadError'
  }
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
  if (!match || !match[2]) throw new EvidenceUploadError('Arquivo de evidencia invalido.')

  const mimeType = match[1] || fallbackMimeType || 'application/octet-stream'
  const buffer = Buffer.from(match[3], 'base64')

  if (!buffer.length) throw new EvidenceUploadError('Arquivo de evidencia vazio.')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new EvidenceUploadError('Arquivo de evidencia acima de 8 MB.')

  return { mimeType, buffer }
}

export function isEvidenceDataUrl(value: string) {
  return value.startsWith('data:')
}

export async function uploadEvidence(input: EvidenceInput) {
  const { mimeType, buffer } = parseDataUrl(input.dataUrl, input.fallbackMimeType)
  const safeName = sanitizeFileName(input.fileName)
  const pathname = `evidencias/${Date.now()}-${safeName}`

  try {
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: true,
    })

    return blob.url
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    const cleanMessage = message.replace(/\s+/g, ' ').trim()

    if (
      cleanMessage.includes('BLOB_READ_WRITE_TOKEN') ||
      cleanMessage.toLowerCase().includes('no token found') ||
      cleanMessage.toLowerCase().includes('missing token')
    ) {
      throw new EvidenceUploadError('Token do Vercel Blob nao configurado. Verifique BLOB_READ_WRITE_TOKEN no Vercel.')
    }

    throw new EvidenceUploadError(
      `Nao foi possivel enviar a evidencia para o Vercel Blob.${cleanMessage ? ` Detalhe: ${cleanMessage.slice(0, 180)}` : ''}`,
    )
  }
}
