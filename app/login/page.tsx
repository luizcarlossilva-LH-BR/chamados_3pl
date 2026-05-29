'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const demoUsers = [
  { email: 'admin@shopee.com', senha: 'admin123', label: 'Admin', className: 'role-admin' },
  { email: 'analista@shopee.com', senha: 'analista123', label: 'Analista', className: 'role-analista' },
  { email: 'supervisor@losung.com', senha: 'losung123', label: 'Supervisor 3PL', className: 'role-supervisor' },
  { email: 'operador@losung.com', senha: 'op123', label: 'Operador 3PL', className: 'role-operador' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Nao foi possivel entrar.')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div className="login-badge">SPX</div>
          <div>
            <div className="login-title">3PL Chamados</div>
            <div className="login-sub">BSC Support Portal - Shopee</div>
          </div>
        </div>

        <div className="login-demo">
          <div className="login-demo-title">Contas de demonstracao</div>
          {demoUsers.map(user => (
            <div className="demo-user" key={user.email}>
              <span><strong>{user.email}</strong></span>
              <span className={`role ${user.className}`}>{user.label}</span>
              <button className="demo-btn" type="button" onClick={() => { setEmail(user.email); setSenha(user.senha) }}>Usar</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="flabel">E-mail</label>
          <input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="seu@email.com" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="flabel">Senha</label>
          <input value={senha} onChange={event => setSenha(event.target.value)} type="password" placeholder="********" />
        </div>

        {error ? <div className="alert alert-err on"><i className="ti ti-alert-circle"></i><span>{error}</span></div> : null}

        <button className="btn btn-primary btn-full" disabled={loading} type="submit">
          <i className="ti ti-login"></i> {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="divider"></div>
        <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginBottom: 12 }}>Nao tem conta? Solicite acesso:</p>
        <Link className="btn btn-full" href="/access-request"><i className="ti ti-user-plus"></i> Solicitar acesso</Link>
      </form>
    </main>
  )
}
