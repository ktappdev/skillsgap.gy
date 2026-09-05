import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { getAccountNavigation } from "@/lib/auth/account-space";
import { signOut } from "@/lib/auth/actions";
import { resolveUserHome } from "@/lib/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { home, navigation } = await getAppShell();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={home} className="flex items-center gap-3 font-semibold tracking-tight text-foreground">
            <span className="grid size-9 place-items-center bg-accent text-xs font-black text-white">SG</span>
            <span className="hidden sm:inline">skillsgap<span className="text-accent">.gy</span></span>
            <span className="sm:hidden">SkillsGap</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-muted md:flex" aria-label="Main navigation">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="hover:text-accent">{item.label}</Link>)}
          </nav>
          <form action={signOut}>
            <SubmitButton
              pendingLabel="Signing out…"
              className="min-h-10 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
        <div className="border-t border-border md:hidden">
          <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-3 text-sm font-semibold text-muted sm:px-6" aria-label="Mobile navigation">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-accent">{item.label}</Link>)}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

async function getAppShell() {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return { home: "/login", navigation: [] };

  const home = await resolveUserHome(supabase, userResult.user.id);
  const space = home === "/admin" ? "admin" : home === "/company" ? "company" : home === "/company/request-access" ? "company-pending" : "applicant";
  return { home, navigation: getAccountNavigation(space) };
}
