-- ============================================================
--  Storage hardening — bucket 'blog-images'. Run once in the Supabase SQL
--  editor / CLI, like the other migrations.
--
--  Parity fix: the INSERT policy already restricts writes to the `blog/` prefix,
--  but UPDATE/DELETE did not — an admin could modify/remove ANY object in the
--  bucket, not only under blog/. This adds the same prefix check to UPDATE and
--  DELETE (defense-in-depth; scopes admin writes to the app's own path space).
--
--  Read serving is intentionally UNCHANGED — the public blog depends on the
--  bucket's public object URLs, so this migration does not touch reads.
-- ============================================================

drop policy if exists blog_img_admin_update on storage.objects;
create policy blog_img_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-images' and public.is_active_admin()
         and (storage.foldername(name))[1] = 'blog')
  with check (bucket_id = 'blog-images' and public.is_active_admin()
              and (storage.foldername(name))[1] = 'blog');

drop policy if exists blog_img_admin_delete on storage.objects;
create policy blog_img_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_active_admin()
         and (storage.foldername(name))[1] = 'blog');
