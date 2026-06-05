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

type TicketTipo = 'erro' | 'acesso' | 'duvida' | 'sugestao'

const TIPO_OPTIONS: { value: TicketTipo; label: string }[] = [
  { value: 'erro', label: 'Reportar erro/problema no BSC' },
  { value: 'acesso', label: 'Solicitar acesso ao BSC' },
  { value: 'duvida', label: 'Duvida sobre o BSC' },
  { value: 'sugestao', label: 'Sugestao de melhoria' },
]

const IMPACT_OPTIONS = [
  { value: 'alto', label: 'Alto - bloqueia o uso ou prejudica a operacao' },
  { value: 'medio', label: 'Medio - dificulta o uso, mas existe contorno' },
  { value: 'baixo', label: 'Baixo - consigo seguir usando normalmente' },
]

const CATEGORY_OPTIONS = [
  'Dados incorretos',
  'Dados faltando',
  'Painel sem atualizacao',
  'Calculo/pontuacao incorreta',
  'Driver/treinamento divergente',
  'Rota/spot/tendencia divergente',
  'Acesso/permissao',
  'Outro',
]

const KPI_OPTIONS = [
  'BSC Geral',
  'ETA Destino',
  'ETA Origem',
  'Treinamentos',
  'Bloqueio Driver',
  'SPOT & Tendencia',
  'Quebras',
  'GR / Gerenciamento de Risco',
  'Field',
  'Monitoring',
  'Planning',
  'Pontuacao geral',
  'CPT',
  'No Show',
  'Telemetria',
  'Outro',
]

const ACCESS_PROFILE_OPTIONS = [
  'Visualizacao do BSC',
  'Gestao de chamados',
  'Perfil supervisor 3PL',
  'Perfil operador 3PL',
  'Outro',
]

const QUESTION_THEME_OPTIONS = [
  'Memoria de calculo',
  'Regra de negocio',
  'Atualizacao de base',
  'Uso do painel',
  'Indicador/KPI especifico',
  'Processo operacional',
  'Outro',
]

const RETURN_OPTIONS = [
  'Explicacao do calculo',
  'Orientacao de processo',
  'Confirmacao de regra',
  'Analise de caso especifico',
  'Material de apoio',
]

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsDataURL(file)
  })
}

function value(form: FormData, name: string) {
  return String(form.get(name) || '').trim()
}

function addSection(lines: string[], title: string, entries: [string, string][]) {
  const filled = entries.filter(([, entryValue]) => entryValue)
  if (!filled.length) return
  lines.push(title)
  filled.forEach(([label, entryValue]) => lines.push(`- ${label}: ${entryValue}`))
  lines.push('')
}

function buildStructuredDescription(form: FormData, tipo: TicketTipo) {
  const lines: string[] = []

  addSection(lines, 'Resumo do chamado', [
    ['Tipo', TIPO_OPTIONS.find(option => option.value === tipo)?.label || tipo],
    ['Bloqueia operacao hoje', value(form, 'bloqueiaOperacao')],
    ['Descricao principal', value(form, 'descricao')],
  ])

  if (tipo === 'erro') {
    addSection(lines, 'Detalhes do erro/problema', [
      ['Categoria', value(form, 'categoria')],
      ['Indicador/KPI', value(form, 'kpis')],
      ['Aba/tela do BSC', value(form, 'abaPainel')],
      ['Periodo afetado', value(form, 'periodo')],
      ['Valor exibido no BSC', value(form, 'dadoBsc')],
      ['Valor esperado/controle interno', value(form, 'dadoEsperado')],
      ['Base/fonte de comparacao', value(form, 'fonteComparacao')],
      ['Ja ocorreu antes', value(form, 'recorrente')],
      ['Primeira ocorrencia percebida', value(form, 'dataPrimeiraOcorrencia')],
    ])
    addSection(lines, 'Identificadores para analise', [
      ['Rotas/LHs/pacotes', value(form, 'rotas')],
      ['Drivers/IDs', value(form, 'drivers')],
      ['Outros IDs relacionados', value(form, 'idsRelacionados')],
    ])
  }

  if (tipo === 'acesso') {
    addSection(lines, 'Solicitacao de acesso', [
      ['E-mails que precisam de acesso', value(form, 'emailsAcesso')],
      ['Empresa dos usuarios', value(form, 'empresaAcesso')],
      ['Perfil necessario', value(form, 'perfilAcesso')],
      ['Justificativa', value(form, 'justificativaAcesso')],
      ['Gestor/aprovador', value(form, 'gestorAprovador')],
    ])
  }

  if (tipo === 'duvida') {
    addSection(lines, 'Duvida', [
      ['Tema', value(form, 'temaDuvida')],
      ['Pergunta principal', value(form, 'perguntaDuvida')],
      ['Contexto/tela/indicador', value(form, 'contextoDuvida')],
      ['Tipo de retorno esperado', value(form, 'retornoEsperado')],
    ])
  }

  if (tipo === 'sugestao') {
    addSection(lines, 'Sugestao de melhoria', [
      ['Melhoria sugerida', value(form, 'oportunidade')],
      ['Problema atual', value(form, 'problemaAtual')],
      ['Impacto esperado', value(form, 'impactoMelhoria')],
      ['Usuarios impactados', value(form, 'usuariosImpactados')],
    ])
  }

  return lines.join('\n').trim()
}

