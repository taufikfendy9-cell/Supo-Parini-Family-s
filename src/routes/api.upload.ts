import { createFileRoute } from '@tanstack/react-router'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}
const MAX_BYTES = 8 * 1024 * 1024

// Admin-only photo upload. Stores the file in Netlify Blobs and returns the
// "/media/<key>" reference that content items save in their `file` field.
export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isAdmin } = await import('@/server/auth')
        if (!(await isAdmin())) {
          return Response.json({ error: 'Please log in as admin first.' }, { status: 401 })
        }
        const form = await request.formData().catch(() => null)
        const file = form?.get('image')
        if (!(file instanceof File) || file.size === 0) {
          return Response.json({ error: 'Choose an image to upload.' }, { status: 400 })
        }
        if (!ALLOWED.includes(file.type)) {
          return Response.json({ error: 'Use a JPG, PNG, WebP, GIF, or AVIF image.' }, { status: 400 })
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: 'Images must be 8 MB or smaller.' }, { status: 400 })
        }
        const { mediaStore } = await import('@/server/media')
        const key = `${crypto.randomUUID()}.${EXT[file.type]}`
        await mediaStore().set(key, await file.arrayBuffer(), {
          metadata: { contentType: file.type },
        })
        return Response.json({ file: `/media/${key}` })
      },
    },
  },
})
