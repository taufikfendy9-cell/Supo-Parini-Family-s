// Shapes and validation for the content the admin can manage.
// Shared by the public pages, the admin screens, and the server functions.
import { z } from 'zod'

const text = (max = 200) => z.string().trim().min(1, 'Required').max(max)
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
/** Either a bundled file in public/img (e.g. "g-beach.png") or an uploaded one ("/media/<key>"). */
const imageRef = z
  .string()
  .trim()
  .regex(/^(\/media\/[\w.-]+|[\w.-]+\.(png|jpe?g|webp|gif|avif))$/i, 'Upload an image')

export const photoCategories = ['Gatherings', 'Kitchen', 'Outdoors', 'Celebrations'] as const
export const eventKinds = ['Reunion', 'Birthday', 'Anniversary', 'Holiday'] as const
export const storyCategories = ['Births', 'Milestones', 'Home', 'Achievements'] as const

export const photoSchema = z.object({
  file: imageRef,
  title: text(120),
  caption: text(400),
  year: z.coerce.number().int().min(1800).max(2200),
  category: z.enum(photoCategories),
  tall: z.boolean().optional(),
})

export const eventSchema = z.object({
  title: text(160),
  start: isoDate,
  end: isoDate.optional().or(z.literal('').transform(() => undefined)),
  time: text(60),
  place: text(200),
  description: text(2000),
  kind: z.enum(eventKinds),
  host: text(120),
})

export const storySchema = z.object({
  title: text(200),
  date: isoDate,
  category: z.enum(storyCategories),
  excerpt: text(600),
  body: z.array(z.string().trim().min(1)).min(1, 'Write at least one paragraph'),
  author: text(120),
  file: imageRef.optional().or(z.literal('').transform(() => undefined)),
})

export const tripSchema = z.object({
  place: text(120),
  country: text(120),
  year: z.coerce.number().int().min(1800).max(2200),
  file: imageRef,
  who: text(200),
  summary: text(1000),
  highlights: z.array(z.string().trim().min(1)).max(12),
  coords: z.string().trim().max(60),
})

export const schemas = {
  photo: photoSchema,
  event: eventSchema,
  story: storySchema,
  trip: tripSchema,
}

export type ContentKind = keyof typeof schemas
export const contentKinds = Object.keys(schemas) as ContentKind[]

type WithId<T> = T & { id: string }
export type Photo = WithId<z.infer<typeof photoSchema>>
export type FamilyEvent = WithId<z.infer<typeof eventSchema>>
export type Story = WithId<z.infer<typeof storySchema>>
export type Trip = WithId<z.infer<typeof tripSchema>>

export type ContentMap = {
  photo: Photo
  event: FamilyEvent
  story: Story
  trip: Trip
}

export type FamilyContent = {
  photos: Photo[]
  events: FamilyEvent[]
  stories: Story[]
  trips: Trip[]
}
