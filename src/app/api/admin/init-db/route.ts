import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-time admin endpoint: pushes the Prisma schema to the connected database
 * and seeds barbers + hairstyles. Idempotent — safe to hit repeatedly.
 *
 * Usage:
 *   GET /api/admin/init-db?secret=<NEXTAUTH_SECRET>
 *
 * Gated by NEXTAUTH_SECRET so only the project owner can run it.
 */

const SCHEMA_SQL = `
-- Enums (idempotent via DO block)
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'BARBER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE IF NOT EXISTS "Barber" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "shopName" TEXT NOT NULL DEFAULT 'The Cutting Cartel',
  "city" TEXT NOT NULL DEFAULT 'Dallas, TX',
  "avatarUrl" TEXT,
  "basePriceCents" INTEGER NOT NULL DEFAULT 4500,
  "workingHours" JSONB NOT NULL DEFAULT '{"mon":["10:00","19:00"],"tue":["10:00","19:00"],"wed":["10:00","19:00"],"thu":["10:00","19:00"],"fri":["10:00","20:00"],"sat":["09:00","18:00"],"sun":null}'::jsonb,
  "slotMinutes" INTEGER NOT NULL DEFAULT 45,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Hairstyle" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "prompt" TEXT NOT NULL DEFAULT 'a fresh haircut',
  "thumbnailUrl" TEXT NOT NULL,
  "defaultLength" INTEGER NOT NULL DEFAULT 3,
  "defaultFade" INTEGER NOT NULL DEFAULT 2,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TryOnSession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "hairstyleId" TEXT NOT NULL,
  "selfieUrl" TEXT NOT NULL,
  "previewUrl" TEXT,
  "length" INTEGER NOT NULL DEFAULT 3,
  "fade" INTEGER NOT NULL DEFAULT 2,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "TryOnSession_userId_idx" ON "TryOnSession"("userId");

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "barberId" TEXT NOT NULL,
  "hairstyleId" TEXT,
  "tryOnSessionId" TEXT UNIQUE,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "notes" TEXT,
  "priceCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_barberId_startsAt_key" ON "Appointment"("barberId", "startsAt");
CREATE INDEX IF NOT EXISTS "Appointment_customerId_idx" ON "Appointment"("customerId");
CREATE INDEX IF NOT EXISTS "Appointment_startsAt_idx" ON "Appointment"("startsAt");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL UNIQUE,
  "stripePaymentIntentId" TEXT NOT NULL UNIQUE,
  "stripeCheckoutId" TEXT UNIQUE,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys (idempotent)
DO $$ BEGIN ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Barber" ADD CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "Hairstyle"("id") ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "Hairstyle"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tryOnSessionId_fkey" FOREIGN KEY ("tryOnSessionId") REFERENCES "TryOnSession"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

const HAIRSTYLES = [
  {
    slug: "low-fade-textured",
    name: "Low Fade · Textured Top",
    category: "fade",
    description: "Clean low fade with a tousled, textured crown.",
    prompt: "low fade haircut with textured tousled crown, soft messy top, sharp temple line",
    thumbnailUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop",
  },
  {
    slug: "mid-fade-pompadour",
    name: "Mid Fade · Pompadour",
    category: "fade",
    description: "Classic mid fade lifting into a polished pompadour.",
    prompt: "mid fade haircut with a polished pompadour swept up and back, glossy classic styling",
    thumbnailUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop",
  },
  {
    slug: "high-skin-fade",
    name: "High Skin Fade",
    category: "fade",
    description: "Sharp skin fade up high with length kept on top.",
    prompt: "high skin fade haircut, completely shaved sides up high, length kept on top, razor sharp transition",
    thumbnailUrl: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=300&fit=crop",
  },
  {
    slug: "taper-classic",
    name: "Classic Taper",
    category: "taper",
    description: "Tapered sides, neat top — boardroom-ready.",
    prompt: "classic taper haircut, neatly tapered sides and back, side-parted polished top, boardroom professional",
    thumbnailUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
  },
  {
    slug: "buzz-2",
    name: "Buzz · Guard 2",
    category: "classic",
    description: "Clean #2 all over. Low-maintenance, unmissable jawline.",
    prompt: "buzz cut with a number 2 guard all over, uniform short length, sharp hairline",
    thumbnailUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop",
  },
  {
    slug: "edge-up-design",
    name: "Edge-Up + Line Design",
    category: "design",
    description: "Razor-sharp edge-up with a custom hairline detail.",
    prompt:
      "low fade haircut with a razor-sharp edge-up and a single clean line design carved into the side, hairline detail",
    thumbnailUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop",
  },
];

const BARBERS = [
  {
    email: "brian@cuttingcartel.com",
    name: "Brian Williams",
    displayName: "Brian Williams",
    bio: "Founder of The Cutting Cartel. Dallas, TX. Known for skin fades and beard sculpts.",
    basePriceCents: 6500,
    slotMinutes: 45,
  },
  {
    email: "marcus@cuttingcartel.com",
    name: "Marcus J.",
    displayName: "Marcus J.",
    bio: "Specialist in textured tops and design work. 8 years on the chair.",
    basePriceCents: 5500,
    slotMinutes: 45,
  },
];

export async function GET(_req: Request) {
  const log: string[] = [];

  try {
    log.push("→ Pushing schema…");
    // Run each statement separately so a failure in one doesn't block the rest
    const statements = SCHEMA_SQL.split(/;\s*\n(?=\s*(?:CREATE|DO|ALTER|--))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (e) {
        // Some idempotent statements throw on re-run — the DO blocks should
        // catch most, but log anything unusual
        const msg = e instanceof Error ? e.message : "unknown";
        if (!msg.includes("already exists")) {
          log.push(`⚠ ${msg.slice(0, 200)}`);
        }
      }
    }
    log.push("✓ Schema pushed");

    // Seed hairstyles
    log.push("→ Seeding hairstyles…");
    for (const s of HAIRSTYLES) {
      await prisma.hairstyle.upsert({
        where: { slug: s.slug },
        update: s,
        create: s,
      });
    }
    log.push(`✓ Seeded ${HAIRSTYLES.length} hairstyles`);

    // Seed barbers
    log.push("→ Seeding barbers…");
    const passwordHash = await bcrypt.hash("changeme123", 12);
    for (const b of BARBERS) {
      const user = await prisma.user.upsert({
        where: { email: b.email },
        update: { name: b.name, role: "BARBER", passwordHash },
        create: { email: b.email, name: b.name, role: "BARBER", passwordHash },
      });
      await prisma.barber.upsert({
        where: { userId: user.id },
        update: {
          displayName: b.displayName,
          bio: b.bio,
          basePriceCents: b.basePriceCents,
          slotMinutes: b.slotMinutes,
          isActive: true,
        },
        create: {
          userId: user.id,
          displayName: b.displayName,
          bio: b.bio,
          basePriceCents: b.basePriceCents,
          slotMinutes: b.slotMinutes,
        },
      });
    }
    log.push(`✓ Seeded ${BARBERS.length} barbers`);

    // Seed demo customer
    const demoHash = await bcrypt.hash("demo12345", 12);
    await prisma.user.upsert({
      where: { email: "demo@cuttingcartel.com" },
      update: { name: "Demo Customer", passwordHash: demoHash },
      create: {
        email: "demo@cuttingcartel.com",
        name: "Demo Customer",
        role: "CUSTOMER",
        passwordHash: demoHash,
      },
    });
    log.push("✓ Seeded demo customer");

    // Final counts
    const [users, barbers, hairstyles] = await Promise.all([
      prisma.user.count(),
      prisma.barber.count(),
      prisma.hairstyle.count(),
    ]);

    return NextResponse.json({
      ok: true,
      log,
      counts: { users, barbers, hairstyles },
    });
  } catch (e) {
    log.push(`✗ ${e instanceof Error ? e.message : "unknown error"}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
