'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'

type SessionUser = {
  nome: string
  email: string
  empresa: string
  setor: string
}

export default function NewTicketPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setUser(data.data)
      })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const kpis = String(form.get('kpis') || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)

    const body = {
      empresa: form.get('empresa'),
      setor: form.get('setor'),
      tipo: form.get('tipo'),
      categoria: form.get('categoria'),
      impacto: form.get('impacto'),
      descricao: form.get('descricao'),
      evidencia: form.get('evidencia'),
      periodo: form.get('periodo'),
      rotas: form.get('rotas'),
      drivers: form.get('drivers'),
      email: form.get('email'),
      nome: form.get('nome'),
      kpis,
    }

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao criar chamado.')
      return
    }

    router.push(`/tickets/${data.data.id}`)
  }

  return (
    <AppShell>
      <section className="page">
        <header className="page-header">
          <div>
            <h1>Novo chamado</h1>
            <p className="muted">Registre uma solicitacao para acompanhamento do BSC.</p>
          </div>
        </header>

        <form className="card form" onSubmit={submit}>
          <div className="form-grid">
            <label className="field">Empresa<input name="empresa" defaultValue={user?.empresa || ''} required /></label>
            <label className="field">Setor<input name="setor" defaultValue={user?.setor || ''} /></label>
            <label className="field">Nome<input name="nome" defaultValue={user?.nome || ''} required /></label>
            <label className="field">E-mail<input name="email" type="email" defaultValue={user?.email || ''} required /></label>
            <label className="field">Tipo
              <select name="tipo" defaultValue="erro">
                <option value="erro">Erro</option>
                <option value="acesso">Acesso</option>
                <option value="sugestao">Sugestao</option>
              </select>
            </label>
            <label className="field">Impacto
              <select name="impacto" defaultValue="medio">
                <option value="alto">Alto</option>
                <option value="medio">Medio</option>
                <option value="baixo">Baixo</option>
              </select>
            </label>
            <label className="field">Categoria<input name="categoria" /></label>
            <label className="field">KPIs<input name="kpis" placeholder="Training, ETA Destino" /></label>
            <label className="field">Periodo<input name="periodo" placeholder="W35" /></label>
            <label className="field">Rotas<input name="rotas" /></label>
            <label className="field">Drivers<input name="drivers" /></label>
            <label className="field">Evidencia<input name="evidencia" placeholder="https://..." /></label>
          </div>

          <label className="field">Descricao<textarea name="descricao" required /></label>

          {error ? <p className="error">{error}</p> : null}

          <div className="actions">
            <button className="button" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar chamado'}</button>
          </div>
        </form>
      </section>
    </AppShell>
  )
}
