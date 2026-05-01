"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Scissors, Menu, X } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={close}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cartel-500 text-ink-900">
            <Scissors className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <div className="font-display text-base tracking-wide sm:text-lg">The Cutting Cartel</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bone-200/60">Dallas, TX</div>
          </div>
        </Link>

        {/* Desktop nav */}
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
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-bone-100 hover:text-cartel-300 md:inline"
              >
                {session.user.name?.split(" ")[0] ?? "Account"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden btn-ghost px-4 py-2 text-xs md:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/signin" className="btn-primary px-4 py-2 text-xs">
              Sign in
            </Link>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink-600 text-bone-100 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-ink-700 bg-ink-900/95 px-4 py-3 md:hidden">
          <div className="flex flex-col">
            <MobileLink href="/try-on" onClick={close}>
              Try On <span className="ml-2 text-[10px] uppercase tracking-wider text-cartel-300">Cutline AI</span>
            </MobileLink>
            <MobileLink href="/booking" onClick={close}>
              Book a chair
            </MobileLink>
            <MobileLink href="/styles" onClick={close}>
              Styles
            </MobileLink>
            {session?.user && (
              <MobileLink href="/dashboard" onClick={close}>
                My bookings
              </MobileLink>
            )}
            {(role === "BARBER" || role === "ADMIN") && (
              <MobileLink href="/barber" onClick={close}>
                Barber dashboard
              </MobileLink>
            )}
            {session?.user && (
              <button
                onClick={() => {
                  close();
                  signOut({ callbackUrl: "/" });
                }}
                className="mt-2 px-2 py-3 text-left text-sm text-bone-200/60"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="border-b border-ink-700/60 px-2 py-3 text-base text-bone-100 last:border-b-0"
    >
      {children}
    </Link>
  );
}
