import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSafeAuthCallbackPath } from "@/lib/validation";
import { resolveUserHome } from "@/lib/auth/queries";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = getSafeAuthCallbackPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const next = requestedNext || await resolveUserHome(supabase, data.user.id);
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const errorUrl = new URL("/auth/error", requestUrl.origin);
  if (requestedNext.startsWith("/update-password")) {
    errorUrl.searchParams.set("reason", "recovery");
    const recoveryNext = new URL(requestedNext, requestUrl.origin).searchParams.get("next");
    if (recoveryNext) errorUrl.searchParams.set("next", recoveryNext);
  } else if (requestedNext) {
    errorUrl.searchParams.set("next", requestedNext);
  }
  return NextResponse.redirect(errorUrl);
}
