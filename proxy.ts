import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Next 16 Proxy (formerly middleware). Runs on the Node.js runtime by default.
 * Refreshes the Supabase session and gates /admin routes — see updateSession.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except Next internals and static image assets, so the
  // session cookie stays fresh across the whole site (Supabase's recommended
  // matcher). The gate logic itself only acts on /admin.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
