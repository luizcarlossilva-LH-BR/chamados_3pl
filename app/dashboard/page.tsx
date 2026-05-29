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
  responsavel: string
  criadoEm: string
  atualizadoEm: string
}

function parseDate(value: string) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function formatHours(hours: number | null) {
  if (hours === null) return '-'
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

function topCounts(tickets: Ticket[], keyFn: (ticket: Ticket) => string) {
  const count: Record<string, number> = {}
  tickets.forEach(ticket => {
    const key = keyFn(ticket) || 'Nao informado'
    count[key] = (count[key] || 0) + 1
  })
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

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

  const filteredTickets = useMemo(() => {
    const start = periodStart ? new Date(`${periodStart}T00:00:00`).getTime() : null
    const end = periodEnd ? new Date(`${periodEnd}T23:59:59`).getTime() : null

    return tickets.filter(ticket => {
      const created = parseDate(ticket.criadoEm)
      if (created === null) return !start && !end
      if (start && created < start) return false
      if (end && created > end) return false
      return true
    })
  }, [tickets, periodStart, periodEnd])

  const byEmpresa = useMemo(() => topCounts(filteredTickets, ticket => ticket.empresa), [filteredTickets])
  const byResponsavel = useMemo(() => topCounts(filteredTickets, ticket => ticket.responsavel || 'Sem responsavel'), [filteredTickets])
  const byAssunto = useMemo(() => topCounts(filteredTickets, ticket => ticket.categoria || ticket.descricao.slice(0, 28)), [filteredTickets])

  const stats = useMemo(() => {
    return {
      total: filteredTickets.length,
      abertos: filteredTickets.filter(t => t.status === 'aberto').length,
      andamento: filteredTickets.filter(t => t.status === 'andamento').length,
      fechados: filteredTickets.filter(t => t.status === 'fechado').length,
    }
  }, [filteredTickets])

  const avgHandling = useMemo(() => {
    const durations = filteredTickets
      .filter(ticket => ['fechado', 'rejeitado'].includes(ticket.status))
      .map(ticket => {
        const created = parseDate(ticket.criadoEm)
        const updated = parseDate(ticket.atualizadoEm)
        if (created === null || updated === null || updated < created) return null
        return (updated - created) / 36e5
      })
      .filter((value): value is number => value !== null)

    if (!durations.length) return null
    return durations.reduce((sum, value) => sum + value, 0) / durations.length
  }, [filteredTickets])

  function renderBars(data: [string, number][], color = '#EE4D2D') {
    const max = Math.max(...data.map(([, value]) => value), 1)
    return data.length ? data.map(([label, value]) => (
      <div className="barh" key={label}>
        <div className="barh-lbl">{label}</div>
        <div className="barh-track">
          <div className="barh-fill" style={{ width: `${Math.round(value / max * 100)}%`, background: color }}>{value}</div>
        </div>
        <div className="barh-val">{value}</div>
      </div>
    )) : <p className="muted">Sem dados no periodo.</p>
  }

  return (
    <AppShell title="Dashboard">
      <section className="page">
        <div className="card">
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <label className="field" style={{ maxWidth: 180 }}>Criado de<input type="date" value={periodStart} onChange={event => setPeriodStart(event.target.value)} /></label>
            <label className="field" style={{ maxWidth: 180 }}>Criado ate<input type="date" value={periodEnd} onChange={event => setPeriodEnd(event.target.value)} /></label>
            <button className="btn" type="button" onClick={() => { setPeriodStart(''); setPeriodEnd('') }}><i className="ti ti-x"></i> Limpar periodo</button>
          </div>
        </div>

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
          <div className="metric">
            <div className="metric-label">Tempo medio</div>
            <div className="metric-value" style={{ color: 'var(--blue)' }}>{loading ? '-' : formatHours(avgHandling)}</div>
            <div className="metric-sub">atendimento finalizado</div>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="two-col">
          <div className="card">
            <div className="card-title"><i className="ti ti-building-warehouse"></i> Numeros por 3PL</div>
            {renderBars(byEmpresa, '#EE4D2D')}
          </div>
          <div className="card">
            <div className="card-title"><i className="ti ti-user-check"></i> Numeros por responsavel</div>
            {renderBars(byResponsavel, '#1A5FA5')}
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <div className="card-title"><i className="ti ti-tag"></i> Numeros por assunto</div>
            {renderBars(byAssunto, '#553C9A')}
          </div>
          <div className="card">
            <div className="card-title"><i className="ti ti-flame"></i> Status</div>
            {renderBars(Object.entries({ aberto: stats.abertos, andamento: stats.andamento, fechado: stats.fechados }), '#7A4A0A')}
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
                {filteredTickets.slice(0, 8).map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className="tid">{ticket.id}</span></td>
                    <td><span className="cpill">{ticket.empresa}</span></td>
                    <td>{ticket.categoria || '-'}</td>
                    <td><span className={`badge b-${ticket.impacto}`}>{ticket.impacto}</span></td>
                    <td><span className={`badge b-${ticket.status}`}>{ticket.status}</span></td>
                    <td><Link className="btn btn-ghost btn-sm" href={`/tickets/${ticket.id}`}><i className="ti ti-eye"></i></Link></td>
                  </tr>
                ))}
                {!loading && filteredTickets.length === 0 ? (
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
