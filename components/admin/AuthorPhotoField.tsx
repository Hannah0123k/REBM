"use client";

import { useRef, useState } from "react";

import { uploadImage } from "@/app/admin/posts/upload";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";

/**
 * Author photo picker: circular preview (photo or initials), upload/replace and
 * remove. Uploads through the same server-validated action + `blog-images`
 * bucket as other images — the browser never sees service-role credentials.
 * Alt text is derived from the author name on the public pages, so none is
 * collected here.
 */
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function AuthorPhotoField({
  url,
  authorName,
  onChange,
}: {
  url: string | null;
  authorName: string;
  onChange: (url: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (busy) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Unsupported file type. Use JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is larger than 5 MB. Please compress it first.");
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    const res = await uploadImage(form);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onChange(res.url);
  }

  return (
    <div className="flex items-center gap-[14px]">
      <AuthorAvatar name={authorName || "Author"} src={url} size={56} />
      <div className="flex min-w-0 flex-col gap-[6px]">
        <div className="flex flex-wrap gap-[8px]">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="rounded-full border border-rebm-card-border px-[14px] py-[7px] text-[13px] font-medium text-rebm-navy hover:bg-[#F0F2F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Uploading…" : url ? "Replace" : "Upload photo"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full px-[12px] py-[7px] text-[13px] font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
        {error ? (
          <span className="text-[12px] text-red-600">{error}</span>
        ) : (
          <span className="text-[12px] text-[rgb(150,158,166)]">JPEG, PNG or WebP · up to 5 MB</span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
