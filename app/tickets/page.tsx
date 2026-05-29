'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'

type Ticket = {
  id: string
  empresa: string
  tipo: string
  categoria: string
  impacto: string
  status: string
  nome: string
  criadoEm: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [status, setStatus] = useState('')
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

  const filtered = status ? tickets.filter(ticket => ticket.status === status) : tickets

  return (
    <AppShell>
      <section className="page">
        <header className="page-header">
          <div>
            <h1>Chamados</h1>
            <p className="muted">Acompanhe e filtre as solicitacoes registradas.</p>
          </div>
          <Link className="button" href="/tickets/new">Novo chamado</Link>
        </header>

        <div className="card">
          <label className="field" style={{ maxWidth: 260 }}>
            Status
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="andamento">Em andamento</option>
              <option value="fechado">Fechado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </label>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Solicitante</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.empresa}</td>
                  <td>{ticket.tipo}</td>
                  <td>{ticket.categoria || '-'}</td>
                  <td><span className="badge">{ticket.status}</span></td>
                  <td>{ticket.nome || '-'}</td>
                  <td><Link className="button secondary" href={`/tickets/${ticket.id}`}>Ver</Link></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7}>Nenhum chamado encontrado.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  )
}
