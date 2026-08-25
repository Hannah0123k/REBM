import "server-only";

/**
 * Monday.com item creation via the GraphQL HTTP API (called with fetch, so no
 * SDK dependency). Runs SERVER-SIDE ONLY — `import "server-only"` makes a client
 * import a build error, so the API token can never reach the browser bundle.
 *
 * Required env vars (documented in .env.example):
 *   MONDAY_API_TOKEN          — Monday personal API token (server-only, NEVER NEXT_PUBLIC_)
 *   MONDAY_CONTACTS_BOARD_ID  — numeric id of the "Prospects" board
 *
 * The token is read from process.env at call time, is never logged, never
 * interpolated into a message, and never returned to the caller. Diagnostics
 * carry only HTTP status codes and Monday's own error text.
 *
 * FUTURE-READY, HONEST: if the env vars aren't set we do NOT pretend a record
 * was created — `createMondayItem` returns { created:false, reason:"unconfigured" }
 * and the caller logs which vars are missing. This mirrors how
 * lib/newsletter/subscribe.ts and lib/contact/email.ts already behave.
 */

import { readGraphQLError as readError, resolveConfig } from "@/lib/monday/config";

const MONDAY_API_URL = "https://api.monday.com/v2";

/** Pinned so a future breaking API version can't silently change behaviour. */
const MONDAY_API_VERSION = "2024-10";

/** Cap on the Monday round-trip. Monday is always a SECONDARY write (the email
 *  or the subscription has already succeeded), so a slow Monday must never hold
 *  a visitor's submit button — on timeout we report provider_error and the
 *  caller carries on. */
const MONDAY_TIMEOUT_MS = 6_000;

export { readGraphQLError, resolveConfig } from "@/lib/monday/config";

export type CreateItemResult =
  | { created: true; id: string }
  | { created: false; reason: "unconfigured"; missing: string[] }
  | { created: false; reason: "provider_error"; detail: string };

/** A Monday column value, keyed by column ID. Shapes are per-column-type — see
 *  lib/monday/prospects.ts, which owns every shape this project sends. */
export type ColumnValues = Record<string, unknown>;

const CREATE_ITEM = `
  mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
    create_item(
      board_id: $boardId
      group_id: $groupId
      item_name: $itemName
      column_values: $columnValues
    ) { id }
  }
`;

/**
 * Create one item on the configured board.
 *
 * Values travel as GraphQL VARIABLES, never string-interpolated into the query,
 * so visitor-supplied text cannot alter the mutation.
 */
export async function createMondayItem(input: {
  groupId: string;
  itemName: string;
  columnValues: ColumnValues;
}): Promise<CreateItemResult> {
  const { token, boardId, missing } = resolveConfig();
  if (!token || !boardId) return { created: false, reason: "unconfigured", missing };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MONDAY_TIMEOUT_MS);
  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "API-Version": MONDAY_API_VERSION,
      },
      body: JSON.stringify({
        query: CREATE_ITEM,
        variables: {
          boardId,
          groupId: input.groupId,
          itemName: input.itemName,
          // Monday wants the column map as a JSON *string*.
          columnValues: JSON.stringify(input.columnValues),
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // Status only — the response body of an auth failure can echo request
      // headers, so it is deliberately not read or logged here.
      return { created: false, reason: "provider_error", detail: `HTTP ${res.status}` };
    }

    const json = (await res.json().catch(() => null)) as unknown;
    const err = readError(json);
    if (err) return { created: false, reason: "provider_error", detail: err };

    const id = String((json as { data: { create_item: { id: string } } }).data.create_item.id);
    return { created: true, id };
  } catch (e) {
    const detail =
      e instanceof Error && e.name === "AbortError"
        ? `timed out after ${MONDAY_TIMEOUT_MS}ms`
        : e instanceof Error
          ? e.message
          : "network error";
    return { created: false, reason: "provider_error", detail };
  } finally {
    clearTimeout(timer);
  }
}
