'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function AccessRequestPage() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())

    const res = await fetch('/api/users/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao enviar solicitacao.')
      return
    }

    setMessage('Solicitacao enviada. O admin Shopee ira analisar em breve.')
    event.currentTarget.reset()
  }

  return (
    <main className="login-screen">
      <form className="login-card" style={{ width: 620 }} onSubmit={submit}>
        <div className="login-logo">
          <div className="login-badge">SPX</div>
          <div>
            <div className="login-title">Solicitar acesso</div>
            <div className="login-sub">Um admin Shopee ira revisar e aprovar.</div>
          </div>
        </div>
        <div className="fgrid" style={{ marginBottom: 14 }}>
          <div><label className="flabel">Nome completo<span className="req">*</span></label><input name="nome" placeholder="Seu nome" required /></div>
          <div><label className="flabel">E-mail<span className="req">*</span></label><input name="email" type="email" placeholder="seu@empresa.com" required /></div>
          <div><label className="flabel">Empresa (3PL)<span className="req">*</span></label><input name="empresa" placeholder="LOSUNG" required /></div>
          <div><label className="flabel">Setor</label><input name="setor" placeholder="Operacional" /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="flabel">Justificativa de acesso</label>
          <textarea name="justificativa" rows={2} placeholder="Por que precisa de acesso ao portal?"></textarea>
        </div>
        {error ? <div className="alert alert-err on"><i className="ti ti-alert-circle"></i>{error}</div> : null}
        {message ? <div className="alert alert-ok on"><i className="ti ti-check"></i>{message}</div> : null}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-ghost" href="/login"><i className="ti ti-arrow-left"></i> Voltar</Link>
          <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={loading}><i className="ti ti-send"></i> {loading ? 'Enviando...' : 'Enviar solicitacao'}</button>
        </div>
      </form>
    </main>
  )
}
