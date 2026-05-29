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
    <AppShell title="Chamados">
      <section className="page">
        <div className="filter-bar">
          <input type="search" placeholder="Buscar ID, 3PL, categoria..." onChange={() => undefined} disabled />
          <select value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="andamento">Em andamento</option>
            <option value="fechado">Fechado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
          <Link className="btn btn-primary" href="/tickets/new"><i className="ti ti-plus"></i> Novo Chamado</Link>
        </div>

        <div style={{ display: 'none' }}>
          <label>
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
                  <td><span className="tid">{ticket.id}</span></td>
                  <td><span className="cpill">{ticket.empresa}</span></td>
                  <td>{ticket.tipo}</td>
                  <td>{ticket.categoria || '-'}</td>
                  <td><span className={`badge b-${ticket.status}`}>{ticket.status}</span></td>
                  <td>{ticket.nome || '-'}</td>
                  <td><Link className="btn btn-ghost btn-sm" href={`/tickets/${ticket.id}`}><i className="ti ti-eye"></i></Link></td>
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
