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
    <AppShell title={ticket?.id || 'Chamado'}>
      <section className="page">
        <header className="page-header">
          <div>
            <h1>{ticket?.id || 'Chamado'}</h1>
            <p className="muted">{ticket ? `${ticket.empresa} - ${ticket.categoria || ticket.tipo}` : 'Carregando...'}</p>
          </div>
          {ticket ? <span className={`badge b-${ticket.status}`}>{ticket.status}</span> : null}
        </header>

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        {loading ? <div className="card">Carregando chamado...</div> : null}

        {ticket ? (
          <>
            <div className="card grid">
              <div className="detail-panel">
                <strong>{ticket.categoria || ticket.tipo}</strong>
                <p style={{ marginTop: 6 }}>{ticket.descricao}</p>
              </div>
              <div className="form-grid">
                <div className="info-row"><span className="info-label">Solicitante</span><strong>{ticket.nome}</strong></div>
                <div className="info-row"><span className="info-label">E-mail</span><strong>{ticket.email}</strong></div>
                <div className="info-row"><span className="info-label">Impacto</span><span className={`badge b-${ticket.impacto}`}>{ticket.impacto}</span></div>
                <div className="info-row"><span className="info-label">Setor</span><strong>{ticket.setor || '-'}</strong></div>
                <div className="info-row"><span className="info-label">Responsavel</span><strong>{ticket.responsavel || '-'}</strong></div>
                <div className="info-row"><span className="info-label">SLA</span><strong>{ticket.sla || '-'}</strong></div>
                <div className="info-row"><span className="info-label">Rotas</span><strong>{ticket.rotas || '-'}</strong></div>
                <div className="info-row"><span className="info-label">Drivers</span><strong>{ticket.drivers || '-'}</strong></div>
              </div>
              {ticket.evidencia ? <a className="btn" href={ticket.evidencia} target="_blank"><i className="ti ti-paperclip"></i> Abrir evidencia</a> : null}
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
              <button className="btn btn-primary" type="submit"><i className="ti ti-refresh"></i> Atualizar chamado</button>
            </form>

            <div className="card grid">
              <div className="card-title" style={{ margin: 0 }}><i className="ti ti-history"></i> Timeline</div>
              {ticket.timeline?.length ? ticket.timeline.map((event, index) => (
                <div className="tl-item" key={`${event.ts}-${index}`}>
                  <div className={`tl-dot ${event.tipo === 'fechado' ? 'tl-dot-ok' : event.tipo === 'rejeitado' ? 'tl-dot-err' : event.tipo === 'status' ? 'tl-dot-warn' : event.role === 'admin' || event.role === 'analista' ? 'tl-dot-shopee' : 'tl-dot-system'}`}>
                    <i className={`ti ${event.tipo === 'fechado' ? 'ti-circle-check' : event.tipo === 'rejeitado' ? 'ti-x' : event.tipo === 'resposta' ? 'ti-message' : 'ti-clock'}`}></i>
                  </div>
                  <div className="tl-content">
                    <div className="tl-header">
                      <span className="tl-author">{event.tipo} - {event.autor}</span>
                      <span className="tl-time">{event.ts} - {event.role}</span>
                    </div>
                    <div className="tl-body">{event.msg}</div>
                  </div>
                </div>
              )) : <p>Nenhum evento registrado.</p>}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  )
}
