import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  hairstyleId: z.string().min(1),
  selfieUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  length: z.number().int().min(1).max(5).default(3),
  fade: z.number().int().min(0).max(5).default(2),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const style = await prisma.hairstyle.findUnique({ where: { id: data.hairstyleId } });
  if (!style) return NextResponse.json({ error: "Style not found" }, { status: 404 });

  const tryOn = await prisma.tryOnSession.create({
    data: {
      hairstyleId: data.hairstyleId,
      userId: session?.user?.id ?? null,
      selfieUrl: data.selfieUrl,
      previewUrl: data.previewUrl,
      length: data.length,
      fade: data.fade,
      notes: data.notes,
    },
  });

  return NextResponse.json({ tryOn });
}
