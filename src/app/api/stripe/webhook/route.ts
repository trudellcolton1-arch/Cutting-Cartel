import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  isMailConfigured,
  sendBarberAppointmentEmail,
  sendCustomerAppointmentEmail,
} from "@/lib/mail";

// Stripe needs the raw body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err) {
    console.error("[stripe] webhook signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const appointmentId = cs.metadata?.appointmentId;
        if (!appointmentId) break;

        const piId =
          typeof cs.payment_intent === "string"
            ? cs.payment_intent
            : cs.payment_intent?.id ?? null;

        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: "CONFIRMED" },
          });
          await tx.payment.update({
            where: { appointmentId },
            data: {
              status: "SUCCEEDED",
              stripePaymentIntentId: piId ?? `cs_${cs.id}`,
              stripeCheckoutId: cs.id,
            },
          });
        });

        // Email both sides — best-effort, don't fail the webhook if SMTP is down
        if (isMailConfigured()) {
          try {
            const appt = await prisma.appointment.findUnique({
              where: { id: appointmentId },
              include: {
                customer: { select: { name: true, email: true } },
                barber: { include: { user: { select: { email: true } } } },
                hairstyle: { select: { name: true } },
                tryOnSession: { select: { previewUrl: true, selfieUrl: true, notes: true } },
              },
            });
            if (appt) {
              const appUrl =
                process.env.NEXT_PUBLIC_APP_URL ?? "https://247cuts.com";
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
                cutType: (appt.cutType as "adult" | "kid" | undefined) ?? "adult",
                paymentMethod: (appt.paymentMethod as "online" | "in_person" | undefined) ?? "online",
                appUrl,
              };
              await Promise.allSettled([
                sendBarberAppointmentEmail(payload),
                sendCustomerAppointmentEmail(payload),
              ]);
            }
          } catch (e) {
            console.error("[stripe] notification email failed", e);
          }
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const appointmentId = cs.metadata?.appointmentId;
        if (!appointmentId) break;
        await prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { appointmentId },
            data: { status: "FAILED" },
          });
          // Free the slot back up.
          await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: "CANCELLED" },
          });
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (!piId) break;
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: piId },
          data: { status: "REFUNDED" },
        });
        break;
      }
      default:
        // ignore
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
