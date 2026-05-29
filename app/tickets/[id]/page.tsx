'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'

type TimelineEvent = {
  tipo: string
  autor: string
  role: string
  msg: string
  ts: string
}

type Ticket = {
  id: string
  empresa: string
  setor: string
  tipo: string
  categoria: string
  kpis: string[]
  impacto: string
  status: string
  descricao: string
  evidencia: string
  periodo: string
  rotas: string
  drivers: string
  email: string
  nome: string
  responsavel: string
  sla: string
  timeline: TimelineEvent[]
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  function loadTicket() {
    fetch(`/api/tickets/${params.id}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao carregar chamado.')
        setTicket(data.data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTicket()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function action(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const actionName = String(form.get('action'))
    const payload = {
      msg: form.get('msg'),
      responsavel: form.get('responsavel'),
      sla: form.get('sla'),
    }

    const res = await fetch(`/api/tickets/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName, payload }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao atualizar chamado.')
      return
    }

    setMessage('Chamado atualizado.')
    setTicket(data.data)
    event.currentTarget.reset()
  }

  return (
    <AppShell>
      <section className="page">
        <header className="page-header">
          <div>
            <h1>{ticket?.id || 'Chamado'}</h1>
            <p className="muted">{ticket ? `${ticket.empresa} - ${ticket.categoria || ticket.tipo}` : 'Carregando...'}</p>
          </div>
          {ticket ? <span className="badge">{ticket.status}</span> : null}
        </header>

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        {loading ? <div className="card">Carregando chamado...</div> : null}

        {ticket ? (
          <>
            <div className="card grid">
              <div className="form-grid">
                <div><strong>Solicitante</strong><p>{ticket.nome} ({ticket.email})</p></div>
                <div><strong>Impacto</strong><p>{ticket.impacto}</p></div>
                <div><strong>Setor</strong><p>{ticket.setor || '-'}</p></div>
                <div><strong>Responsavel</strong><p>{ticket.responsavel || '-'}</p></div>
                <div><strong>SLA</strong><p>{ticket.sla || '-'}</p></div>
                <div><strong>Periodo</strong><p>{ticket.periodo || '-'}</p></div>
                <div><strong>Rotas</strong><p>{ticket.rotas || '-'}</p></div>
                <div><strong>Drivers</strong><p>{ticket.drivers || '-'}</p></div>
              </div>
              <div>
                <strong>Descricao</strong>
                <p>{ticket.descricao}</p>
              </div>
              {ticket.evidencia ? <a className="button secondary" href={ticket.evidencia} target="_blank">Abrir evidencia</a> : null}
            </div>

            <form className="card form" onSubmit={action}>
              <h2 style={{ margin: 0 }}>Atendimento Shopee</h2>
              <div className="form-grid">
                <label className="field">Acao
                  <select name="action" defaultValue="responder">
                    <option value="responder">Responder</option>
                    <option value="andamento">Marcar em andamento</option>
                    <option value="atribuir">Atribuir</option>
                    <option value="sla">Definir SLA</option>
                    <option value="fechar">Fechar</option>
                    <option value="rejeitar">Rejeitar</option>
                  </select>
                </label>
                <label className="field">Responsavel<input name="responsavel" /></label>
                <label className="field">SLA<input name="sla" placeholder="DD/MM/AAAA" /></label>
              </div>
              <label className="field">Mensagem<textarea name="msg" /></label>
              <button className="button" type="submit">Atualizar chamado</button>
            </form>

            <div className="card grid">
              <h2 style={{ margin: 0 }}>Timeline</h2>
              {ticket.timeline?.length ? ticket.timeline.map((event, index) => (
                <div key={`${event.ts}-${index}`} style={{ borderTop: index ? '1px solid #e5e7eb' : 0, paddingTop: index ? 12 : 0 }}>
                  <strong>{event.tipo} - {event.autor}</strong>
                  <p className="muted">{event.ts} - {event.role}</p>
                  <p>{event.msg}</p>
                </div>
              )) : <p>Nenhum evento registrado.</p>}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  )
}
