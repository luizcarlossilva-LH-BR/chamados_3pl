'use client'

import { FormEvent, useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'

type User = {
  id: string
  nome: string
  email: string
  role: string
  empresa: string
  setor: string
  ativo: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function loadUsers() {
    fetch('/api/users')
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao carregar usuarios.')
        setUsers(data.data)
      })
      .catch(err => setError(err.message))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao criar usuario.')
      return
    }
    setMessage('Usuario criado.')
    event.currentTarget.reset()
    loadUsers()
  }

  return (
    <AppShell>
      <section className="page">
        <header className="page-header">
          <div>
            <h1>Usuarios</h1>
            <p className="muted">Gerencie acessos ao portal.</p>
          </div>
        </header>

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        <form className="card form" onSubmit={create}>
          <h2 style={{ margin: 0 }}>Novo usuario</h2>
          <div className="form-grid">
            <label className="field">Nome<input name="nome" required /></label>
            <label className="field">E-mail<input name="email" type="email" required /></label>
            <label className="field">Senha<input name="senha" type="password" minLength={8} required /></label>
            <label className="field">Perfil
              <select name="role" defaultValue="operador">
                <option value="admin">Admin Shopee</option>
                <option value="analista">Analista Shopee</option>
                <option value="supervisor">Supervisor 3PL</option>
                <option value="operador">Operador 3PL</option>
              </select>
            </label>
            <label className="field">Empresa<input name="empresa" defaultValue="Shopee" /></label>
            <label className="field">Setor<input name="setor" /></label>
          </div>
          <button className="button" type="submit">Criar usuario</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Empresa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.empresa}</td>
                  <td>{user.ativo ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  )
}
