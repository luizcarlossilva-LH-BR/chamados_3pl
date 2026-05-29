'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Ticket = {
  id: string
  empresa: string
  status: string
  descricao: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tickets')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao carregar chamados.')
        setTickets(data.data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: 24,
      fontFamily: 'Arial, sans-serif',
      background: '#f6f7f9',
      color: '#1f2937',
    }}>
      <section style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 18 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Dashboard</h1>
            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Resumo inicial dos chamados.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              height: 38,
              padding: '0 14px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </header>

        <div style={{
          display: 'grid',
          gap: 8,
          padding: 18,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#ffffff',
        }}>
          <strong>Total de chamados</strong>
          <span style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '...' : tickets.length}</span>
          {error ? <span style={{ color: '#b91c1c' }}>{error}</span> : null}
        </div>
      </section>
    </main>
  )
}
