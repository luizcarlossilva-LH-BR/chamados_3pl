/**
 * lib/auth.ts
 * JWT-based session (no NextAuth needed - simpler for this use case).
 * Token stored in HttpOnly cookie.
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { SessionUser } from '@/types'

const COOKIE = '3pl_session'
const EXPIRES = 60 * 60 * 8 // 8 hours

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set with at least 32 characters.')
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${EXPIRES}s`)
    .setIssuedAt()
    .sign(getSecret())
  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, getSecret())
    return (payload as { user: SessionUser }).user
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(COOKIE, '', { maxAge: 0, path: '/' })
}

export function canSeeAllTickets(role: string) {
  return role === 'admin' || role === 'analista'
}

export function isShopeeUser(role: string) {
  return role === 'admin' || role === 'analista'
}

export function isAdmin(role: string) {
  return role === 'admin'
}
