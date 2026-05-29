'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

type SessionUser = {
  nome: string
  email: string
  role: string
  empresa: string
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Sessao expirada.')
        setUser(data.data)
      })
      .catch(() => router.push('/login'))
  }, [router])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>3PL Chamados</strong>
          <span>BSC Support Portal</span>
        </div>

        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/tickets">Chamados</Link>
          <Link href="/tickets/new">Novo chamado</Link>
          {user?.role === 'admin' ? <Link href="/admin/users">Usuarios</Link> : null}
          {user?.role === 'admin' ? <Link href="/admin/requests">Solicitacoes</Link> : null}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{user?.nome || 'Carregando...'}</strong>
            <br />
            <span>{user?.role || ''}{user?.empresa ? ` - ${user.empresa}` : ''}</span>
          </div>
          <button className="ghost-button" type="button" onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
