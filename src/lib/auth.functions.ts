import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getAdminStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAdmin } = await import('@/server/auth')
  return { loggedIn: await isAdmin() }
})

export const loginAdmin = createServerFn({ method: 'POST' })
  .validator(z.object({ username: z.string().max(200), password: z.string().max(200) }))
  .handler(async ({ data }) => {
    const { checkCredentials, startSession } = await import('@/server/auth')
    if (!checkCredentials(data.username.trim(), data.password)) {
      return { ok: false as const, error: 'Wrong ID or password.' }
    }
    await startSession()
    return { ok: true as const }
  })

export const logoutAdmin = createServerFn({ method: 'POST' }).handler(async () => {
  const { endSession } = await import('@/server/auth')
  await endSession()
  return { ok: true }
})
