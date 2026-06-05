import { NextRequest, NextResponse } from 'next/server'
import { getSession, canSeeAllTickets } from '@/lib/auth'
import { DriveUploadError, isEvidenceDataUrl, uploadEvidenceToDrive } from '@/lib/drive'
import { getAllTickets, getTicketsByEmpresa, createTicket } from '@/lib/sheets'
import { asString, asStringArray, isEmail, isTicketImpact, isTicketTipo } from '@/lib/validation'
import type { TimelineEvent } from '@/types'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })

  const tickets = canSeeAllTickets(session.role)
    ? await getAllTickets()
    : await getTicketsByEmpresa(session.empresa)

  return NextResponse.json({ ok: true, data: tickets })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await req.json()
    const empresa = asString(body.empresa)
    const setor = asString(body.setor)
    const tipo = asString(body.tipo) || 'erro'
    const categoria = asString(body.categoria)
    const impacto = asString(body.impacto) || 'medio'
    const descricao = asString(body.descricao)
    let evidencia = asString(body.evidencia)
    const evidenciaArquivoNome = asString(body.evidenciaArquivoNome) || `evidencia-${Date.now()}`
    const evidenciaArquivoTipo = asString(body.evidenciaArquivoTipo)
    const periodo = asString(body.periodo)
    const rotas = asString(body.rotas)
    const drivers = asString(body.drivers)
    const email = asString(body.email).toLowerCase()
    const nome = asString(body.nome)
    const kpis = asStringArray(body.kpis)

    if (!empresa || !descricao || !email || !nome) {
      return NextResponse.json({ ok: false, error: 'Campos obrigatórios faltando.' }, { status: 400 })
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: 'E-mail inválido.' }, { status: 400 })
    }

    if (!isTicketTipo(tipo)) {
      return NextResponse.json({ ok: false, error: 'Tipo de chamado inválido.' }, { status: 400 })
    }

    if (!isTicketImpact(impacto)) {
      return NextResponse.json({ ok: false, error: 'Impacto inválido.' }, { status: 400 })
    }

    if (!canSeeAllTickets(session.role) && empresa !== session.empresa) {
      return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })
    }

    if (isEvidenceDataUrl(evidencia)) {
      evidencia = await uploadEvidenceToDrive({
        dataUrl: evidencia,
        fileName: evidenciaArquivoNome,
        fallbackMimeType: evidenciaArquivoTipo,
      })
    }

    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const firstEvent: TimelineEvent = {
      tipo: 'criado',
      autor: session.nome,
      role: session.role,
      msg: 'Chamado aberto.',
      ts: now,
    }

    const ticket = await createTicket({
      empresa, setor, tipo, categoria, kpis, impacto,
      status: 'aberto',
      descricao,
      evidencia,
      periodo,
      rotas,
      drivers,
      email,
      nome,
      responsavel: '',
      sla: '',
      timeline: [firstEvent],
    })

    return NextResponse.json({ ok: true, data: ticket }, { status: 201 })
  } catch (err) {
    console.error('[tickets POST]', err)
    if (err instanceof DriveUploadError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ ok: false, error: 'Erro ao criar chamado.' }, { status: 500 })
  }
}
