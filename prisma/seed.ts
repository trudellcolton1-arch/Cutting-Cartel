import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STYLES = [
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
    prompt: "low fade haircut with a razor-sharp edge-up and a single clean line design carved into the side, hairline detail",
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
];

async function main() {
  console.log("→ Seeding hairstyles…");
  for (const s of STYLES) {
    await prisma.hairstyle.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  console.log("→ Seeding barbers…");
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

  console.log("→ Seeding demo customer (demo@cuttingcartel.com / demo12345)…");
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

  console.log("✓ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
