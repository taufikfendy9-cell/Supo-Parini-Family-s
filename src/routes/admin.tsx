import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ImagePlus,
  Loader2,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { kindConfigs, type Field } from '@/components/admin/fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getAdminStatus, loginAdmin, logoutAdmin } from '@/lib/auth.functions'
import {
  contentKinds,
  type ContentKind,
  type ContentMap,
  type FamilyContent,
} from '@/lib/content'
import {
  deleteContentItem,
  getFamilyContent,
  saveContentItem,
} from '@/lib/content.functions'
import { family, img } from '@/lib/family'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: `Admin · The ${family.surname} Family` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  loader: async () => {
    const { loggedIn } = await getAdminStatus()
    return { loggedIn, content: loggedIn ? await getFamilyContent() : null }
  },
  component: AdminPage,
})

const listKey: Record<ContentKind, keyof FamilyContent> = {
  photo: 'photos',
  event: 'events',
  story: 'stories',
  trip: 'trips',
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

function AdminPage() {
  const { loggedIn, content } = Route.useLoaderData()
  return (
    <div className="mx-auto max-w-content px-4 pt-12 pb-8 sm:px-6 md:pt-16">
      {loggedIn && content ? <Dashboard content={content} /> : <LoginCard />}
    </div>
  )
}

/* ---------------------------------- Login --------------------------------- */

function LoginCard() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    try {
      const res = await loginAdmin({
        data: {
          username: String(form.get('username') ?? ''),
          password: String(form.get('password') ?? ''),
        },
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success('Welcome back!')
      await router.invalidate()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rise mx-auto max-w-md">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_40px_80px_-40px_color-mix(in_oklch,var(--primary)_55%,transparent)] sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
          <LockKeyhole className="size-7" strokeWidth={1.6} />
        </span>
        <h1 className="mt-6 text-center font-display text-4xl font-medium">
          Family <em className="font-light text-accent">admin</em>
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Log in to upload photos and keep events, news, and trips up to date.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ID</Label>
            <Input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full rounded-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Log in
          </Button>
        </form>
      </div>
    </div>
  )
}

/* -------------------------------- Dashboard ------------------------------- */

function Dashboard({ content }: { content: FamilyContent }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    try {
      await logoutAdmin()
      await router.invalidate()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            <ShieldCheck className="size-4" /> Admin
          </p>
          <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">
            Manage the <em className="font-light text-accent">family site</em>
          </h1>
        </div>
        <Button variant="outline" className="rounded-full" onClick={logout} disabled={loggingOut}>
          <LogOut /> Log out
        </Button>
      </div>

      <Tabs defaultValue="photo" className="mt-10">
        <TabsList className="flex h-auto flex-wrap">
          {contentKinds.map((kind) => (
            <TabsTrigger key={kind} value={kind} className="px-4 py-2">
              {kindConfigs[kind].label}
              <Badge variant="secondary" className="ml-2 rounded-full">
                {content[listKey[kind]].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {contentKinds.map((kind) => (
          <TabsContent key={kind} value={kind} className="mt-6">
            <CollectionPanel
              kind={kind}
              items={content[listKey[kind]] as ContentMap[typeof kind][]}
            />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}

function CollectionPanel<K extends ContentKind>({
  kind,
  items,
}: {
  kind: K
  items: ContentMap[K][]
}) {
  const config = kindConfigs[kind]
  const [editing, setEditing] = useState<ContentMap[K] | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ContentMap[K] | null>(null)

  return (
    <section aria-label={config.label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? config.singular : `${config.singular}s`} on the{' '}
          {config.label} page
        </p>
        <Button className="rounded-full" onClick={() => setEditing('new')}>
          {kind === 'photo' ? <ImagePlus /> : <Plus />}
          {kind === 'photo' ? 'Upload photo' : `Add ${config.singular}`}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nothing here yet. Add the first {config.singular} to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item) => {
            const image = config.image(item)
            return (
              <li key={item.id} className="flex items-center gap-4 p-3 sm:p-4">
                {kind !== 'event' && (
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                    {image && (
                      <img
                        src={img(image, 128, 128)}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-medium">{config.title(item)}</p>
                  <p className="truncate text-sm text-muted-foreground">{config.subtitle(item)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${config.title(item)}`}
                    onClick={() => setEditing(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${config.title(item)}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <ItemDialog
          kind={kind}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <DeleteDialog kind={kind} item={deleting} onClose={() => setDeleting(null)} />
    </section>
  )
}

/* ------------------------------- Edit dialog ------------------------------ */

type FormValues = Record<string, unknown>

function toFormValues(item: Record<string, unknown> | null, blank: FormValues): FormValues {
  const values: FormValues = { ...blank, ...(item ?? {}) }
  delete values.id
  return values
}

function fromFormValues(fields: Field[], values: FormValues) {
  const out: FormValues = {}
  for (const f of fields) {
    const v = values[f.name]
    if (f.type === 'lines') {
      out[f.name] = String(Array.isArray(v) ? v.join('\n') : (v ?? ''))
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    } else if (f.type === 'checkbox') {
      out[f.name] = Boolean(v)
    } else if (f.type === 'number') {
      out[f.name] = Number(v)
    } else {
      const s = String(v ?? '').trim()
      out[f.name] = s === '' && f.optional ? undefined : s
    }
  }
  return out
}

function ItemDialog<K extends ContentKind>({
  kind,
  item,
  onClose,
}: {
  kind: K
  item: ContentMap[K] | null
  onClose: () => void
}) {
  const router = useRouter()
  const config = kindConfigs[kind]
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(item as unknown as Record<string, unknown> | null, config.blank()),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missingImage = config.fields.find(
      (f) => f.type === 'image' && !f.optional && !values[f.name],
    )
    if (missingImage) {
      setError(`Please upload a ${missingImage.label.toLowerCase()}.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveContentItem({
        data: { kind, id: item ? Number(item.id) : undefined, data: fromFormValues(config.fields, values) },
      })
      toast.success(item ? 'Changes saved' : `New ${config.singular} added`)
      await router.invalidate()
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {item ? `Edit ${config.singular}` : kind === 'photo' ? 'Upload a photo' : `Add a ${config.singular}`}
          </DialogTitle>
          <DialogDescription>
            Changes appear on the {config.label} page as soon as you save.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => (
            <FieldInput
              key={f.name}
              field={f}
              value={values[f.name]}
              onChange={(v) => set(f.name, v)}
              onUploadingChange={setUploading}
            />
          ))}
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="animate-spin" />}
              {item ? 'Save changes' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function FieldInput({
  field: f,
  value,
  onChange,
  onUploadingChange,
}: {
  field: Field
  value: unknown
  onChange: (v: unknown) => void
  onUploadingChange: (uploading: boolean) => void
}) {
  const id = `field-${f.name}`
  const wrap = `space-y-2 ${f.wide ? 'sm:col-span-2' : ''}`
  const label = (
    <Label htmlFor={id}>
      {f.label}
      {f.optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </Label>
  )
  const hint = f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>

  if (f.type === 'image') {
    return (
      <div className={wrap}>
        {label}
        <ImageField
          id={id}
          value={String(value ?? '')}
          optional={f.optional}
          onChange={onChange}
          onUploadingChange={onUploadingChange}
        />
      </div>
    )
  }
  if (f.type === 'checkbox') {
    return (
      <div className={`flex items-center gap-2 self-end pb-2 ${f.wide ? 'sm:col-span-2' : ''}`}>
        <Checkbox id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
        <Label htmlFor={id}>{f.label}</Label>
      </div>
    )
  }
  if (f.type === 'select') {
    return (
      <div className={wrap}>
        {label}
        <select
          id={id}
          className={selectClass}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    )
  }
  if (f.type === 'textarea' || f.type === 'lines') {
    const text = Array.isArray(value) ? value.join('\n') : String(value ?? '')
    return (
      <div className={wrap}>
        {label}
        <Textarea
          id={id}
          rows={f.type === 'lines' ? 5 : 3}
          required={!f.optional}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
        {hint}
      </div>
    )
  }
  return (
    <div className={wrap}>
      {label}
      <Input
        id={id}
        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
        required={!f.optional}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint}
    </div>
  )
}

function ImageField({
  id,
  value,
  optional,
  onChange,
  onUploadingChange,
}: {
  id: string
  value: string
  optional?: boolean
  onChange: (v: string) => void
  onUploadingChange: (uploading: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  async function upload(file: File) {
    setUploading(true)
    onUploadingChange(true)
    setLocalPreview(URL.createObjectURL(file))
    try {
      const body = new FormData()
      body.append('image', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = (await res.json().catch(() => ({}))) as { file?: string; error?: string }
      if (!res.ok || !json.file) throw new Error(json.error ?? 'Upload failed. Please try again.')
      onChange(json.file)
      toast.success('Photo uploaded')
    } catch (err) {
      setLocalPreview(null)
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
      onUploadingChange(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const preview = localPreview ?? (value ? img(value, 640) : null)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted sm:w-48">
        {preview ? (
          <img src={preview} alt="Selected photo preview" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-8 text-muted-foreground" />
        )}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-background/70">
            <Loader2 className="size-6 animate-spin" />
          </span>
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus /> {value ? 'Replace photo' : 'Choose photo'}
          </Button>
          {optional && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalPreview(null)
                onChange('')
              }}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or AVIF, up to 8 MB.</p>
      </div>
    </div>
  )
}

/* ------------------------------ Delete dialog ----------------------------- */

function DeleteDialog<K extends ContentKind>({
  kind,
  item,
  onClose,
}: {
  kind: K
  item: ContentMap[K] | null
  onClose: () => void
}) {
  const router = useRouter()
  const config = kindConfigs[kind]
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    if (!item) return
    setDeleting(true)
    try {
      await deleteContentItem({ data: { kind, id: Number(item.id) } })
      toast.success(`Deleted “${config.title(item)}”`)
      await router.invalidate()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(o) => !o && !deleting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Delete this {config.singular}?</DialogTitle>
          <DialogDescription>
            {item && `“${config.title(item)}” will be removed from the site. This can't be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
