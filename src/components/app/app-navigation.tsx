"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = Readonly<{
  href: string;
  label: string;
}>;

type AppNavigationProps = {
  items: readonly NavigationItem[];
  mobile?: boolean;
};

const desktopLink = "inline-flex min-h-11 items-center hover:text-accent";
const desktopActiveLink = "inline-flex min-h-11 items-center text-accent";
const mobileLink = "inline-flex min-h-11 items-center whitespace-nowrap hover:text-accent";
const mobileActiveLink = "inline-flex min-h-11 items-center whitespace-nowrap text-accent";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ items, mobile = false }: AppNavigationProps) {
  const pathname = usePathname();
  const linkClass = mobile ? mobileLink : desktopLink;
  const activeLinkClass = mobile ? mobileActiveLink : desktopActiveLink;

  return (
    <nav
      className={mobile ? "mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-1 text-sm font-semibold text-muted sm:px-6" : "hidden items-center gap-6 text-sm font-semibold text-muted md:flex"}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? activeLinkClass : linkClass}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
