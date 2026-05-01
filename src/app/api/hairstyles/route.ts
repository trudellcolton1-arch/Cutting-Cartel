import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  const styles = await prisma.hairstyle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ styles });
}
