import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  isPathwayHandoffToken,
  pathwaySaveOAuthCallbackPath,
  pathwaySaveReturnPath,
} from "@/lib/i-want-to-become/pathway-handoff";
import {
  bindPathwayHandoffToEmail,
  pathwayHandoffOAuthCookieName,
  pathwayHandoffOAuthCookiePath,
} from "@/lib/i-want-to-become/pathway-handoff-server";

import { createClient } from "@/lib/supabase/server";
import { getSafeAuthCallbackPath } from "@/lib/validation";
import { resolveUserHome } from "@/lib/auth/queries";

function redirectWithoutReferrer(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = getSafeAuthCallbackPath(requestUrl.searchParams.get("next"));
  const cookieStore = await cookies();
  const oauthHandoffToken = cookieStore.get(pathwayHandoffOAuthCookieName)?.value;
  const clearOAuthHandoffCookie = () => cookieStore.set(pathwayHandoffOAuthCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: pathwayHandoffOAuthCookiePath,
    maxAge: 0,
  });

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      let next = requestedNext || await resolveUserHome(supabase, data.user.id);
      if (oauthHandoffToken) {
        clearOAuthHandoffCookie();
        const hasMatchingOAuthReturn = requestedNext === pathwaySaveOAuthCallbackPath;
        if (hasMatchingOAuthReturn && isPathwayHandoffToken(oauthHandoffToken)) {
          const binding = await bindPathwayHandoffToEmail(supabase, oauthHandoffToken, data.user.email);
          if (binding.bound) {
            next = pathwaySaveReturnPath(oauthHandoffToken);
          } else {
            const errorUrl = new URL("/auth/error", requestUrl.origin);
            errorUrl.searchParams.set("next", pathwaySaveReturnPath(oauthHandoffToken));
            return redirectWithoutReferrer(errorUrl);
          }
        }
      }
      return redirectWithoutReferrer(new URL(next, requestUrl.origin));
    }
  }

  const errorUrl = new URL("/auth/error", requestUrl.origin);
  if (oauthHandoffToken && requestedNext === pathwaySaveOAuthCallbackPath && isPathwayHandoffToken(oauthHandoffToken)) {
    errorUrl.searchParams.set("next", pathwaySaveReturnPath(oauthHandoffToken));
  } else if (requestedNext.startsWith("/update-password")) {
    errorUrl.searchParams.set("reason", "recovery");
    const recoveryNext = new URL(requestedNext, requestUrl.origin).searchParams.get("next");
    if (recoveryNext) errorUrl.searchParams.set("next", recoveryNext);
  } else if (requestedNext) {
    errorUrl.searchParams.set("next", requestedNext);
  }
  clearOAuthHandoffCookie();
  return redirectWithoutReferrer(errorUrl);
}
