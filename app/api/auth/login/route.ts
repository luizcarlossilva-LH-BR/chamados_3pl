import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from '@/lib/sheets'
import { createSession, setSessionCookie } from '@/lib/auth'
import { asString, isEmail } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = asString(body.email).toLowerCase()
    const senha = asString(body.senha)

    if (!email || !senha) {
      return NextResponse.json({ ok: false, error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: 'E-mail inválido.' }, { status: 400 })
    }

    const user = await getUserByEmail(email)

    if (!user || !user.ativo) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado ou inativo.' }, { status: 401 })
    }

    const match = await bcrypt.compare(senha, user.senha)
    if (!match) {
      return NextResponse.json({ ok: false, error: 'Senha incorreta.' }, { status: 401 })
    }

    const sessionUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      empresa: user.empresa,
      setor: user.setor,
    }

    const token = await createSession(sessionUser)
    await setSessionCookie(token)

    return NextResponse.json({ ok: true, data: sessionUser })
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 500 })
  }
}
