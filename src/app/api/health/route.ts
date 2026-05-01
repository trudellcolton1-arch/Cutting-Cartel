import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint — reveals which env vars and integrations are configured
 * without exposing the actual secret values. Hit /api/health from any browser
 * to see what's wired up. Safe to leave public; nothing sensitive is returned.
 */
export async function GET() {
  const env = process.env;

  // Helper that just confirms presence + does basic format sanity checks.
  const present = (v: string | undefined) => !!v && v.trim().length > 0;
  const validUrl = (v: string | undefined) => {
    if (!v) return false;
    try {
      const trimmed = v.trim();
      if (/\s/.test(trimmed)) return false; // any whitespace inside is invalid
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  };

  // Try a tiny database query
  let dbReachable: boolean;
  let dbError: string | null = null;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbReachable = true;
  } catch (e) {
    dbReachable = false;
    dbError = e instanceof Error ? e.message.slice(0, 200) : "unknown";
  }

  return NextResponse.json({
    ok: dbReachable && present(env.NEXTAUTH_SECRET) && validUrl(env.NEXTAUTH_URL),

    nextauth: {
      NEXTAUTH_SECRET_set: present(env.NEXTAUTH_SECRET),
      NEXTAUTH_SECRET_length: env.NEXTAUTH_SECRET?.length ?? 0,
      NEXTAUTH_URL_set: present(env.NEXTAUTH_URL),
      NEXTAUTH_URL_valid: validUrl(env.NEXTAUTH_URL),
      NEXTAUTH_URL_value_preview: env.NEXTAUTH_URL?.slice(0, 50) ?? null,
    },

    database: {
      DATABASE_URL_set: present(env.DATABASE_URL),
      DATABASE_URL_starts_with: env.DATABASE_URL?.slice(0, 12) ?? null,
      reachable: dbReachable,
      error: dbError,
    },

    google: {
      GOOGLE_CLIENT_ID_set: present(env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET_set: present(env.GOOGLE_CLIENT_SECRET),
      client_id_preview: env.GOOGLE_CLIENT_ID?.slice(0, 16) ?? null,
    },

    stripe: {
      STRIPE_SECRET_KEY_set: present(env.STRIPE_SECRET_KEY),
      STRIPE_WEBHOOK_SECRET_set: present(env.STRIPE_WEBHOOK_SECRET),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_set: present(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },

    cloudinary: {
      CLOUDINARY_CLOUD_NAME_set: present(env.CLOUDINARY_CLOUD_NAME),
      CLOUDINARY_API_KEY_set: present(env.CLOUDINARY_API_KEY),
      CLOUDINARY_API_SECRET_set: present(env.CLOUDINARY_API_SECRET),
      unsigned_preset_set: present(env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET),
    },

    replicate: {
      REPLICATE_API_TOKEN_set: present(env.REPLICATE_API_TOKEN),
    },

    email: {
      EMAIL_SERVER_HOST_set: present(env.EMAIL_SERVER_HOST),
      EMAIL_SERVER_USER_set: present(env.EMAIL_SERVER_USER),
      EMAIL_SERVER_PASSWORD_set: present(env.EMAIL_SERVER_PASSWORD),
      EMAIL_FROM_set: present(env.EMAIL_FROM),
      BARBER_NOTIFICATION_EMAILS_set: present(env.BARBER_NOTIFICATION_EMAILS),
      BARBER_NOTIFICATIONS_EMAILS_set: present(env.BARBER_NOTIFICATIONS_EMAILS),
      BARBER_NOTIFICATION_EMAIL_set: present(env.BARBER_NOTIFICATION_EMAIL),
      BARBER_NOTIFICATIONS_EMAIL_set: present(env.BARBER_NOTIFICATIONS_EMAIL),
      BARBER_EMAIL_set: present(env.BARBER_EMAIL),
      BARBER_EMAILS_set: present(env.BARBER_EMAILS),
      // Show the value's domain only (not the whole address) for verification
      barber_email_value_preview:
        (env.BARBER_NOTIFICATION_EMAILS ||
          env.BARBER_NOTIFICATIONS_EMAILS ||
          env.BARBER_NOTIFICATION_EMAIL ||
          env.BARBER_NOTIFICATIONS_EMAIL ||
          env.BARBER_EMAIL ||
          env.BARBER_EMAILS ||
          "")
          .split(",")[0]
          ?.trim()
          .replace(/^([^@]{2}).+(@.+)$/, "$1***$2") || null,
    },

    app: {
      NEXT_PUBLIC_APP_URL_valid: validUrl(env.NEXT_PUBLIC_APP_URL),
      NEXT_PUBLIC_APP_URL_value_preview: env.NEXT_PUBLIC_APP_URL?.slice(0, 50) ?? null,
    },
  });
}
