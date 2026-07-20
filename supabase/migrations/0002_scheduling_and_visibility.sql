-- ============================================================
--  0002 — Iron-clad publishing visibility + scheduling
--  Run after 0001. Safe to re-run (drops/recreates policies,
--  indexes and the helper function idempotently).
-- ============================================================
--
--  WHY:
--  In 0001, a post was public only when `status = 'published'`. Scheduled
--  posts (`status = 'scheduled'`, future `published_at`) were flipped to
--  'published' ONLY at save time (normalizeStatus in the server action).
--  Nothing re-evaluated them once their time arrived, so a due scheduled
--  post stayed invisible forever.
--
--  FIX (time-based visibility): a post is public iff
--    * it is in a publish-intended status (published OR scheduled), AND
--    * it has a publish instant that has arrived (published_at <= now()), AND
--    * it is not archived (archived_at is null).
--  Visibility is therefore a pure function of the clock — no cron, trigger,
--  or background job is required for a scheduled post to go live exactly on
--  time. `status` distinguishes 'scheduled' vs 'published' only for the
--  admin UI; it no longer gates public visibility on its own.
--
--  All times are stored as `timestamptz` (UTC instants). `now()` is
--  evaluated by Postgres in UTC. The client always sends an offset-aware
--  ISO-8601 instant, so "9:30 AM on July 15, 2019" is pinned to one exact
--  moment regardless of the admin's or the server's local zone.
-- ============================================================

-- ---- public read: published OR due-scheduled, not archived ----
drop policy if exists blog_public_read on public.blog_posts;
create policy blog_public_read on public.blog_posts for select to anon, authenticated
  using (
    status in ('published','scheduled')
    and published_at is not null
    and published_at <= now()
    and archived_at is null
  );

-- ---- post<->tag public read mirrors the same visibility ----
drop policy if exists post_tags_public_read on public.blog_post_tags;
create policy post_tags_public_read on public.blog_post_tags for select to anon, authenticated
  using (
    exists (
      select 1 from public.blog_posts p
      where p.id = post_id
        and p.status in ('published','scheduled')
        and p.published_at is not null
        and p.published_at <= now()
        and p.archived_at is null
    )
  );

-- ---- partial indexes: widen to include scheduled ----
--  Predicate stays status-based (now() is not immutable and can't live in a
--  partial-index predicate); the published_at-desc ordering still serves the
--  runtime `published_at <= now()` range filter.
drop index if exists public.blog_posts_public_idx;
create index blog_posts_public_idx on public.blog_posts (published_at desc)
  where status in ('published','scheduled') and archived_at is null;

drop index if exists public.blog_posts_featured_idx;
create index blog_posts_featured_idx on public.blog_posts (published_at desc)
  where featured = true and status in ('published','scheduled') and archived_at is null;

-- ============================================================
--  OPTIONAL admin-label tidiness (NOT required for correctness).
--  Promotes due 'scheduled' rows to 'published' so the admin list shows
--  "Published" once a scheduled post has gone live. Public visibility is
--  already correct without this — it only keeps the status column tidy.
--
--  Schedule it with pg_cron (Supabase → Database → Extensions → enable
--  pg_cron), e.g. every 5 minutes:
--    select cron.schedule('promote-scheduled', '*/5 * * * *',
--                         $$select public.promote_due_scheduled()$$);
-- ============================================================
create or replace function public.promote_due_scheduled()
returns integer language sql security definer set search_path = public as $$
  with moved as (
    update public.blog_posts
       set status = 'published'
     where status = 'scheduled'
       and published_at is not null
       and published_at <= now()
       and archived_at is null
    returning 1
  )
  select count(*)::int from moved;
$$;
alter function public.promote_due_scheduled() owner to postgres;
revoke all on function public.promote_due_scheduled() from public, anon, authenticated;
