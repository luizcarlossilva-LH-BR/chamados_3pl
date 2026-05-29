import type { Role, TicketImpact, TicketTipo } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(asString).filter(Boolean)
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value)
}

export function isRole(value: string): value is Role {
  return ['admin', 'analista', 'supervisor', 'operador'].includes(value)
}

export function isTicketTipo(value: string): value is TicketTipo {
  return ['erro', 'acesso', 'sugestao'].includes(value)
}

export function isTicketImpact(value: string): value is TicketImpact {
  return ['alto', 'medio', 'baixo'].includes(value)
}

export function isTicketAction(
  value: string,
): value is 'responder' | 'atribuir' | 'sla' | 'andamento' | 'fechar' | 'rejeitar' {
  return ['responder', 'atribuir', 'sla', 'andamento', 'fechar', 'rejeitar'].includes(value)
}
