import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { updateUser } from '@/lib/sheets'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  if (!isAdmin(session.role)) return NextResponse.json({ ok: false, error: 'Acesso negado.' }, { status: 403 })

  try {
    const body = await req.json()
    const patch: Record<string, unknown> = {}

    if (typeof body.ativo === 'boolean') patch.ativo = body.ativo

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: 'Nenhum campo para atualizar.' }, { status: 400 })
    }

    const updated = await updateUser(params.id, patch)
    if (!updated) return NextResponse.json({ ok: false, error: 'Usuário não encontrado.' }, { status: 404 })

    const { senha: _, ...safe } = updated
    return NextResponse.json({ ok: true, data: safe })
  } catch (err) {
    console.error('[users PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar usuário.' }, { status: 500 })
  }
}
