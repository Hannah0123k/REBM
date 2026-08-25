/**
 * Pure helpers for the Monday client — no network, no env side effects, and
 * deliberately NOT marked "server-only" so the unit tests can import them under
 * the bare Node test runner (Next aliases `server-only` at build time; it is not
 * a real installed package, so importing it outside Next fails to resolve).
 *
 * The token never passes through this file. Everything that touches it lives in
 * lib/monday/client.ts, which keeps the "server-only" guard.
 */

/**
 * Resolve Monday config from server env, reporting which vars are still unset.
 * Takes an env map so tests never touch the real process.env or need a token.
 */
export function resolveConfig(env: Record<string, string | undefined> = process.env): {
  token?: string;
  boardId?: string;
  missing: string[];
} {
  const token = (env.MONDAY_API_TOKEN ?? "").trim() || undefined;
  const boardId = (env.MONDAY_CONTACTS_BOARD_ID ?? "").trim() || undefined;
  const missing: string[] = [];
  if (!token) missing.push("MONDAY_API_TOKEN");
  if (!boardId) missing.push("MONDAY_CONTACTS_BOARD_ID");
  return { token, boardId, missing };
}

/**
 * Monday answers 200 OK even for a rejected mutation, putting the failure in an
 * `errors` array (or `error_message`). Treating 200 as success would silently
 * drop records, so pull a diagnostic out of the body.
 */
export function readGraphQLError(body: unknown): string | null {
  if (!body || typeof body !== "object") return "malformed response";
  const b = body as {
    errors?: { message?: string }[];
    error_message?: string;
    data?: { create_item?: { id?: string } | null } | null;
  };
  if (Array.isArray(b.errors) && b.errors.length) {
    return b.errors.map((e) => e?.message ?? "unknown").join("; ").slice(0, 300);
  }
  if (typeof b.error_message === "string" && b.error_message) {
    return b.error_message.slice(0, 300);
  }
  if (!b.data?.create_item?.id) return "no item id returned";
  return null;
}
