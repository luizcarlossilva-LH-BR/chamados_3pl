import { NextRequest, NextResponse } from 'next/server'
import { getSession, isShopeeUser } from '@/lib/auth'
import { updateTicket, appendTimelineEvent, getAllTickets, getTicketsByEmpresa } from '@/lib/sheets'
import { asString, isTicketAction } from '@/lib/validation'
import type { TimelineEvent, TicketStatus } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })

  const tickets = isShopeeUser(session.role)
    ? await getAllTickets()
    : await getTicketsByEmpresa(session.empresa)

  const ticket = tickets.find(t => t.id === id)
  if (!ticket) return NextResponse.json({ ok: false, error: 'Chamado não encontrado.' }, { status: 404 })

  return NextResponse.json({ ok: true, data: ticket })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isShopeeUser(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = await req.json()
    const action = asString(body.action)
    const payload: Record<string, unknown> =
      typeof body.payload === 'object' && body.payload !== null ? body.payload : {}

    if (!isTicketAction(action)) {
      return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 })
    }

    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    let newStatus: TicketStatus | undefined
    let event: TimelineEvent
    let extraPatch: Record<string, string> = {}

    switch (action) {
      case 'responder': {
        const msg = asString(payload.msg)
        if (!msg) return NextResponse.json({ ok: false, error: 'Mensagem obrigatória.' }, { status: 400 })
        event = { tipo: 'resposta', autor: session.nome, role: session.role, msg, ts: now }
        break
      }

      case 'atribuir': {
        const responsavel = asString(payload.responsavel)
        if (!responsavel) return NextResponse.json({ ok: false, error: 'Responsável obrigatório.' }, { status: 400 })
        extraPatch = { responsavel }
        event = { tipo: 'atribuido', autor: session.nome, role: session.role, msg: `Chamado atribuído para ${responsavel}.`, ts: now }
        break
      }

      case 'sla': {
        const sla = asString(payload.sla)
        if (!sla) return NextResponse.json({ ok: false, error: 'Data SLA obrigatória.' }, { status: 400 })
        extraPatch = { sla }
        event = { tipo: 'sla', autor: session.nome, role: session.role, msg: `SLA definido para ${sla}.`, ts: now }
        break
      }

      case 'andamento': {
        const msg = asString(payload.msg) || 'Chamado em análise pela equipe Shopee.'
        newStatus = 'andamento'
        event = { tipo: 'status', autor: session.nome, role: session.role, msg, ts: now }
        break
      }

      case 'fechar': {
        const msg = asString(payload.msg)
        if (!msg) return NextResponse.json({ ok: false, error: 'Comentário de encerramento obrigatório.' }, { status: 400 })
        newStatus = 'fechado'
        event = { tipo: 'fechado', autor: session.nome, role: session.role, msg, ts: now }
        break
      }

      case 'rejeitar': {
        const msg = asString(payload.msg)
        if (!msg) return NextResponse.json({ ok: false, error: 'Justificativa obrigatória.' }, { status: 400 })
        newStatus = 'rejeitado'
        event = { tipo: 'rejeitado', autor: session.nome, role: session.role, msg, ts: now }
        break
      }
    }

    let ticket = await appendTimelineEvent(id, event!)
    if (!ticket) return NextResponse.json({ ok: false, error: 'Chamado não encontrado.' }, { status: 404 })

    if (newStatus || Object.keys(extraPatch).length) {
      ticket = await updateTicket(id, {
        ...(newStatus ? { status: newStatus } : {}),
        ...extraPatch,
      })
    }

    return NextResponse.json({ ok: true, data: ticket })
  } catch (err) {
    console.error('[tickets PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar chamado.' }, { status: 500 })
  }
}
