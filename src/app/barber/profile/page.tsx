import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BarberProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  const barber = await prisma.barber.findUnique({ where: { userId: session.user.id } });
  if (!barber) redirect("/");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl">Barber profile</h1>
      <div className="card mt-6 space-y-2 text-sm">
        <Row label="Display name" value={barber.displayName} />
        <Row label="Shop" value={barber.shopName} />
        <Row label="City" value={barber.city} />
        <Row label="Slot length" value={`${barber.slotMinutes} minutes`} />
        <Row label="Base price" value={formatPrice(barber.basePriceCents)} />
      </div>
      <p className="mt-4 text-xs text-bone-200/50">
        To update working hours or pricing, contact the admin or run a Prisma migration.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-bone-200/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
