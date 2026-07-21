// The pdfjs-dist "legacy" build is used at runtime for Safari / older-engine
// compatibility (see lib/blog/pdfThumbnail.ts — the modern build calls
// Map.prototype.getOrInsertComputed, which Safari lacks). That subpath ships no
// type declarations of its own, so map it to pdfjs-dist's real types to keep the
// import fully typed.
declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export * from "pdfjs-dist";
}
