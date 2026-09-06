import Image from "next/image";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { getAccountNavigation } from "@/lib/auth/account-space";
import { signOut } from "@/lib/auth/actions";
import { resolveUserHome } from "@/lib/auth/queries";
import { createClient } from "@/lib/supabase/server";

const desktopLink = "inline-flex min-h-11 items-center hover:text-accent";
const desktopActiveLink = "inline-flex min-h-11 items-center text-accent";
const mobileLink = "inline-flex min-h-11 items-center whitespace-nowrap hover:text-accent";
const mobileActiveLink = "inline-flex min-h-11 items-center whitespace-nowrap text-accent";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { home, navigation, activeHref } = await getAppShell();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={home} className="inline-flex min-h-11 items-center" aria-label="SkillsGap.gy home">
            <Image
              src="/skillsgap-logo.webp"
              alt="SkillsGap.gy"
              width={1200}
              height={728}
              priority
              className="h-7 w-auto object-contain sm:h-8"
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === activeHref ? desktopActiveLink : desktopLink}
                aria-current={item.href === activeHref ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <SubmitButton
              pendingLabel="Signing out…"
              className="min-h-11 border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
        <div className="border-t border-border md:hidden">
          <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-1 text-sm font-semibold text-muted sm:px-6" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === activeHref ? mobileActiveLink : mobileLink}
                aria-current={item.href === activeHref ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
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
  if (!userResult.user) return { home: "/login", navigation: [], activeHref: "/login" };

  const home = await resolveUserHome(supabase, userResult.user.id);
  const space = home === "/admin" ? "admin" : home === "/company" ? "company" : home === "/provider" ? "provider" : home === "/company/request-access" ? "company-pending" : "applicant";
  return { home, navigation: getAccountNavigation(space), activeHref: home };
}
