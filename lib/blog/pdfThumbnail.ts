/**
 * Render the FIRST PAGE of a PDF to a raster image, entirely in the browser.
 * =========================================================================
 * The PDF is only an *import source* for a featured image: we rasterize page 1,
 * hand the pixels to the crop editor, and then throw the PDF away. Nothing here
 * ever uploads or stores the PDF.
 *
 * pdfjs is a heavy dependency (~1 MB incl. worker), so it is **dynamically
 * imported** the first time a PDF is actually chosen — it never ships in the
 * bundle for admins who only upload JP/PNG, and never anywhere on the public
 * site. The worker is resolved from the installed package via `new URL(…,
 * import.meta.url)`, so it is bundled locally (no CDN, works offline).
 *
 * Client-only: touches `document`/`canvas`. Do not import from a Server
 * Component or a "use server" module.
 */

/** Longest edge (px) of the rasterized page. 1600 comfortably exceeds the 1564
 *  target cover width, so the crop editor always has full-resolution pixels to
 *  work from regardless of page orientation. */
const MAX_EDGE = 1600;

export type RenderedPdfPage = {
  /** A `blob:` object URL for an `<img>` — remember to revokeObjectURL it. */
  url: string;
  width: number;
  height: number;
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/** Load pdfjs + wire its worker exactly once. */
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // LEGACY build (not the default modern one): it is transpiled and ships
      // the polyfills pdfjs needs on engines that lack the very newest JS — e.g.
      // Safari has no `Map.prototype.getOrInsertComputed`, which the modern build
      // calls unguarded and throws. The library and its worker MUST come from the
      // same (legacy) build or the worker crashes the same way.
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Bundled worker URL (Turbopack/webpack rewrites this to a local asset).
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/**
 * Rasterize page 1 of `file` to a PNG blob URL. Rejects with a human-readable
 * message when the file isn't a readable PDF (encrypted, corrupt, empty).
 */
export async function renderPdfFirstPage(file: File): Promise<RenderedPdfPage> {
  const pdfjs = await loadPdfjs();

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  let doc;
  try {
    doc = await loadingTask.promise;
  } catch {
    await loadingTask.destroy();
    throw new Error("This PDF couldn’t be read. It may be corrupted or password-protected.");
  }

  try {
    if (doc.numPages < 1) throw new Error("This PDF has no pages.");
    const page = await doc.getPage(1);

    // Scale so the longest edge lands at MAX_EDGE (never upscale past ~2×).
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_EDGE / Math.max(base.width, base.height), 2);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn’t create a canvas to render the PDF.");

    // White backdrop so transparent PDFs don't render onto black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Couldn’t convert the PDF page to an image.");

    return { url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
  } finally {
    // Free pdfjs' worker-side resources for this document.
    await loadingTask.destroy();
  }
}
