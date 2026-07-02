import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession, isAdmin } from '@/lib/auth'
import { getAllAccessRequests, updateAccessRequest, createUser, getUserByEmail, enqueueAccessEmail } from '@/lib/sheets'
import { asString } from '@/lib/validation'

type Params = { params: Promise<{ id: string }> }

function generateTemporaryPassword() {
  return randomBytes(12).toString('base64url')
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isAdmin(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = await req.json()
    const action = asString(body.action)

    if (!['aprovar', 'recusar'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 })
    }

    const requests = await getAllAccessRequests()
    const request = requests.find(r => r.id === id)
    if (!request) return NextResponse.json({ ok: false, error: 'Solicitação não encontrada.' }, { status: 404 })

    if (request.status !== 'pendente') {
      return NextResponse.json({ ok: false, error: 'Solicitação já processada.' }, { status: 409 })
    }

    if (action === 'aprovar') {
      const existingUser = await getUserByEmail(request.email)
      if (existingUser) {
        return NextResponse.json({ ok: false, error: 'E-mail já cadastrado.' }, { status: 409 })
      }

      const tempSenha = generateTemporaryPassword()
      const hash = await bcrypt.hash(tempSenha, 10)
      const user = await createUser({
        nome: request.nome,
        email: request.email,
        senha: hash,
        role: 'operador',
        empresa: request.empresa,
        setor: request.setor,
        ativo: true,
      })
      await updateAccessRequest(id, 'aprovado')
      const { senha: _, ...safeUser } = user

      let emailAgendado = true
      let emailErro: string | undefined
      try {
        await enqueueAccessEmail({
          nome: request.nome,
          email: request.email,
          senha: tempSenha,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://chamados-3pl.vercel.app',
        })
      } catch (err) {
        console.error('[access-requests PATCH] falha ao enfileirar e-mail de acesso', err)
        emailAgendado = false
        emailErro = 'Não foi possível agendar o envio do e-mail de acesso.'
      }

      return NextResponse.json({ ok: true, data: { user: safeUser, tempSenha, emailAgendado, emailErro } })
    }

    await updateAccessRequest(id, 'recusado')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[access-requests PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao processar solicitação.' }, { status: 500 })
  }
}
