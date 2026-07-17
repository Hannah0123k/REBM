-- ============================================================
--  Real Estate Broker Match — Website CMS (Phase 1 schema)
--  Run once in the Supabase SQL editor (or via the Supabase CLI).
--  Idempotency: intended for a fresh project. Re-running requires dropping
--  the objects first.
-- ============================================================

-- ---- 1. status enum ----------------------------------------
create type public.post_status as enum ('draft','published','scheduled','unpublished');

-- ---- 2. admin authorization --------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  created_by uuid        references auth.users(id)
);

-- ---- 3. media registry (future Media Library) --------------
create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  storage_path text        not null unique,       -- e.g. blog/2026/07/<uuid>.webp
  public_url   text        not null,
  mime_type    text        not null,
  size_bytes   bigint      not null,
  width        integer,
  height       integer,
  alt_text     text,
  uploaded_by  uuid        references auth.users(id),
  created_at   timestamptz not null default now(),
  constraint media_mime_allowed check (mime_type in ('image/jpeg','image/png','image/webp'))
);

-- ---- 4. tags (many-to-many) --------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ---- 5. blog_posts -----------------------------------------
create table public.blog_posts (
  id                   uuid primary key default gen_random_uuid(),
  title                text        not null,
  slug                 text        not null,
  excerpt              text,
  body                 jsonb       not null,           -- TipTap document (source of truth)
  featured_image_url   text,
  featured_image_alt   text,
  author_name          text,
  status               public.post_status not null default 'draft',
  featured             boolean     not null default false,
  reading_time_minutes integer     not null default 0,
  published_at         timestamptz,
  archived_at          timestamptz,                    -- null = not archived (soft delete)
  seo_title            text,
  meta_description     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint blog_posts_title_not_blank check (length(btrim(title)) > 0),
  constraint blog_posts_slug_not_blank  check (length(btrim(slug))  > 0),
  constraint blog_posts_slug_format     check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_body_is_object  check (jsonb_typeof(body) = 'object'),
  constraint blog_posts_pub_needs_date  check (status not in ('published','scheduled')
                                               or published_at is not null),
  constraint blog_posts_reading_nonneg  check (reading_time_minutes >= 0),
  constraint blog_posts_seo_title_len   check (seo_title is null       or char_length(seo_title)       <= 70),
  constraint blog_posts_meta_desc_len   check (meta_description is null or char_length(meta_description) <= 320)
);

alter table public.blog_posts add constraint blog_posts_slug_key unique (slug);

-- ---- 6. slug history (old URL -> post, for 301 redirects) --
create table public.blog_post_slugs (
  old_slug   text        primary key,
  post_id    uuid        not null references public.blog_posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---- 7. post <-> tag join ----------------------------------
create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)       on delete cascade,
  primary key (post_id, tag_id)
);

-- ---- 8. indexes --------------------------------------------
create index blog_posts_status_idx       on public.blog_posts (status);
create index blog_posts_published_at_idx  on public.blog_posts (published_at desc);
create index blog_posts_public_idx        on public.blog_posts (published_at desc)
  where status = 'published' and archived_at is null;
create index blog_posts_featured_idx      on public.blog_posts (published_at desc)
  where featured = true and status = 'published' and archived_at is null;
create index blog_post_tags_tag_idx       on public.blog_post_tags (tag_id);
create index blog_post_slugs_post_idx     on public.blog_post_slugs (post_id);

-- ---- 9. updated_at trigger ---------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ============================================================
--  Authorization helper — non-recursive, SECURITY DEFINER
-- ============================================================
create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users
                 where user_id = auth.uid() and is_active = true);
$$;
alter function public.is_active_admin() owner to postgres;
revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to anon, authenticated;

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.admin_users     enable row level security;
alter table public.media_assets    enable row level security;
alter table public.tags            enable row level security;
alter table public.blog_posts      enable row level security;
alter table public.blog_post_slugs enable row level security;
alter table public.blog_post_tags  enable row level security;

-- admin_users: self-read only; no client writes (dashboard / service role only)
create policy admin_users_self_read on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- media_assets: admin only (public loads images by URL from Storage, not here)
create policy media_admin_all on public.media_assets
  for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin());

-- tags: public read; admin write
create policy tags_public_read on public.tags for select to anon, authenticated using (true);
create policy tags_admin_write on public.tags
  for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin());

-- blog_posts: public sees only published, due, not archived
create policy blog_public_read on public.blog_posts for select to anon, authenticated
  using (status = 'published' and published_at is not null
         and published_at <= now() and archived_at is null);
create policy blog_admin_read   on public.blog_posts for select to authenticated using (public.is_active_admin());
create policy blog_admin_insert on public.blog_posts for insert to authenticated with check (public.is_active_admin());
create policy blog_admin_update on public.blog_posts for update to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());
create policy blog_admin_delete on public.blog_posts for delete to authenticated using (public.is_active_admin());

-- slug history: public read (redirects); admin write
create policy slugs_public_read on public.blog_post_slugs for select to anon, authenticated using (true);
create policy slugs_admin_write on public.blog_post_slugs
  for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin());

-- post<->tag links: public read only when the post is publicly visible; admin write
create policy post_tags_public_read on public.blog_post_tags for select to anon, authenticated
  using (exists (select 1 from public.blog_posts p
                 where p.id = post_id and p.status = 'published'
                   and p.published_at <= now() and p.archived_at is null));
create policy post_tags_admin_read  on public.blog_post_tags for select to authenticated using (public.is_active_admin());
create policy post_tags_admin_write on public.blog_post_tags
  for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin());

-- ============================================================
--  Storage policies — bucket 'blog-images' (create it first,
--  Public bucket = ON). Path convention: blog/{yyyy}/{mm}/{uuid}.{ext}
-- ============================================================
create policy blog_img_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'blog-images');

create policy blog_img_admin_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'blog-images' and public.is_active_admin()
    and (storage.foldername(name))[1] = 'blog');

create policy blog_img_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-images' and public.is_active_admin())
  with check (bucket_id = 'blog-images' and public.is_active_admin()
              and (storage.foldername(name))[1] = 'blog');

create policy blog_img_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_active_admin());

-- ============================================================
--  After running this file:
--    1. Storage → create bucket "blog-images" (Public ON) BEFORE the storage
--       policies above will apply to anything (policies are fine to create
--       first; the bucket just needs to exist to upload).
--    2. Auth → disable public signups.
--    3. Auth → Users → add your admin (email + password, auto-confirm).
--    4. Grant admin:  insert into public.admin_users (user_id) values ('<uuid>');
-- ============================================================
