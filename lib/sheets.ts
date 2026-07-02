/**
 * lib/sheets.ts
 * Google Sheets as database via Service Account.
 *
 * Sheet structure:
 *   tickets         - one row per ticket
 *   users           - one row per user
 *   access_requests - pending signup requests
 *
 * Reads and writes use Sheets API v4 via Service Account.
 */

import { google } from 'googleapis'
import type { Ticket, User, AccessRequest, TimelineEvent, EmailQueueItem } from '@/types'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set.`)
  return value
}

function getAuth() {
  const credentials = JSON.parse(requireEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

function getSheetId() {
  return requireEnv('GOOGLE_SHEETS_ID')
}

async function readRange(range: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range,
  })
  return (res.data.values || []) as string[][]
}

async function appendRow(sheetName: string, values: string[]) {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

async function updateRow(sheetName: string, rowIndex: number, values: string[]) {
  const sheets = getSheetsClient()
  const colLast = String.fromCharCode(64 + values.length)
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!A${rowIndex}:${colLast}${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

function rowToTicket(row: string[], rowIdx: number): Ticket {
  return {
    id: row[0] || `T${rowIdx}`,
    empresa: row[1] || '',
    setor: row[2] || '',
    tipo: (row[3] || 'erro') as Ticket['tipo'],
    categoria: row[4] || '',
    kpis: safeJSON(row[5], []),
    impacto: (row[6] || 'medio') as Ticket['impacto'],
    status: (row[7] || 'aberto') as Ticket['status'],
    descricao: row[8] || '',
    evidencia: row[9] || '',
    periodo: row[10] || '',
    rotas: row[11] || '',
    drivers: row[12] || '',
    email: row[13] || '',
    nome: row[14] || '',
    responsavel: row[15] || '',
    sla: row[16] || '',
    timeline: safeJSON(row[17], []),
    criadoEm: row[18] || '',
    atualizadoEm: row[19] || '',
  }
}

function ticketToRow(t: Ticket): string[] {
  return [
    t.id, t.empresa, t.setor, t.tipo, t.categoria,
    JSON.stringify(t.kpis), t.impacto, t.status, t.descricao,
    t.evidencia, t.periodo, t.rotas, t.drivers, t.email, t.nome,
    t.responsavel, t.sla, JSON.stringify(t.timeline),
    t.criadoEm, new Date().toISOString(),
  ]
}

export async function getAllTickets(): Promise<Ticket[]> {
  const rows = await readRange('tickets!A2:T')
  return rows.map((r, i) => rowToTicket(r, i + 2))
}

export async function getTicketsByEmpresa(empresa: string): Promise<Ticket[]> {
  const all = await getAllTickets()
  return all.filter(t => t.empresa === empresa)
}

export async function createTicket(t: Omit<Ticket, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Ticket> {
  const all = await getAllTickets()
  const id = nextSequentialId(all.map(ticket => ticket.id), 'BSC-', 3)
  const now = new Date().toISOString()
  const ticket: Ticket = { ...t, id, criadoEm: now, atualizadoEm: now }
  await appendRow('tickets', ticketToRow(ticket))
  return ticket
}

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null> {
  const rows = await readRange('tickets!A2:T')
  const rowIdx = rows.findIndex(r => r[0] === id)
  if (rowIdx === -1) return null
  const existing = rowToTicket(rows[rowIdx], rowIdx + 2)
  const updated = { ...existing, ...patch, atualizadoEm: new Date().toISOString() }
  await updateRow('tickets', rowIdx + 2, ticketToRow(updated))
  return updated
}

export async function appendTimelineEvent(ticketId: string, event: TimelineEvent): Promise<Ticket | null> {
  const rows = await readRange('tickets!A2:T')
  const rowIdx = rows.findIndex(r => r[0] === ticketId)
  if (rowIdx === -1) return null
  const ticket = rowToTicket(rows[rowIdx], rowIdx + 2)
  ticket.timeline = [...ticket.timeline, event]
  ticket.atualizadoEm = new Date().toISOString()
  await updateRow('tickets', rowIdx + 2, ticketToRow(ticket))
  return ticket
}

function rowToUser(row: string[]): User {
  return {
    id: row[0] || '',
    nome: row[1] || '',
    email: row[2] || '',
    senha: row[3] || '',
    role: (row[4] || 'operador') as User['role'],
    empresa: row[5] || '',
    setor: row[6] || '',
    ativo: row[7] !== 'false',
    criadoEm: row[8] || '',
  }
}

function userToRow(u: User): string[] {
  return [u.id, u.nome, u.email, u.senha, u.role, u.empresa, u.setor, String(u.ativo), u.criadoEm]
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await readRange('users!A2:I')
  return rows.map(rowToUser)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const all = await getAllUsers()
  return all.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

export async function createUser(u: Omit<User, 'id' | 'criadoEm'>): Promise<User> {
  const all = await getAllUsers()
  const id = nextSequentialId(all.map(user => user.id), 'U', 3)
  const user: User = { ...u, id, criadoEm: new Date().toISOString() }
  await appendRow('users', userToRow(user))
  return user
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | null> {
  const rows = await readRange('users!A2:I')
  const rowIdx = rows.findIndex(r => r[0] === id)
  if (rowIdx === -1) return null
  const existing = rowToUser(rows[rowIdx])
  const updated = { ...existing, ...patch }
  await updateRow('users', rowIdx + 2, userToRow(updated))
  return updated
}

function rowToRequest(row: string[]): AccessRequest {
  return {
    id: row[0] || '',
    nome: row[1] || '',
    email: row[2] || '',
    empresa: row[3] || '',
    setor: row[4] || '',
    justificativa: row[5] || '',
    status: (row[6] || 'pendente') as AccessRequest['status'],
    criadoEm: row[7] || '',
  }
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  const rows = await readRange('access_requests!A2:H')
  return rows.map(rowToRequest)
}

export async function createAccessRequest(r: Omit<AccessRequest, 'id' | 'status' | 'criadoEm'>): Promise<AccessRequest> {
  const all = await getAllAccessRequests()
  const id = nextSequentialId(all.map(request => request.id), 'AR', 3)
  const req: AccessRequest = { ...r, id, status: 'pendente', criadoEm: new Date().toISOString() }
  await appendRow('access_requests', [
    req.id, req.nome, req.email, req.empresa, req.setor,
    req.justificativa, req.status, req.criadoEm,
  ])
  return req
}

export async function updateAccessRequest(id: string, status: AccessRequest['status']): Promise<void> {
  const rows = await readRange('access_requests!A2:H')
  const rowIdx = rows.findIndex(r => r[0] === id)
  if (rowIdx === -1) return
  const existing = rowToRequest(rows[rowIdx])
  await updateRow('access_requests', rowIdx + 2, [
    existing.id, existing.nome, existing.email, existing.empresa,
    existing.setor, existing.justificativa, status, existing.criadoEm,
  ])
}

export async function enqueueAccessEmail(item: Pick<EmailQueueItem, 'nome' | 'email' | 'senha' | 'appUrl'>): Promise<void> {
  const ids = await readRange('email_queue!A2:A')
  const id = nextSequentialId(ids.map(r => r[0] || ''), 'EQ', 3)
  await appendRow('email_queue', [
    id, item.nome, item.email, item.senha, item.appUrl, 'pendente', '', new Date().toISOString(), '',
  ])
}

function safeJSON<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

function nextSequentialId(existingIds: string[], prefix: string, pad: number) {
  const max = existingIds.reduce((highest, id) => {
    if (!id.startsWith(prefix)) return highest
    const numeric = Number.parseInt(id.slice(prefix.length), 10)
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest
  }, 0)
  return `${prefix}${String(max + 1).padStart(pad, '0')}`
}
