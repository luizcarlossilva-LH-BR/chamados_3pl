'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'

type AccessRequest = {
  id: string
  nome: string
  email: string
  empresa: string
  setor: string
  justificativa: string
  status: string
}

type TempCredential = {
  nome: string
  email: string
  senha: string
  emailAgendado: boolean
  emailErro?: string
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [error, setError] = useState('')
  const [tempCredential, setTempCredential] = useState<TempCredential | null>(null)
  const [copied, setCopied] = useState(false)

  function loadRequests() {
    fetch('/api/users/requests')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao carregar solicitacoes.')
        setRequests(data.data)
      })
      .catch(err => setError(err.message))
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function decide(id: string, action: 'aprovar' | 'recusar') {
    setError('')
    setTempCredential(null)
    setCopied(false)

    const req = requests.find(r => r.id === id)
    const res = await fetch(`/api/users/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao processar solicitacao.')
      return
    }

    if (action === 'aprovar' && data.data?.tempSenha) {
      setTempCredential({
        nome: req?.nome ?? '',
        email: req?.email ?? '',
        senha: data.data.tempSenha,
        emailAgendado: Boolean(data.data.emailAgendado),
        emailErro: data.data.emailErro,
      })
    }

    loadRequests()
  }

  async function copyCredentials() {
    if (!tempCredential) return
    await navigator.clipboard.writeText(
      `Login: ${tempCredential.email}\nSenha temporaria: ${tempCredential.senha}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <AppShell title="Solicitacoes">
      <section className="page">
        {error ? <p className="error">{error}</p> : null}

        {tempCredential && (
          <div style={{
            background: 'var(--green-bg)',
            border: '1px solid var(--green-b)',
            borderRadius: 'var(--rl)',
            padding: '18px 22px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <i className="ti ti-circle-check" style={{ color: 'var(--green)', fontSize: 18 }}></i>
                <strong style={{ color: 'var(--green)' }}>Acesso aprovado — {tempCredential.nome}</strong>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setTempCredential(null)}
                style={{ flexShrink: 0 }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--green-b)',
              borderRadius: 'var(--r)',
              padding: '12px 16px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}>
              <div>
                <div style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 4 }}>LOGIN</div>
                <div>{tempCredential.email}</div>
                <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 10, marginBottom: 4 }}>SENHA TEMPORARIA</div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>{tempCredential.senha}</div>
              </div>
              <button
                className={`btn ${copied ? 'btn-success' : ''}`}
                type="button"
                onClick={copyCredentials}
                style={{ flexShrink: 0 }}
              >
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`}></i>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {tempCredential.emailAgendado ? (
              <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 10 }}>
                <i className="ti ti-mail-check" style={{ fontSize: 12, marginRight: 4 }}></i>
                E-mail com os dados de acesso agendado para {tempCredential.email} (envio em poucos minutos).
              </p>
            ) : (
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 4 }}></i>
                Não foi possível agendar o envio do e-mail automaticamente. Copie e envie as credenciais manualmente.
              </p>
            )}
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ margin: 0 }}><i className="ti ti-user-plus"></i> Solicitacoes pendentes</div>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{request.nome}</td>
                    <td>{request.email}</td>
                    <td><span className="cpill">{request.empresa}</span></td>
                    <td><span className={`badge b-${request.status}`}>{request.status}</span></td>
                    <td>
                      {request.status === 'pendente' ? (
                        <div className="actions">
                          <button className="btn btn-success btn-sm" type="button" onClick={() => decide(request.id, 'aprovar')}><i className="ti ti-check"></i> Aprovar</button>
                          <button className="btn btn-danger btn-sm" type="button" onClick={() => decide(request.id, 'recusar')}><i className="ti ti-x"></i> Recusar</button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
