import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { formatShopDateTime } from "@/lib/booking";
import {
  isMailConfigured,
  sendBarberAppointmentEmail,
  sendCustomerAppointmentEmail,
} from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  barberId: z.string().min(1),
  hairstyleId: z.string().optional(),
  tryOnSessionId: z.string().optional(),
  startsAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  cutType: z.enum(["adult", "kid"]).default("adult"),
  paymentMethod: z.enum(["online", "in_person"]).default("online"),
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

  const { barberId, hairstyleId, tryOnSessionId, startsAt, notes, cutType, paymentMethod } =
    parsed.data;

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

  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId,
      status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      OR: [{ startsAt: { lt: end }, endsAt: { gt: start } }],
    },
    select: { id: true },
  });
  if (conflict) return NextResponse.json({ error: "Slot just got taken." }, { status: 409 });

  const priceCents =
    cutType === "kid" ? barber.priceKidCents : barber.priceAdultCents;

  // ===== Pay in person =====
  // Confirm immediately, no Stripe round-trip. Email both sides right away.
  if (paymentMethod === "in_person") {
    const created = await prisma.appointment.create({
      data: {
        customerId: session.user.id,
        barberId,
        hairstyleId: hairstyleId ?? null,
        tryOnSessionId: tryOnSessionId ?? null,
        startsAt: start,
        endsAt: end,
        status: "CONFIRMED",
        notes: notes ?? null,
        priceCents,
        cutType,
        paymentMethod: "in_person",
      },
    });

    if (isMailConfigured()) {
      try {
        const appt = await prisma.appointment.findUnique({
          where: { id: created.id },
          include: {
            customer: { select: { name: true, email: true } },
            barber: { include: { user: { select: { email: true } } } },
            hairstyle: { select: { name: true } },
            tryOnSession: { select: { previewUrl: true, selfieUrl: true, notes: true } },
          },
        });
        if (appt) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cuttingcartel.com";
          const payload = {
            appointmentId: appt.id,
            startsAt: appt.startsAt,
            priceCents: appt.priceCents,
            customer: { name: appt.customer.name, email: appt.customer.email },
            barber: {
              displayName: appt.barber.displayName,
              shopName: appt.barber.shopName,
              userEmail: appt.barber.user.email,
            },
            hairstyleName: appt.hairstyle?.name ?? null,
            notes: appt.tryOnSession?.notes ?? appt.notes ?? null,
            previewUrl: appt.tryOnSession?.previewUrl ?? null,
            selfieUrl: appt.tryOnSession?.selfieUrl ?? null,
            cutType,
            paymentMethod: "in_person" as const,
            appUrl,
          };
          await Promise.allSettled([
            sendBarberAppointmentEmail(payload),
            sendCustomerAppointmentEmail(payload),
          ]);
        }
      } catch (e) {
        console.error("[appointments] in-person email failed", e);
      }
    }

    return NextResponse.json({
      appointmentId: created.id,
      redirectUrl: `/booking/success?appt=${created.id}`,
    });
  }

  // ===== Pay online (Stripe Checkout) =====
  const created = await prisma.appointment.create({
    data: {
      customerId: session.user.id,
      barberId,
      hairstyleId: hairstyleId ?? null,
      tryOnSessionId: tryOnSessionId ?? null,
      startsAt: start,
      endsAt: end,
      status: "PENDING_PAYMENT",
      notes: notes ?? null,
      priceCents,
      cutType,
      paymentMethod: "online",
    },
  });

  const cutTypeLabel = cutType === "kid" ? "Kids cut" : "Adult cut";
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: priceCents,
          product_data: {
            name: `${cutTypeLabel} with ${barber.displayName}`,
            description: `The Cutting Cartel · ${formatShopDateTime(start, "EEE, MMM d · h:mm a 'CT'")}`,
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
      stripePaymentIntentId:
        typeof checkout.payment_intent === "string"
          ? checkout.payment_intent
          : `pending_${created.id}`,
      stripeCheckoutId: checkout.id,
      amountCents: priceCents,
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
