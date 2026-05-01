import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShopDateTime } from "@/lib/booking";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "border-cartel-500/50 text-cartel-300",
  CONFIRMED: "border-blade-500/50 text-blade-400",
  COMPLETED: "border-ink-500 text-bone-200/60",
  CANCELLED: "border-red-500/40 text-red-400",
  NO_SHOW: "border-red-500/40 text-red-400",
};

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const appts = await prisma.appointment.findMany({
    where: { customerId: session.user.id },
    include: { barber: true, hairstyle: true, payment: true, tryOnSession: true },
    orderBy: { startsAt: "desc" },
  });

  const upcoming = appts.filter(
    (a) => a.startsAt >= new Date() && (a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT")
  );
  const past = appts.filter((a) => !upcoming.includes(a));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-bone-200/70">Your bookings and locked-in cuts.</p>
        </div>
        <Link href="/try-on" className="btn-primary self-start sm:self-auto">
          New try-on
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl">Upcoming</h2>
        <div className="mt-3 grid gap-3">
          {upcoming.length === 0 && (
            <div className="card text-sm text-bone-200/60">
              No upcoming appointments. <Link href="/booking" className="text-cartel-300">Book one now →</Link>
            </div>
          )}
          {upcoming.map((a) => (
            <div key={a.id} className="card flex items-center gap-4">
              {a.tryOnSession?.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.tryOnSession.previewUrl} alt="cut" className="h-20 w-20 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <div className="font-display text-lg">
                  {formatShopDateTime(a.startsAt, "EEE, MMM d · h:mm a 'CT'")}
                </div>
                <div className="text-sm text-bone-200/70">
                  with {a.barber.displayName} · {a.hairstyle?.name ?? "Walk-in cut"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{formatPrice(a.priceCents)}</div>
                <span className={`pill ${STATUS_COLORS[a.status] ?? ""}`}>{a.status.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">History</h2>
        <div className="mt-3 grid gap-3">
          {past.length === 0 && <div className="text-sm text-bone-200/50">No past bookings yet.</div>}
          {past.map((a) => (
            <div key={a.id} className="card flex items-center gap-4 opacity-80">
              {a.tryOnSession?.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.tryOnSession.previewUrl} alt="cut" className="h-16 w-16 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <div className="font-medium">{formatShopDateTime(a.startsAt, "MMM d, yyyy · h:mm a")}</div>
                <div className="text-sm text-bone-200/60">
                  {a.barber.displayName} · {a.hairstyle?.name ?? "Walk-in cut"}
                </div>
              </div>
              {a.tryOnSessionId && (
                <Link href={`/share/${a.tryOnSessionId}`} className="text-xs text-cartel-300 hover:text-cartel-100">
                  Share
                </Link>
              )}
              <span className={`pill ${STATUS_COLORS[a.status] ?? ""}`}>{a.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
