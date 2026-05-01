import { NextResponse } from "next/server";
import { z } from "zod";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

const schema = z.object({
  // Accepts a base64 data URL ("data:image/png;base64,...") OR an https:// URL
  // (used when the source is a Replicate output, which lives on their CDN)
  data: z.string().min(8),
  kind: z.enum(["selfie", "preview"]),
});

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,/;
const HTTPS_RE = /^https:\/\//;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, kind } = parsed.data;
  const isDataUrl = DATA_URL_RE.test(data);
  const isHttps = HTTPS_RE.test(data);
  if (!isDataUrl && !isHttps) {
    return NextResponse.json(
      { error: "Must be a base64 image data URL or https:// URL" },
      { status: 400 }
    );
  }

  // estimate decoded byte size from base64 length (skip for https URLs — we
  // trust Cloudinary's own size limit)
  if (isDataUrl) {
    const base64 = data.split(",", 2)[1] ?? "";
    const approxBytes = Math.floor((base64.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 413 });
    }
  }

  if (!isCloudinaryConfigured()) {
    // Dev fallback: echo source back. Production must configure Cloudinary.
    return NextResponse.json({
      url: data,
      width: 0,
      height: 0,
      warning: "Cloudinary not configured; returning source URL.",
    });
  }

  try {
    const result = await uploadImage(data, {
      folder: `cutline-ai/${kind}`,
    });
    return NextResponse.json({
      url: result.secure_url,
      width: result.width,
      height: result.height,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("[upload] cloudinary error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
