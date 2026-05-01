import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BarberDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/barber");
  if (session.user.role !== "BARBER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const barber = await prisma.barber.findUnique({
    where: { userId: session.user.id },
  });
  if (!barber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Barber profile not set up</h1>
        <p className="mt-2 text-sm text-bone-200/70">
          Ping the admin to provision your profile, or seed the database.
        </p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = await prisma.appointment.findMany({
    where: {
      barberId: barber.id,
      endsAt: { gte: now },
      status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
    },
    include: {
      customer: { select: { id: true, name: true, email: true, image: true, phone: true } },
      hairstyle: true,
      tryOnSession: true,
      payment: true,
    },
    orderBy: { startsAt: "asc" },
  });

  const todays = upcoming.filter(
    (a) => format(a.startsAt, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
  );

  const todaysRevenue = todays.reduce(
    (s, a) => s + (a.payment?.status === "SUCCEEDED" ? a.payment.amountCents : 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{barber.displayName} · Studio</h1>
          <p className="mt-1 text-sm text-bone-200/70">{barber.shopName} · {barber.city}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/barber/profile`} className="btn-ghost">Profile</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Stat label="Today" value={String(todays.length)} hint="appointments" />
        <Stat label="Upcoming" value={String(upcoming.length)} hint="bookings ahead" />
        <Stat label="Today's revenue" value={formatPrice(todaysRevenue)} hint="paid" />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Today</h2>
        <div className="mt-3 grid gap-3">
          {todays.length === 0 && <div className="card text-sm text-bone-200/60">Empty chair today.</div>}
          {todays.map((a) => (
            <ApptCard key={a.id} appt={a} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Upcoming</h2>
        <div className="mt-3 grid gap-3">
          {upcoming.filter((a) => !todays.includes(a)).map((a) => (
            <ApptCard key={a.id} appt={a} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-bone-200/60">{label}</div>
      <div className="mt-1 font-display text-3xl text-cartel-300">{value}</div>
      <div className="text-xs text-bone-200/50">{hint}</div>
    </div>
  );
}

type ApptCardProps = {
  appt: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    notes: string | null;
    priceCents: number;
    customer: { id: string; name: string | null; email: string | null; image: string | null; phone: string | null };
    hairstyle: { id: string; name: string; thumbnailUrl: string } | null;
    tryOnSession: {
      id: string;
      selfieUrl: string;
      previewUrl: string | null;
      length: number;
      fade: number;
      notes: string | null;
    } | null;
    payment: { status: string; amountCents: number } | null;
  };
};

function ApptCard({ appt }: ApptCardProps) {
  const fadeLabel =
    appt.tryOnSession?.fade === 0
      ? "no fade"
      : appt.tryOnSession?.fade === 5
      ? "skin fade"
      : `fade ${appt.tryOnSession?.fade ?? "—"}`;

  return (
    <div className="card grid gap-4 md:grid-cols-[120px_1fr_240px]">
      <div className="grid grid-cols-2 gap-1">
        {appt.tryOnSession?.selfieUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={appt.tryOnSession.selfieUrl} alt="customer" className="aspect-square rounded-lg object-cover" />
        )}
        {appt.tryOnSession?.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={appt.tryOnSession.previewUrl} alt="locked cut" className="aspect-square rounded-lg object-cover ring-2 ring-cartel-500" />
        )}
        {!appt.tryOnSession && (
          <div className="col-span-2 aspect-square rounded-lg bg-ink-700 grid place-items-center text-xs text-bone-200/50">
            walk-in
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg">
            {format(appt.startsAt, "h:mm a")} – {format(appt.endsAt, "h:mm a")}
          </span>
          <span
            className={`pill ${
              appt.status === "CONFIRMED"
                ? "border-blade-500/40 text-blade-400"
                : "border-cartel-500/50 text-cartel-300"
            }`}
          >
            {appt.status.replace("_", " ")}
          </span>
        </div>
        <div className="mt-1 text-sm">
          <span className="font-semibold">{appt.customer.name ?? "Customer"}</span>{" "}
          <span className="text-bone-200/60">· {appt.customer.email}</span>
        </div>
        {appt.hairstyle && (
          <div className="mt-2 text-sm text-bone-200/80">
            Style: <span className="font-medium">{appt.hairstyle.name}</span>
            {appt.tryOnSession && (
              <>
                {" · length "}
                {appt.tryOnSession.length} · {fadeLabel}
              </>
            )}
          </div>
        )}
        {(appt.notes || appt.tryOnSession?.notes) && (
          <div className="mt-2 rounded-lg border border-ink-600 bg-ink-800/60 p-2 text-xs text-bone-200/80">
            <span className="text-cartel-300">Notes:</span>{" "}
            {appt.tryOnSession?.notes ?? appt.notes}
          </div>
        )}
      </div>

      <div className="text-right">
        <div className="font-display text-2xl text-cartel-300">{formatPrice(appt.priceCents)}</div>
        <div className="text-xs text-bone-200/60">
          {appt.payment?.status === "SUCCEEDED" ? "Prepaid" : appt.payment?.status?.replace("_", " ") ?? "—"}
        </div>
        {appt.customer.phone && (
          <a href={`tel:${appt.customer.phone}`} className="btn-ghost mt-2 px-3 py-1 text-xs">
            Call
          </a>
        )}
      </div>
    </div>
  );
}
