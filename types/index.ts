// ── Roles ──────────────────────────────────────────────
export type Role = 'admin' | 'analista' | 'supervisor' | 'operador'

export const ROLE_LABELS: Record<Role, string> = {
  admin:      'Admin Shopee',
  analista:   'Analista Shopee',
  supervisor: 'Supervisor 3PL',
  operador:   'Operador 3PL',
}

export const SHOPEE_ROLES: Role[] = ['admin', 'analista']
export const TPL_ROLES:    Role[] = ['supervisor', 'operador']

// ── User ───────────────────────────────────────────────
export interface User {
  id:        string   // row index as string
  nome:      string
  email:     string
  senha:     string   // bcrypt hash in Sheets
  role:      Role
  empresa:   string
  setor:     string
  ativo:     boolean
  criadoEm:  string
}

// ── Ticket ─────────────────────────────────────────────
export type TicketStatus = 'aberto' | 'andamento' | 'fechado' | 'rejeitado'
export type TicketImpact = 'alto' | 'medio' | 'baixo'
export type TicketTipo   = 'erro' | 'acesso' | 'duvida' | 'sugestao'

export interface TimelineEvent {
  tipo:   'criado' | 'resposta' | 'status' | 'fechado' | 'rejeitado' | 'atribuido' | 'sla'
  autor:  string
  role:   Role
  msg:    string
  ts:     string
}

export interface Ticket {
  id:          string
  empresa:     string
  setor:       string
  tipo:        TicketTipo
  categoria:   string
  kpis:        string[]   // JSON array stored as string in Sheets
  impacto:     TicketImpact
  status:      TicketStatus
  descricao:   string
  evidencia:   string
  periodo:     string
  rotas:       string
  drivers:     string
  email:       string
  nome:        string
  responsavel: string
  sla:         string
  timeline:    TimelineEvent[]  // JSON stored as string in Sheets
  criadoEm:    string
  atualizadoEm:string
}

// ── Access Request ─────────────────────────────────────
export interface AccessRequest {
  id:            string
  nome:          string
  email:         string
  empresa:       string
  setor:         string
  justificativa: string
  status:        'pendente' | 'aprovado' | 'recusado'
  criadoEm:      string
}

// ── API responses ──────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok:    boolean
  data?: T
  error?: string
}

// ── Session ────────────────────────────────────────────
export interface SessionUser {
  id:      string
  nome:    string
  email:   string
  role:    Role
  empresa: string
  setor:   string
}
