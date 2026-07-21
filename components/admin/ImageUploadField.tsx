"use client";

import { useEffect, useRef, useState } from "react";

import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { uploadImage } from "@/app/admin/posts/upload";
import { renderPdfFirstPage } from "@/lib/blog/pdfThumbnail";

/**
 * Featured-image field. Accepts JPG / JPEG / PNG / WebP / PDF. Every accepted
 * file is routed through a crop editor before anything is saved:
 *
 *   image → open crop modal directly
 *   PDF   → rasterize page 1 in the browser → feed that image to the crop modal,
 *           then DISCARD the PDF (it is only an import source; it is never
 *           uploaded or stored, and the site treats the result exactly like a
 *           normal uploaded image).
 *
 * Only after "Apply Crop" is the cropped 1564×942 image uploaded (as WebP) via
 * the server action. The public site is unaware any of this happened — it still
 * receives a plain image URL in featured_image_url.
 */

// Accepted INPUT types (what the admin may choose). The uploaded OUTPUT is
// always a cropped WebP, which the server action already allows.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PDF_TYPE = "application/pdf";
const IMAGE_MAX_BYTES = 15 * 1024 * 1024; // source image cap (output is far smaller)
const PDF_MAX_BYTES = 25 * 1024 * 1024; // PDFs (e.g. Market Pulse reports) can be large

type Phase = "idle" | "reading" | "cropping" | "uploading";

export function ImageUploadField({
  url,
  alt,
  onChange,
}: {
  url: string | null;
  // Carried through so existing posts keep any alt text they already have, even
  // though it is no longer edited here (the public site falls back to the post
  // title when it is absent).
  alt: string;
  onChange: (next: { url: string | null; alt: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [broken, setBroken] = useState(false);
  // Object URL of the source handed to the crop modal (image or rasterized PDF).
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const busy = phase !== "idle";

  // Always revoke the crop source object URL when it changes / on unmount.
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  async function pick(file: File) {
    if (busy) return; // one at a time
    setError(null);

    const isImage = IMAGE_TYPES.includes(file.type);
    const isPdf = file.type === PDF_TYPE || /\.pdf$/i.test(file.name);

    if (!isImage && !isPdf) {
      setError("Unsupported file type. Use JPG, PNG, WebP or PDF.");
      return;
    }
    if (isImage && file.size > IMAGE_MAX_BYTES) {
      setError("Image is larger than 15 MB. Please compress it first.");
      return;
    }
    if (isPdf && file.size > PDF_MAX_BYTES) {
      setError("PDF is larger than 25 MB. Please use a smaller file.");
      return;
    }

    if (isPdf) {
      setPhase("reading");
      try {
        const page = await renderPdfFirstPage(file);
        openCropper(page.url);
      } catch (e) {
        setPhase("idle");
        setError(e instanceof Error ? e.message : "Couldn’t read that PDF.");
      }
      return;
    }

    // Regular image → straight into the cropper.
    openCropper(URL.createObjectURL(file));
  }

  function openCropper(nextSrc: string) {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextSrc;
    });
    setPhase("cropping");
  }

  function closeCropper() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhase("idle");
  }

  async function handleCropped(blob: Blob) {
    // Move from the modal into the uploading state (revokes the source URL).
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhase("uploading");
    setError(null);

    const file = new File([blob], `featured-${crypto.randomUUID()}.webp`, { type: "image/webp" });
    const form = new FormData();
    form.set("file", file);
    const res = await uploadImage(form);
    setPhase("idle");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBroken(false);
    onChange({ url: res.url, alt });
  }

  const phaseLabel =
    phase === "reading" ? "Reading PDF…" : phase === "uploading" ? "Uploading…" : "Drag an image or PDF here, or click to choose";

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
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="text-[13px] font-medium text-rebm-link hover:underline disabled:opacity-50"
            >
              {busy ? phaseLabel : "Replace image"}
            </button>
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
            if (f) pick(f);
          }}
          className={`flex w-full flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-[16px] py-[32px] text-center transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
            dragOver ? "border-rebm-blue bg-[#EEF5FC]" : "border-rebm-card-border bg-white hover:bg-[#F8FAFB]"
          }`}
        >
          <span className="text-[15px] font-medium text-rebm-navy">{phaseLabel}</span>
          <span className="mt-[4px] text-[12px] text-[rgb(140,148,156)]">JPG, PNG, WebP or PDF</span>
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-[8px] text-[13px] text-red-600">{error}</p>}

      {phase === "cropping" && cropSrc && (
        <ImageCropModal src={cropSrc} onCancel={closeCropper} onApply={handleCropped} />
      )}
    </div>
  );
}
