import Link from "next/link";
import { ArrowRight, Camera, CalendarCheck, CreditCard, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getFeaturedStyles() {
  try {
    return await prisma.hairstyle.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const styles = await getFeaturedStyles();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Teflon Cutz mascot — faded into the hero background */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-no-repeat sm:h-[640px] md:h-[760px]"
          style={{
            backgroundImage:
              "url('/A4D9A22C-1FA9-4603-8021-CC8F0BCBE8C1.jpeg')",
            backgroundPosition: "right 12px top 12px",
            backgroundSize: "min(560px, 64vw) auto",
            opacity: 0.14,
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid-fade" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-col items-start gap-5 sm:gap-6">
            <span className="pill border-cartel-500/40 bg-cartel-500/10 text-cartel-300">
              <Sparkles className="h-3.5 w-3.5" /> Dallas · Texas
            </span>
            <h1 className="font-display text-[2.75rem] leading-[0.95] tracking-tight sm:text-6xl md:text-8xl">
              The Cutting
              <br />
              <span className="text-cartel-300">Cartel.</span>
            </h1>
            <p className="max-w-xl text-sm text-bone-100/80 sm:text-base md:text-lg">
              Dallas&apos;s premier barber experience. Book your chair, prepay online, and use{" "}
              <span className="font-semibold text-cartel-300">Cutline AI</span> — our in-house
              hairstyle try-on — to lock the look before you sit down.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/booking" className="btn-primary">
                Book a chair <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/try-on" className="btn-ghost">
                Try a cut with Cutline AI
              </Link>
            </div>
          </div>
        </div>
        <div className="h-1 w-full stripe-accent" aria-hidden />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: Camera,
              title: "Snap a selfie",
              body: "Upload or take a photo to start with Cutline AI.",
            },
            {
              icon: Sparkles,
              title: "Try the cut",
              body: "Cutline AI overlays styles on your face in real time.",
            },
            {
              icon: CalendarCheck,
              title: "Pick a slot",
              body: "Live availability — no double bookings.",
            },
            {
              icon: CreditCard,
              title: "Prepay & lock in",
              body: "Stripe secures your seat. Your barber sees everything.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card">
              <Icon className="h-5 w-5 text-cartel-300" />
              <div className="mt-3 font-semibold">{title}</div>
              <div className="mt-1 text-sm text-bone-200/70">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl md:text-3xl">In the catalogue</h2>
          <Link href="/styles" className="text-sm text-cartel-300 hover:text-cartel-100">
            See all →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {styles.length === 0 ? (
            <div className="card col-span-full text-sm text-bone-200/70">
              The catalog hasn&apos;t been seeded yet. Run <code>npm run db:seed</code> to load
              starter hairstyles.
            </div>
          ) : (
            styles.map((s) => (
              <Link key={s.id} href={`/try-on?style=${s.slug}`} className="card group hover:border-cartel-500/60">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.thumbnailUrl}
                    alt={s.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs uppercase tracking-wider text-bone-200/60">{s.category}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-cartel-300 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Brand block */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card overflow-hidden p-0">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h3 className="font-display text-2xl md:text-3xl">
                Run by barbers, built for the chair.
              </h3>
              <p className="mt-3 text-bone-200/80">
                The Cutting Cartel is Dallas-grown — Brian Williams and crew. Every cut starts with
                the same problem: explaining what you want. So we built{" "}
                <span className="font-semibold text-cartel-300">Cutline AI</span> right into the
                site. Show up with the reference already locked in.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/booking" className="btn-primary">
                  Book a chair
                </Link>
                <Link href="/auth/signin" className="btn-ghost">
                  Client login
                </Link>
              </div>
            </div>
            <div className="relative min-h-64 stripe-accent" aria-hidden />
          </div>
        </div>
      </section>
    </div>
  );
}
