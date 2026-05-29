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

    setMessage('Solicitacao enviada para aprovacao.')
    event.currentTarget.reset()
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: '#f6f7f9',
    }}>
      <form className="card form" style={{ width: '100%', maxWidth: 520 }} onSubmit={submit}>
        <div>
          <h1 style={{ margin: 0 }}>Solicitar acesso</h1>
          <p className="muted">Seu pedido sera avaliado por um administrador.</p>
        </div>
        <div className="form-grid">
          <label className="field">Nome<input name="nome" required /></label>
          <label className="field">E-mail<input name="email" type="email" required /></label>
          <label className="field">Empresa<input name="empresa" required /></label>
          <label className="field">Setor<input name="setor" /></label>
        </div>
        <label className="field">Justificativa<textarea name="justificativa" /></label>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        <div className="actions">
          <button className="button" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitacao'}</button>
          <Link className="button secondary" href="/login">Voltar ao login</Link>
        </div>
      </form>
    </main>
  )
}
