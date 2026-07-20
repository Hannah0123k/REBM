# Blog CMS — operations & architecture

The publishing system that backs `/blog`. Built to hold hundreds–thousands of
posts with correct ordering, scheduling, and URLs — including back-dated posts
migrated from WordPress.

## Data model (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `blog_posts` | posts (Tiptap `body` JSON is the source of truth) |
| `blog_post_slugs` | old slug → post, for 301/308 redirects |
| `tags`, `blog_post_tags` | tags (many-to-many); "Market Watch" is a tag |
| `media_assets` | uploaded image registry |
| `admin_users` | who may write (RLS gate) |

Status enum: `draft · published · scheduled · unpublished`. Soft-delete/archive
is the `archived_at` timestamp (not a status).

## Publishing workflow & visibility

A post is **publicly visible iff**:

```
status IN ('published','scheduled')
AND published_at IS NOT NULL
AND published_at <= now()
AND archived_at IS NULL
```

This is enforced **twice** — by RLS (migration `0002`) and again explicitly in
every function in `lib/blog/queries.ts`. Consequences:

- **Drafts / unpublished** → never public (status excluded).
- **Published, due** → public immediately.
- **Scheduled / future-dated published** → hidden until `published_at` passes,
  then public automatically — **no cron required**, visibility is a pure
  function of the clock. (`normalizeStatus` maps a future `published` →
  `scheduled` and a due `scheduled` → `published` at save time for a tidy label;
  correctness does not depend on it.)
- **Archived / soft-deleted** → never public (`archived_at` set).
- **Unpublished** → disappears immediately (status change).

The public pages are dynamically rendered (Supabase read via cookies), so a
scheduled post appears on the next request after its time — no cache flush.

### Optional: tidy the status label

`promote_due_scheduled()` flips due `scheduled` rows to `published` so the admin
list reads "Published". Schedule with pg_cron (Supabase → Database → Extensions):

```sql
select cron.schedule('promote-scheduled', '*/5 * * * *',
                     $$select public.promote_due_scheduled()$$);
```

## Sorting

Every public listing sorts `published_at DESC, id DESC` — the admin-chosen
instant, never `created_at`/`updated_at`/insertion order. Back-dated migrated
posts land in true chronological position. The `id` tiebreak makes pagination
deterministic.

## Time-zone strategy

- **Store**: `published_at` is `timestamptz` — a UTC instant.
- **Submit**: the editor sends an **offset-aware ISO** string, so "9:30 AM on
  Jul 15 2019" is pinned to one exact moment regardless of the admin's zone.
- **Compare**: against `now()` (UTC) — no DST or locale drift.
- **Display**: formatted in one fixed business zone, **America/New_York**
  (`lib/blog/date.ts`), so every visitor sees the same date and a late-evening
  post never renders "the next day". Legacy date-only strings are treated as
  calendar dates (no zone shift).

## Slugs & URLs

- Auto-generated from the title; editable; validated `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Uniqueness: checked in the action **and** backed by a DB unique constraint.
- On slug change, the old slug is saved to `blog_post_slugs`; `/blog/[slug]`
  issues a **308** to the current URL, so old links never break.
- Autosave never changes the slug — a live post's URL only changes via Save.

## Editing guarantees

Saving preserves everything you didn't change: `published_at`, author, featured
image, tags, and SEO fields are all hydrated into the editor and written back.
Optimistic concurrency (`updated_at` guard) blocks a stale tab from clobbering a
newer version and prompts a reload instead.

## SEO

Per post: SEO title (≤70, warns at 60), meta description (≤320, warns at 160),
canonical URL, OpenGraph (+ image), Twitter card, and `BlogPosting` JSON-LD —
all emitted by `app/blog/[slug]/page.tsx`. Set `NEXT_PUBLIC_SITE_URL` per deploy
so canonical/OG URLs are absolute.

## Migrating WordPress posts

For each post, insert with the **original** publish date/time:

```sql
insert into blog_posts (title, slug, excerpt, body, status, published_at, author_name)
values ('…','original-slug','…', '{"type":"doc","content":[…]}'::jsonb,
        'published', '2019-07-15T09:30:00-04:00', 'Alan Fruitman');
```

- `published_at` = the original instant (offset-aware). They sort correctly and
  appear immediately.
- Register every historical WordPress URL slug that differs in
  `blog_post_slugs` so inbound links 308 to the new URL.
- Tags: insert into `tags` (name + derived slug) and link via `blog_post_tags`,
  or set them in the editor.
- `body` must be a Tiptap doc JSON; convert WP HTML → Tiptap during import.

## Public features

- **Pagination**: `/blog?page=N` and `/blog/tag/<slug>?page=N`, 12/page, prev/next
  controls (`BlogPagination`). Page 1 leads with the featured post.
- **Search**: `/blog?q=…` — a no-JS GET form matching title/excerpt (ILIKE).
  Upgrade to Postgres full-text search when volume warrants.
- **Tags**: `/blog/tag/<slug>` archives (paginated); "Market Watch" is a tag.

## Maintenance

- **Orphaned images**: `scripts/blog-orphan-images.mjs` lists storage objects no
  post references (dry-run); `--delete` removes them. Needs
  `SUPABASE_SERVICE_ROLE_KEY` in the shell — the app itself never uses it.

## Tests

`npm test` — Node's built-in runner over `tests/**/*.test.mts` (native TS type
stripping, no deps). Covers the pure guarantees: slug format, body sanitization,
and zone-stable date handling. DB-dependent behavior (visibility, redirects,
concurrency) needs an integration suite against a live Supabase.

## Deploy checklist

1. Apply `supabase/migrations/0001_init.sql` then `0002_scheduling_and_visibility.sql`.
2. Storage → bucket `blog-images` (Public ON). Auth → disable public signups.
3. Add the admin user; `insert into admin_users (user_id) values ('<uuid>')`.
4. Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SITE_URL`.
5. (Optional) enable pg_cron + schedule `promote_due_scheduled()`.
