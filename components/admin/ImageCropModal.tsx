"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BLOG_COVER_H, BLOG_COVER_RATIO, BLOG_COVER_W } from "@/lib/blog/cardView";

/**
 * Featured-image crop editor. A "cover-fit" cropper: the crop box is locked to
 * the site's featured-cover aspect (1564×942); the source image pans and zooms
 * *behind* a fixed window, and the window itself is the live WYSIWYG preview —
 * what you see inside the frame is exactly what gets saved.
 *
 * Interactions: drag to reposition (pointer events → mouse + touch), zoom via
 * the slider or the mouse wheel (zooms around the frame centre), Reset restores
 * the centred fit, Apply Crop renders the framed region to a 1564×942 WebP and
 * hands the Blob back. Nothing uploads until Apply.
 *
 * Modal a11y follows the admin ConfirmDialog convention: portal to body,
 * role="dialog" + aria-modal, Escape cancels, focus moves in on open and is
 * restored on close, Tab is trapped inside the panel, background scroll locked.
 */

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Offset = { x: number; y: number };

function clampOffset(off: Offset, cropW: number, cropH: number, imgW: number, imgH: number): Offset {
  // Image must always cover the crop box → top-left offset ∈ [cropSize - imgSize, 0].
  const minX = Math.min(0, cropW - imgW);
  const minY = Math.min(0, cropH - imgH);
  return {
    x: Math.min(0, Math.max(minX, off.x)),
    y: Math.min(0, Math.max(minY, off.y)),
  };
}

