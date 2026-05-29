import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { getAllAccessRequests, createAccessRequest } from '@/lib/sheets'
import { asString, isEmail } from '@/lib/validation'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isAdmin(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  const requests = await getAllAccessRequests()
  return NextResponse.json({ ok: true, data: requests })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nome = asString(body.nome)
    const email = asString(body.email).toLowerCase()
    const empresa = asString(body.empresa)
    const setor = asString(body.setor)
    const justificativa = asString(body.justificativa)

    if (!nome || !email || !empresa) {
      return NextResponse.json({ ok: false, error: 'Nome, e-mail e empresa são obrigatórios.' }, { status: 400 })
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: 'E-mail inválido.' }, { status: 400 })
    }

    const request = await createAccessRequest({ nome, email, empresa, setor, justificativa })
    return NextResponse.json({ ok: true, data: request }, { status: 201 })
  } catch (err) {
    console.error('[access-requests POST]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao enviar solicitação.' }, { status: 500 })
  }
}
