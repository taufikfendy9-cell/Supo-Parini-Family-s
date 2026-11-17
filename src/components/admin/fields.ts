// Describes the edit form for each kind of content in the admin area.
import {
  eventKinds,
  photoCategories,
  storyCategories,
  type ContentKind,
  type ContentMap,
} from '@/lib/content'
import { formatDate } from '@/lib/family'

export type Field = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'image' | 'checkbox' | 'lines'
  options?: readonly string[]
  optional?: boolean
  hint?: string
  wide?: boolean
}

export type KindConfig<K extends ContentKind> = {
  label: string
  singular: string
  fields: Field[]
  title: (item: ContentMap[K]) => string
  subtitle: (item: ContentMap[K]) => string
  image: (item: ContentMap[K]) => string | undefined
  blank: () => Record<string, unknown>
}

const thisYear = () => new Date().getFullYear()
const today = () => new Date().toISOString().slice(0, 10)

export const kindConfigs: { [K in ContentKind]: KindConfig<K> } = {
  photo: {
    label: 'Gallery',
    singular: 'photo',
    fields: [
      { name: 'file', label: 'Photo', type: 'image', wide: true },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'category', label: 'Category', type: 'select', options: photoCategories },
      { name: 'tall', label: 'Portrait (tall) layout', type: 'checkbox' },
      { name: 'caption', label: 'Caption', type: 'textarea', wide: true },
    ],
    title: (p) => p.title,
    subtitle: (p) => `${p.category} · ${p.year}`,
    image: (p) => p.file,
    blank: () => ({ file: '', title: '', caption: '', year: thisYear(), category: 'Gatherings', tall: false }),
  },
  event: {
    label: 'Events',
    singular: 'event',
    fields: [
      { name: 'title', label: 'Title', type: 'text', wide: true },
      { name: 'start', label: 'Date', type: 'date' },
      { name: 'end', label: 'End date', type: 'date', optional: true, hint: 'Only for multi-day events' },
      { name: 'time', label: 'Time', type: 'text', hint: 'e.g. 6:00 pm or All weekend' },
      { name: 'kind', label: 'Type', type: 'select', options: eventKinds },
      { name: 'place', label: 'Place', type: 'text' },
      { name: 'host', label: 'Hosted by', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
    title: (e) => e.title,
    subtitle: (e) => `${e.kind} · ${formatDate(e.start)} · ${e.place}`,
    image: () => undefined,
    blank: () => ({ title: '', start: today(), end: '', time: '', place: '', description: '', kind: 'Reunion', host: '' }),
  },
  story: {
    label: 'News',
    singular: 'story',
    fields: [
      { name: 'title', label: 'Headline', type: 'text', wide: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'category', label: 'Category', type: 'select', options: storyCategories },
      { name: 'author', label: 'Written by', type: 'text' },
      { name: 'file', label: 'Photo', type: 'image', optional: true, wide: true },
      { name: 'excerpt', label: 'Summary', type: 'textarea', wide: true },
      { name: 'body', label: 'Full story', type: 'lines', wide: true, hint: 'Each line becomes a paragraph' },
    ],
    title: (s) => s.title,
    subtitle: (s) => `${s.category} · ${formatDate(s.date)} · ${s.author}`,
    image: (s) => s.file,
    blank: () => ({ title: '', date: today(), category: 'Milestones', excerpt: '', body: [], author: '', file: '' }),
  },
  trip: {
    label: 'Travel',
    singular: 'trip',
    fields: [
      { name: 'place', label: 'Place', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'coords', label: 'Coordinates', type: 'text', optional: true, hint: 'e.g. 45.98° N, 9.26° E' },
      { name: 'file', label: 'Photo', type: 'image', wide: true },
      { name: 'who', label: 'Who went', type: 'text', wide: true },
      { name: 'summary', label: 'Summary', type: 'textarea', wide: true },
      { name: 'highlights', label: 'Highlights', type: 'lines', optional: true, wide: true, hint: 'One per line' },
    ],
    title: (t) => `${t.place}, ${t.country}`,
    subtitle: (t) => `${t.year} · ${t.who}`,
    image: (t) => t.file,
    blank: () => ({ place: '', country: '', year: thisYear(), file: '', who: '', summary: '', highlights: [], coords: '' }),
  },
}
