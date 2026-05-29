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

const KPI_OPTIONS = [
  'BSC Geral',
  'CPT',
  'ETA Destino',
  'No Show',
  'Plano de Acao',
  'SPOT / Tendencia',
  'Telemetria',
  'Training',
]

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsDataURL(file)
  })
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
    const kpi = String(form.get('kpis') || '')
    const file = form.get('evidenciaArquivo')
    let evidencia = String(form.get('evidencia') || '')

    if (file instanceof File && file.size > 0) {
      if (file.size > 35_000) {
        setError('A evidencia deve ter ate 35 KB para ser salva no Sheets. Use um link para arquivos maiores.')
        setLoading(false)
        return
      }
      evidencia = await fileToDataUrl(file)
    }

    const body = {
      empresa: user?.empresa || form.get('empresa'),
      setor: user?.setor || form.get('setor'),
      tipo: form.get('tipo'),
      categoria: form.get('categoria'),
      impacto: form.get('impacto'),
      descricao: form.get('descricao'),
      evidencia,
      periodo: form.get('periodo'),
      rotas: form.get('rotas'),
      drivers: form.get('drivers'),
      email: user?.email || form.get('email'),
      nome: user?.nome || form.get('nome'),
      kpis: kpi ? [kpi] : [],
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
    <AppShell title="Novo Chamado">
      <section className="page">
        <form className="card form" onSubmit={submit}>
          <div className="steps">
            <div className="step active"><div className="step-n">1</div><span>Identificacao</span></div>
            <div className="step-line"></div>
            <div className="step active"><div className="step-n">2</div><span>Problema</span></div>
            <div className="step-line"></div>
            <div className="step active"><div className="step-n">3</div><span>Detalhes</span></div>
          </div>

          <div className="fsec-title">Dados do solicitante</div>
          <div className="form-grid">
            <label className="field">Empresa<input name="empresa" value={user?.empresa || ''} readOnly required /></label>
            <label className="field">Setor<input name="setor" value={user?.setor || ''} readOnly /></label>
            <label className="field">Nome<input name="nome" value={user?.nome || ''} readOnly required /></label>
            <label className="field">E-mail<input name="email" type="email" value={user?.email || ''} readOnly required /></label>
          </div>

          <div className="fsec-title" style={{ marginTop: 8 }}>Tipo e impacto</div>
          <div className="form-grid">
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
            <label className="field">Assunto/Categoria<input name="categoria" /></label>
            <label className="field">KPI
              <select name="kpis" defaultValue="">
                <option value="">Selecione...</option>
                {KPI_OPTIONS.map(kpi => <option key={kpi} value={kpi}>{kpi}</option>)}
              </select>
            </label>
          </div>

          <div className="fsec-title" style={{ marginTop: 8 }}>Detalhes do problema</div>
          <div className="form-grid">
            <label className="field">Periodo<input name="periodo" placeholder="W35" /></label>
            <label className="field">Rotas<input name="rotas" /></label>
            <label className="field">Drivers<input name="drivers" /></label>
            <label className="field">Link da evidencia<input name="evidencia" placeholder="https://..." /></label>
            <label className="field">Upload da evidencia<input name="evidenciaArquivo" type="file" accept="image/*,.pdf,.txt,.csv,.xlsx" /><span className="fhint">Arquivos ate 35 KB ficam salvos no Sheets. Para arquivos maiores, use link.</span></label>
          </div>

          <label className="field">Descricao<textarea name="descricao" required /></label>

          {error ? <p className="error">{error}</p> : null}

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}><i className="ti ti-send"></i> {loading ? 'Salvando...' : 'Criar chamado'}</button>
          </div>
        </form>
      </section>
    </AppShell>
  )
}
