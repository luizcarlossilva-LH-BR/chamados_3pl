'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/app/components/AppShell'

type Ticket = {
  id: string
  empresa: string
  status: string
  impacto: string
  categoria: string
  descricao: string
  criadoEm: string
}

export default function DashboardPage() {
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

  const byCategory = useMemo(() => {
    const count: Record<string, number> = {}
    tickets.forEach(ticket => {
      const key = ticket.categoria || 'Sem categoria'
      count[key] = (count[key] || 0) + 1
    })
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [tickets])

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      abertos: tickets.filter(t => t.status === 'aberto').length,
      andamento: tickets.filter(t => t.status === 'andamento').length,
      fechados: tickets.filter(t => t.status === 'fechado').length,
    }
  }, [tickets])

  return (
    <AppShell title="Dashboard">
      <section className="page">
        <div className="metrics-grid">
          <div className="metric">
            <div className="metric-label">Total</div>
            <div className="metric-value" style={{ color: 'var(--text)' }}>{loading ? '-' : stats.total}</div>
            <div className="metric-sub">chamados</div>
          </div>
          <div className="metric">
            <div className="metric-label">Em aberto</div>
            <div className="metric-value" style={{ color: 'var(--red)' }}>{loading ? '-' : stats.abertos}</div>
            <div className="metric-sub">aguardando resolucao</div>
          </div>
          <div className="metric">
            <div className="metric-label">Concluidos</div>
            <div className="metric-value" style={{ color: 'var(--green)' }}>{loading ? '-' : stats.fechados}</div>
            <div className="metric-sub">resolvidos</div>
          </div>
          <div className="metric">
            <div className="metric-label">Em andamento</div>
            <div className="metric-value" style={{ color: 'var(--amber)' }}>{loading ? '-' : stats.andamento}</div>
            <div className="metric-sub">em analise</div>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="two-col">
          <div className="card">
            <div className="card-title"><i className="ti ti-chart-bar"></i> Categorias</div>
            {byCategory.length ? byCategory.map(([category, value], index) => {
              const max = Math.max(...byCategory.map(([, v]) => v), 1)
              const colors = ['#EE4D2D', '#185FA5', '#7A4A0A', '#553C9A', '#2E7D32', '#9B2C2C']
              return (
                <div className="barh" key={category}>
                  <div className="barh-lbl">{category}</div>
                  <div className="barh-track">
                    <div className="barh-fill" style={{ width: `${Math.round(value / max * 100)}%`, background: colors[index % colors.length] }}>{value}</div>
                  </div>
                  <div className="barh-val">{value}</div>
                </div>
              )
            }) : <p className="muted">Sem dados ainda.</p>}
          </div>
          <div className="card">
            <div className="card-title"><i className="ti ti-flame"></i> Status</div>
            {Object.entries({ aberto: stats.abertos, andamento: stats.andamento, fechado: stats.fechados }).map(([status, value]) => {
              const max = Math.max(stats.abertos, stats.andamento, stats.fechados, 1)
              return (
                <div className="barh" key={status}>
                  <div className="barh-lbl">{status}</div>
                  <div className="barh-track"><div className="barh-fill" style={{ width: `${Math.round(value / max * 100)}%`, background: '#EE4D2D' }}>{value}</div></div>
                  <div className="barh-val">{value}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ margin: 0 }}><i className="ti ti-clock"></i> Recentes</div>
            <Link className="btn btn-ghost btn-sm" href="/tickets">Ver todos <i className="ti ti-arrow-right"></i></Link>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>#</th><th>3PL</th><th>Categoria</th><th>Impacto</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {tickets.slice(0, 8).map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className="tid">{ticket.id}</span></td>
                    <td><span className="cpill">{ticket.empresa}</span></td>
                    <td>{ticket.categoria || '-'}</td>
                    <td><span className={`badge b-${ticket.impacto}`}>{ticket.impacto}</span></td>
                    <td><span className={`badge b-${ticket.status}`}>{ticket.status}</span></td>
                    <td><Link className="btn btn-ghost btn-sm" href={`/tickets/${ticket.id}`}><i className="ti ti-eye"></i></Link></td>
                  </tr>
                ))}
                {!loading && tickets.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>Nenhum chamado</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
