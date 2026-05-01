import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a Cloudinary signed-upload payload so the browser can POST a file
 * directly to api.cloudinary.com without round-tripping through our server.
 * Used as a fallback when no unsigned preset is configured — the user gets
 * the fast direct-upload path with zero Cloudinary dashboard setup.
 */
export async function GET() {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "cutline-ai/selfie";

  // The signature must include all params we'll send with the upload (except
  // file, api_key, signature, and resource_type).
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
  });
}
