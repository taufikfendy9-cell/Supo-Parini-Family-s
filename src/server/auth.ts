// Server-only admin authentication: credential check + DB-backed sessions.
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { eq, lt } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

import { db } from '../../db/index.js'
import { adminSessions } from '../../db/schema.js'

export const SESSION_COOKIE = 'family_admin'
const SESSION_DAYS = 7

// The defaults are the requested admin / admin. Set ADMIN_USERNAME and
// ADMIN_PASSWORD in the Netlify environment to replace them without a code change.
function expectedCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
  }
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function checkCredentials(username: string, password: string) {
  const expected = expectedCredentials()
  // Evaluate both so timing doesn't reveal which half was wrong.
  const userOk = safeEqual(username, expected.username)
  const passOk = safeEqual(password, expected.password)
  return userOk && passOk
}

export async function startSession() {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5)
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()))
  await db.insert(adminSessions).values({ token, expiresAt })
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function endSession() {
  const token = getCookie(SESSION_COOKIE)
  if (token) await db.delete(adminSessions).where(eq(adminSessions.token, token))
  deleteCookie(SESSION_COOKIE, { path: '/' })
}

export async function isValidToken(token: string | undefined) {
  if (!token) return false
  const [row] = await db
    .select({ expiresAt: adminSessions.expiresAt })
    .from(adminSessions)
    .where(eq(adminSessions.token, token))
  return !!row && row.expiresAt > new Date()
}

/** True when the current request carries a live admin session. */
export function isAdmin() {
  return isValidToken(getCookie(SESSION_COOKIE))
}

/** Throws unless the current request is from a logged-in admin. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Please log in as admin first.')
}
