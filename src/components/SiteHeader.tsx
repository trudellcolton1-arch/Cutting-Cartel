"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Scissors } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cartel-500 text-ink-900">
            <Scissors className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-wide">Cutline AI</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bone-200/60">
              The Cutting Cartel
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/try-on" className="text-bone-100 hover:text-cartel-300">
            Try On
          </Link>
          <Link href="/booking" className="text-bone-100 hover:text-cartel-300">
            Book
          </Link>
          <Link href="/styles" className="text-bone-100 hover:text-cartel-300">
            Styles
          </Link>
          {(role === "BARBER" || role === "ADMIN") && (
            <Link href="/barber" className="text-cartel-300 hover:text-cartel-100">
              Barber Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hidden text-sm text-bone-100 hover:text-cartel-300 md:inline">
                {session.user.name?.split(" ")[0] ?? "Account"}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost px-4 py-2 text-xs">
                Sign out
              </button>
            </>
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
