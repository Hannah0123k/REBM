-- ============================================================
--  0004 — Blog migration / import tracking
--  Run after 0003. NON-DESTRUCTIVE and additive only:
--    * creates ONE new table (public.blog_post_imports)
--    * touches NO existing table, column, policy, or data
--    * existing manually-created posts are completely unaffected
--  DO NOT apply until the dry-run report has been reviewed and approved.
-- ============================================================
--
--  WHY a separate table (not columns on blog_posts):
--  Migration bookkeeping is orthogonal to a post's content. Keeping it in its
--  own table means imported posts are ordinary blog_posts rows — fully editable
--  in the normal admin editor, with identical status/scheduling/visibility — and
--  the migration metadata never clutters or constrains the post schema. A post
--  with no row here is simply "not imported" (i.e. manually created).
--
--  IDEMPOTENCY: unique (source_site, source_post_id) and
--  (source_site, normalized_source_url) let the importer find an existing record
--  by stable identity and skip/update instead of duplicating.
-- ============================================================

create table public.blog_post_imports (
  id            uuid primary key default gen_random_uuid(),

  -- Destination (nullable so a manifest row can exist before the post is written)
  post_id       uuid references public.blog_posts(id) on delete cascade,

  -- Source identity (used for dedupe / idempotent re-runs)
  source_site        text        not null,              -- e.g. 'realestatebrokermatch.com'
  source_post_id     text,                              -- WordPress post id when exposed
  canonical_source_url text      not null,
  normalized_source_url text     not null,              -- lowercased host, no trailing slash, no tracking params
  source_slug        text,

  -- Change detection
  source_checksum               text,                   -- checksum of the source content at extract time
  destination_checksum_at_import text,                  -- checksum of what we wrote (to detect later manual edits)
  migration_batch_id            text,                   -- groups one importer run
  last_imported_at              timestamptz,

  -- Status + review flags (drive the admin badges/filters)
  import_status        text        not null default 'pending'
    constraint blog_post_imports_status_chk
      check (import_status in ('pending','imported','skipped','failed','needs_review')),
  review_required        boolean   not null default true,
  missing_featured_image boolean   not null default false,
  unresolved_image_count integer   not null default 0
    constraint blog_post_imports_img_nonneg check (unresolved_image_count >= 0),
  publish_time_inferred  boolean   not null default false,
  slug_conflict          boolean   not null default false,
  metadata_incomplete    boolean   not null default false,

  -- Original source metadata (title, dates, author, categories, tags, image URLs,
  -- warnings, suspicious findings, table info) kept for audit + re-import.
  source_metadata        jsonb     not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Manually edited after import" is DERIVED (no stored flag to drift):
--   a post is considered manually edited when
--   blog_posts.updated_at > blog_post_imports.last_imported_at
-- The importer's update-unmodified mode also compares
--   destination_checksum_at_import against the current body checksum.

-- ---- idempotency: stable-identity uniqueness ----------------
create unique index blog_post_imports_site_pid_uidx
  on public.blog_post_imports (source_site, source_post_id)
  where source_post_id is not null;
create unique index blog_post_imports_site_url_uidx
  on public.blog_post_imports (source_site, normalized_source_url);
create unique index blog_post_imports_post_uidx
  on public.blog_post_imports (post_id)
  where post_id is not null;

-- ---- admin filter/sort helpers ------------------------------
create index blog_post_imports_status_idx on public.blog_post_imports (import_status);
create index blog_post_imports_review_idx on public.blog_post_imports (review_required)
  where review_required = true;
create index blog_post_imports_batch_idx  on public.blog_post_imports (migration_batch_id);

-- ---- keep updated_at fresh (reuses the 0001 trigger fn) -----
create trigger blog_post_imports_set_updated_at before update on public.blog_post_imports
  for each row execute function public.set_updated_at();

-- ============================================================
--  Row Level Security — ADMIN ONLY. No anon/public access at all.
--  (The public site never reads this table; only the admin portal and the
--   service-role importer do.) RLS on other tables is unchanged.
-- ============================================================
alter table public.blog_post_imports enable row level security;

create policy blog_imports_admin_all on public.blog_post_imports
  for all to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- No grant to anon; no policy for anon → invisible to the public.
