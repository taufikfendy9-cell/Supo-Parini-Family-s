import { getStore } from '@netlify/blobs'

/** Blob store holding photos uploaded through the admin area. */
export const mediaStore = () => getStore({ name: 'family-media', consistency: 'strong' })
