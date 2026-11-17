import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Every editable piece of family content (gallery photos, events, news
 * stories, trips) is one row. `kind` says which collection it belongs to and
 * `data` holds the fields, validated by the zod schemas in src/lib/content.ts.
 */
export const contentItems = pgTable(
  'content_items',
  {
    id: serial().primaryKey(),
    kind: text().notNull(),
    data: jsonb().notNull(),
    position: integer().notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('content_items_kind_idx').on(t.kind)],
)

/** Small key/value table; used to remember that default content was seeded. */
export const siteMeta = pgTable('site_meta', {
  key: text().primaryKey(),
  value: text().notNull(),
})

/** Logged-in admin sessions. The token lives in an HttpOnly cookie. */
export const adminSessions = pgTable('admin_sessions', {
  token: text().primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
