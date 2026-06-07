import { NextRequest, NextResponse } from 'next/server'
import { getSession, isShopeeUser } from '@/lib/auth'
import { getEvidence } from '@/lib/evidence-storage'
import { getAllTickets, getTicketsByEmpresa } from '@/lib/sheets'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 })

  const ticketId = req.nextUrl.searchParams.get('ticketId') || ''
  if (!ticketId) return NextResponse.json({ ok: false, error: 'Chamado nao informado.' }, { status: 400 })

  const tickets = isShopeeUser(session.role)
    ? await getAllTickets()
    : await getTicketsByEmpresa(session.empresa)

  const ticket = tickets.find(item => item.id === ticketId)
  if (!ticket) return NextResponse.json({ ok: false, error: 'Chamado nao encontrado.' }, { status: 404 })
  if (!ticket.evidencia) return NextResponse.json({ ok: false, error: 'Chamado sem evidencia.' }, { status: 404 })

  if (!ticket.evidencia.includes('.private.blob.vercel-storage.com')) {
    return NextResponse.redirect(ticket.evidencia)
  }

  const evidence = await getEvidence(ticket.evidencia)
  if (!evidence || evidence.statusCode !== 200 || !evidence.stream) {
    return NextResponse.json({ ok: false, error: 'Evidencia nao encontrada.' }, { status: 404 })
  }

  return new Response(evidence.stream, {
    headers: {
      'Content-Type': evidence.blob.contentType || 'application/octet-stream',
      'Content-Disposition': evidence.blob.contentDisposition || 'inline',
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}
