import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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
  return NextResponse.json({ barbers });
}
