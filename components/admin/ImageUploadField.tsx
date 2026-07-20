"use client";

import { useRef, useState } from "react";

import { uploadImage } from "@/app/admin/posts/upload";

/**
 * Featured-image field: drag-and-drop OR click-to-select, upload progress,
 * preview, alt text, and remove. Uploads via the server action (validated
 * server-side). Only reports the resulting URL up; storage cleanup of a
 * replaced image is a documented Phase-4 maintenance task.
 */
export function ImageUploadField({
  url,
  alt,
  onChange,
  altError,
}: {
  url: string | null;
  alt: string;
  onChange: (next: { url: string | null; alt: string }) => void;
  altError?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [broken, setBroken] = useState(false);

  // Mirror the server-side limits (upload.ts) so bad files fail instantly,
  // before a multi-MB round trip.
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  const MAX_BYTES = 5 * 1024 * 1024;

  async function upload(file: File) {
    if (busy) return; // one upload at a time
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
    setBroken(false);
    onChange({ url: res.url, alt });
  }

  return (
    <div>
      {url ? (
        <div className="overflow-hidden rounded-[12px] border border-rebm-card-border">
          {broken ? (
            <div className="flex h-[140px] w-full flex-col items-center justify-center gap-[6px] bg-[#F8FAFB] text-center text-[13px] text-[rgb(120,130,140)]">
              <span>Image can’t be loaded (moved or deleted).</span>
              <button type="button" onClick={() => input.current?.click()} className="font-medium text-rebm-link underline">
                Upload a replacement
              </button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt || "Featured image preview"}
              onError={() => setBroken(true)}
              className="max-h-[220px] w-full object-cover"
            />
          )}
          <div className="flex items-center justify-between bg-white px-[12px] py-[8px]">
            <span className="truncate text-[12px] text-[rgb(120,130,140)]">{url.split("/").pop()}</span>
            <button
              type="button"
              onClick={() => onChange({ url: null, alt })}
              className="text-[13px] text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) upload(f);
          }}
          className={`flex w-full flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-[16px] py-[32px] text-center transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
            dragOver ? "border-rebm-blue bg-[#EEF5FC]" : "border-rebm-card-border bg-white hover:bg-[#F8FAFB]"
          }`}
        >
          <span className="text-[15px] font-medium text-rebm-navy">
            {busy ? "Uploading…" : "Drag an image here, or click to choose"}
          </span>
          <span className="mt-[4px] text-[12px] text-[rgb(140,148,156)]">JPEG, PNG or WebP · up to 5 MB</span>
        </button>
      )}

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

      {error && <p className="mt-[8px] text-[13px] text-red-600">{error}</p>}

      {url && (
        <label className="mt-[12px] flex flex-col gap-[6px]">
          <span className="text-[13px] font-medium text-rebm-navy">
            Featured image alt text <span className="text-[rgb(140,148,156)]">(required to publish)</span>
          </span>
          <input
            value={alt}
            onChange={(e) => onChange({ url, alt: e.target.value })}
            placeholder="Describe the image for screen readers"
            className={`rounded-[10px] border px-[14px] py-[10px] text-[15px] outline-none focus:border-rebm-blue ${
              altError ? "border-red-500" : "border-rebm-card-border"
            }`}
          />
          {altError && <span className="text-[13px] text-red-600">{altError}</span>}
        </label>
      )}
    </div>
  );
}
