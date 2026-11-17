// Server-only data access for family content. Imported only inside server
// function handlers and server routes, never from browser code.
import { asc, eq, sql } from 'drizzle-orm'

import { db } from '../../db/index.js'
import { contentItems, siteMeta } from '../../db/schema.js'
import {
  schemas,
  type ContentKind,
  type ContentMap,
  type FamilyContent,
} from '@/lib/content'
import { seedEvents, seedPhotos, seedStories, seedTrips } from '@/lib/family'

const seeds: Record<ContentKind, unknown[]> = {
  photo: seedPhotos,
  event: seedEvents,
  story: seedStories,
  trip: seedTrips,
}

let seeding: Promise<void> | null = null

/**
 * Copies the starter content from src/lib/family.ts into the database exactly
 * once. The marker row means deleting everything later does not bring it back.
 */
function ensureSeeded() {
  seeding ??= seed().catch((err) => {
    seeding = null
    throw err
  })
  return seeding
}

async function seed() {
  const claimed = await db
    .insert(siteMeta)
    .values({ key: 'seeded', value: new Date().toISOString() })
    .onConflictDoNothing()
    .returning()
  if (claimed.length === 0) return
  const rows = (Object.keys(seeds) as ContentKind[]).flatMap((kind) =>
    seeds[kind].map((item, position) => ({
      kind,
      position,
      data: schemas[kind].parse(item),
    })),
  )
  try {
    await db.insert(contentItems).values(rows)
  } catch (err) {
    // Let a later request retry the seed.
    await db.delete(siteMeta).where(eq(siteMeta.key, 'seeded'))
    throw err
  }
}

function toItem<K extends ContentKind>(kind: K, row: { id: number; data: unknown }) {
  const parsed = schemas[kind].safeParse(row.data)
  if (!parsed.success) return null
  return { ...(parsed.data as object), id: String(row.id) } as unknown as ContentMap[K]
}

export async function listKind<K extends ContentKind>(kind: K): Promise<ContentMap[K][]> {
  await ensureSeeded()
  const rows = await db
    .select({ id: contentItems.id, data: contentItems.data })
    .from(contentItems)
    .where(eq(contentItems.kind, kind))
    .orderBy(asc(contentItems.position), asc(contentItems.id))
  const items = rows
    .map((r) => toItem(kind, r))
    .filter((x): x is ContentMap[K] => x !== null)
  return sortKind(kind, items)
}

function sortKind<K extends ContentKind>(kind: K, items: ContentMap[K][]) {
  if (kind === 'event')
    return [...(items as unknown as ContentMap['event'][])].sort((a, b) =>
      a.start.localeCompare(b.start),
    ) as unknown as ContentMap[K][]
  if (kind === 'story')
    return [...(items as unknown as ContentMap['story'][])].sort((a, b) =>
      b.date.localeCompare(a.date),
    ) as unknown as ContentMap[K][]
  if (kind === 'trip')
    return [...(items as unknown as ContentMap['trip'][])].sort((a, b) => b.year - a.year) as unknown as ContentMap[K][]
  return items
}

export async function listAll(): Promise<FamilyContent> {
  await ensureSeeded()
  const [photos, events, stories, trips] = await Promise.all([
    listKind('photo'),
    listKind('event'),
    listKind('story'),
    listKind('trip'),
  ])
  return { photos, events, stories, trips }
}

export async function createItem(kind: ContentKind, data: unknown) {
  await ensureSeeded()
  const parsed = schemas[kind].parse(data)
  // New items go to the front of their collection.
  const [{ min }] = await db
    .select({ min: sql<number>`coalesce(min(${contentItems.position}), 0)` })
    .from(contentItems)
    .where(eq(contentItems.kind, kind))
  const [row] = await db
    .insert(contentItems)
    .values({ kind, data: parsed, position: Number(min) - 1 })
    .returning({ id: contentItems.id })
  return String(row.id)
}

export async function updateItem(kind: ContentKind, id: number, data: unknown) {
  const parsed = schemas[kind].parse(data)
  const rows = await db
    .update(contentItems)
    .set({ data: parsed, updatedAt: new Date() })
    .where(sql`${contentItems.id} = ${id} and ${contentItems.kind} = ${kind}`)
    .returning({ id: contentItems.id })
  if (rows.length === 0) throw new Error('That item no longer exists.')
}

export async function deleteItem(kind: ContentKind, id: number) {
  const rows = await db
    .delete(contentItems)
    .where(sql`${contentItems.id} = ${id} and ${contentItems.kind} = ${kind}`)
    .returning({ data: contentItems.data })
  return rows[0]?.data as { file?: string } | undefined
}
