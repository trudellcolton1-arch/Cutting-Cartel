import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  barberId: z.string().min(1),
  hairstyleId: z.string().optional(),
  tryOnSessionId: z.string().optional(),
  startsAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { barberId, hairstyleId, tryOnSessionId, startsAt, notes } = parsed.data;

  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true },
  });
  if (!barber || !barber.isActive) {
    return NextResponse.json({ error: "Barber not available" }, { status: 404 });
  }

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime()) || start < new Date()) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }
  const end = addMinutes(start, barber.slotMinutes);

  // verify slot is still free
  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      OR: [
        { startsAt: { lt: end }, endsAt: { gt: start } },
      ],
    },
    select: { id: true },
  });
  if (conflict) return NextResponse.json({ error: "Slot just got taken." }, { status: 409 });

  // create appointment + payment intent in a transaction
  const created = await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.create({
      data: {
        customerId: session.user.id,
        barberId,
        hairstyleId: hairstyleId ?? null,
        tryOnSessionId: tryOnSessionId ?? null,
        startsAt: start,
        endsAt: end,
        status: "PENDING_PAYMENT",
        notes: notes ?? null,
        priceCents: barber.basePriceCents,
      },
    });
    return appt;
  });

  // Create a Stripe Checkout session
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: barber.basePriceCents,
          product_data: {
            name: `Cut with ${barber.displayName}`,
            description: `Cutline AI booking · ${start.toLocaleString()}`,
          },
        },
      },
    ],
    metadata: { appointmentId: created.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/booking/success?appt=${created.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/booking/cancel?appt=${created.id}`,
  });

  await prisma.payment.create({
    data: {
      appointmentId: created.id,
      stripePaymentIntentId: typeof checkout.payment_intent === "string"
        ? checkout.payment_intent
        : `pending_${created.id}`,
      stripeCheckoutId: checkout.id,
      amountCents: barber.basePriceCents,
      currency: "usd",
      status: "REQUIRES_PAYMENT",
    },
  });

  return NextResponse.json({
    appointmentId: created.id,
    checkoutUrl: checkout.url,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appts = await prisma.appointment.findMany({
    where: { customerId: session.user.id },
    include: {
      barber: { select: { displayName: true, shopName: true } },
      hairstyle: true,
      payment: true,
    },
    orderBy: { startsAt: "desc" },
  });
  return NextResponse.json({ appointments: appts });
}
