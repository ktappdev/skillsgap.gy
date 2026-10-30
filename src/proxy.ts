import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Refreshes the Supabase session cookie on navigation. Server Components cannot persist a rotated
// token, so this is the one place a refresh reaches the browser before the page renders.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
