import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession, isAdmin } from '@/lib/auth'
import { getAllUsers, createUser } from '@/lib/sheets'
import { asString, isEmail, isRole } from '@/lib/validation'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isAdmin(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  const users = await getAllUsers()
  const safe = users.map(({ senha: _, ...u }) => u)
  return NextResponse.json({ ok: true, data: safe })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isAdmin(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = await req.json()
    const nome = asString(body.nome)
    const email = asString(body.email).toLowerCase()
    const senha = asString(body.senha)
    const role = asString(body.role)
    const empresa = asString(body.empresa) || 'Shopee'
    const setor = asString(body.setor)

    if (!nome || !email || !senha || !role) {
      return NextResponse.json({ ok: false, error: 'Campos obrigatórios faltando.' }, { status: 400 })
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: 'E-mail inválido.' }, { status: 400 })
    }

    if (!isRole(role)) {
      return NextResponse.json({ ok: false, error: 'Perfil inválido.' }, { status: 400 })
    }

    if (senha.length < 8) {
      return NextResponse.json({ ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const existing = (await getAllUsers()).find(u => u.email.toLowerCase() === email)
    if (existing) return NextResponse.json({ ok: false, error: 'E-mail já cadastrado.' }, { status: 409 })

    const hash = await bcrypt.hash(senha, 10)
    const user = await createUser({
      nome, email, senha: hash, role, empresa, setor, ativo: true,
    })

    const { senha: _, ...safe } = user
    return NextResponse.json({ ok: true, data: safe }, { status: 201 })
  } catch (err) {
    console.error('[users POST]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
