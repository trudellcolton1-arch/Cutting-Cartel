import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: { tryOnId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const target = searchParams.tryOnId
      ? `/booking?tryOnId=${encodeURIComponent(searchParams.tryOnId)}`
      : "/booking";
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(target)}`);
  }

  const barbers = await prisma.barber.findMany({
    where: { isActive: true },
    select: {
      id: true,
      displayName: true,
      bio: true,
      shopName: true,
      city: true,
      avatarUrl: true,
      basePriceCents: true,
      slotMinutes: true,
    },
    orderBy: { displayName: "asc" },
  });

  const tryOn = searchParams.tryOnId
    ? await prisma.tryOnSession.findUnique({
        where: { id: searchParams.tryOnId },
        include: { hairstyle: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl md:text-4xl">Book your chair</h1>
      <p className="mt-1 text-sm text-bone-200/70">
        Pick your barber, time, and prepay. Your reference cut and notes go with the booking.
      </p>

      <Suspense fallback={<div className="card mt-6">Loading…</div>}>
        <BookingFlow barbers={barbers} tryOn={tryOn} />
      </Suspense>
    </div>
  );
}
