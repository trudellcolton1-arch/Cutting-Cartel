import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { filterAvailableSlots, generateSlots, shopDayBounds } from "@/lib/booking";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    barberId: url.searchParams.get("barberId") ?? "",
    date: url.searchParams.get("date") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing barberId or date" }, { status: 400 });
  }

  const { barberId, date } = parsed.data;
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { id: true, workingHours: true, slotMinutes: true, isActive: true },
  });
  if (!barber || !barber.isActive) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  // Don't allow availability checks more than 60 days out.
  const { startUtc, endUtc } = shopDayBounds(date);
  if (startUtc > addDays(new Date(), 60)) {
    return NextResponse.json({ slots: [] });
  }

  const candidates = generateSlots(barber, date);

  const taken = await prisma.appointment.findMany({
    where: {
      barberId,
      startsAt: { gte: startUtc, lte: endUtc },
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
    },
    select: { startsAt: true, endsAt: true },
  });

  const available = filterAvailableSlots(candidates, taken, barber.slotMinutes);
  return NextResponse.json({
    slots: available.map((d) => d.toISOString()),
    slotMinutes: barber.slotMinutes,
  });
}
