# The SUPO PARINI FAMILY

A family website for the Hartwell family — four generations rooted at Oakridge Farm. The landing page features the extended-family portrait and the family name, with five icon tiles that each open their own page:

- **Gallery** — a filterable photo album with a full-screen lightbox (arrow keys to browse).
- **Events** — a live countdown to the next reunion, an upcoming-events timeline with one-click "Add to calendar" downloads, and past gatherings.
- **News** — "The Hartwell Herald": births, graduations, and milestones, each readable in full.
- **Travel** — a journal of family trips and the next adventure being planned.
- **Contact** — family contacts and a message form that delivers to the family inbox via Netlify Forms.
- **Admin** (`/admin`, linked in the footer) — log in to upload, edit, and delete Gallery photos, Events, News stories, and Travel trips. Changes appear on the site immediately.

## Admin login

Default credentials are **ID `admin` / password `admin`**. Change them without touching code by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the Netlify project's environment variables — strongly recommended before sharing the site widely.

## Tech

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) deployed on Netlify
- Tailwind CSS 4 with shadcn/ui components and lucide icons
- Netlify Forms for the contact form
- Netlify Image CDN for responsive, WebP-optimized photos
- Netlify Database (Postgres + Drizzle ORM) for gallery, events, news, and travel content
- Netlify Blobs for photos uploaded through the admin area

## Making it yours

Gallery photos, events, news, and trips are managed from `/admin`. The first time the site runs, the starter content in `src/lib/family.ts` is copied into the database; after that the database is the source of truth. The family name, motto, stats, past events, next trip, and contacts are still edited in `src/lib/family.ts`.

## Run locally

```bash
pnpm install
netlify dev   # full Netlify emulation (forms, image CDN) on http://localhost:8888
# or
pnpm dev      # Vite only on http://localhost:3000
```

## Ideas for later

- A visual, interactive family tree with profiles for each relative
- Separate logins for individual family members
- Admin editing for the family name, stats, contacts, and hero portrait
- RSVP tracking for events
