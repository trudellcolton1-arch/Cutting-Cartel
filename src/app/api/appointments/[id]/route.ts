import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      barber: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          shopName: true,
          city: true,
          user: { select: { name: true, email: true } },
        },
      },
      hairstyle: true,
      tryOnSession: true,
      payment: true,
      customer: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = appt.customerId === session.user.id;
  const isBarber = appt.barber.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isBarber && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ appointment: appt });
}
