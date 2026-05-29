'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useMemo, useState } from 'react'

type SessionUser = {
  nome: string
  email: string
  role: string
  empresa: string
}

type Ticket = {
  status: string
}

const roleLabels: Record<string, string> = {
  admin: 'Admin Shopee',
  analista: 'Analista Shopee',
  supervisor: 'Supervisor 3PL',
  operador: 'Operador 3PL',
}

function initials(name?: string) {
  return (name || 'SP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

export default function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [openCount, setOpenCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Sessao expirada.')
        setUser(data.data)
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    fetch('/api/tickets')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.ok) {
          setOpenCount(data.data.filter((ticket: Ticket) => ['aberto', 'andamento'].includes(ticket.status)).length)
        }
      })

    fetch('/api/users/requests')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.ok) setPendingCount(data.data.filter((req: { status: string }) => req.status === 'pendente').length)
      })
      .catch(() => undefined)
  }, [])

  const currentTitle = useMemo(() => {
    if (title) return title
    if (pathname.startsWith('/tickets/new')) return 'Novo Chamado'
    if (pathname.startsWith('/tickets')) return 'Chamados'
    if (pathname.startsWith('/account')) return 'Minha Conta'
    if (pathname.startsWith('/admin')) return 'Gestao de Usuarios'
    return 'Dashboard'
  }, [pathname, title])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function active(path: string) {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-mark">SPX</div>
          <div>
            <div className="sb-name">3PL Chamados</div>
            <div className="sb-sub">BSC Support</div>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">{initials(user?.nome)}</div>
          <div>
            <div className="sb-user-name">{user?.nome || 'Carregando...'}</div>
            <div className="sb-user-role">{user ? roleLabels[user.role] || user.role : ''}</div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">Menu</div>
          <Link className={`sb-item ${active('/dashboard') ? 'active' : ''}`} href="/dashboard">
            <i className="ti ti-layout-dashboard"></i> Dashboard
          </Link>
          <Link className={`sb-item ${active('/tickets/new') ? 'active' : ''}`} href="/tickets/new">
            <i className="ti ti-circle-plus"></i> Novo Chamado
          </Link>
          <Link className={`sb-item ${active('/tickets') && !active('/tickets/new') ? 'active' : ''}`} href="/tickets">
            <i className="ti ti-list-details"></i> Chamados
            <span className="sb-badge">{openCount}</span>
          </Link>
          <Link className={`sb-item ${active('/account') ? 'active' : ''}`} href="/account">
            <i className="ti ti-user-cog"></i> Minha Conta
          </Link>

          {user?.role === 'admin' ? (
            <>
              <div className="sb-section">Administracao</div>
              <Link className={`sb-item ${active('/admin/users') ? 'active' : ''}`} href="/admin/users">
                <i className="ti ti-users"></i> Usuarios
              </Link>
              <Link className={`sb-item ${active('/admin/requests') ? 'active' : ''}`} href="/admin/requests">
                <i className="ti ti-user-plus"></i> Solicitacoes
                <span className="sb-badge amber">{pendingCount}</span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="sb-footer">
          <div className="sb-footer-text">BSC Tickets v2.0 - Shopee</div>
          <button className="logout-btn" type="button" onClick={logout}>
            <i className="ti ti-logout" style={{ fontSize: 15 }}></i> Sair
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{currentTitle}</div>
          <div className="topbar-right">
            <Link className="btn btn-ghost btn-sm" href="/tickets"><i className="ti ti-filter"></i> Filtrar</Link>
            <Link className="btn btn-primary btn-sm" href="/tickets/new"><i className="ti ti-plus"></i> Novo Chamado</Link>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
