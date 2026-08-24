import type { TiptapDoc } from "@/lib/blog/types";

/**
 * Rebuild a TipTap doc as ordinary JSON objects before it crosses into React
 * state and, from there, into a Server Action.
 *
 * ProseMirror builds node attrs with `Object.create(null)` (prosemirror-model's
 * `computeAttrs`), and `Node.toJSON()` assigns that live object straight onto
 * its output rather than copying it — so `editor.getJSON()` returns a doc whose
 * every `attrs` has a NULL PROTOTYPE.
 *
 * React's Server Action serializer accepts only plain objects. It replaces each
 * null-prototype one with a temporary client reference, and the action throws
 * the instant it reads a property off it:
 *
 *   Cannot access level on the server. You cannot dot into a temporary client
 *   reference from a server component.
 *
 * `level` is the heading attr that sanitizeDoc's cleanNode() reads first. Every
 * post has a heading, so every save of an edited body failed this way — the
 * original "Save does nothing" report. Round-tripping through JSON gives each
 * attrs object Object.prototype again and drops anything non-serializable,
 * which is the shape the action needs.
 */
export function toPlainDoc(doc: TiptapDoc): TiptapDoc {
  return JSON.parse(JSON.stringify(doc)) as TiptapDoc;
}
