import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateCutPreview, isReplicateConfigured } from "@/lib/replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Replicate latency is 12–25s; give ourselves headroom
export const maxDuration = 60;

const schema = z.object({
  selfieUrl: z.string().url(),
  hairstyleId: z.string().min(1),
  length: z.number().int().min(1).max(5).default(3),
  fade: z.number().int().min(0).max(5).default(2),
});

export async function POST(req: Request) {
  if (!isReplicateConfigured()) {
    return NextResponse.json(
      { error: "Cutline AI is not configured. Set REPLICATE_API_TOKEN." },
      { status: 503 }
    );
  }

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
  const { selfieUrl, hairstyleId, length, fade } = parsed.data;

  const style = await prisma.hairstyle.findUnique({
    where: { id: hairstyleId },
    select: { prompt: true, name: true, isActive: true },
  });
  if (!style?.isActive) {
    return NextResponse.json({ error: "Style unavailable" }, { status: 404 });
  }

  try {
    const previewUrl = await generateCutPreview({
      selfieUrl,
      styleFragment: style.prompt,
      length,
      fade,
    });
    return NextResponse.json({ previewUrl, styleName: style.name });
  } catch (err) {
    console.error("[cutline-ai] generation failed", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
