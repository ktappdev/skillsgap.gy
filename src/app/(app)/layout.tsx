import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const navigation = await getNavigation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold tracking-tight text-foreground">
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

async function getNavigation() {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return [{ href: "/dashboard", label: "My pathway" }];

  const [{ data: admin }, { data: memberships }] = await Promise.all([
    supabase.from("platform_admins").select("user_id").eq("user_id", userResult.user.id).maybeSingle(),
    supabase.from("company_members").select("company_id").eq("user_id", userResult.user.id),
  ]);

  const companyIds = (memberships ?? []).map((membership) => membership.company_id);
  const { data: companies } = companyIds.length > 0
    ? await supabase.from("companies").select("id,status").in("id", companyIds)
    : { data: [] };
  const hasApprovedCompany = (companies ?? []).some((company) => company.status === "approved");
  const hasPendingCompany = (companies ?? []).some((company) => company.status === "pending");

  return [
    { href: "/dashboard", label: "My pathway" },
    { href: "/interviews", label: "Interviews" },
    ...(hasApprovedCompany ? [{ href: "/company", label: "Company" }] : hasPendingCompany ? [{ href: "/company/request-access", label: "Company access" }] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
}
