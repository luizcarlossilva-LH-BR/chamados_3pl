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

type ActionConfig = {
  msgRequired: boolean
  msgPlaceholder: string
  showResponsavel: boolean
  showSla: boolean
  btnClass: string
  btnLabel: string
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  responder:  { msgRequired: true,  msgPlaceholder: 'Escreva sua resposta...',                    showResponsavel: false, showSla: false, btnClass: 'btn-primary', btnLabel: 'Responder' },
  andamento:  { msgRequired: false, msgPlaceholder: 'Comentario (opcional)...',                   showResponsavel: false, showSla: false, btnClass: 'btn-amber',   btnLabel: 'Marcar em andamento' },
  atribuir:   { msgRequired: false, msgPlaceholder: 'Comentario (opcional)...',                   showResponsavel: true,  showSla: false, btnClass: 'btn-primary', btnLabel: 'Atribuir' },
  sla:        { msgRequired: false, msgPlaceholder: 'Comentario (opcional)...',                   showResponsavel: false, showSla: true,  btnClass: 'btn-primary', btnLabel: 'Definir SLA' },
  fechar:     { msgRequired: true,  msgPlaceholder: 'Descreva como o problema foi resolvido...',  showResponsavel: false, showSla: false, btnClass: 'btn-success', btnLabel: 'Fechar chamado' },
  rejeitar:   { msgRequired: true,  msgPlaceholder: 'Explique o motivo da rejeicao...',           showResponsavel: false, showSla: false, btnClass: 'btn-danger',  btnLabel: 'Rejeitar chamado' },
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [userRole, setUserRole] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState('responder')
  const [submitting, setSubmitting] = useState(false)

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
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.ok) setUserRole(data.data.role) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function action(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
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
    setSubmitting(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao atualizar chamado.')
      return
    }

    setMessage('Chamado atualizado.')
    setTicket(data.data)
    setSelectedAction('responder')
    event.currentTarget.reset()
  }

  const cfg = ACTION_CONFIG[selectedAction] ?? ACTION_CONFIG.responder
  const isTerminal = ticket?.status === 'fechado' || ticket?.status === 'rejeitado'
  const canAct = (userRole === 'admin' || userRole === 'analista') && !isTerminal

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
                <p className="structured-text" style={{ marginTop: 6 }}>{ticket.descricao}</p>
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

            {canAct ? (
              <form className="card form" onSubmit={action}>
                <h2 style={{ margin: 0 }}>Atendimento Shopee</h2>

                <label className="field" style={{ maxWidth: 280 }}>Acao
                  <select name="action" value={selectedAction} onChange={e => setSelectedAction(e.target.value)}>
                    <option value="responder">Responder</option>
                    <option value="andamento">Marcar em andamento</option>
                    <option value="atribuir">Atribuir</option>
                    <option value="sla">Definir SLA</option>
                    <option value="fechar">Fechar</option>
                    <option value="rejeitar">Rejeitar</option>
                  </select>
                </label>

                {cfg.showResponsavel && (
                  <label className="field" style={{ maxWidth: 280 }}>
                    Responsavel <span className="req">*</span>
                    <input name="responsavel" required />
                  </label>
                )}

                {cfg.showSla && (
                  <label className="field" style={{ maxWidth: 280 }}>
                    SLA <span className="req">*</span>
                    <input name="sla" placeholder="DD/MM/AAAA" required />
                  </label>
                )}

                <label className="field">
                  Mensagem{cfg.msgRequired
                    ? <span className="req"> *</span>
                    : <span className="muted" style={{ fontWeight: 400 }}> (opcional)</span>}
                  <textarea name="msg" placeholder={cfg.msgPlaceholder} required={cfg.msgRequired} />
                </label>

                <div>
                  <button className={`btn ${cfg.btnClass}`} type="submit" disabled={submitting}>
                    <i className="ti ti-refresh"></i> {submitting ? 'Salvando...' : cfg.btnLabel}
                  </button>
                </div>
              </form>
            ) : isTerminal ? (
              <div className="card" style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-lock" style={{ fontSize: 18 }}></i>
                Chamado encerrado — nenhuma acao disponivel.
              </div>
            ) : null}

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
