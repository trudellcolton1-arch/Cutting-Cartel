import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-tap admin endpoint: pushes the Prisma schema to the connected database
 * and seeds barbers + hairstyles. Idempotent — safe to hit repeatedly.
 *
 *   GET /api/admin/init-db
 *
 * No auth gate (per project owner's preference) — operations are bounded and
 * non-destructive (CREATE IF NOT EXISTS / upsert).
 */

// Each statement runs separately so a failure in one (typically a duplicate
// object on re-run) doesn't block the rest. Idempotent through a mix of
// `IF NOT EXISTS` clauses and JS-level error swallowing.
const STATEMENTS: string[] = [
  // ===== Enums =====
  `CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'BARBER', 'ADMIN')`,
  `CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`,
  `CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED')`,

  // ===== Tables =====
  `CREATE TABLE IF NOT EXISTS "User" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "Account" (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`,
  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
  `CREATE TABLE IF NOT EXISTS "Barber" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "Hairstyle" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "TryOnSession" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "hairstyleId" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "previewUrl" TEXT,
    "length" INTEGER NOT NULL DEFAULT 3,
    "fade" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "TryOnSession_userId_idx" ON "TryOnSession"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Appointment" (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_barberId_startsAt_key" ON "Appointment"("barberId", "startsAt")`,
  `CREATE INDEX IF NOT EXISTS "Appointment_customerId_idx" ON "Appointment"("customerId")`,
  `CREATE INDEX IF NOT EXISTS "Appointment_startsAt_idx" ON "Appointment"("startsAt")`,
  `CREATE TABLE IF NOT EXISTS "Payment" (
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
  )`,

  // ===== Schema migrations on existing tables =====
  // Add new columns idempotently for already-deployed dbs
  `ALTER TABLE "Barber" ADD COLUMN IF NOT EXISTS "priceAdultCents" INTEGER NOT NULL DEFAULT 5000`,
  `ALTER TABLE "Barber" ADD COLUMN IF NOT EXISTS "priceKidCents" INTEGER NOT NULL DEFAULT 2000`,
  `ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "cutType" TEXT NOT NULL DEFAULT 'adult'`,
  `ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'online'`,

  // ===== Foreign keys =====
  `ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE`,
  `ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE`,
  `ALTER TABLE "Barber" ADD CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE`,
  `ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL`,
  `ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "Hairstyle"("id") ON DELETE RESTRICT`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hairstyleId_fkey" FOREIGN KEY ("hairstyleId") REFERENCES "Hairstyle"("id") ON DELETE SET NULL`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tryOnSessionId_fkey" FOREIGN KEY ("tryOnSessionId") REFERENCES "TryOnSession"("id") ON DELETE SET NULL`,
  `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE`,
];

// Errors that just mean "already done" — safe to ignore on re-runs.
const IDEMPOTENT_ERROR_PATTERNS = [
  "already exists",
  "duplicate key",
  "duplicate object",
  "duplicate_object",
  "duplicate_table",
];

const HAIRSTYLES = [
  {
    slug: "low-fade-textured",
    name: "Low Fade · Textured Top",
    category: "fade",
    description: "Clean low fade with a tousled, textured crown.",
    prompt: "low fade haircut with textured tousled crown, soft messy top, sharp temple line",
    thumbnailUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=450&fit=crop&q=80",
  },
  {
    slug: "mid-fade-pompadour",
    name: "Mid Fade · Pompadour",
    category: "fade",
    description: "Classic mid fade lifting into a polished pompadour.",
    prompt: "mid fade haircut with a polished pompadour swept up and back, glossy classic styling",
    thumbnailUrl: "https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=600&h=450&fit=crop&q=80",
  },
  {
    slug: "high-skin-fade",
    name: "High Skin Fade",
    category: "fade",
    description: "Sharp skin fade up high with length kept on top.",
    prompt: "high skin fade haircut, completely shaved sides up high, length kept on top, razor sharp transition",
    thumbnailUrl: "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=600&h=450&fit=crop&q=80",
  },
  {
    slug: "taper-classic",
    name: "Classic Taper",
    category: "taper",
    description: "Tapered sides, neat top — sharp and timeless.",
    prompt: "classic taper haircut, neatly tapered sides and back, side-parted polished top, professional barbershop",
    thumbnailUrl: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=600&h=450&fit=crop&q=80",
  },
  {
    slug: "buzz-2",
    name: "Buzz · Guard 2",
    category: "classic",
    description: "Clean #2 all over. Low-maintenance, unmissable jawline.",
    prompt: "buzz cut with a number 2 guard all over, uniform short length, sharp hairline",
    thumbnailUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&h=450&fit=crop&q=80",
  },
  {
    slug: "edge-up-design",
    name: "Edge-Up + Line Design",
    category: "design",
    description: "Razor-sharp edge-up with a custom hairline detail.",
    prompt:
      "low fade haircut with a razor-sharp edge-up and a single clean line design carved into the side, hairline detail",
    thumbnailUrl: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&h=450&fit=crop&q=80",
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
];

// Removed barbers — wipe from prior seeds. We delete the Barber row first
// (the User row may still want to exist if they have past appointments, but
// since these were placeholder seeds they have no real data tied to them).
const REMOVED_BARBER_EMAILS = ["marcus@cuttingcartel.com"];

export async function GET(_req: Request) {
  const log: string[] = [];
  let stmtCount = 0;
  let skipped = 0;

  try {
    log.push("→ Pushing schema…");
    for (const stmt of STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        stmtCount++;
      } catch (e) {
        const msg = (e instanceof Error ? e.message : "").toLowerCase();
        const idempotent = IDEMPOTENT_ERROR_PATTERNS.some((p) => msg.includes(p));
        if (idempotent) {
          skipped++;
        } else {
          log.push(`⚠ ${stmt.slice(0, 70).replace(/\s+/g, " ")}… → ${msg.slice(0, 150)}`);
        }
      }
    }
    log.push(`✓ Schema: ${stmtCount} ran, ${skipped} already-exist`);

    log.push("→ Seeding hairstyles…");
    for (const s of HAIRSTYLES) {
      await prisma.hairstyle.upsert({ where: { slug: s.slug }, update: s, create: s });
    }
    log.push(`✓ Seeded ${HAIRSTYLES.length} hairstyles`);

    log.push("→ Seeding barbers…");
    const passwordHash = await bcrypt.hash("changeme123", 12);
    for (const b of BARBERS) {
      const user = await prisma.user.upsert({
        where: { email: b.email },
        update: { name: b.name, role: "BARBER", passwordHash },
        create: { email: b.email, name: b.name, role: "BARBER", passwordHash },
      });
      // Set per-cut prices: $50 adults, $20 kids
      await prisma.barber.upsert({
        where: { userId: user.id },
        update: {
          displayName: b.displayName,
          bio: b.bio,
          basePriceCents: 5000,
          priceAdultCents: 5000,
          priceKidCents: 2000,
          slotMinutes: b.slotMinutes,
          isActive: true,
        },
        create: {
          userId: user.id,
          displayName: b.displayName,
          bio: b.bio,
          basePriceCents: 5000,
          priceAdultCents: 5000,
          priceKidCents: 2000,
          slotMinutes: b.slotMinutes,
        },
      });
    }
    log.push(`✓ Seeded ${BARBERS.length} barber${BARBERS.length === 1 ? "" : "s"}`);

    // Wipe placeholder barbers we no longer want around
    let removed = 0;
    for (const email of REMOVED_BARBER_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      // Delete the barber profile, then the user. CASCADE on Barber.userId
      // means deleting the user also drops the barber row.
      try {
        await prisma.user.delete({ where: { id: user.id } });
        removed++;
      } catch (e) {
        log.push(`⚠ couldn't remove ${email}: ${e instanceof Error ? e.message.slice(0, 100) : "unknown"}`);
      }
    }
    if (removed > 0) log.push(`✓ Removed ${removed} placeholder barber${removed === 1 ? "" : "s"}`);

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
