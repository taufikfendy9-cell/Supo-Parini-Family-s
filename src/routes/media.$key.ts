import { createFileRoute } from '@tanstack/react-router'

// Serves admin-uploaded photos from Netlify Blobs. Pages never link here
// directly; they go through the Image CDN (see img() in src/lib/family.ts).
export const Route = createFileRoute('/media/$key')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[\w-]+\.\w+$/.test(params.key)) return new Response('Not found', { status: 404 })
        const { mediaStore } = await import('@/server/media')
        const result = await mediaStore().getWithMetadata(params.key, { type: 'stream' })
        if (!result) return new Response('Not found', { status: 404 })
        const contentType =
          typeof result.metadata?.contentType === 'string'
            ? result.metadata.contentType
            : 'application/octet-stream'
        return new Response(result.data, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
