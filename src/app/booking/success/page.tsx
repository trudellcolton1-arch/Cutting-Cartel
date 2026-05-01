import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShopDateTime } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { appt?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  const appt = searchParams.appt
    ? await prisma.appointment.findUnique({
        where: { id: searchParams.appt },
        include: { barber: true, hairstyle: true, payment: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-blade-400" />
      <h1 className="mt-4 font-display text-3xl">You&apos;re booked.</h1>
      <p className="mt-2 text-sm text-bone-200/70">
        Your barber has your reference cut, your notes, and your payment.
      </p>

      {appt && (
        <div className="card mt-8 text-left">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-cartel-300">Appointment</div>
              <div className="font-display text-xl">
                {formatShopDateTime(appt.startsAt, "EEE, MMM d · h:mm a 'CT'")}
              </div>
              <div className="text-sm text-bone-200/70">
                with {appt.barber.displayName}
              </div>
            </div>
            <span className="pill border-blade-500/40 text-blade-400">
              {appt.payment?.status === "SUCCEEDED" ? "Paid" : "Processing"}
            </span>
          </div>
          {appt.hairstyle && (
            <div className="mt-3 text-sm text-bone-200/70">Cut: {appt.hairstyle.name}</div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          View my bookings
        </Link>
        {appt?.tryOnSessionId && (
          <Link href={`/share/${appt.tryOnSessionId}`} className="btn-ghost">
            Share your cut
          </Link>
        )}
        <Link href="/" className="btn-ghost">
          Back home
        </Link>
      </div>
    </div>
  );
}
