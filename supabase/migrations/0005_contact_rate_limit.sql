-- ============================================================
--  Distributed rate limiting for the PUBLIC contact/newsletter forms.
--  Run once in the Supabase SQL editor (or via the Supabase CLI), like the
--  other migrations. Until this is applied, the app transparently falls back to
--  its per-instance in-memory limiter (the RPC call fails → fail-open to the
--  in-memory check), so nothing breaks pre-migration.
-- ============================================================

-- Ledger of recent submissions, keyed by a HASH of the client IP (never the raw
-- IP — privacy). Only the SECURITY DEFINER function below ever touches it.
create table if not exists public.contact_rate_hits (
  ip_hash text        not null,
  hit_at  timestamptz not null default now()
);
create index if not exists contact_rate_hits_idx
  on public.contact_rate_hits (ip_hash, hit_at desc);

alter table public.contact_rate_hits enable row level security;
-- Intentionally NO policies: with RLS on and no policy, anon/authenticated have
-- zero direct access. All access is through contact_rate_check() (definer).

-- Atomically record a hit and report whether the caller is now OVER the limit
-- within the window. SECURITY DEFINER so it can write despite RLS; fixed
-- search_path blocks hijacking. Opportunistically prunes rows older than a day
-- so the table stays small even under a spoofed-key flood.
create or replace function public.contact_rate_check(
  p_ip_hash        text,
  p_max            integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  cnt    integer;
begin
  delete from public.contact_rate_hits where hit_at < now() - interval '1 day';
  insert into public.contact_rate_hits (ip_hash) values (p_ip_hash);
  select count(*) into cnt
    from public.contact_rate_hits
   where ip_hash = p_ip_hash and hit_at >= cutoff;
  return cnt > greatest(p_max, 0);
end;
$$;

alter function public.contact_rate_check(text, integer, integer) owner to postgres;
revoke all on function public.contact_rate_check(text, integer, integer) from public;
grant execute on function public.contact_rate_check(text, integer, integer) to anon, authenticated;
