-- ============================================================
--  0003 — Author photo
--  Adds an optional author image URL to blog_posts. Additive and safe:
--  a nullable column with no default, so existing rows and data are
--  untouched. Re-runnable (IF NOT EXISTS). The image itself lives in the
--  existing `blog-images` Storage bucket; alt text uses the author's name.
-- ============================================================

alter table public.blog_posts
  add column if not exists author_image_url text;
