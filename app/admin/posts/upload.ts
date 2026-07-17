"use server";

import { randomUUID } from "node:crypto";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "blog-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

/**
 * Upload a blog image. Server Action — the file is validated on the server and
 * written by the authenticated admin (storage RLS enforces admin + the blog/
 * path prefix). The service-role key is never involved. Object path is fully
 * server-generated as blog/{yyyy}/{mm}/{uuid}.{ext}; the client cannot choose it.
 * Every upload is recorded in media_assets (future Media Library).
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const user = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };

  const ext = ALLOWED[file.type];
  if (!ext) return { ok: false, error: "Only JPEG, PNG or WebP images are allowed." };
  if (file.size === 0) return { ok: false, error: "The file is empty." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be 5 MB or smaller." };

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const path = `blog/${yyyy}/${mm}/${randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Record in the media registry (best-effort — failure here doesn't fail the
  // upload, the image is already stored and usable).
  await supabase.from("media_assets").insert({
    storage_path: path,
    public_url: publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: user.id,
  });

  return { ok: true, url: publicUrl, path };
}
