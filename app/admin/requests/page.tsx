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

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
    setMessage('')
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
    setMessage(action === 'aprovar' && data.data?.tempSenha
      ? `Solicitacao aprovada. Senha temporaria: ${data.data.tempSenha}`
      : 'Solicitacao atualizada.')
    loadRequests()
  }

  return (
    <AppShell title="Solicitacoes">
      <section className="page">
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

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
