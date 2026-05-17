"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Scissors } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header
      className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cartel-500 text-ink-900">
            <Scissors className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <div className="font-display text-base tracking-wide sm:text-lg">24/7 Cuts</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bone-200/60">Dallas, TX</div>
          </div>
        </Link>

        {/* Desktop nav — hidden on mobile (the bottom tab bar handles mobile) */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/try-on" className="flex items-center gap-1.5 text-bone-100 hover:text-cartel-300">
            Try On
            <span className="rounded-full border border-cartel-500/40 bg-cartel-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cartel-300">
              Cutline AI
            </span>
          </Link>
          <Link href="/booking" className="text-bone-100 hover:text-cartel-300">
            Book
          </Link>
          <Link href="/styles" className="text-bone-100 hover:text-cartel-300">
            Styles
          </Link>
          {(role === "BARBER" || role === "ADMIN") && (
            <Link href="/barber" className="text-cartel-300 hover:text-cartel-100">
              Barber
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-bone-200/60 hover:text-bone-50"
            >
              Sign out
            </button>
          ) : (
            <Link href="/auth/signin" className="btn-primary px-4 py-2 text-xs">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
