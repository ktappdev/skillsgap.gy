import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { AppHeaderSkeleton } from "@/components/app/app-header-skeleton";
import { AppNavigation } from "@/components/app/app-navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAccountNavigation } from "@/lib/auth/account-space";
import { signOut } from "@/lib/auth/actions";
import { resolveUserHome } from "@/lib/auth/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * This layout is deliberately synchronous. Its only runtime read — the session
 * and account home behind `getAppShell()` — lives in `<AppHeader />` below, so
 * the shell streams immediately and each segment's `loading.tsx` can paint on a
 * cold load. An `async` layout here would block until the session resolved and
 * suppress every `(app)` fallback (Next's `layout.md`, "Layouts and loading.js").
 *
 * There is no auth redirect in this boundary on purpose: a redirect here would
 * fire before the page's guard, discarding the destination it carries. The
 * per-page guards in `src/lib/auth/queries.ts` remain the runtime authority, and
 * `src/lib/auth/app-page-guards.test.ts` keeps a new page from shipping without
 * one.
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AppHeader />
      </Suspense>
      <main id="main-content">{children}</main>
    </div>
  );
}

async function AppHeader() {
  const { home, navigation } = await getAppShell();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={home} className="inline-flex min-h-11 items-center" aria-label="SkillsGap.gy home">
          <Image
            src="/skillsgap-logo.webp"
            alt="SkillsGap.gy"
            width={1200}
            height={728}
            priority
            className="h-10 w-auto object-contain sm:h-11"
          />
        </Link>
        <AppNavigation items={navigation} />
        <form action={signOut}>
          <SubmitButton
            pendingLabel="Signing out…"
            className="min-h-11 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
          >
            Sign out
          </SubmitButton>
        </form>
      </div>
      <div className="border-t border-border md:hidden">
        <AppNavigation items={navigation} mobile />
      </div>
    </header>
  );
}

async function getAppShell() {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    if (process.env.NODE_ENV !== "production") console.warn("[pdbg] (app)/layout.tsx: no session for app shell, rendering anonymous header");
    return { home: "/login", navigation: [] as const };
  }

  const home = await resolveUserHome(supabase, userResult.user.id);
  const space = home === "/admin" ? "admin" : home === "/company" ? "company" : home === "/provider" ? "provider" : home === "/company/request-access" ? "company-pending" : "applicant";
  return { home, navigation: getAccountNavigation(space) };
}
