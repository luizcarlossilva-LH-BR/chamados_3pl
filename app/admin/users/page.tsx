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

const ROLE_LABELS: Record<string, string> = {
  admin:      'Admin Shopee',
  analista:   'Analista Shopee',
  supervisor: 'Supervisor 3PL',
  operador:   'Operador 3PL',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

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

  async function toggleAtivo(user: User) {
    setError('')
    setMessage('')
    setToggling(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !user.ativo }),
    })
    const data = await res.json()
    setToggling(null)
    if (!res.ok || !data.ok) {
      setError(data.error || 'Erro ao atualizar usuario.')
      return
    }
    setMessage(`${user.nome} ${!user.ativo ? 'ativado' : 'desativado'}.`)
    loadUsers()
  }

  return (
    <AppShell title="Gestao de Usuarios">
      <section className="page">
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        <form className="card form" onSubmit={create}>
          <div className="card-title"><i className="ti ti-user-plus"></i> Novo usuario</div>
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
          <button className="btn btn-primary" type="submit"><i className="ti ti-plus"></i> Criar usuario</button>
        </form>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ margin: 0 }}><i className="ti ti-users"></i> Usuarios</div>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td style={{ color: 'var(--text3)' }}>{user.email}</td>
                    <td><span className={`role role-${user.role}`}>{ROLE_LABELS[user.role] ?? user.role}</span></td>
                    <td><span className="cpill">{user.empresa}</span></td>
                    <td><span className={`badge ${user.ativo ? 'b-fechado' : 'b-neutro'}`}>{user.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.ativo ? 'btn-danger' : 'btn-success'}`}
                        type="button"
                        disabled={toggling === user.id}
                        onClick={() => toggleAtivo(user)}
                      >
                        <i className={`ti ${user.ativo ? 'ti-user-off' : 'ti-user-check'}`}></i>
                        {toggling === user.id ? '...' : user.ativo ? 'Desativar' : 'Ativar'}
                      </button>
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
