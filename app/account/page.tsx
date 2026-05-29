'use client'

import { FormEvent, useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'

type SessionUser = {
  nome: string
  email: string
  role: string
  empresa: string
  setor: string
}

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [email, setEmail] = useState('')
  const [setor, setSetor] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.ok) return
        setUser(data.data)
        setEmail(data.data.email)
        setSetor(data.data.setor || '')
      })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, setor, senha }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao atualizar conta.')
      return
    }

    setUser(data.data)
    setSenha('')
    setMessage('Conta atualizada com sucesso.')
  }

  return (
    <AppShell title="Minha Conta">
      <section className="page">
        <form className="card form" onSubmit={submit}>
          <div className="card-title"><i className="ti ti-user-cog"></i> Dados da conta</div>
          <div className="form-grid">
            <label className="field">Nome<input value={user?.nome || ''} disabled /></label>
            <label className="field">Empresa<input value={user?.empresa || ''} disabled /></label>
            <label className="field">Perfil<input value={user?.role || ''} disabled /></label>
            <label className="field">Setor<input value={setor} onChange={event => setSetor(event.target.value)} /></label>
            <label className="field">E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
            <label className="field">Nova senha<input type="password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Deixe em branco para manter" /></label>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {message ? <p className="success">{message}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading}><i className="ti ti-device-floppy"></i> {loading ? 'Salvando...' : 'Salvar alteracoes'}</button>
        </form>
      </section>
    </AppShell>
  )
}
