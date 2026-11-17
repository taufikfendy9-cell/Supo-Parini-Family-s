import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { contentKinds } from '@/lib/content'

/** Public: all family content for the site pages. */
export const getFamilyContent = createServerFn({ method: 'GET' }).handler(async () => {
  const { listAll } = await import('@/server/content')
  return listAll()
})

const kindSchema = z.enum(contentKinds as [string, ...string[]]).transform(
  (k) => k as (typeof contentKinds)[number],
)

export const saveContentItem = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      kind: kindSchema,
      id: z.coerce.number().int().positive().optional(),
      data: z.unknown(),
    }),
  )
  .handler(async ({ data: input }) => {
    const { requireAdmin } = await import('@/server/auth')
    await requireAdmin()
    const { createItem, updateItem } = await import('@/server/content')
    try {
      if (input.id) {
        await updateItem(input.kind, input.id, input.data)
        return { id: String(input.id) }
      }
      return { id: await createItem(input.kind, input.data) }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new Error(err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
      }
      throw err
    }
  })

export const deleteContentItem = createServerFn({ method: 'POST' })
  .validator(z.object({ kind: kindSchema, id: z.coerce.number().int().positive() }))
  .handler(async ({ data: input }) => {
    const { requireAdmin } = await import('@/server/auth')
    await requireAdmin()
    const { deleteItem } = await import('@/server/content')
    const removed = await deleteItem(input.kind, input.id)
    // Clean up an uploaded photo that nothing else uses any more.
    const file = removed?.file
    if (file?.startsWith('/media/')) {
      const { listAll } = await import('@/server/content')
      const all = await listAll()
      const stillUsed = [...all.photos, ...all.stories, ...all.trips].some((i) => i.file === file)
      if (!stillUsed) {
        const { mediaStore } = await import('@/server/media')
        await mediaStore().delete(file.slice('/media/'.length))
      }
    }
    return { ok: true }
  })
