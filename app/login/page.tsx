'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: '#f6f7f9',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'grid',
          gap: 14,
          padding: 24,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#ffffff',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>3PL Chamados</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Acesse o portal BSC.</p>
        </div>

        <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
          E-mail
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
            style={{ height: 40, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
          Senha
          <input
            value={senha}
            onChange={event => setSenha(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
            style={{ height: 40, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </label>

        {error ? <p style={{ margin: 0, color: '#b91c1c', fontSize: 14 }}>{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: 42,
            border: 0,
            borderRadius: 6,
            background: '#EE4D2D',
            color: '#ffffff',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