export default function NewTicketPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [tipo, setTipo] = useState<TicketTipo>('erro')
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
    const file = form.get('evidenciaArquivo')
    let evidencia = value(form, 'evidencia')

    if (file instanceof File && file.size > 0) {
      if (file.size > 35_000) {
        setError('A evidencia deve ter ate 35 KB para ser salva no Sheets. Use um link para arquivos maiores.')
        setLoading(false)
        return
      }
      evidencia = await fileToDataUrl(file)
    }

    const kpi = value(form, 'kpis')
    const categoria =
      tipo === 'acesso' ? 'Solicitacao de acesso' :
      tipo === 'duvida' ? value(form, 'temaDuvida') :
      tipo === 'sugestao' ? 'Sugestao de melhoria' :
      value(form, 'categoria')

    const body = {
      empresa: user?.empresa || form.get('empresa'),
      setor: user?.setor || form.get('setor'),
      tipo,
      categoria,
      impacto: form.get('impacto'),
      descricao: buildStructuredDescription(form, tipo),
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
            <div className="step active"><div className="step-n">2</div><span>Classificacao</span></div>
            <div className="step-line"></div>
            <div className="step active"><div className="step-n">3</div><span>Evidencias</span></div>
          </div>

          <div className="fsec-title">Dados do solicitante</div>
          <div className="form-grid">
            <label className="field">Empresa<input name="empresa" value={user?.empresa || ''} readOnly required /></label>
            <label className="field">Setor<input name="setor" value={user?.setor || ''} readOnly /></label>
            <label className="field">Nome<input name="nome" value={user?.nome || ''} readOnly required /></label>
            <label className="field">E-mail<input name="email" type="email" value={user?.email || ''} readOnly required /></label>
          </div>

          <div className="fsec-title" style={{ marginTop: 8 }}>Classificacao do chamado</div>
          <div className="form-grid">
            <label className="field">Tipo de solicitacao
              <select name="tipo" value={tipo} onChange={event => setTipo(event.target.value as TicketTipo)} required>
                {TIPO_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="field">Impacto
              <select name="impacto" defaultValue="medio" required>
                {IMPACT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="field">Esse problema bloqueia alguma operacao hoje?
              <select name="bloqueiaOperacao" defaultValue="nao" required>
                <option value="nao">Nao</option>
                <option value="sim">Sim</option>
              </select>
            </label>
          </div>

          {tipo === 'erro' ? (
            <>
              <div className="fsec-title" style={{ marginTop: 8 }}>Detalhes do erro/problema</div>
              <div className="form-grid">
                <label className="field">Tipo de problema
                  <select name="categoria" defaultValue="" required>
                    <option value="">Selecione...</option>
                    {CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="field">Indicador/KPI
                  <select name="kpis" defaultValue="" required>
                    <option value="">Selecione...</option>
                    {KPI_OPTIONS.map(kpi => <option key={kpi} value={kpi}>{kpi}</option>)}
                  </select>
                </label>
                <label className="field">Aba/tela do BSC<input name="abaPainel" placeholder="Ex.: Detalhamento ETA Destino" required /></label>
                <label className="field">Periodo afetado<input name="periodo" placeholder="Ex.: 24/04/2026, W17, Abril/2026" required /></label>
                <label className="field">Valor exibido no BSC<input name="dadoBsc" placeholder="Ex.: 79,70%" required /></label>
                <label className="field">Valor esperado ou controle interno<input name="dadoEsperado" placeholder="Ex.: 80,47%" required /></label>
                <label className="field">Base/fonte usada para comparar<input name="fonteComparacao" placeholder="Ex.: controle interno, DBLH, Agency" required /></label>
                <label className="field">Esse problema ja ocorreu antes?
                  <select name="recorrente" defaultValue="nao" required>
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </select>
                </label>
                <label className="field">Quando percebeu pela primeira vez?<input name="dataPrimeiraOcorrencia" type="date" /></label>
              </div>

              <div className="fsec-title" style={{ marginTop: 8 }}>Identificadores para analise</div>
              <div className="form-grid">
                <label className="field">Rotas, LHs ou pacotes<textarea name="rotas" placeholder="Informe exemplos especificos, um por linha." /></label>
                <label className="field">Drivers/IDs<textarea name="drivers" placeholder="Informe IDs envolvidos, um por linha." /></label>
                <label className="field">Outros IDs relacionados<textarea name="idsRelacionados" placeholder="Viagens, placas, ocorrencias, pedidos etc." /></label>
              </div>
            </>
          ) : null}

          {tipo === 'acesso' ? (
            <>
              <div className="fsec-title" style={{ marginTop: 8 }}>Solicitacao de acesso</div>
              <div className="form-grid">
                <label className="field">E-mails que precisam de acesso<textarea name="emailsAcesso" placeholder="Informe um e-mail por linha." required /></label>
                <label className="field">Empresa dos usuarios<input name="empresaAcesso" defaultValue={user?.empresa || ''} required /></label>
                <label className="field">Perfil de acesso necessario
                  <select name="perfilAcesso" defaultValue="" required>
                    <option value="">Selecione...</option>
                    {ACCESS_PROFILE_OPTIONS.map(profile => <option key={profile} value={profile}>{profile}</option>)}
                  </select>
                </label>
                <label className="field">Gestor/aprovador<input name="gestorAprovador" placeholder="Nome ou e-mail, se houver" /></label>
              </div>
              <label className="field">Justificativa do acesso<textarea name="justificativaAcesso" required /></label>
            </>
          ) : null}

          {tipo === 'duvida' ? (
            <>
              <div className="fsec-title" style={{ marginTop: 8 }}>Duvida</div>
              <div className="form-grid">
                <label className="field">Tema da duvida
                  <select name="temaDuvida" defaultValue="" required>
                    <option value="">Selecione...</option>
                    {QUESTION_THEME_OPTIONS.map(theme => <option key={theme} value={theme}>{theme}</option>)}
                  </select>
                </label>
                <label className="field">Tipo de retorno esperado
                  <select name="retornoEsperado" defaultValue="">
                    <option value="">Selecione...</option>
                    {RETURN_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="field">Contexto, tela ou indicador<input name="contextoDuvida" placeholder="Ex.: aba Status Driver, indicador ETA Destino" required /></label>
              </div>
              <label className="field">Qual e sua duvida principal?<textarea name="perguntaDuvida" required /></label>
            </>
          ) : null}

          {tipo === 'sugestao' ? (
            <>
              <div className="fsec-title" style={{ marginTop: 8 }}>Sugestao de melhoria</div>
              <label className="field">Qual melhoria voce sugere?<textarea name="oportunidade" required /></label>
              <div className="form-grid">
                <label className="field">Qual problema essa melhoria resolveria?<textarea name="problemaAtual" required /></label>
                <label className="field">Qual seria o impacto esperado?
                  <select name="impactoMelhoria" defaultValue="" required>
                    <option value="">Selecione...</option>
                    <option value="Reduz retrabalho">Reduz retrabalho</option>
                    <option value="Melhora visibilidade">Melhora visibilidade</option>
                    <option value="Acelera tomada de decisao">Acelera tomada de decisao</option>
                    <option value="Evita divergencia de dados">Evita divergencia de dados</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
                <label className="field">Quem seria beneficiado?<input name="usuariosImpactados" placeholder="Ex.: operacao, qualidade, todos os 3PLs" /></label>
              </div>
            </>
          ) : null}

          <div className="fsec-title" style={{ marginTop: 8 }}>Resumo e evidencias</div>
          <label className="field">
            Descricao principal
            <textarea
              name="descricao"
              placeholder="Informe um exemplo especifico com data/periodo, indicador, valor exibido no BSC e valor esperado."
              required
            />
          </label>

          <div className="form-grid">
            <label className="field">Link da evidencia<input name="evidencia" placeholder="https://..." /></label>
            <label className="field">Upload da evidencia<input name="evidenciaArquivo" type="file" accept="image/*,.pdf,.txt,.csv,.xlsx" /><span className="fhint">Arquivos ate 35 KB ficam salvos no Sheets. Para arquivos maiores, use link.</span></label>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}><i className="ti ti-send"></i> {loading ? 'Salvando...' : 'Criar chamado'}</button>
          </div>
        </form>
      </section>
    </AppShell>
  )
}
