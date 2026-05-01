"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Wand2, Calendar, User, Scissors } from "lucide-react";

/**
 * Persistent bottom-nav for mobile, gives the site an app feel.
 * Hidden on md+ (desktop keeps the top header nav).
 *
 * Lays out around iOS safe-area inset so the home indicator doesn't
 * overlap the active tab.
 */
export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const isBarber = session?.user?.role === "BARBER" || session?.user?.role === "ADMIN";

  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    {
      href: "/try-on",
      label: "Try On",
      icon: Wand2,
      match: (p: string) => p.startsWith("/try-on"),
      accent: true,
    },
    {
      href: "/booking",
      label: "Book",
      icon: Calendar,
      match: (p: string) => p.startsWith("/booking"),
    },
    isBarber
      ? {
          href: "/barber",
          label: "Chair",
          icon: Scissors,
          match: (p: string) => p.startsWith("/barber"),
        }
      : {
          href: session?.user ? "/dashboard" : "/auth/signin",
          label: session?.user ? "Account" : "Sign in",
          icon: User,
          match: (p: string) =>
            p.startsWith("/dashboard") || p.startsWith("/auth"),
        },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700/80 bg-ink-900/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-wider transition ${
                  active
                    ? "text-cartel-300"
                    : "text-bone-200/55 active:text-bone-50"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full transition ${
                    active && t.accent
                      ? "bg-cartel-500 text-ink-900"
                      : active
                      ? "bg-cartel-500/15 text-cartel-300"
                      : "text-current"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