export function ImageCropModal({
  src,
  onCancel,
  onApply,
}: {
  /** Object URL of the source image (a real image, or a rasterized PDF page). */
  src: string;
  onCancel: () => void;
  /** Receives the cropped 1564×942 image as a Blob (WebP, PNG fallback). */
  onApply: (blob: Blob) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [cropSize, setCropSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffsetState] = useState<Offset>({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Mirrors of the values the imperative callbacks (onLoad, ResizeObserver,
  // drag, wheel) need to read without going stale — updated alongside state so
  // no state-syncing effect is required.
  const naturalRef = useRef<{ w: number; h: number } | null>(null);
  const cropRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });

  const setOffset = useCallback((next: Offset) => {
    offsetRef.current = next;
    setOffsetState(next);
  }, []);

  // Derived scale: baseCover makes the image exactly cover the frame at zoom 1.
  const baseCover = natural && cropSize.w ? Math.max(cropSize.w / natural.w, cropSize.h / natural.h) : 0;
  const displayScale = baseCover * zoom;
  const imgW = natural ? natural.w * displayScale : 0;
  const imgH = natural ? natural.h * displayScale : 0;

  const ready = Boolean(natural && cropSize.w && !loadError);

  const centre = useCallback((z: number, nat: { w: number; h: number }, crop: { w: number; h: number }): Offset => {
    const scale = Math.max(crop.w / nat.w, crop.h / nat.h) * z;
    return { x: (crop.w - nat.w * scale) / 2, y: (crop.h - nat.h * scale) / 2 };
  }, []);

  // ── measure the frame (responsive) ─────────────────────────────────────────
  // setState here lives in the ResizeObserver callback / a helper, not directly
  // in the effect body, and re-anchors the crop on a genuine size change.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      const nextCrop = { w, h: w / BLOG_COVER_RATIO };
      const prevCrop = cropRef.current;
      const nat = naturalRef.current;
      cropRef.current = nextCrop;
      setCropSize(nextCrop);
      if (!nat) return; // image not loaded yet → placement happens in onLoad
      if (!prevCrop.w) {
        setOffset(centre(zoomRef.current, nat, nextCrop));
        return;
      }
      // Keep the image point under the old frame centre fixed across the resize.
      const oldScale = Math.max(prevCrop.w / nat.w, prevCrop.h / nat.h) * zoomRef.current;
      const newScale = Math.max(nextCrop.w / nat.w, nextCrop.h / nat.h) * zoomRef.current;
      const px = (prevCrop.w / 2 - offsetRef.current.x) / oldScale;
      const py = (prevCrop.h / 2 - offsetRef.current.y) / oldScale;
      const next = { x: nextCrop.w / 2 - px * newScale, y: nextCrop.h / 2 - py * newScale };
      setOffset(clampOffset(next, nextCrop.w, nextCrop.h, nat.w * newScale, nat.h * newScale));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [centre, setOffset]);

  // ── zoom around the frame centre ────────────────────────────────────────────
  const applyZoom = useCallback(
    (nextZoomRaw: number) => {
      if (!natural || !cropSize.w) return;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
      const prev = offsetRef.current;
      const oldScale = baseCover * zoom;
      const newScale = baseCover * nextZoom;
      const cx = cropSize.w / 2;
      const cy = cropSize.h / 2;
      // Keep the image point currently under the frame centre fixed.
      const next = {
        x: cx - ((cx - prev.x) / oldScale) * newScale,
        y: cy - ((cy - prev.y) / oldScale) * newScale,
      };
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      setOffset(clampOffset(next, cropSize.w, cropSize.h, natural.w * newScale, natural.h * newScale));
    },
    [natural, cropSize, baseCover, zoom, setOffset],
  );

  // ── drag to reposition ──────────────────────────────────────────────────────
  const drag = useRef<{ id: number; startX: number; startY: number; base: Offset } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, base: offset };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !natural) return;
    const next = { x: d.base.x + (e.clientX - d.startX), y: d.base.y + (e.clientY - d.startY) };
    setOffset(clampOffset(next, cropSize.w, cropSize.h, imgW, imgH));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  // Wheel zoom (native, non-passive so we can preventDefault the page scroll).
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!ready) return;
      e.preventDefault();
      applyZoom(zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom, zoom, ready]);

  const reset = () => {
    if (!natural || !cropSize.w) return;
    zoomRef.current = MIN_ZOOM;
    setZoom(MIN_ZOOM);
    setOffset(centre(MIN_ZOOM, natural, cropSize));
  };

  // ── produce the cropped Blob ────────────────────────────────────────────────
  async function apply() {
    const img = imgRef.current;
    if (!img || !natural || !cropSize.w || applying) return;
    setApplying(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = BLOG_COVER_W;
      canvas.height = BLOG_COVER_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.imageSmoothingQuality = "high";

      // Frame (0..cropW, 0..cropH) → source pixels via the current transform.
      const sx = Math.max(0, -offset.x / displayScale);
      const sy = Math.max(0, -offset.y / displayScale);
      const sw = Math.min(natural.w - sx, cropSize.w / displayScale);
      const sh = Math.min(natural.h - sy, cropSize.h / displayScale);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, BLOG_COVER_W, BLOG_COVER_H);

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.92));
      const finalBlob =
        blob ?? (await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png")));
      if (finalBlob) onApply(finalBlob);
    } finally {
      setApplying(false);
    }
  }

  // ── modal chrome: focus, Escape, scroll lock, focus trap ────────────────────
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-[16px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Crop featured image"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-rebm-card-border px-[20px] py-[14px]">
          <h2 className="text-[16px] font-semibold text-rebm-navy">Crop featured image</h2>
          <span className="text-[12px] text-[rgb(140,148,156)]">Fills a {BLOG_COVER_W}×{BLOG_COVER_H} cover</span>
        </div>

        <div className="flex flex-col gap-[14px] overflow-y-auto p-[20px]">
          {/* The crop frame IS the live preview. */}
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{ aspectRatio: `${BLOG_COVER_W} / ${BLOG_COVER_H}` }}
            className={`relative w-full touch-none overflow-hidden rounded-[12px] border border-rebm-card-border bg-[#0f1720] select-none ${
              ready ? "cursor-grab active:cursor-grabbing" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                const nat = { w: el.naturalWidth, h: el.naturalHeight };
                setLoadError(false);
                naturalRef.current = nat;
                setNatural(nat);
                // Centre immediately using the already-measured frame size.
                const crop = cropRef.current;
                if (crop.w) setOffset(centre(zoomRef.current, nat, crop));
              }}
              onError={() => setLoadError(true)}
              style={
                ready
                  ? { position: "absolute", left: offset.x, top: offset.y, width: imgW, height: imgH, maxWidth: "none" }
                  : { display: "none" }
              }
            />
            {!ready && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center text-[13px] text-white/70">
                Loading image…
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center px-[16px] text-center text-[13px] text-white/80">
                This image couldn’t be loaded.
              </div>
            )}
            {/* Rule-of-thirds guides (non-interactive). */}
            {ready && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/25" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/25" />
                <div className="absolute top-1/3 right-0 left-0 h-px bg-white/25" />
                <div className="absolute top-2/3 right-0 left-0 h-px bg-white/25" />
              </div>
            )}
          </div>

          {/* Zoom control */}
          <label className="flex items-center gap-[12px] text-[13px] text-rebm-navy">
            <span className="w-[38px] shrink-0 font-medium">Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={!ready}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="h-[4px] w-full cursor-pointer accent-rebm-blue disabled:cursor-not-allowed"
              aria-label="Zoom"
            />
          </label>
          <p className="text-[12px] text-[rgb(140,148,156)]">Drag to reposition · scroll or use the slider to zoom.</p>
        </div>

        <div className="flex items-center justify-between gap-[10px] border-t border-rebm-card-border px-[20px] py-[14px]">
          <button
            type="button"
            onClick={reset}
            disabled={!ready}
            className="rounded-full border border-rebm-card-border px-[16px] py-[8px] text-[14px] font-medium text-rebm-navy hover:bg-[#F0F2F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-rebm-card-border px-[18px] py-[8px] text-[14px] font-medium text-rebm-navy hover:bg-[#F0F2F4]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!ready || applying}
              className="rounded-full bg-rebm-navy px-[20px] py-[8px] text-[14px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applying ? "Applying…" : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
