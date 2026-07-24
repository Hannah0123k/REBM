/**
 * Serialize a JSON-LD object for safe embedding inside an inline
 * `<script type="application/ld+json">` via dangerouslySetInnerHTML.
 *
 * `JSON.stringify` escapes `"` and `\` but NOT `<`, `>` or `&` — so a value like
 * `</script><img onerror=...>` would break out of the inline script tag and
 * execute (stored XSS). Escaping those to their `\uXXXX` form keeps the payload
 * a plain JSON string literal that's inert to the HTML parser, while staying
 * valid JSON-LD.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
