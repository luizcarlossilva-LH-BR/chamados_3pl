import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession, getSession, setSessionCookie } from '@/lib/auth'
import { getUserByEmail, updateUser } from '@/lib/sheets'
import { asString, isEmail } from '@/lib/validation'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Nao autenticado.' }, { status: 401 })

  try {
    const body = await req.json()
    const email = asString(body.email).toLowerCase()
    const setor = asString(body.setor)
    const senha = asString(body.senha)

    if (!email || !isEmail(email)) {
      return NextResponse.json({ ok: false, error: 'E-mail invalido.' }, { status: 400 })
    }

    if (senha && senha.length < 8) {
      return NextResponse.json({ ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing && existing.id !== session.id) {
      return NextResponse.json({ ok: false, error: 'E-mail ja cadastrado.' }, { status: 409 })
    }

    const patch: { email: string; setor: string; senha?: string } = { email, setor }
    if (senha) patch.senha = await bcrypt.hash(senha, 10)

    const updated = await updateUser(session.id, patch)
    if (!updated) return NextResponse.json({ ok: false, error: 'Usuario nao encontrado.' }, { status: 404 })

    const sessionUser = {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      role: updated.role,
      empresa: updated.empresa,
      setor: updated.setor,
    }
    const token = await createSession(sessionUser)
    await setSessionCookie(token)

    return NextResponse.json({ ok: true, data: sessionUser })
  } catch (err) {
    console.error('[account PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar conta.' }, { status: 500 })
  }
}
